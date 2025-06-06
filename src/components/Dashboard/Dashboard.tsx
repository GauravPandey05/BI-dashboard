import React from 'react';
import FilterPanel from './FilterPanel';
import QuestionSelector from './QuestionSelector';
import ChartGrid from '../Charts/ChartGrid';
import PowerPointExport from '../Export/PowerPointExport';
import Chatbot from '../Chatbot/Chatbot';
import { useData } from '../../contexts/DataContext';
import { useState } from 'react';
import { MessageSquare } from 'lucide-react';

const Dashboard: React.FC = () => {
  const { selectedQuestions } = useData();
  const [showChatbot, setShowChatbot] = useState(false);
  const [activeTab, setActiveTab] = useState('charts');

  return (
    <div className="flex-grow p-6 relative">
      <div className="mb-6">
        <div className="bg-white rounded-lg shadow p-4 w-full">
          <FilterPanel />
        </div>
      </div>

      <div className="bg-white rounded-lg shadow mb-6">
        <div className="border-b border-gray-200">
          <nav className="flex">
            <button
              onClick={() => setActiveTab('charts')}
              className={`px-4 py-3 text-sm font-medium ${
                activeTab === 'charts' 
                  ? 'border-b-2 border-blue-500 text-blue-600' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Charts
            </button>
            <button
              onClick={() => setActiveTab('questions')}
              className={`px-4 py-3 text-sm font-medium ${
                activeTab === 'questions' 
                  ? 'border-b-2 border-blue-500 text-blue-600' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Select Questions
            </button>
            <button
              onClick={() => setActiveTab('export')}
              className={`px-4 py-3 text-sm font-medium ${
                activeTab === 'export' 
                  ? 'border-b-2 border-blue-500 text-blue-600' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Export
            </button>
          </nav>
        </div>
        
        <div className="p-4">
          {activeTab === 'charts' && selectedQuestions.length > 0 && <ChartGrid />}
          {activeTab === 'questions' && <QuestionSelector />}
          {activeTab === 'export' && <PowerPointExport />}
          {activeTab === 'charts' && selectedQuestions.length === 0 && (
            <div className="text-center py-10">
              <h3 className="text-lg font-medium text-gray-700 mb-2">No questions selected</h3>
              <p className="text-gray-500 mb-4">Please select questions to display charts</p>
              <button 
                onClick={() => setActiveTab('questions')} 
                className="bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition-colors"
              >
                Select Questions
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Fixed chatbot button in bottom right corner */}
      <div className="fixed bottom-6 right-6 z-50">
        <button 
          onClick={() => setShowChatbot(true)} 
          className={`flex items-center gap-2 rounded-full px-5 py-3 shadow-lg font-bold text-lg border-2 border-white transition-all duration-200
            ${showChatbot 
              ? 'bg-gradient-to-r from-orange-200 to-orange-100 text-orange-400 opacity-70 cursor-default' 
              : 'bg-gradient-to-r from-orange-500 to-orange-400 text-white hover:from-orange-600 hover:to-orange-500 cursor-pointer'
            }`}
          style={{ minWidth: 64, pointerEvents: showChatbot ? 'none' : 'auto' }}
          aria-label="Open chatbot"
        >
          <MessageSquare size={24} />
          <span className="ml-1">ASK</span>
        </button>
      </div>

      {/* Chatbot popup */}
      {showChatbot && (
        <div className="fixed bottom-32 right-6 w-[30rem] z-50 bg-white rounded-lg shadow-xl overflow-hidden h-[34rem]">
          <Chatbot onClose={() => setShowChatbot(false)} />
        </div>
      )}
    </div>
  );
};

export default Dashboard;