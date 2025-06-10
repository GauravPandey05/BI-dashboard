import React, { useState, useEffect } from 'react';
import { DataProvider } from './contexts/DataContext';
import Dashboard from './components/Dashboard/Dashboard';
import DashboardHeader from './components/Dashboard/DashboardHeader';
import { loadMockData } from './data/mockData';

function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [dashboardExport, setDashboardExport] = useState<(() => void) | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 1000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <DataProvider initialData={loadMockData()}>
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <DashboardHeader onExportClick={() => dashboardExport && dashboardExport()} />
        {isLoading ? (
          <div className="flex-grow flex items-center justify-center px-4">
            <div className="animate-pulse flex flex-col items-center">
              <div className="h-12 w-12 sm:h-16 sm:w-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              <p className="mt-4 text-gray-600 text-sm sm:text-base text-center">Loading dashboard...</p>
            </div>
          </div>
        ) : (
          <Dashboard setExportHandler={setDashboardExport} />
        )}
        <footer className="bg-white border-t border-gray-200 py-3 sm:py-4 px-4 sm:px-6 text-center text-gray-500 text-xs sm:text-sm">
          <div className="max-w-7xl mx-auto">
            © 2025 Travel Survey Dashboard • All data is confidential and protected
          </div>
        </footer>
      </div>
    </DataProvider>
  );
}

export default App;