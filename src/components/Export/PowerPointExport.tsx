import React, { useState, useRef } from 'react';
import pptxgen from 'pptxgenjs';
import { useData } from '../../contexts/DataContext';
import { Download, FileText, Image, PieChart } from 'lucide-react';
import ChartCard from '../Charts/ChartCard';

interface PowerPointExportProps {
  chartImages: { [questionId: string]: string };
}

const PowerPointExport: React.FC<PowerPointExportProps> = ({ chartImages }) => {
  const { data, filteredData, selectedQuestions } = useData();
  const [exporting, setExporting] = useState(false);
  const [brandingImage, setBrandingImage] = useState<File | null>(null);
  const [brandingColor, setBrandingColor] = useState('#2563eb');
  const [exportName, setExportName] = useState('Travel Survey Report');
  const exportChartRef = useRef<any>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setBrandingImage(e.target.files[0]);
    }
  };

  // Example: get chart image for PPT export
  const getExportChartImage = () => {
    if (exportChartRef.current) {
      // Chart.js v4: chartRef.current is the chart instance
      return exportChartRef.current.toBase64Image();
    }
    return null;
  };

  const exportToPowerPoint = async () => {
    setExporting(true);
    try {
      const pptx = new pptxgen();
      pptx.author = 'Travel Survey Dashboard';
      pptx.title = exportName;

      pptx.defineSlideMaster({
        title: 'BRANDED_SLIDE',
        background: { color: '#FFFFFF' },
        objects: [
          { rect: { x: 0, y: '90%', w: '100%', h: '10%', fill: { color: brandingColor } } }
        ]
      });

      // Title slide
      const slide1 = pptx.addSlide({ masterName: 'BRANDED_SLIDE' });
      slide1.addText(exportName, {
        x: 0.5, y: 0.3, w: '95%', h: 1.0,
        fontSize: 24, color: '#333333', bold: true, align: 'center'
      });
      slide1.addText(`Generated on ${new Date().toLocaleDateString()}`, {
        x: 0.5, y: 1.3, w: '95%', h: 0.3,
        fontSize: 14, color: '#666666', align: 'center'
      });

      // Add branding image (logo) if available
      if (brandingImage) {
        const reader = new FileReader();
        const imageLoaded = new Promise<string>((resolve) => {
          reader.onload = (e) => resolve(e.target?.result as string);
        });
        reader.readAsDataURL(brandingImage);
        const imgData = await imageLoaded;
        slide1.addImage({
          data: imgData,
          x: 7.5, // right bottom corner
          y: 5.2,
          w: 1.5,
          h: 0.8
        });
      }

      // Summary slide
      const slide2 = pptx.addSlide({ masterName: 'BRANDED_SLIDE' });
      slide2.addText('Survey Overview', {
        x: 0.5, y: 0.3, w: '95%', h: 0.5,
        fontSize: 18, color: '#333333', bold: true, align: 'center'
      });
      slide2.addText([
        { text: 'Total Responses: ', options: { bold: true } },
        { text: `${data.responses.length}` },
        { text: '\nFiltered Responses: ', options: { bold: true } },
        { text: `${filteredData.responses.length}` },
        { text: '\nSelected Questions: ', options: { bold: true } },
        { text: `${selectedQuestions.length}` }
      ], {
        x: 0.5, y: 1.0, w: '95%', h: 2.0,
        fontSize: 14, color: '#333333', align: 'center'
      });

      // Slides for each selected question
      for (const qid of selectedQuestions) {
        const question = data.questions.find(q => q.id === qid);
        if (!question) continue;
        const slide = pptx.addSlide({ masterName: 'BRANDED_SLIDE' });
        slide.addText(`${question.id}: ${question.text}`, {
          x: 0.5, y: 0.3, w: '95%', h: 0.5,
          fontSize: 16, color: '#333333', bold: true, align: 'center'
        });

        // Use the correct aspect ratio image for PPT
        const chartImage = chartImages[qid] || getExportChartImage();
        if (chartImage) {
          slide.addImage({
            data: chartImage,
            x: 1, y: 1, w: 8, h: 6 // 4:3 aspect ratio, centered with margin
          });
        } else {
          slide.addText('Chart not available', {
            x: 1.5, y: 1.0, w: 7, h: 4,
            fontSize: 14, color: '#666666', align: 'center', valign: 'middle',
            fill: { color: '#F5F5F5' }
          });
        }

        slide.addText(`Based on ${filteredData.responses.length} responses`, {
          x: 0.5, y: 5.2, w: '95%', h: 0.3,
          fontSize: 12, color: '#666666', align: 'center', italic: true
        });
      }

      await pptx.writeFile({ fileName: `${exportName.replace(/\s+/g, '_')}.pptx` });
    } catch (error) {
      alert('Error exporting to PowerPoint. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-lg font-semibold text-gray-800">Export to PowerPoint</h2>
        <p className="text-sm text-gray-600">
          Generate a PowerPoint presentation with the charts from your selected questions.
          You can customize the branding and appearance of the presentation.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <label htmlFor="exportName" className="block text-sm font-medium text-gray-700 mb-1">
              Presentation Title
            </label>
            <input
              type="text"
              id="exportName"
              value={exportName}
              onChange={(e) => setExportName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label htmlFor="brandingColor" className="block text-sm font-medium text-gray-700 mb-1">
              Branding Color
            </label>
            <div className="flex">
              <input
                type="color"
                id="brandingColor"
                value={brandingColor}
                onChange={(e) => setBrandingColor(e.target.value)}
                className="h-10 w-10 border border-gray-300 rounded-md cursor-pointer"
              />
              <input
                type="text"
                value={brandingColor}
                onChange={(e) => setBrandingColor(e.target.value)}
                className="ml-2 flex-grow px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label htmlFor="brandingImage" className="block text-sm font-medium text-gray-700 mb-1">
              Company Logo (optional)
            </label>
            <div className="flex items-center">
              <label 
                htmlFor="brandingImage" 
                className="cursor-pointer px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                Choose File
              </label>
              <input
                type="file"
                id="brandingImage"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
              <span className="ml-3 text-sm text-gray-500">
                {brandingImage ? brandingImage.name : 'No file chosen'}
              </span>
            </div>
            <p className="mt-1 text-xs text-gray-500">
              Recommended size: 200x100 pixels
            </p>
          </div>
        </div>

        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
          <h3 className="font-medium text-gray-800 mb-3">Export Preview</h3>
          <div className="bg-white border border-gray-300 rounded shadow-sm aspect-[4/3] mb-4 relative overflow-hidden">
            <div className="h-full flex flex-col">
              <div className="flex-grow p-4 flex flex-col items-center justify-center">
                {/* Title preview */}
                <div className="w-full text-center mb-2">
                  <span className="text-lg font-bold text-gray-700">{exportName || "Travel Survey Report"}</span>
                </div>
                {/* Chart preview */}
                <div className="w-full flex justify-center mb-4">
                  <div className="w-28 h-28 rounded-full border-4 border-dashed border-blue-300 flex items-center justify-center bg-blue-50">
                    <PieChart size={40} className="text-blue-500" />
                  </div>
                </div>
                {/* Subtitle */}
                <div className="w-full text-center">
                  <span className="text-sm text-gray-500">Charts and insights for your selected questions</span>
                </div>
              </div>
              {/* Branding bar */}
              <div className="h-8 w-full" style={{ backgroundColor: brandingColor }}></div>
            </div>
            {/* Logo preview */}
            {brandingImage && (
              <img
                src={URL.createObjectURL(brandingImage)}
                alt="Logo preview"
                className="absolute bottom-10 right-4 w-32 h-16 object-contain bg-white rounded shadow"
              />
            )}
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Selected questions:</span>
              <span className="font-medium">{selectedQuestions.length}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Total slides:</span>
              <span className="font-medium">{2 + selectedQuestions.length}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="pt-4 border-t border-gray-200">
        <div className="flex items-start">
          <div className="mr-4 bg-blue-100 rounded-lg p-2">
            <FileText className="h-6 w-6 text-blue-600" />
          </div>
          <div className="flex-grow">
            <h3 className="text-sm font-medium text-gray-800">What's included in the export?</h3>
            <ul className="mt-2 text-sm text-gray-600 space-y-1 list-disc list-inside">
              <li>Title slide with your presentation name and branding</li>
              <li>Summary slide with key metrics</li>
              <li>Individual slides for each selected question</li>
              <li>Charts and data visualizations</li>
              <li>Customized with your selected branding colors</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button 
          onClick={exportToPowerPoint}
          disabled={exporting || selectedQuestions.length === 0}
          className={`flex items-center gap-2 px-4 py-2 rounded-md ${
            exporting || selectedQuestions.length === 0
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          {exporting ? (
            <>
              <div className="h-4 w-4 border-2 border-t-blue-300 border-r-blue-300 border-b-transparent border-l-transparent rounded-full animate-spin"></div>
              <span>Exporting...</span>
            </>
          ) : (
            <>
              <Download size={16} />
              <span>Export to PowerPoint</span>
            </>
          )}
        </button>
      </div>

      {/* Hidden export chart for PPTX */}
      <div style={{ position: 'absolute', left: '-9999px', top: 0 }}>
        {selectedQuestions.length > 0 && (
          <ChartCard
            ref={exportChartRef}
            question={data.questions.find(q => q.id === selectedQuestions[0])}
            data={filteredData}
            exportMode={true}
            width={800}
            height={600}
          />
        )}
      </div>
    </div>
  );
};

export default PowerPointExport;