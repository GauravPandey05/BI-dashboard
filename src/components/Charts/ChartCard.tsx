import React, { useState, useMemo, useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import { Pie, Bar } from 'react-chartjs-2';
import { 
  Chart as ChartJS, 
  ArcElement, 
  Tooltip, 
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title
} from 'chart.js';
import { Download, BarChart, PieChart, Info } from 'lucide-react';

// Register Chart.js components
ChartJS.register(
  ArcElement, 
  Tooltip, 
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title
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
  '#0ea5e9', // sky-500
  '#f59e0b', // amber-500
  '#10b981', // emerald-500
  '#8b5cf6', // violet-500
  '#ec4899', // pink-500
  '#f43f5e', // rose-500
  '#0d9488', // teal-600
  '#fbbf24', // amber-400
  '#a3e635', // lime-400
  '#7c3aed', // violet-600
];

// Forward ref to allow parent to call toBase64Image
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

  // Chart ref for image export
  const chartRef = useRef<any>(null);
  const exportTimeout = useRef<NodeJS.Timeout | null>(null);

  // Expose toBase64Image to parent via ref
  useImperativeHandle(ref, () => ({
    toBase64Image: () => chartRef.current?.toBase64Image?.()
  }));

  // Compute statistics from the data
  const stats = useMemo(() => {
    if (!question.choices) return { counts: {}, total: 0, labels: [], dataset: [] };

    const counts: Record<string, number> = {};
    let total = 0;

    // Initialize counts for all choices
    question.choices.forEach((choice: any) => {
      counts[choice.id] = 0;
    });

    // Count responses
    data.responses.forEach((response: any) => {
      const answer = response.answers[question.id];

      if (Array.isArray(answer)) {
        // For multiple choice questions
        answer.forEach((choice: any) => {
          counts[choice] = (counts[choice] || 0) + 1 * response.weight;
          total += response.weight;
        });
      } else if (typeof answer === 'object' && answer !== null) {
        // For scale questions (different handling)
        Object.entries(answer).forEach(([key, value]) => {
          if (!counts[key]) counts[key] = 0;
          counts[key] += Number(value) * response.weight;
          total += response.weight;
        });
      } else if (answer) {
        // For single choice questions
        counts[answer] = (counts[answer] || 0) + 1 * response.weight;
        total += response.weight;
      }
    });

    // Get labels and data for chart
    const labels: string[] = [];
    const dataset: number[] = [];

    if (question.choices) {
      question.choices.forEach((choice: any) => {
        if (counts[choice.id] > 0) {
          labels.push(choice.text);
          dataset.push(counts[choice.id]);
        }
      });
    } else {
      Object.entries(counts).forEach(([key, value]) => {
        labels.push(key);
        dataset.push(value as number);
      });
    }

    return { counts, total, labels, dataset };
  }, [question, data]);

  // Prepare chart data
  const chartData = {
    labels: stats.labels,
    datasets: [
      {
        label: 'Responses',
        data: stats.dataset,
        backgroundColor: CHART_COLORS.slice(0, stats.labels.length),
        hoverBackgroundColor: CHART_COLORS.slice(0, stats.labels.length).map(color => color + 'dd'),
      },
    ],
  };

  // Chart options
  const chartOptions = {
    plugins: {
      legend: {
        display: true,
        position: 'right' as const,
        labels: {
          boxWidth: 15,
          padding: 15,
          font: {
            size: 11
          }
        }
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            const value = context.raw;
            const percentage = Math.round((value / stats.total) * 100);
            return `${context.label}: ${percentage}% (${Math.round(value)})`;
          }
        }
      }
    },
    maintainAspectRatio: false,
  };

  // Bar chart specific options
  const barOptions = {
    ...chartOptions,
    indexAxis: 'y' as const,
    scales: {
      x: {
        beginAtZero: true,
        ticks: {
          callback: function(tickValue: string | number) {
            const numericValue = typeof tickValue === 'number' ? tickValue : Number(tickValue);
            return Math.round((numericValue / stats.total) * 100) + '%';
          }
        }
      }
    }
  };

  // Export chart image when chartType or data changes
  useEffect(() => {
    if (chartRef.current && onChartImageReady && stats.total > 0) {
      if (exportTimeout.current) clearTimeout(exportTimeout.current);
      exportTimeout.current = setTimeout(() => {
        const dataUrl = chartRef.current.toBase64Image();
        onChartImageReady(question.id, dataUrl);
      }, 300);
    }
    return () => {
      if (exportTimeout.current) clearTimeout(exportTimeout.current);
    };
  }, [chartType, chartData, onChartImageReady, question.id, stats.total]);

  // If exportMode, call onChartImageReady after render
  useEffect(() => {
    if (exportMode && chartRef.current && onChartImageReady) {
      const chartInstance = chartRef.current;
      const dataUrl = chartInstance.toBase64Image
        ? chartInstance.toBase64Image()
        : chartInstance?.chartInstance?.toBase64Image?.();
      if (dataUrl) {
        onChartImageReady(question.id, dataUrl);
      }
    }
  }, [exportMode, chartRef, onChartImageReady, question?.id]);

  // (Optional) Export Image Button
  const handleExportChart = () => {
    if (chartRef.current) {
      const imgData = chartRef.current.toBase64Image();
      const link = document.createElement('a');
      link.href = imgData;
      link.download = `${question.text}.png`;
      link.click();
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden transition-all duration-300 hover:shadow-md">
      <div className="p-4 border-b border-gray-100">
        <div className="flex justify-between items-start">
          <h3 className="text-sm font-medium text-gray-700">{question.id}: {question.text}</h3>
          <div className="flex space-x-1">
            <button 
              onClick={() => setChartType('pie')}
              className={`p-1 rounded ${chartType === 'pie' ? 'bg-blue-100 text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
              title="Show as pie chart"
            >
              <PieChart size={16} />
            </button>
            <button 
              onClick={() => setChartType('bar')}
              className={`p-1 rounded ${chartType === 'bar' ? 'bg-blue-100 text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
              title="Show as bar chart"
            >
              <BarChart size={16} />
            </button>
            <button 
              onClick={() => setShowInfo(!showInfo)}
              className={`p-1 rounded ${showInfo ? 'bg-blue-100 text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
              title="Show information"
            >
              <Info size={16} />
            </button>
          </div>
        </div>
        
        <div className="mt-2 flex items-center text-xs text-gray-500">
          <span>Showing data from {data.responses.length} responses</span>
          <span className="mx-2">•</span>
          <span>{stats.total > 0 ? `${stats.labels.length} options` : 'No data'}</span>
        </div>
      </div>
      
      <div className="p-4">
        {stats.total > 0 ? (
          <div
            style={
              exportMode
                ? { width, height, background: "#fff" }
                : {}
            }
            className={exportMode ? "" : "h-80 flex items-center justify-center"}
          >
            {chartType === 'pie' ? (
              <Pie
                ref={chartRef}
                data={chartData}
                options={{
                  ...chartOptions,
                  maintainAspectRatio: false,
                }}
                width={width}
                height={height}
              />
            ) : (
              <Bar
                ref={chartRef}
                data={chartData}
                options={{
                  ...barOptions,
                  maintainAspectRatio: false,
                }}
              />
            )}
          </div>
        ) : (
          <div className="h-80 flex items-center justify-center text-gray-400">
            No data available for this question
          </div>
        )}

        {chartType === 'pie' && (
          <div className="mb-2 text-xs text-blue-500 text-center">
            Tip: Click on a legend item to hide/show that section of the pie chart.
          </div>
        )}

        {showInfo && (
          <div className="mt-4 p-3 bg-gray-50 rounded-md text-xs text-gray-600">
            <h4 className="font-medium mb-1">Summary</h4>
            <p>Total responses: {Math.round(stats.total)}</p>
            <div className="mt-2 space-y-1">
              {stats.labels.map((label, index) => (
                <div key={index} className="flex justify-between">
                  <span>{label}:</span>
                  <span className="font-medium">{Math.round((stats.dataset[index] / stats.total) * 100)}%</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      
      <div className="bg-gray-50 px-4 py-2 border-t border-gray-100">
        <div className="flex justify-between items-center">
          <div className="text-xs text-gray-500">
            <span className="font-medium">Filtered:</span> {data.responses.length}
          </div>
          <button
            onClick={handleExportChart}
            className="flex items-center gap-1 px-2 py-1 text-xs bg-blue-100 text-blue-600 rounded hover:bg-blue-200"
            title="Export chart as image"
          >
            <Download size={14} />
            Export Image
          </button>
        </div>
      </div>
    </div>
  );
});

export default React.memo(ChartCard);