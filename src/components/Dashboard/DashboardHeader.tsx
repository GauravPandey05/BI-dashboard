import React, { useState } from 'react';
import { Home, BarChart3, FileDown, LogOut, Upload, Menu } from 'lucide-react';
import { useData } from '../../contexts/DataContext';
import DataUploader from '../DataUpload/DataUploader';
import type { SurveyData, Response } from '../../types';

// These interfaces should match your types file
interface Choice {
  id: string;
  text: string;
}
interface Question {
  id: string;
  text: string;
  type: string;
  choices: Choice[];
}

// Helper to get summary stats from mock data
function getSurveySummary(data: SurveyData) {
  const responses: Response[] = data.responses;
  const questions: Question[] = data.questions as Question[];

  // Helper to get most common answer for a question
  function getMostCommonAnswer(qid: string) {
    const counts: Record<string, number> = {};
    responses.forEach((r: Response) => {
      const ans = r.answers[qid];
      if (typeof ans === 'string') counts[ans] = (counts[ans] || 0) + 1;
    });
    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    const [mostId, mostCount] = sorted[0] || [undefined, 0];
    const q = questions.find((q: Question) => q.id === qid);
    const c = q?.choices.find((c: Choice) => c.id === mostId);
    return {
      id: mostId,
      text: c?.text ?? 'N/A',
      count: mostCount,
      percent: responses.length > 0 ? Math.round((mostCount / responses.length) * 100) : 0
    };
  }

  // Q8: Booked in last 6 months
  const booked = responses.filter((r: Response) => r.answers["Q8"] === "Q8_1").length;
  const notBooked = responses.length - booked;

  return {
    total: responses.length,
    mostCommonTravelPlan: getMostCommonAnswer("Q1"),
    mostPopularTripType: getMostCommonAnswer("Q2"),
    mostImportantBookingFactor: getMostCommonAnswer("Q4"),
    bookedLast6mo: booked,
    notBookedLast6mo: notBooked,
    bookedLast6moPercent: responses.length > 0 ? Math.round((booked / responses.length) * 100) : 0
  };
}

const DashboardHeader: React.FC<{ onExportClick?: () => void }> = ({
  onExportClick
}) => {
  const { data, filteredData } = useData();
  const [showUploader, setShowUploader] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  const totalResponses = data.responses.length;
  const filteredResponses = filteredData.responses.length;

  // Calculate summary only when needed
  const summary = getSurveySummary(filteredData);

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

        {/* Desktop Navigation */}
        <div className="hidden xl:flex items-center space-x-3 lg:space-x-4 flex-shrink-0">
          <button className="text-gray-600 hover:text-gray-900 flex items-center gap-1 text-sm">
            <Home size={16} />
            <span>Home</span>
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
          <button
            className="text-gray-600 hover:text-blue-700 flex items-center gap-1 text-sm"
            onClick={() => setShowSummary(true)}
            title="Show Survey Summary"
          >
            <BarChart3 size={16} />
            <span>Summary</span>
          </button>
          <button className="text-gray-600 hover:text-gray-900 flex items-center gap-1 text-sm">
            <LogOut size={16} />
            <span>Logout</span>
          </button>
        </div>

        {/* Mobile Menu Button */}
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
            <button
              className="w-full text-left text-blue-700 hover:text-blue-900 flex items-center gap-3 py-2"
              onClick={() => {
                setShowSummary(true);
                setShowMobileMenu(false);
              }}
            >
              <BarChart3 size={18} />
              <span>Summary</span>
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

      {/* Responsive Survey Summary Modal */}
      {showSummary && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <div className="bg-blue-50 p-4 rounded-lg shadow-sm">
                  <h3 className="text-sm font-medium text-blue-700 mb-2">Total Responses</h3>
                  <p className="text-3xl font-bold text-blue-800">{summary.total}</p>
                  <p className="text-xs text-blue-600 mt-1">
                    {filteredResponses === totalResponses
                      ? 'All responses'
                      : `${Math.round((filteredResponses / totalResponses) * 100)}% of total`}
                  </p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg shadow-sm">
                  <h3 className="text-sm font-medium text-green-700 mb-2">Most Common Travel Plan</h3>
                  <p className="text-xl font-bold text-green-800">{summary.mostCommonTravelPlan.text}</p>
                  <p className="text-xs text-green-600 mt-1">
                    {summary.mostCommonTravelPlan.count} respondents ({summary.mostCommonTravelPlan.percent}%)
                  </p>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg shadow-sm">
                  <h3 className="text-sm font-medium text-purple-700 mb-2">Most Popular Trip Type</h3>
                  <p className="text-xl font-bold text-purple-800">{summary.mostPopularTripType.text}</p>
                  <p className="text-xs text-purple-600 mt-1">
                    {summary.mostPopularTripType.count} respondents ({summary.mostPopularTripType.percent}%)
                  </p>
                </div>
                <div className="bg-yellow-50 p-4 rounded-lg shadow-sm">
                  <h3 className="text-sm font-medium text-yellow-700 mb-2">Most Important Booking Factor</h3>
                  <p className="text-xl font-bold text-yellow-800">{summary.mostImportantBookingFactor.text}</p>
                  <p className="text-xs text-yellow-600 mt-1">
                    {summary.mostImportantBookingFactor.count} respondents ({summary.mostImportantBookingFactor.percent}%)
                  </p>
                </div>
                <div className="bg-teal-50 p-4 rounded-lg shadow-sm">
                  <h3 className="text-sm font-medium text-teal-700 mb-2">Booked in Last 6 Months</h3>
                  <p className="text-2xl font-bold text-teal-800">{summary.bookedLast6mo}</p>
                  <p className="text-xs text-teal-600 mt-1">
                    {summary.bookedLast6moPercent}% of respondents
                  </p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg shadow-sm">
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Not Booked in Last 6 Months</h3>
                  <p className="text-2xl font-bold text-gray-800">{summary.notBookedLast6mo}</p>
                </div>
              </div>
              <div className="mt-8 text-center">
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