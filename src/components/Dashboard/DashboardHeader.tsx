import React, { useState } from 'react';
import { Home, BarChart3, PieChart, FileDown, PaletteIcon, LogOut, Upload, Menu, Settings } from 'lucide-react';
import { useData } from '../../contexts/DataContext';
import DataUploader from '../DataUpload/DataUploader';

const DashboardHeader: React.FC<{ onExportClick?: () => void, onSummaryClick?: () => void }> = ({ 
  onExportClick,
  onSummaryClick
}) => {
  const { data, filteredData } = useData();
  const [showUploader, setShowUploader] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

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
      <div className="mobile-padding py-3 flex justify-between items-center">
        <div className="flex items-center space-x-2 min-w-0 flex-1">
          <BarChart3 className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600 flex-shrink-0" />
          <h1 className="text-lg sm:text-xl lg:text-2xl font-semibold text-gray-800">
            <span className="hidden lg:inline">Travel Survey Dashboard</span>
            <span className="hidden sm:inline lg:hidden">Travel Survey</span>
            <span className="sm:hidden">Dashboard</span>
          </h1>
        </div>

        {/* Response count - adjust visibility */}
        <div className="hidden lg:block text-sm text-gray-500 mx-4 flex-shrink-0">
          {filteredResponses === totalResponses ? (
            <span>All {totalResponses} responses</span>
          ) : (
            <span>{filteredResponses} of {totalResponses}</span>
          )}
        </div>

        {/* Desktop Navigation - hide on medium screens to prevent overcrowding */}
        <div className="hidden xl:flex items-center space-x-3 lg:space-x-4 flex-shrink-0">
          <button className="text-gray-600 hover:text-gray-900 flex items-center gap-1 text-sm">
            <Home size={16} />
            <span>Home</span>
          </button>
          <button 
            className="text-gray-600 hover:text-gray-900 flex items-center gap-1 text-sm"
            onClick={handleSummaryClick}
          >
            <PieChart size={16} />
            <span>Summary</span>
          </button>
          <button className="text-gray-600 hover:text-gray-900 flex items-center gap-1 text-sm">
            <PaletteIcon size={16} />
            <span>Palette</span>
          </button>
          <button className="text-gray-600 hover:text-gray-900 flex items-center gap-1 text-sm">
            <Settings size={16} />
            <span>Settings</span>
          </button>
          <button
            className="text-gray-600 hover:text-gray-900 flex items-center gap-1 text-sm"
            onClick={onExportClick}
          >
            <FileDown size={16} />
            <span>Export</span>
          </button>
          <button 
            onClick={() => setShowUploader(true)}
            className="text-gray-600 hover:text-gray-900 flex items-center gap-1 text-sm"
          >
            <Upload size={16} />
            <span>Upload</span>
          </button>
          <button className="text-gray-600 hover:text-gray-900 flex items-center gap-1 text-sm">
            <LogOut size={16} />
            <span>Logout</span>
          </button>
        </div>

        {/* Mobile Menu Button - show on medium screens too */}
        <button 
          className="xl:hidden p-2 text-gray-600 hover:text-gray-900 flex-shrink-0"
          onClick={() => setShowMobileMenu(!showMobileMenu)}
        >
          <Menu size={20} />
        </button>
      </div>

      {/* Response Count for tablet/mobile */}
      <div className="lg:hidden mobile-padding py-2 text-xs text-gray-500 border-t border-gray-100">
        {filteredResponses === totalResponses ? (
          <span>Showing all {totalResponses} responses</span>
        ) : (
          <span>Showing {filteredResponses} of {totalResponses} responses</span>
        )}
      </div>

      {/* Mobile Navigation Menu */}
      {showMobileMenu && (
        <div className="xl:hidden bg-white border-t border-gray-200">
          <div className="mobile-padding py-3 space-y-3">
            <button className="w-full text-left text-gray-600 hover:text-gray-900 flex items-center gap-3 py-2">
              <Home size={18} />
              <span>Home</span>
            </button>
            <button 
              className="w-full text-left text-gray-600 hover:text-gray-900 flex items-center gap-3 py-2"
              onClick={() => {
                handleSummaryClick();
                setShowMobileMenu(false);
              }}
            >
              <PieChart size={18} />
              <span>Summary</span>
            </button>
            <button className="w-full text-left text-gray-600 hover:text-gray-900 flex items-center gap-3 py-2">
              <PaletteIcon size={18} />
              <span>Color Palette</span>
            </button>
            <button className="w-full text-left text-gray-600 hover:text-gray-900 flex items-center gap-3 py-2">
              <Settings size={18} />
              <span>Settings</span>
            </button>
            <button 
              className="w-full text-left text-gray-600 hover:text-gray-900 flex items-center gap-3 py-2"
              onClick={() => {
                onExportClick?.();
                setShowMobileMenu(false);
              }}
            >
              <FileDown size={18} />
              <span>Export</span>
            </button>
            <button 
              onClick={() => {
                setShowUploader(true);
                setShowMobileMenu(false);
              }}
              className="w-full text-left text-gray-600 hover:text-gray-900 flex items-center gap-3 py-2"
            >
              <Upload size={18} />
              <span>Upload Data</span>
            </button>
            <button className="w-full text-left text-gray-600 hover:text-gray-900 flex items-center gap-3 py-2">
              <LogOut size={18} />
              <span>Logout</span>
            </button>
          </div>
        </div>
      )}

      {/* Breadcrumb */}
      <div className="mobile-padding py-2 bg-gray-50 border-t border-b border-gray-200 text-xs text-gray-500">
        <div className="flex items-center space-x-2 max-w-7xl mx-auto">
          <span>Dashboard</span>
          <span>/</span>
          <span className="font-medium text-gray-700">Travel Survey Analysis</span>
        </div>
      </div>

      {/* Upload Modal */}
      {showUploader && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-lg font-semibold text-gray-800">Upload Survey Data</h2>
              <button 
                onClick={() => setShowUploader(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl leading-none"
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
      
      {/* Summary Modal - Make responsive */}
      {showSummary && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-lg font-semibold text-gray-800">Survey Summary</h2>
              <button 
                onClick={() => setShowSummary(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl leading-none"
              >
                ×
              </button>
            </div>
            <div className="p-4 sm:p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
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