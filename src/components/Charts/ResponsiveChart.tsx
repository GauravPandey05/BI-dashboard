import React from 'react';
import { Bar, Pie } from 'react-chartjs-2';

interface ResponsiveChartProps {
  chartType: 'pie' | 'bar';
  data: any;
  options: any;
  chartRef: React.RefObject<any>;
}

const ResponsiveChart: React.FC<ResponsiveChartProps> = ({
  chartType,
  data,
  options,
  chartRef
}) => {
  // Adjust options for mobile
  const mobileOptions = {
    ...options,
    plugins: {
      ...options.plugins,
      legend: {
        ...options.plugins.legend,
        position: chartType === 'pie' ? 'bottom' : 'top',
        labels: {
          ...options.plugins.legend.labels,
          boxWidth: window.innerWidth < 640 ? 12 : 15,
          font: {
            size: window.innerWidth < 640 ? 10 : 12
          }
        }
      }
    },
    layout: {
      padding: {
        top: 10,
        bottom: chartType === 'pie' ? (window.innerWidth < 640 ? 30 : 20) : 10,
        left: 10,
        right: 10
      }
    }
  };

  return (
    <div className="w-full h-full">
      {chartType === 'pie' ? (
        <Pie ref={chartRef} data={data} options={mobileOptions} />
      ) : (
        <Bar ref={chartRef} data={data} options={mobileOptions} />
      )}
    </div>
  );
};

export default ResponsiveChart;