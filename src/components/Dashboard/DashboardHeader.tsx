import React, { useState } from 'react';
import { Home, BarChart3, PieChart, FileDown, PaletteIcon, LogOut, Upload } from 'lucide-react';
import { useData } from '../../contexts/DataContext';
import DataUploader from '../DataUpload/DataUploader';

const DashboardHeader: React.FC<{ onExportClick?: () => void, onSummaryClick?: () => void }> = ({ 
  onExportClick,
  onSummaryClick
}) => {
  const { data, filteredData } = useData();
  const [showUploader, setShowUploader] = useState(false);
  const [showSummary, setShowSummary] = useState(false);

  const totalResponses = data.responses.length;
  const filteredResponses = filteredData.responses.length;

  const handleSummaryClick = () => {
    if (onSummaryClick) {
      onSummaryClick();
    } else {
      setShowSummary(true);
    }
  };

  return (
    <header className="bg-white border-b border-gray-200">
      <div className="px-6 py-3 flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <BarChart3 className="h-6 w-6 text-blue-600" />
          <h1 className="text-xl font-semibold text-gray-800">Travel Survey Dashboard</h1>
        </div>

        <div className="text-sm text-gray-500">
          {filteredResponses === totalResponses ? (
            <span>Showing all {totalResponses} responses</span>
          ) : (
            <span>Showing {filteredResponses} of {totalResponses} responses</span>
          )}
        </div>

        <div className="flex items-center space-x-4">
          <button className="text-gray-600 hover:text-gray-900 flex items-center gap-1">
            <Home size={18} />
            <span className="hidden md:inline">Home</span>
          </button>
          <button 
            className="text-gray-600 hover:text-gray-900 flex items-center gap-1"
            onClick={handleSummaryClick}
          >
            <PieChart size={18} />
            <span className="hidden md:inline">Summary</span>
          </button>
          <button className="text-gray-600 hover:text-gray-900 flex items-center gap-1">
            <PaletteIcon size={18} />
            <span className="hidden md:inline">Color Palette</span>
          </button>
          <button
            className="text-gray-600 hover:text-gray-900 flex items-center gap-1"
            onClick={onExportClick}
          >
            <FileDown size={18} />
            <span className="hidden md:inline">Export</span>
          </button>
          <button 
            onClick={() => setShowUploader(true)}
            className="text-gray-600 hover:text-gray-900 flex items-center gap-1"
          >
            <Upload size={18} />
            <span className="hidden md:inline">Upload</span>
          </button>
          <button className="text-gray-600 hover:text-gray-900 flex items-center gap-1">
            <LogOut size={18} />
            <span className="hidden md:inline">Logout</span>
          </button>
        </div>
      </div>

      <div className="px-6 py-2 bg-gray-50 border-t border-b border-gray-200 text-xs text-gray-500">
        <div className="flex items-center space-x-2">
          <span>Dashboard</span>
          <span>/</span>
          <span className="font-medium text-gray-700">Travel Survey Analysis</span>
        </div>
      </div>

      {/* Upload Modal */}
      {showUploader && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-lg font-semibold text-gray-800">Upload Survey Data</h2>
              <button 
                onClick={() => setShowUploader(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ×
              </button>
            </div>
            <div className="p-4">
              <DataUploader />
            </div>
          </div>
        </div>
      )}
      
      {/* Summary Modal */}
      {showSummary && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-lg font-semibold text-gray-800">Survey Summary</h2>
              <button 
                onClick={() => setShowSummary(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ×
              </button>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-blue-50 p-4 rounded-lg shadow-sm">
                  <h3 className="text-sm font-medium text-blue-700 mb-2">Total Responses</h3>
                  <p className="text-3xl font-bold text-blue-800">{filteredResponses}</p>
                  <p className="text-xs text-blue-600 mt-1">
                    {filteredResponses === totalResponses 
                      ? 'All responses' 
                      : `${Math.round((filteredResponses/totalResponses) * 100)}% of total`}
                  </p>
                </div>
                
                <div className="bg-green-50 p-4 rounded-lg shadow-sm">
                  <h3 className="text-sm font-medium text-green-700 mb-2">Most Popular Destination</h3>
                  <p className="text-xl font-bold text-green-800">Paris, France</p>
                  <p className="text-xs text-green-600 mt-1">Selected by 32% of respondents</p>
                </div>
                
                <div className="bg-purple-50 p-4 rounded-lg shadow-sm">
                  <h3 className="text-sm font-medium text-purple-700 mb-2">Average Travel Budget</h3>
                  <p className="text-3xl font-bold text-purple-800">$3,250</p>
                  <p className="text-xs text-purple-600 mt-1">Per person per trip</p>
                </div>
              </div>
              
              <div className="mt-8">
                <h3 className="text-lg font-medium mb-4">Key Insights</h3>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start">
                    <div className="mr-2 mt-0.5">•</div>
                    <div>67% of respondents prefer booking travel online versus using a travel agent (24%)</div>
                  </li>
                  <li className="flex items-start">
                    <div className="mr-2 mt-0.5">•</div>
                    <div>Beach destinations are most popular (45%), followed by cultural/city trips (32%)</div>
                  </li>
                  <li className="flex items-start">
                    <div className="mr-2 mt-0.5">•</div>
                    <div>Travelers aged 25-34 spend an average of 12% more on accommodations than other age groups</div>
                  </li>
                </ul>
              </div>
              
              <div className="mt-6 text-center">
                <button 
                  onClick={() => setShowSummary(false)}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                >
                  Return to Dashboard
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default DashboardHeader;