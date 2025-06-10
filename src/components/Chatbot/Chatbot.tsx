import React, { useState } from 'react';
import { MessageSquare, Send } from 'lucide-react';
import { useData } from '../../contexts/DataContext';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const SYSTEM_PROMPT = `
You are a travel data assistant.
Answer using ONLY the provided survey data.
Your answers MUST match exactly with the data shown in the charts.
Present counts and percentages precisely as they appear in the data.

IMPORTANT: For multi-select questions (marked as "multi-select question"), percentages may sum to over 100% because respondents can select multiple options. This is expected and correct.

Do not mention question IDs (like Q3_1) in your response—use only the question text and answer options.
If you provide a demographic split, format it as a markdown table (with a blank line before and after the table).
Always present percentages as whole numbers (e.g., 24% not 24.3%).
After presenting data, add a brief insight highlighting the most significant finding.
Only add explanations if the user asks for them. For follow-up questions, use the previous context.
`;

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface ChatbotProps {
  onClose: () => void;
}

const Chatbot: React.FC<ChatbotProps> = ({ onClose }) => {
  const { filteredData } = useData();
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
    const { questions, responses } = filteredData;
    
    // If you want to show filter info, ensure you get it from the correct context or remove this block
    const filterInfo = ''; // No activeFilters in SurveyData
    
    // Get response counts for each question and choice
    const responseCounts = questions.map(q => {
      const qId = q.id;
      const counts: Record<string, number> = {};
      const responseCounted = new Set();
      let total = 0;
      
      // Count responses for each choice
      responses.forEach(r => {
        const answer = r.answers[qId];
        const weight = r.weight || 1;
        
        if (answer) {
          if (Array.isArray(answer)) {
            answer.forEach(a => {
              const choice = q.choices?.find(c => c.id === a);
              if (choice) {
                counts[choice.text] = (counts[choice.text] || 0) + weight;
              }
            });
            
            // Only count response once for total
            if (!responseCounted.has(r.id)) {
              total += weight;
              responseCounted.add(r.id);
            }
          } else if (typeof answer === 'object' && answer !== null) {
            // Handle scale questions
            Object.entries(answer).forEach(([key, value]) => {
              const choice = q.choices?.find(c => c.id === key);
              if (choice) {
                counts[choice.text] = (counts[choice.text] || 0) + Number(value) * weight;
              }
            });
            
            if (!responseCounted.has(r.id)) {
              total += weight;
              responseCounted.add(r.id);
            }
          } else {
            const choice = q.choices?.find(c => c.id === answer);
            if (choice) {
              counts[choice.text] = (counts[choice.text] || 0) + weight;
            }
            
            if (!responseCounted.has(r.id)) {
              total += weight;
              responseCounted.add(r.id);
            }
          }
        }
      });
      
      // Calculate percentages
      const countsWithPercentages = Object.entries(counts).reduce((acc, [choice, count]) => {
        acc[choice] = {
          count: Math.round(count),
          percentage: Math.round((count / total) * 100)
        };
        return acc;
      }, {} as Record<string, {count: number, percentage: number}>);
      
      // Note if this is a multi-select question
      const isMultiSelect = q.type === 'multiple_choice';
      let questionInfo = `${q.text}: ${JSON.stringify(countsWithPercentages)}`;
      if (isMultiSelect) {
        questionInfo += " (multi-select question - percentages may sum to >100%)";
      }
      
      return questionInfo;
    }).join('\n');
    
    // Demographic data summary
    const demoFields = responses[0]?.demographics
      ? Object.keys(responses[0].demographics).join(', ')
      : '';
      
    let extra = '';
    if (demographic) {
      // Prepare demographic breakdown
      const demoBreakdown: Record<string, number> = {};
      responses.forEach(r => {
        const value = r.demographics?.[demographic as keyof typeof r.demographics];
        if (value) {
          demoBreakdown[value as string] = (demoBreakdown[value as string] || 0) + 1;
        }
      });
      
      extra = `\nIf the user asks for a breakdown by ${demographic}, use this data: ${JSON.stringify(demoBreakdown)}`;
    }
    
    return `${filterInfo}Survey Questions with Response Counts:\n${responseCounts}\n\nDemographic fields: ${demoFields}\nTotal responses: ${responses.length}${extra}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    // Detect demographic intent
    const demographic = extractDemographic(message) ?? undefined;

    // Add the new user message to the chat history
    const newMessages: Message[] = [
      {
        role: 'system',
        content:
          `You are a travel data assistant. 
          Answer using ONLY the provided survey data.
          Your answers MUST match exactly with the data shown in the charts.
          Present counts and percentages precisely as they appear in the data.
          
          IMPORTANT: For multi-select questions (marked as "multi-select question"), percentages may sum to over 100% because respondents can select multiple options. This is expected and correct.
          
          Do not mention question IDs (like Q3_1) in your response—use only the question text and answer options.
          If you provide a demographic split, format it as a markdown table (with a blank line before and after the table).
          Always present percentages as whole numbers (e.g., 24% not 24.3%).
          After presenting data, add a brief insight highlighting the most significant finding.
          Only add explanations if the user asks for them. For follow-up questions, use the previous context.\n\n${getSurveyContext(demographic)}`
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
        <span className="font-bold text-xl" aria-label="Close">×</span>
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