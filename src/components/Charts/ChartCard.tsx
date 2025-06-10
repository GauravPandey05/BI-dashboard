import React, { useState, useMemo, useRef, useEffect, forwardRef, useImperativeHandle, useCallback } from 'react';
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';
import { Download, BarChart, PieChart, Info } from 'lucide-react';

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
  const chartComponentRef = useRef<any>(null);
  const exportingModuleLoaded = useRef(false);

  useImperativeHandle(ref, () => ({
    toBase64Image: () => {
      if (chartComponentRef.current) {
        return chartComponentRef.current.chart.getSVG();
      }
      return null;
    }
  }));

  // Compute statistics from the data - with better memoization
  const stats = useMemo(() => {
    if (!question.choices) return { counts: {}, total: 0, labels: [], dataset: [], isMultiSelect: false };

    const counts: Record<string, number> = {};
    let total = 0;
    const responseCounted = new Set();
    const isMultiSelect = question.type === 'multiple_choice';

    // Pre-initialize counts object to avoid repeated property creation
    if (question.choices) {
      question.choices.forEach((choice: any) => {
        counts[choice.id] = 0;
      });
    }

    // Process responses
    data.responses.forEach((response: any) => {
      const answer = response.answers[question.id];
      const weight = response.weight || 1;

      if (Array.isArray(answer)) {
        answer.forEach((choice: any) => {
          counts[choice] = (counts[choice] || 0) + weight;
        });
        if (!responseCounted.has(response.id)) {
          total += weight;
          responseCounted.add(response.id);
        }
      } else if (typeof answer === 'object' && answer !== null) {
        Object.entries(answer).forEach(([key, value]) => {
          if (!counts[key]) counts[key] = 0;
          counts[key] += Number(value) * weight;
        });
        if (!responseCounted.has(response.id)) {
          total += weight;
          responseCounted.add(response.id);
        }
      } else if (answer) {
        counts[answer] = (counts[answer] || 0) + weight;
        if (!responseCounted.has(response.id)) {
          total += weight;
          responseCounted.add(response.id);
        }
      }
    });

    // Generate labels and dataset arrays
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

    return { counts, total, labels, dataset, isMultiSelect };
  }, [question, data.responses]); // Depend directly on data.responses

  // Prepare Highcharts options
  const highchartsOptions = useMemo(() => {
    if (chartType === 'pie') {
      return {
        chart: {
          type: 'pie',
          height: exportMode ? height : 320,
          backgroundColor: '#fff',
          animation: false // Disable animations for better performance
        },
        title: { text: null },
        tooltip: {
          pointFormat: '<b>{point.percentage:.0f}%</b> ({point.y})'
        },
        plotOptions: {
          pie: {
            allowPointSelect: true,
            cursor: 'pointer',
            dataLabels: {
              enabled: true,
              format: '{point.name}: {point.percentage:.0f}%'
            },
            colors: CHART_COLORS
          },
          series: {
            animation: false, // Disable animations for better performance
            turboThreshold: 0 // Disable series optimizations for better reliability
          }
        },
        legend: { enabled: true, align: 'right', verticalAlign: 'middle', layout: 'vertical' },
        series: [{
          name: 'Responses',
          colorByPoint: true,
          data: stats.labels.map((label, i) => ({
            name: label,
            y: stats.dataset[i]
          }))
        }]
      };
    } else {
      return {
        chart: {
          type: 'bar',
          height: exportMode ? height : 320,
          backgroundColor: '#fff',
          animation: false // Disable animations for better performance
        },
        title: { text: null },
        xAxis: {
          categories: stats.labels,
          title: { text: null }
        },
        yAxis: {
          min: 0,
          title: { text: 'Responses', align: 'high' },
          labels: {
            overflow: 'justify',
            formatter: function (this: any) {
              const total = stats.total;
              if (!total) return '0%';
              return Math.round((Number(this.value) / total) * 100) + '%';
            }
          }
        },
        tooltip: {
          formatter: function (this: any) {
            const value = this.y as number;
            const total = stats.total;
            const percentage = total ? Math.round((value / total) * 100) : 0;
            return `<b>${this.x}</b>: ${percentage}% (${value})`;
          }
        },
        plotOptions: {
          bar: {
            dataLabels: {
              enabled: true,
              formatter: function (this: any) {
                if (!stats.total) return '0%';
                return Math.round((this.y as number / stats.total) * 100) + '%';
              }
            },
            colors: CHART_COLORS
          },
          series: {
            animation: false, // Disable animations for better performance
            turboThreshold: 0 // Disable series optimizations for better reliability
          }
        },
        legend: { enabled: false },
        series: [{
          name: 'Responses',
          data: stats.dataset,
          colorByPoint: true
        }]
      };
    }
  }, [chartType, stats.labels, stats.dataset, stats.total, exportMode, height]);

  // Lazy load exporting module only when needed
  const loadExportingModule = useCallback(async () => {
    if (exportingModuleLoaded.current) return;
    
    try {
      const module: any = await import('highcharts/modules/exporting');
      if (typeof module === 'function') {
        module(Highcharts);
      } else if (module.default && typeof module.default === 'function') {
        module.default(Highcharts);
      }
      exportingModuleLoaded.current = true;
    } catch (e) {
      console.error('Failed to load Highcharts exporting module', e);
    }
  }, []);

  // Export chart image as PNG
  const handleExportChart = useCallback(() => {
    if (chartComponentRef.current) {
      loadExportingModule().then(() => {
        chartComponentRef.current.chart.exportChart({ type: 'image/png' });
      });
    }
  }, [loadExportingModule]);

  // Call onChartImageReady with SVG data
  useEffect(() => {
    if (chartComponentRef.current && onChartImageReady && stats.total > 0) {
      const timer = setTimeout(() => {
        if (chartComponentRef.current) {
          const svg = chartComponentRef.current.chart.getSVG();
          onChartImageReady(question.id, svg);
        }
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [chartType, onChartImageReady, question.id, stats.total]);

  // Memoize the chart component to prevent unnecessary re-renders
  const chartComponent = useMemo(() => {
    if (stats.total <= 0) {
      return (
        <div className="h-80 flex items-center justify-center text-gray-400">
          No data available for this question
        </div>
      );
    }

    return (
      <div
        style={exportMode ? { width, height, background: "#fff" } : {}}
        className={exportMode ? "" : "h-80 flex items-center justify-center"}
      >
        <HighchartsReact
          highcharts={Highcharts}
          options={highchartsOptions}
          ref={chartComponentRef}
          immutable={true}
          updateArgs={[true, true, true]} // Force proper updates
        />
      </div>
    );
  }, [stats.total, exportMode, highchartsOptions, width, height]);

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
        {chartComponent}

        {showInfo && (
          <div className="mt-4 p-3 bg-gray-50 rounded-md text-xs text-gray-600">
            <h4 className="font-medium mb-1">Summary</h4>
            <p>Total responses: {data.responses.length}</p>
            {stats.isMultiSelect && (
              <p className="mt-1 text-amber-600 italic">
                Note: Percentages may sum to over 100% as respondents can select multiple options.
              </p>
            )}
            <div className="mt-2 space-y-1">
              {stats.labels.map((label, index) => {
                const percentage = Math.round((stats.dataset[index] / stats.total) * 100);
                const count = Math.round(stats.dataset[index]);
                return (
                  <div key={index} className="flex justify-between">
                    <span>{label}:</span>
                    <span className="font-medium">{percentage}% ({count})</span>
                  </div>
                );
              })}
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