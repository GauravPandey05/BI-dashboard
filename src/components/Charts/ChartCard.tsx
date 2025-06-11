import React, { useState, useMemo, useRef, forwardRef, useImperativeHandle, useCallback } from 'react';
import Highcharts from 'highcharts';
import HighchartsExporting from 'highcharts/modules/exporting';
import HighchartsExportData from 'highcharts/modules/export-data';
import HighchartsOfflineExporting from 'highcharts/modules/offline-exporting';
import HighchartsReact from 'highcharts-react-official';
import { Download, BarChart, PieChart, Info } from 'lucide-react';
import { svgToPng } from '../../utils/svgToPng';

// Compatibility for both CJS and ESM
const exportingModule = HighchartsExporting as any;
if (typeof exportingModule === 'function') {
  exportingModule(Highcharts);
} else if (exportingModule && typeof exportingModule.default === 'function') {
  exportingModule.default(Highcharts);
}
const exportDataModule = HighchartsExportData as any;
if (typeof exportDataModule === 'function') {
  exportDataModule(Highcharts);
} else if (exportDataModule && typeof exportDataModule.default === 'function') {
  exportDataModule.default(Highcharts);
}
const offlineExportingModule = HighchartsOfflineExporting as any;
if (typeof offlineExportingModule === 'function') {
  offlineExportingModule(Highcharts);
} else if (offlineExportingModule && typeof offlineExportingModule.default === 'function') {
  offlineExportingModule.default(Highcharts);
}

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

  // Download button (manual user download, keep as is)
  const handleExportChart = useCallback(() => {
    if (chartComponentRef.current) {
      try {
        const chart = chartComponentRef.current.chart;
        if (typeof chart.exportChartLocal === 'function') {
          chart.exportChartLocal({
            type: 'image/png',
            filename: `chart-${question.id}`,
            fallbackToExportServer: false,
          });
          console.log('Highcharts local export triggered for', question.id);
        } else {
          chart.exportChart({
            type: 'image/png',
            filename: `chart-${question.id}`,
          });
          console.log('Highcharts server export triggered for', question.id);
        }
      } catch (error) {
        console.error('Highcharts export failed:', error);
      }
    } else {
      console.warn('Highcharts ref not available for export');
    }
  }, [question.id]);

  // For PPT export: always use SVG->PNG conversion, never triggers download
  useImperativeHandle(ref, () => ({
    exportChart: handleExportChart,
    getChartImage: async (callback: (dataUrl: string) => void) => {
      if (chartComponentRef.current) {
        const chart = chartComponentRef.current.chart;
        if (typeof chart.getSVGForExport === 'function') {
          const svg = chart.getSVGForExport();
          try {
            const pngDataUrl = await svgToPng(svg, width, height);
            callback(pngDataUrl);
          } catch (err) {
            console.error('SVG to PNG conversion failed', err);
            callback('');
          }
        }
      }
    }
  }));

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

    if (question.choices) {
      question.choices.forEach((choice: any) => {
        counts[choice.id] = 0;
      });
    }

    data.responses.forEach((response: any) => {
      const answer = response.answers[question.id];
      const weight = Math.round(response.weight || 1);

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

    total = Math.round(total);

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

    detailedStats.sort((a, b) => b.count - a.count);

    return { counts, total, labels, dataset, isMultiSelect, detailedStats };
  }, [question, data.responses]);

  const highchartsOptions = useMemo(() => {
    const tooManyCategories = stats.labels.length > 8;

    // Helper for truncating labels
    const truncate = (str: string, n: number) =>
      str.length > n ? str.slice(0, n - 1) + '…' : str;

    // Use a very high maxLen in exportMode to avoid truncation
    const getMaxLen = (mobileLen: number, desktopLen: number) =>
      exportMode ? 1000 : (window.innerWidth < 640 ? mobileLen : desktopLen);

    return chartType === 'pie'
      ? {
          chart: {
            type: 'pie',
            height: exportMode ? height : undefined,
            backgroundColor: 'transparent',
          },
          title: { text: undefined },
          tooltip: {
            pointFormat: '<b>{point.y} responses</b> ({point.percentage:.0f}%)'
          },
          plotOptions: {
            pie: {
              allowPointSelect: true,
              cursor: 'pointer',
              colors: CHART_COLORS,
              dataLabels: {
                enabled: !tooManyCategories,
                allowOverlap: false,
                // Dynamically adjust label content and style for mobile
                formatter: function (this: any): string {
                  const name = this.point.name || '';
                  const y = this.point.y;
                  const pct = this.point.percentage ? Math.round(this.point.percentage) : 0;
                  // On mobile, if too many slices, show only value and percent
                  if (window.innerWidth < 640 && stats.labels.length > 4) {
                    return `${y} (${pct}%)`;
                  }
                  const maxLen = window.innerWidth < 640 ? 10 : 20;
                  return `${name.length > maxLen ? name.slice(0, maxLen - 1) + '…' : name}: ${y} (${pct}%)`;
                },
                distance: window.innerWidth < 640 ? 28 : 20,
                style: {
                  fontWeight: 'bold',
                  color: '#333',
                  textOutline: 'none',
                  fontSize: window.innerWidth < 480 ? '8px' : (window.innerWidth < 640 ? '9px' : '13px')
                }
              }
            }
          },
          series: [{
            name: 'Responses',
            colorByPoint: true,
            data: stats.labels.map((label, i) => ({
              name: label,
              y: stats.dataset[i]
            }))
          }],
          credits: { enabled: false },
          exporting: {
            enabled: true,
            allowHTML: true,
            fallbackToExportServer: false,
            sourceWidth: width,
            sourceHeight: height,
            chartOptions: {
              chart: { backgroundColor: '#fff' }
            }
          },
          responsive: {
            rules: [
              {
                condition: { maxWidth: 600 },
                chartOptions: {
                  chart: { height: 220 },
                  plotOptions: {
                    pie: {
                      dataLabels: {
                        style: { fontSize: '8px' },
                        distance: 32,
                        allowOverlap: false,
                        formatter: function (this: any): string {
                          const name = this.point.name || '';
                          const y = this.point.y;
                          const pct = this.point.percentage ? Math.round(this.point.percentage) : 0;
                          if (stats.labels.length > 4) {
                            return `${y} (${pct}%)`;
                          }
                          const maxLen = 10;
                          return `${name.length > maxLen ? name.slice(0, maxLen - 1) + '…' : name}: ${y} (${pct}%)`;
                        }
                      }
                    }
                  }
                }
              },
              {
                // Hide data labels if too many slices on small screens
                condition: { maxWidth: 600, callback: () => stats.labels.length > 6 },
                chartOptions: {
                  plotOptions: {
                    pie: {
                      dataLabels: { enabled: false }
                    }
                  }
                }
              }
            ]
          }
        }
      : {
          chart: {
            type: 'column',
            height: exportMode ? height : undefined,
            backgroundColor: 'transparent',
          },
          title: { text: undefined },
          xAxis: {
            categories: stats.labels,
            labels: {
              style: { fontSize: window.innerWidth < 640 ? '10px' : '12px' },
              rotation: stats.labels.length > 5 ? -45 : 0,
              step: stats.labels.length > 10 ? 2 : 1,
              autoRotation: [-45],
              useHTML: true,
              formatter: function (this: any): string {
                const label = this.value as string || '';
                const maxLen = getMaxLen(10, 16);
                return `<span title="${label}">${truncate(label, maxLen)}</span>`;
              }
            }
          },
          yAxis: {
            min: 0,
            allowDecimals: false,
            title: { text: 'Responses' }
          },
          tooltip: {
            formatter: function (this: any): string {
              const label = this.x as string || '';
              const y = this.y as number;
              const pct = this.point && (this.point as any).percentage ? Math.round((this.point as any).percentage) : 0;
              return `<b>${label}</b><br/>${y} responses (${pct}%)`;
            }
          },
          plotOptions: {
            column: {
              colorByPoint: true,
              colors: CHART_COLORS,
              dataLabels: {
                enabled: !tooManyCategories,
                inside: false,
                formatter: function (this: any): string {
                  const y = this.y as number;
                  const pct = this.point && (this.point as any).percentage ? Math.round((this.point as any).percentage) : 0;
                  return `${y} (${pct}%)`;
                },
                style: {
                  fontWeight: 'bold',
                  color: '#333',
                  textOutline: 'none',
                  fontSize: window.innerWidth < 640 ? '10px' : '13px'
                }
              }
            }
          },
          series: [{
            name: 'Responses',
            data: stats.dataset.map((y, i) => ({
              y,
              percentage: stats.total > 0 ? Math.round((y / stats.total) * 100) : 0
            })),
            showInLegend: false
          }],
          credits: { enabled: false },
          exporting: {
            enabled: true,
            allowHTML: true,
            fallbackToExportServer: false,
            sourceWidth: width,
            sourceHeight: height,
            chartOptions: {
              chart: { backgroundColor: '#fff' }
            }
          },
          responsive: {
            rules: [
              {
                condition: { maxWidth: 600 },
                chartOptions: {
                  chart: { height: 180 },
                  xAxis: {
                    labels: {
                      rotation: -45,
                      style: { fontSize: '10px' }
                    }
                  },
                  plotOptions: {
                    column: {
                      dataLabels: {
                        style: { fontSize: '10px' }
                      }
                    }
                  }
                }
              },
              {
                // Hide data labels if too many bars on small screens
                condition: { maxWidth: 600, callback: () => stats.labels.length > 5 },
                chartOptions: {
                  plotOptions: {
                    column: {
                      dataLabels: { enabled: false }
                    }
                  }
                }
              }
            ]
          }
        };
  }, [chartType, stats, exportMode, width, height]);

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
        <HighchartsReact
          highcharts={Highcharts}
          options={highchartsOptions}
          ref={chartComponentRef}
          immutable={true}
        />
      </div>
    </div>
  );
});

ChartCard.displayName = 'ChartCard';

export default ChartCard;