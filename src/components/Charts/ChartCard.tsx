import React, { useState, useMemo, useRef, useEffect, forwardRef, useImperativeHandle, useCallback } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { Bar, Pie } from 'react-chartjs-2';
import { Download, BarChart, PieChart, Info } from 'lucide-react';
import ResponsiveChart from './ResponsiveChart';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

interface ChartCardProps {
  question: any;
  data: any;
  onChartImageReady?: (questionId: string, dataUrl: string) => void;
  exportMode?: boolean;
  width?: number;
  height?: number;
}

const CHART_COLORS = [
  '#0ea5e9', '#f59e0b', '#10b981', '#8b5cf6', '#ec4899',
  '#f43f5e', '#0d9488', '#fbbf24', '#a3e635', '#7c3aed',
];

const ChartCard = forwardRef<any, ChartCardProps>(({
  question,
  data,
  onChartImageReady,
  exportMode = false,
  width = 400,
  height = 300,
}, ref) => {
  const [chartType, setChartType] = useState<'pie' | 'bar'>('pie');
  const [showInfo, setShowInfo] = useState(false);
  const chartRef = useRef<any>(null);

  useImperativeHandle(ref, () => ({
    toBase64Image: () => {
      if (chartRef.current) {
        try {
          // Get canvas and convert to base64
          const canvas = chartRef.current.canvas;
          return canvas.toDataURL('image/png');
        } catch (error) {
          console.warn('Chart export failed:', error);
          return null;
        }
      }
      return null;
    }
  }));

  // Compute statistics from the data with better formatting
  const stats = useMemo(() => {
    if (!question?.choices) return { 
      counts: {}, 
      total: 0, 
      labels: [], 
      dataset: [], 
      isMultiSelect: false,
      detailedStats: []
    };

    const counts: Record<string, number> = {};
    let total = 0;
    const responseCounted = new Set();
    const isMultiSelect = question.type === 'multiple_choice';

    // Pre-initialize counts object
    if (question.choices) {
      question.choices.forEach((choice: any) => {
        counts[choice.id] = 0;
      });
    }

    // Process responses
    data.responses.forEach((response: any) => {
      const answer = response.answers[question.id];
      const weight = Math.round(response.weight || 1); // Round weights to whole numbers

      if (Array.isArray(answer)) {
        answer.forEach((choice: any) => {
          counts[choice] = Math.round((counts[choice] || 0) + weight);
        });
        if (!responseCounted.has(response.id)) {
          total += weight;
          responseCounted.add(response.id);
        }
      } else if (typeof answer === 'object' && answer !== null) {
        Object.entries(answer).forEach(([key, value]) => {
          if (!counts[key]) counts[key] = 0;
          counts[key] = Math.round(counts[key] + (Number(value) * weight));
        });
        if (!responseCounted.has(response.id)) {
          total += weight;
          responseCounted.add(response.id);
        }
      } else if (answer) {
        counts[answer] = Math.round((counts[answer] || 0) + weight);
        if (!responseCounted.has(response.id)) {
          total += weight;
          responseCounted.add(response.id);
        }
      }
    });

    total = Math.round(total); // Ensure total is whole number

    // Generate labels and dataset arrays
    const labels: string[] = [];
    const dataset: number[] = [];
    const detailedStats: Array<{label: string, count: number, percentage: number}> = [];
    
    if (question.choices) {
      question.choices.forEach((choice: any) => {
        const count = Math.round(counts[choice.id] || 0);
        if (count > 0) {
          const percentage = total > 0 ? Math.round((count / total) * 100) : 0;
          labels.push(choice.text);
          dataset.push(count);
          detailedStats.push({
            label: choice.text,
            count: count,
            percentage: percentage
          });
        }
      });
    } else {
      Object.entries(counts).forEach(([key, value]) => {
        const count = Math.round(value as number);
        const percentage = total > 0 ? Math.round((count / total) * 100) : 0;
        labels.push(key);
        dataset.push(count);
        detailedStats.push({
          label: key,
          count: count,
          percentage: percentage
        });
      });
    }

    // Sort detailed stats by count (descending)
    detailedStats.sort((a, b) => b.count - a.count);

    return { counts, total, labels, dataset, isMultiSelect, detailedStats };
  }, [question, data.responses]);

  // Chart.js data configuration with rounded values
  const chartData = useMemo(() => {
    return {
      labels: stats.labels,
      datasets: [
        {
          label: 'Responses',
          data: stats.dataset.map(val => Math.round(val)), // Ensure all values are whole numbers
          backgroundColor: CHART_COLORS.slice(0, stats.labels.length),
          borderColor: CHART_COLORS.slice(0, stats.labels.length).map(color => color + '80'),
          borderWidth: 1,
        },
      ],
    };
  }, [stats.labels, stats.dataset]);

  // Chart.js options with no decimal tooltips
  const chartOptions = useMemo(() => {
    const baseOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: chartType === 'pie' ? 'bottom' as const : 'top' as const,
          display: true,
          labels: {
            padding: 10,
            usePointStyle: true,
            font: {
              size: 12
            },
            generateLabels: function(chart: any) {
              const data = chart.data;
              if (data.labels.length && data.datasets.length) {
                return data.labels.map((label: string, i: number) => {
                  const dataset = data.datasets[0];
                  const value = Math.round(dataset.data[i]);
                  const percentage = stats.total ? Math.round((value / stats.total) * 100) : 0;
                  return {
                    text: `${label} (${percentage}%)`,
                    fillStyle: dataset.backgroundColor[i],
                    strokeStyle: dataset.borderColor[i],
                    lineWidth: 1,
                    hidden: false,
                    index: i
                  };
                });
              }
              return [];
            }
          }
        },
        tooltip: {
          callbacks: {
            label: function(context: any) {
              const value = Math.round(context.parsed.y || context.parsed);
              const percentage = stats.total ? Math.round((value / stats.total) * 100) : 0;
              return `${context.label}: ${value} responses (${percentage}%)`;
            },
            afterLabel: function(context: any) {
              const value = Math.round(context.parsed.y || context.parsed);
              if (stats.total > 0) {
                const ratio = `${value}/${stats.total}`;
                return `Ratio: ${ratio}`;
              }
              return '';
            }
          }
        }
      },
      animation: {
        duration: exportMode ? 0 : 1000,
      },
      layout: {
        padding: {
          top: 10,
          bottom: chartType === 'pie' ? 20 : 10,
          left: 10,
          right: 10
        }
      }
    };

    if (chartType === 'bar') {
      return {
        ...baseOptions,
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              stepSize: 1, // Force whole number steps
              callback: function(value: any) {
                return Math.round(Number(value)); // Display whole numbers only
              }
            }
          },
          x: {
            ticks: {
              maxRotation: 45,
              minRotation: 0
            }
          }
        }
      };
    }

    return baseOptions;
  }, [chartType, stats.total, exportMode]);

  // Export chart image
  const handleExportChart = useCallback(() => {
    if (chartRef.current) {
      try {
        const canvas = chartRef.current.canvas;
        const url = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.download = `chart-${question.id}.png`;
        link.href = url;
        link.click();
      } catch (error) {
        console.warn('Export failed:', error);
      }
    }
  }, [question.id]);

  // Call onChartImageReady when chart is ready
  useEffect(() => {
    if (chartRef.current && onChartImageReady && stats.total > 0) {
      const timer = setTimeout(() => {
        if (chartRef.current) {
          try {
            const canvas = chartRef.current.canvas;
            const dataUrl = canvas.toDataURL('image/png');
            onChartImageReady(question.id, dataUrl);
          } catch (error) {
            console.warn('Failed to generate chart image:', error);
          }
        }
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [chartType, onChartImageReady, question?.id, stats.total]);

  if (!question || stats.total === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="text-center text-gray-500">
          <Info className="h-8 w-8 mx-auto mb-2" />
          <p>No data available for this question</p>
        </div>
      </div>
    );
  }

  if (exportMode) {
    return (
      <div style={{ width, height }}>
        {chartType === 'pie' ? (
          <Pie ref={chartRef} data={chartData} options={chartOptions} />
        ) : (
          <Bar ref={chartRef} data={chartData} options={chartOptions} />
        )}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-3 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-3 sm:gap-0">
        <div className="flex-1 min-w-0">
          <h3 className="text-base sm:text-lg font-semibold text-gray-800 break-words">{question.id}</h3>
          <p className="text-xs sm:text-sm text-gray-600 mt-1 break-words">{question.text}</p>
        </div>
        <div className="flex items-center space-x-1 sm:space-x-2 flex-shrink-0">
          <button
            onClick={() => setChartType(chartType === 'pie' ? 'bar' : 'pie')}
            className="p-1.5 sm:p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
            title={`Switch to ${chartType === 'pie' ? 'bar' : 'pie'} chart`}
          >
            {chartType === 'pie' ? <BarChart size={16} /> : <PieChart size={16} />}
          </button>
          <button
            onClick={handleExportChart}
            className="p-1.5 sm:p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
            title="Export chart"
          >
            <Download size={16} />
          </button>
          <button
            onClick={() => setShowInfo(!showInfo)}
            className="p-1.5 sm:p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
            title="Show detailed statistics"
          >
            <Info size={16} />
          </button>
        </div>
      </div>

      {/* Enhanced Info Panel */}
      {showInfo && (
        <div className="mb-4 p-3 sm:p-4 bg-blue-50 border border-blue-200 rounded-md">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Summary Statistics */}
            <div>
              <h4 className="text-sm font-semibold text-blue-900 mb-2">Summary</h4>
              <div className="space-y-1 text-xs sm:text-sm text-blue-800">
                <div><strong>Total Responses:</strong> {stats.total}</div>
                <div><strong>Question Type:</strong> {question.type?.replace('_', ' ') || 'Unknown'}</div>
                <div><strong>Multi-select:</strong> {stats.isMultiSelect ? 'Yes' : 'No'}</div>
                <div><strong>Answer Options:</strong> {stats.labels.length}</div>
                <div><strong>Response Rate:</strong> {stats.total > 0 ? '100%' : '0%'}</div>
              </div>
            </div>

            {/* Detailed Breakdown */}
            <div>
              <h4 className="text-sm font-semibold text-blue-900 mb-2">Response Breakdown</h4>
              <div className="space-y-1 text-xs sm:text-sm text-blue-800 max-h-32 overflow-y-auto">
                {stats.detailedStats.map((stat, index) => (
                  <div key={index} className="flex justify-between items-center">
                    <span className="truncate mr-2" title={stat.label}>
                      {stat.label.length > 20 ? `${stat.label.substring(0, 20)}...` : stat.label}
                    </span>
                    <span className="font-medium flex-shrink-0">
                      {stat.count} ({stat.percentage}%)
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Most/Least Popular */}
          {stats.detailedStats.length > 1 && (
            <div className="mt-3 pt-3 border-t border-blue-200">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs sm:text-sm text-blue-800">
                <div>
                  <strong>Most Popular:</strong> {stats.detailedStats[0]?.label} 
                  <span className="text-blue-600"> ({stats.detailedStats[0]?.percentage}%)</span>
                </div>
                <div>
                  <strong>Least Popular:</strong> {stats.detailedStats[stats.detailedStats.length - 1]?.label}
                  <span className="text-blue-600"> ({stats.detailedStats[stats.detailedStats.length - 1]?.percentage}%)</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Chart Container */}
      <div className={`${chartType === 'pie' ? 'h-80 sm:h-96' : 'h-64 sm:h-80'} w-full chart-container`}>
        <ResponsiveChart
          chartType={chartType}
          data={chartData}
          options={chartOptions}
          chartRef={chartRef}
        />
      </div>
    </div>
  );
});

ChartCard.displayName = 'ChartCard';

export default ChartCard;