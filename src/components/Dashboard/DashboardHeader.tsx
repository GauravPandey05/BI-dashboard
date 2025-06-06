import React, { useState } from 'react';
import { Home, BarChart3, PieChart, FileDown, PaletteIcon, LogOut, Upload } from 'lucide-react';
import { useData } from '../../contexts/DataContext';
import DataUploader from '../DataUpload/DataUploader';

const DashboardHeader: React.FC = () => {
  const { data, filteredData } = useData();
  const [showUploader, setShowUploader] = useState(false);
  
  const totalResponses = data.responses.length;
  const filteredResponses = filteredData.responses.length;
  
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
          <button className="text-gray-600 hover:text-gray-900 flex items-center gap-1">
            <PieChart size={18} />
            <span className="hidden md:inline">Summary</span>
          </button>
          <button className="text-gray-600 hover:text-gray-900 flex items-center gap-1">
            <PaletteIcon size={18} />
            <span className="hidden md:inline">Color Palette</span>
          </button>
          <button className="text-gray-600 hover:text-gray-900 flex items-center gap-1">
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
    </header>
  );
};

export default DashboardHeader;