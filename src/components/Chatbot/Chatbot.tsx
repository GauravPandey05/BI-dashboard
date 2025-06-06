import React, { useState } from 'react';
import { MessageSquare, Send } from 'lucide-react';
import { useData } from '../../contexts/DataContext';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const SYSTEM_PROMPT = `
You are a travel data assistant. 
Answer using only the provided survey data. 
Respond concisely with only the requested data (percentages, counts, etc.).
Do not mention question numbers or codes (like Q3_1) in your response—use only the plain text labels.
If you provide a demographic split, format it as a markdown table (with a blank line before and after the table).
After the data, add a brief insight or highlight (e.g., which group is highest, or a notable trend) if possible.
Only add explanations if the user asks for them. If the user asks a follow-up, use the previous context.
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
    // Only send question texts and choices, not codes
    const questionSummaries = questions.map(q => {
      const choices = q.choices ? q.choices.map(c => c.text).join('; ') : '';
      return `${q.text}${choices ? ` [${choices}]` : ''}`;
    }).join('\n');
    const demoFields = responses[0]?.demographics
      ? Object.keys(responses[0].demographics).join(', ')
      : '';
    let extra = '';
    if (demographic) {
      extra = `\nIf the user asks for a breakdown by ${demographic}, use the "${demographic}" field from the demographics.`;
    }
    return `Survey Questions:\n${questionSummaries}\nDemographic fields: ${demoFields}\nTotal responses: ${responses.length}${extra}`;
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
          Answer using only the provided survey data. 
          Respond concisely with only the requested data (percentages, counts, etc.).
          Do not mention question numbers or codes (like Q3_1) in your response—use only the plain text labels.
          If you provide a demographic split, format it as a markdown table (with a blank line before and after the table).
          After the data, add a brief insight or highlight (e.g., which group is highest, or a notable trend) if possible.
          Only add explanations if the user asks for them. If the user asks a follow-up, use the previous context.\n\n${getSurveyContext(demographic)}`
      },
      ...messages.filter(m => m.role !== 'system'),
      { role: 'user', content: message }
    ];

    setMessages([...messages, { role: 'user', content: message }]);
    setMessage('');
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('http://localhost:5000/api/chat', {
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