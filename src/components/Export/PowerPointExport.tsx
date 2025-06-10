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
  const exportChartRefs = useRef<{ [key: string]: any }>({});

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setBrandingImage(e.target.files[0]);
    }
  };

  // Generate chart image for a specific question
  const generateChartImage = async (questionId: string): Promise<string | null> => {
    // First check if we have a pre-generated image
    if (chartImages[questionId]) {
      return chartImages[questionId];
    }

    // Try to get from export chart refs
    const chartRef = exportChartRefs.current[questionId];
    if (chartRef) {
      try {
        const imageData = chartRef.toBase64Image();
        return imageData;
      } catch (error) {
        console.warn(`Failed to generate chart image for ${questionId}:`, error);
      }
    }

    return null;
  };

  const exportToPowerPoint = async () => {
    setExporting(true);
    try {
      const pptx = new pptxgen();
      pptx.author = 'Travel Survey Dashboard';
      pptx.title = exportName;

      // Define slide master with proper background and fixed footer
      pptx.defineSlideMaster({
        title: 'BRANDED_SLIDE',
        background: { color: 'FFFFFF' },
        objects: [
          { 
            rect: { 
              x: 0, 
              y: 7.0, 
              w: 10, 
              h: 0.5, 
              fill: { color: brandingColor.replace('#', '') }
            } 
          }
        ]
      });

      // Title slide
      const slide1 = pptx.addSlide({ masterName: 'BRANDED_SLIDE' });
      slide1.addText(exportName, {
        x: 0.5, 
        y: 2.5, 
        w: 9.0, 
        h: 1.0,
        fontSize: 28, 
        color: '333333',
        bold: true, 
        align: 'center'
      });
      
      slide1.addText(`Generated on ${new Date().toLocaleDateString()}`, {
        x: 0.5, 
        y: 4.0, 
        w: 9.0, 
        h: 0.5,
        fontSize: 16, 
        color: '666666',
        align: 'center'
      });

      // Add branding image (logo) if available
      if (brandingImage) {
        try {
          const reader = new FileReader();
          const imageLoaded = new Promise<string>((resolve, reject) => {
            reader.onload = (e) => {
              if (e.target?.result) {
                resolve(e.target.result as string);
              } else {
                reject(new Error('Failed to read image'));
              }
            };
            reader.onerror = () => reject(new Error('FileReader error'));
          });
          reader.readAsDataURL(brandingImage);
          const imgData = await imageLoaded;
          
          slide1.addImage({
            data: imgData,
            x: 7.5,
            y: 5.0,
            w: 1.5,
            h: 1.0
          });
        } catch (error) {
          console.warn('Failed to add branding image:', error);
        }
      }

      // Summary slide
      const slide2 = pptx.addSlide({ masterName: 'BRANDED_SLIDE' });
      slide2.addText('Survey Overview', {
        x: 0.5, 
        y: 0.5, 
        w: 9.0, 
        h: 0.8,
        fontSize: 24, 
        color: '333333', 
        bold: true, 
        align: 'center'
      });

      // Add summary statistics in a more organized layout
      slide2.addText(`Total Responses: ${data.responses.length}`, {
        x: 1.0, y: 2.0, w: 8.0, h: 0.5,
        fontSize: 18, color: '333333', align: 'left'
      });
      
      slide2.addText(`Filtered Responses: ${filteredData.responses.length}`, {
        x: 1.0, y: 2.7, w: 8.0, h: 0.5,
        fontSize: 18, color: '333333', align: 'left'
      });
      
      slide2.addText(`Selected Questions: ${selectedQuestions.length}`, {
        x: 1.0, y: 3.4, w: 8.0, h: 0.5,
        fontSize: 18, color: '333333', align: 'left'
      });

      // Generate chart images and slides for each selected question
      for (const qid of selectedQuestions) {
        const question = data.questions.find(q => q.id === qid);
        if (!question) continue;
        
        const slide = pptx.addSlide({ masterName: 'BRANDED_SLIDE' });
        
        // Question title - reduced height to give more space for chart
        const questionTitle = `${question.id}: ${question.text}`;
        slide.addText(questionTitle, {
          x: 0.5, 
          y: 0.2, 
          w: 9.0, 
          h: 0.6,  // Reduced from 0.7
          fontSize: 14, 
          color: '333333', 
          bold: true, 
          align: 'center',
          wrap: true
        });

        // Generate chart image with much smaller sizing to prevent overlap
        const chartImage = await generateChartImage(qid);
        if (chartImage) {
          try {
            // Significantly reduced chart size to prevent footer overlap
            slide.addImage({
              data: chartImage,
              x: 1.0,   // Increased margin from 0.75
              y: 1.0,   // Moved up slightly from 1.2
              w: 8.0,   // Reduced from 8.5
              h: 4.5    // Significantly reduced from 5.3
            });
          } catch (imageError) {
            console.warn('Failed to add chart image to slide:', imageError);
            // Add fallback text
            slide.addText('Chart could not be generated', {
              x: 2, 
              y: 3.5, 
              w: 6, 
              h: 1,
              fontSize: 16, 
              color: '666666', 
              align: 'center',
              fill: { color: 'F5F5F5' }
            });
          }
        } else {
          // No chart available
          slide.addText('Chart not available - please ensure all charts are loaded on the dashboard', {
            x: 1.5, 
            y: 3.0, 
            w: 7, 
            h: 2.0,
            fontSize: 14, 
            color: '666666', 
            align: 'center',
            fill: { color: 'F5F5F5' },
            wrap: true
          });
        }

        // Response count - positioned well above footer with more space
        slide.addText(`Based on ${filteredData.responses.length} responses`, {
          x: 0.5, 
          y: 6.0,  // Moved up from 6.7 to create bigger gap
          w: 9.0, 
          h: 0.3,
          fontSize: 12, 
          color: '666666', 
          align: 'center', 
          italic: true
        });
      }

      // Generate and download the file
      const fileName = `${exportName.replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '_')}.pptx`;
      await pptx.writeFile({ fileName });
      
    } catch (error) {
      console.error('PowerPoint export error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      alert(`Error exporting to PowerPoint: ${errorMessage}. Please try again.`);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex-1 space-y-6 pb-20"> {/* Added padding bottom to prevent footer overlap */}
        <div className="space-y-2">
          <h2 className="text-lg font-semibold text-gray-800">Export to PowerPoint</h2>
          <p className="text-sm text-gray-600">
            Generate a PowerPoint presentation with the charts from your selected questions.
            You can customize the branding and appearance of the presentation.
          </p>
          {Object.keys(chartImages).length === 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
              <p className="text-sm text-yellow-800">
                <strong>Note:</strong> Make sure all charts are loaded on the dashboard before exporting. 
                If charts appear as "not available", please refresh the page and wait for all charts to load.
              </p>
            </div>
          )}
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
                  className="cursor-pointer px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50"
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
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <h3 className="font-medium text-gray-800 mb-3">Export Preview</h3>
            <div className="bg-white border border-gray-300 rounded shadow-sm aspect-[4/3] mb-4 relative overflow-hidden">
              <div className="h-full flex flex-col">
                <div className="flex-grow p-4 flex flex-col items-center justify-center">
                  <div className="w-full text-center mb-2">
                    <span className="text-lg font-bold text-gray-700">{exportName || "Travel Survey Report"}</span>
                  </div>
                  <div className="w-full flex justify-center mb-4">
                    <div className="w-28 h-28 rounded-full border-4 border-dashed border-blue-300 flex items-center justify-center bg-blue-50">
                      <PieChart size={40} className="text-blue-500" />
                    </div>
                  </div>
                  <div className="w-full text-center">
                    <span className="text-sm text-gray-500">Charts and insights for your selected questions</span>
                  </div>
                </div>
                <div className="h-6 w-full" style={{ backgroundColor: brandingColor }}></div> {/* Reduced footer height */}
              </div>
              {brandingImage && (
                <img
                  src={URL.createObjectURL(brandingImage)}
                  alt="Logo preview"
                  className="absolute bottom-8 right-4 w-24 h-12 object-contain bg-white rounded shadow" // Adjusted positioning
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
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Charts available:</span>
                <span className="font-medium">{Object.keys(chartImages).length}/{selectedQuestions.length}</span>
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
      </div>

      {/* Hidden export charts for each question - moved outside scrollable area */}
      <div className="fixed left-[-9999px] top-0 opacity-0 pointer-events-none"> {/* Fixed positioning to prevent layout issues */}
        {selectedQuestions.map(qid => {
          const question = data.questions.find(q => q.id === qid);
          if (!question) return null;
          
          return (
            <ChartCard
              key={qid}
              ref={(ref) => {
                if (ref) {
                  exportChartRefs.current[qid] = ref;
                }
              }}
              question={question}
              data={filteredData}
              exportMode={true}
              width={800}
              height={600}
            />
          );
        })}
      </div>
    </div>
  );
};

export default PowerPointExport;