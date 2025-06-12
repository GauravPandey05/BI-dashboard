import React, { useState } from 'react';
import { MessageSquare, Send } from 'lucide-react';
import { useData } from '../../contexts/DataContext';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { Question, Choice, SurveyData, FilterOptions, SelectedFilters } from '../../types';

const SYSTEM_PROMPT = `
You are a travel data assistant.
Answer using ONLY the provided survey data.
Your answers MUST match exactly with the data shown in the charts.
For every question, present both the numeric counts (number of respondents) and percentages, and structure your answer according to what is being asked.

IMPORTANT: For multi-select questions (marked as "multi-select question"), percentages may sum to over 100% because respondents can select multiple options. This is expected and correct.

Do not mention question IDs (like Q3_1) in your response—use only the question text and answer options.
If you provide a demographic split, format it as a markdown table (with a blank line before and after the table).
Always present percentages as whole numbers (e.g., 24% not 24.3%).
After presenting data, add a brief insight highlighting the most significant finding.
Only add explanations if the user asks for them. For follow-up questions, use the previous context.

If the user asks for a percentage or count of people matching multiple criteria (e.g., "travel domestically and plan to go to beach"), do the following:
- First, state the total number of respondents in the base group (e.g., total domestic travelers).
- Then, state the number and percentage of respondents who match all criteria (e.g., domestic travelers planning a beach vacation), as a count and as a percentage of both the base group and of all respondents.
- Structure your answer step by step, so it is clear how the numbers relate.

Example:
Q: What percent of people travel domestically and plan to go to the beach?
A: Out of 200 respondents who plan to travel domestically, 50 are planning a beach vacation. That is 25% of domestic travelers and 10% of all respondents.
`;

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface ChatbotProps {
  onClose: () => void;
}

// Helper: Build a keyword map from your survey schema
function buildKeywordMap(questions: Question[]) {
  const map: Record<string, { qid: string; cid: string }> = {};
  questions.forEach(q => {
    (q.choices ?? []).forEach(c => {
      const base = c.text.toLowerCase();
      map[base] = { qid: q.id, cid: c.id };
      map[base.replace(/[^a-z0-9 ]/g, '')] = { qid: q.id, cid: c.id };
      map[(q.text + ' ' + c.text).toLowerCase()] = { qid: q.id, cid: c.id };
    });
  });
  return map;
}

// Helper: Extract all matching criteria from the user query
function extractCriteriaFromQuery(query: string, keywordMap: Record<string, { qid: string; cid: string }>) {
  const found: Record<string, string> = {};
  const lower = query.toLowerCase();
  Object.entries(keywordMap).forEach(([key, { qid, cid }]) => {
    if (key.length > 2 && lower.includes(key)) {
      found[qid] = cid;
    }
  });
  return found;
}

// Helper: Get cross-tab count for any criteria
function getCrossTabCount(
  responses: SurveyData['responses'],
  criteria: { [questionId: string]: string }
) {
  return responses.filter(r =>
    Object.entries(criteria).every(([qid, cid]) => r.answers[qid] === cid)
  ).length;
}

// Helper: Extract demographic filters from user query
function extractFilterFromQuery(query: string, filters: FilterOptions): Partial<SelectedFilters> {
  const lower = query.toLowerCase();
  const result: Partial<SelectedFilters> = {};

  for (const age of filters.ageGroups) {
    if (lower.includes(age.toLowerCase())) {
      result.ageGroups = [age];
      break;
    }
  }
  for (const gender of filters.genders) {
    if (lower.includes(gender.toLowerCase())) {
      result.genders = [gender];
      break;
    }
  }
  for (const fam of filters.familyCompositions) {
    if (lower.includes(fam.toLowerCase())) {
      result.familyCompositions = [fam];
      break;
    }
  }
  for (const inc of filters.incomeRanges) {
    if (lower.includes(inc.toLowerCase())) {
      result.incomeRanges = [inc];
      break;
    }
  }
  for (const reg of filters.regions) {
    if (lower.includes(reg.toLowerCase())) {
      result.regions = [reg];
      break;
    }
  }
  return result;
}

// Helper: Demographic split for a base group
function getDemographicSplit(
  responses: SurveyData['responses'],
  demographic: keyof typeof responses[0]['demographics'],
  baseCriteria: { [questionId: string]: string | string[] },
  demographicValues: string[]
) {
  const baseGroup = responses.filter(r =>
    Object.entries(baseCriteria).every(([qid, val]) => {
      const answer = r.answers[qid];
      if (Array.isArray(val)) {
        if (Array.isArray(answer)) {
          return val.some(v => answer.includes(v));
        }
        return typeof answer === 'string' ? val.includes(answer) : false;
      } else {
        if (Array.isArray(answer)) {
          return answer.includes(val);
        }
        return answer === val;
      }
    })
  );
  const baseTotal = baseGroup.length;

  const split = demographicValues.map(value => {
    const count = baseGroup.filter(r => {
      const demoVal = r.demographics[demographic];
      if (typeof demoVal === 'string') {
        return demoVal === value;
      }
      if (demoVal && typeof demoVal === 'object') {
        return Boolean(demoVal[value]);
      }
      return false;
    }).length;
    const percentage = baseTotal > 0 ? Math.round((count / baseTotal) * 100) : 0;
    return { value, count, percentage };
  });

  return { baseTotal, split };
}

const Chatbot: React.FC<ChatbotProps> = ({ onClose }) => {
  const { filteredData, filters, selectedFilters, setSelectedFilters } = useData();
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'system',
      content: SYSTEM_PROMPT
    },
    {
      role: 'assistant',
      content: 'Hello! Ask me anything about the travel survey data.'
    }
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Extract demographic intent from user query
  const extractDemographic = (query: string) => {
    const lower = query.toLowerCase();
    if (lower.includes('age')) return 'ageGroup';
    if (lower.includes('gender')) return 'gender';
    if (lower.includes('income')) return 'incomeRange';
    if (lower.includes('region')) return 'region';
    if (lower.includes('family')) return 'familyComposition';
    return null;
  };

  // Generate a concise summary of the current survey data for the system prompt
  const getSurveyContext = (demographic?: string) => {
    const { questions, responses } = filteredData as SurveyData;

    // 1. Survey schema (all questions and options)
    const schema = questions.map((q: Question) => {
      const options = (q.choices ?? []).map((c: Choice) => `- ${c.text}`).join('\n');
      return `Q: ${q.text}\nOptions:\n${options}`;
    }).join('\n\n');

    // 2. Response counts for each question and choice (MATCHES CHART LOGIC)
    const responseCounts = questions.map(q => {
      const qId = q.id;
      const counts: Record<string, number> = {};
      let total = 0;

      responses.forEach(r => {
        const answer = r.answers[qId];
        if (q.type === 'multiple_choice' && Array.isArray(answer)) {
          answer.forEach(a => {
            counts[a] = (counts[a] || 0) + 1;
          });
          total += 1; // Each respondent counts once
        } else if (typeof answer === 'string') {
          counts[answer] = (counts[answer] || 0) + 1;
          total += 1;
        }
      });

      // Map choice IDs to text and calculate percentages
      const countsWithPercentages = (q.choices ?? []).reduce((acc, c) => {
        const count = counts[c.id] || 0;
        acc[c.text] = {
          count,
          percentage: total > 0 ? Math.round((count / total) * 100) : 0
        };
        return acc;
      }, {} as Record<string, { count: number; percentage: number }>);

      let questionInfo = `${q.text}: ${JSON.stringify(countsWithPercentages)}`;
      if (q.type === 'multiple_choice') {
        questionInfo += " (multi-select question - percentages may sum to >100%)";
      }
      return questionInfo;
    }).join('\n');

    // 3. Demographic fields
    const demoFields = responses[0]?.demographics
      ? Object.keys(responses[0].demographics).join(', ')
      : '';

    // 4. Demographic breakdown if needed
    let extra = '';
    if (demographic) {
      const demoBreakdown: Record<string, number> = {};
      responses.forEach(r => {
        const value = r.demographics?.[demographic as keyof typeof r.demographics];
        if (value) {
          demoBreakdown[value as string] = (demoBreakdown[value as string] || 0) + 1;
        }
      });
      extra = `\nIf the user asks for a breakdown by ${demographic}, use this data: ${JSON.stringify(demoBreakdown)}`;
    }

    return `
Survey Schema:
${schema}

Survey Questions with Response Counts:
${responseCounts}

Demographic fields: ${demoFields}
Total responses: ${responses.length}${extra}
`;
  };

  // Main submit handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    // Only apply dashboard filters if the query contains a filter-panel value
    const filtersToApply = extractFilterFromQuery(message, filters);

    // Only update filters if the query contains a filter-panel value (region, age, gender, etc.)
    if (Object.keys(filtersToApply).length > 0) {
      setSelectedFilters({ ...selectedFilters, ...filtersToApply });
      // Wait for filteredData to update, then answer
      setTimeout(() => actuallyHandleQuery(), 200);
      return;
    }

    // For all other queries, just answer using the current filteredData (do NOT update filters)
    actuallyHandleQuery();
  };

  // Move your existing handleSubmit logic into actuallyHandleQuery
  const actuallyHandleQuery = async () => {
    const { questions, responses } = filteredData as SurveyData;
    const keywordMap = buildKeywordMap(questions);
    const criteria = extractCriteriaFromQuery(message, keywordMap);

    // --- Demographic split for a base group ---
    // Detect queries like "age-wise split for domestic travel", "gender-wise split for beach vacation", etc.
    const lowerMsg = message.toLowerCase();
    const splitDemographics: Array<{ key: keyof typeof responses[0]['demographics'], label: string }> = [
      { key: 'ageGroup', label: 'age' },
      { key: 'gender', label: 'gender' },
      { key: 'incomeRange', label: 'income' },
      { key: 'region', label: 'region' },
      { key: 'familyComposition', label: 'family' }
    ];
    const splitDemo = splitDemographics.find(d => lowerMsg.includes(d.label));
    if (splitDemo && Object.keys(criteria).length >= 1) {
      // Use all values for the demographic
      const demoValues = Array.from(new Set(responses.map(r => r.demographics[splitDemo.key])));
      // If the base group is "domestic", support both "Domestic only" and "Both domestic and international"
      let baseCriteria: { [questionId: string]: string | string[] } = { ...criteria };
      if (
        (splitDemo.key === 'ageGroup' || splitDemo.key === 'gender' || splitDemo.key === 'incomeRange' || splitDemo.key === 'region' || splitDemo.key === 'familyComposition') &&
        (lowerMsg.includes('domestic') || lowerMsg.includes('domestically')) &&
        criteria['Q1'] === 'Q1_1'
      ) {
        baseCriteria['Q1'] = ['Q1_1', 'Q1_3']; // Domestic only or Both
      }
      const { baseTotal, split } = getDemographicSplit(
        responses,
        splitDemo.key,
        baseCriteria,
        demoValues
      );

      // Build markdown table
      let table = `\n\n| ${splitDemo.label.charAt(0).toUpperCase() + splitDemo.label.slice(1)} | Number | Percentage of Base Group |\n|---|---|---|\n`;
      split.forEach(({ value, count, percentage }) => {
        table += `| ${value} | ${count} | ${percentage}% |\n`;
      });

      setMessages(prev => [
        ...prev,
        { role: 'user', content: message },
        {
          role: 'assistant',
          content:
            `Here is the ${splitDemo.label}-wise split for your query:\n${table}\n\nTotal in base group: ${baseTotal}\n\nInsight: ${split.length > 0 ? `The highest share is in the ${split.reduce((a, b) => (a.percentage > b.percentage ? a : b)).value} group.` : ''}`
        }
      ]);
      setMessage('');
      return;
    }

    // --- Cross-questioning ---
    if (Object.keys(criteria).length >= 2) {
      const [baseQid, baseCid] = Object.entries(criteria)[0];
      const baseCount = getCrossTabCount(responses, { [baseQid]: baseCid });
      const intersectionCount = getCrossTabCount(responses, criteria);
      const percentOfBase = baseCount > 0 ? Math.round((intersectionCount / baseCount) * 100) : 0;
      const percentOfAll = responses.length > 0 ? Math.round((intersectionCount / responses.length) * 100) : 0;

      const baseQ = questions.find(q => q.id === baseQid);
      const baseC = baseQ?.choices?.find(c => c.id === baseCid);
      const baseLabel = baseC?.text || 'base group';

      const intersectionLabels = Object.entries(criteria).map(([qid, cid]) => {
        const q = questions.find(q => q.id === qid);
        const c = q?.choices?.find(c => c.id === cid);
        return c?.text || '';
      }).filter(Boolean);

      setMessages(prev => [
        ...prev,
        { role: 'user', content: message },
        {
          role: 'assistant',
          content:
            `Out of ${baseCount} respondents who selected "${baseLabel}", ` +
            `${intersectionCount} also selected ${intersectionLabels.map(l => `"${l}"`).join(' and ')}. ` +
            `That is ${percentOfBase}% of "${baseLabel}" and ${percentOfAll}% of all respondents.\n\n` +
            `Insight: Among those who chose "${baseLabel}", ${intersectionLabels.slice(1).join(' and ')} are a notable preference.`
        },
      ]);
      setMessage('');
      return;
    }

    // --- LLM fallback ---
    const demographic = extractDemographic(message) ?? undefined;
    const newMessages: Message[] = [
      {
        role: 'system',
        content: SYSTEM_PROMPT + '\n\n' + getSurveyContext(demographic)
      },
      ...messages.filter(m => m.role !== 'system'),
      { role: 'user', content: message }
    ];

    setMessages([...messages, { role: 'user', content: message }]);
    setMessage('');
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMessages }),
      });

      if (!response.ok) throw new Error('API error');
      const data = await response.json();
      const assistantMessage = data.choices?.[0]?.message?.content?.trim() ||
        data.choices?.[0]?.content?.trim() ||
        data.choices?.[0]?.text?.trim() ||
        'Sorry, I couldn\'t understand that.';

      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: assistantMessage }
      ]);
    } catch (error) {
      setError('Failed to get response. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full h-[34rem] flex flex-col">
      {/* Header */}
      <div
        className="p-4 bg-primary-600 text-black rounded-t-lg flex justify-between items-center cursor-pointer"
        onClick={onClose}
      >
        <div className="flex items-center">
          <MessageSquare size={20} className="mr-2" />
          <span className="font-medium text-lg">Travel Data Assistant</span>
        </div>
        <button
          type="button"
          className="font-bold text-xl"
          aria-label="Close"
          onClick={onClose}
          style={{ background: 'none', border: 'none', cursor: 'pointer' }}
        >
          ×
        </button>
      </div>

      {/* Messages container */}
      <div className="p-4 h-[22rem] overflow-y-auto flex flex-col space-y-3 flex-1">
        {messages
          .filter(msg => msg.role !== 'system')
          .map((msg, idx) => (
            <div key={idx} className={`mb-2 ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
              {msg.role === 'assistant' ? (
                <div className="inline-block px-3 py-2 rounded-lg bg-gray-100 text-left max-w-full">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
                </div>
              ) : (
                <span className="inline-block px-3 py-2 rounded-lg bg-blue-100">{msg.content}</span>
              )}
            </div>
          ))}
        {loading && <div className="text-gray-400">Thinking...</div>}
        {error && <div className="text-red-500">{error}</div>}
      </div>

      {/* Input form */}
      <form onSubmit={handleSubmit} className="p-4 border-t border-gray-200">
        <div className="flex items-center">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Ask about the travel data..."
            className="flex-1 border border-gray-300 rounded-l-md py-2 px-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary-500"
          />
          <button
            type="submit"
            className="bg-primary-600 text-black py-2 px-3 rounded-r-md hover:bg-primary-700 transition-colors"
            disabled={loading}
          >
            <Send size={18} />
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Try: "What % of people prefer international travel?" or "Show age-wise split for travel websites"
        </p>
      </form>
    </div>
  );
};

export default Chatbot;