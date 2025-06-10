import React, { useEffect, useState } from 'react';
import { MessageSquare } from 'lucide-react';
import { useData } from '../../contexts/DataContext';
import FilterPanel from './FilterPanel';
import QuestionSelector from './QuestionSelector';
import ChartGrid from '../Charts/ChartGrid';
import PowerPointExport from '../Export/PowerPointExport';
import Chatbot from '../Chatbot/Chatbot';

interface DashboardProps {
  setExportHandler?: (handler: () => void) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ setExportHandler }) => {
  const { selectedQuestions, data, filteredData } = useData();
  const [showChatbot, setShowChatbot] = useState(false);
  const [activeTab, setActiveTab] = useState('charts'); // Default to 'charts'
  const [chartImages, setChartImages] = useState<{ [questionId: string]: string }>({});

  // Handler to collect chart images from ChartCard
  const handleChartImageReady = (questionId: string, dataUrl: string) => {
    setChartImages(prev => ({ ...prev, [questionId]: dataUrl }));
  };

  // Handler to switch to export tab and scroll to export section
  const handleExportClick = () => {
    setActiveTab('export');
    setTimeout(() => {
      const exportSection = document.getElementById('export-section');
      if (exportSection) {
        exportSection.scrollIntoView({ behavior: 'smooth' });
      }
    }, 100); // Wait for tab content to render
  };

  // Register the export handler with parent, but don't call it here!
  useEffect(() => {
    if (setExportHandler) setExportHandler(() => handleExportClick);
  }, [setExportHandler]);

  return (
    <div className="flex-grow mobile-padding relative">
      
      {/* Filter Panel - Mobile responsive */}
      <div className="mb-4 sm:mb-6">
        <div className="bg-white rounded-lg shadow p-3 sm:p-4 w-full">
          <FilterPanel />
        </div>
      </div>

      {/* Main Content */}
      <div className="bg-white rounded-lg shadow mb-4 sm:mb-6">
        {/* Tab Navigation - Mobile scrollable */}
        <div className="border-b border-gray-200 overflow-x-auto">
          <nav className="flex min-w-max sm:min-w-0">
            <button
              onClick={() => setActiveTab('charts')}
              className={`px-3 sm:px-4 py-3 text-sm font-medium whitespace-nowrap ${
                activeTab === 'charts' 
                  ? 'border-b-2 border-blue-500 text-blue-600' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Charts
            </button>
            <button
              onClick={() => setActiveTab('questions')}
              className={`px-3 sm:px-4 py-3 text-sm font-medium whitespace-nowrap ${
                activeTab === 'questions' 
                  ? 'border-b-2 border-blue-500 text-blue-600' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <span className="hidden sm:inline">Select Questions</span>
              <span className="sm:hidden">Questions</span>
            </button>
            <button
              onClick={() => setActiveTab('export')}
              className={`px-3 sm:px-4 py-3 text-sm font-medium whitespace-nowrap ${
                activeTab === 'export' 
                  ? 'border-b-2 border-blue-500 text-blue-600' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Export
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-3 sm:p-4">
          {activeTab === 'charts' && selectedQuestions.length > 0 && (
            <ChartGrid onChartImageReady={handleChartImageReady} />
          )}
          {activeTab === 'questions' && <QuestionSelector />}
          {activeTab === 'export' && (
            <div id="export-section">
              <PowerPointExport chartImages={chartImages} />
            </div>
          )}
          {activeTab === 'charts' && selectedQuestions.length === 0 && (
            <div className="text-center py-8 sm:py-10">
              <h3 className="text-base sm:text-lg font-medium text-gray-700 mb-2">No questions selected</h3>
              <p className="text-sm sm:text-base text-gray-500 mb-4">Please select questions to display charts</p>
              <button 
                onClick={() => setActiveTab('questions')} 
                className="bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition-colors text-sm sm:text-base"
              >
                Select Questions
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Mobile-responsive chatbot button */}
      <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50">
        <button 
          onClick={() => setShowChatbot(true)} 
          className={`flex items-center gap-2 rounded-full px-3 sm:px-5 py-2 sm:py-3 shadow-lg font-bold text-base sm:text-lg border-2 border-white transition-all duration-200
            ${showChatbot 
              ? 'bg-gradient-to-r from-orange-200 to-orange-100 text-orange-400 opacity-70 cursor-default' 
              : 'bg-gradient-to-r from-orange-500 to-orange-400 text-white hover:from-orange-600 hover:to-orange-500 cursor-pointer'
            }`}
          style={{ minWidth: 56, pointerEvents: showChatbot ? 'none' : 'auto' }}
          aria-label="Open chatbot"
        >
          <MessageSquare size={20} />
          <span className="hidden sm:inline ml-1">ASK</span>
        </button>
      </div>

      {/* Mobile-responsive chatbot popup */}
      {showChatbot && (
        <div className="fixed bottom-16 right-4 sm:bottom-32 sm:right-6 w-[calc(100vw-2rem)] max-w-[30rem] z-50 bg-white rounded-lg shadow-xl overflow-hidden h-[60vh] sm:h-[34rem]">
          <Chatbot onClose={() => setShowChatbot(false)} />
        </div>
      )}
    </div>
  );
};

export default Dashboard;