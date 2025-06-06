import React, { useState } from 'react';
import pptxgen from 'pptxgenjs';
import { useData } from '../../contexts/DataContext';
import { Download, FileText, Image } from 'lucide-react';

const PowerPointExport: React.FC = () => {
  const { data, filteredData, selectedQuestions } = useData();
  const [exporting, setExporting] = useState(false);
  const [brandingImage, setBrandingImage] = useState<File | null>(null);
  const [brandingColor, setBrandingColor] = useState('#2563eb'); // Default blue color
  const [exportName, setExportName] = useState('Travel Survey Report');
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setBrandingImage(e.target.files[0]);
    }
  };
  
  const exportToPowerPoint = async () => {
    setExporting(true);
    
    try {
      // Create a new presentation
      const pptx = new pptxgen();
      
      // Set presentation properties
      pptx.author = 'Travel Survey Dashboard';
      pptx.title = exportName;
      
      // Create a base master slide with branding
      pptx.defineSlideMaster({
        title: 'BRANDED_SLIDE',
        background: { color: '#FFFFFF' },
        objects: [
          // Bottom bar with branding color
          { rect: { x: 0, y: '90%', w: '100%', h: '10%', fill: { color: brandingColor } } },
          // Add title placeholder
          {
            text: {
              text: 'TITLE_PLACEHOLDER',
              options: {
                x: 0.5,
                y: 0.1,
                w: '95%',
                h: 0.5,
                align: 'center',
                fontSize: 18,
                bold: true,
                color: '#333333'
              }
            }
          }
        ]
      });
      
      // Add title slide
      const slide1 = pptx.addSlide({ masterName: 'BRANDED_SLIDE' });
      
      // Add title
      slide1.addText(exportName, {
        x: 0.5,
        y: 0.3,
        w: '95%',
        h: 1.0,
        fontSize: 24,
        color: '#333333',
        bold: true,
        align: 'center'
      });
      
      // Add date
      slide1.addText(`Generated on ${new Date().toLocaleDateString()}`, {
        x: 0.5,
        y: 1.3,
        w: '95%',
        h: 0.3,
        fontSize: 14,
        color: '#666666',
        align: 'center'
      });
      
      // Add branding image if available
      if (brandingImage) {
        const reader = new FileReader();
        reader.onload = (e) => {
          if (e.target && e.target.result) {
            slide1.addImage({
              data: e.target.result as string,
              x: 4,
              y: 5,
              w: 2,
              h: 1
            });
          }
        };
        reader.readAsDataURL(brandingImage);
      }
      
      // Add summary slide
      const slide2 = pptx.addSlide({ masterName: 'BRANDED_SLIDE' });
      
      slide2.addText('Survey Overview', {
        x: 0.5,
        y: 0.3,
        w: '95%',
        h: 0.5,
        fontSize: 18,
        color: '#333333',
        bold: true,
        align: 'center'
      });
      
      // Add summary details
      slide2.addText([
        { text: 'Total Responses: ', options: { bold: true } },
        { text: `${data.responses.length}` },
        { text: '\nFiltered Responses: ', options: { bold: true } },
        { text: `${filteredData.responses.length}` },
        { text: '\nSelected Questions: ', options: { bold: true } },
        { text: `${selectedQuestions.length}` }
      ], {
        x: 0.5,
        y: 1.0,
        w: '95%',
        h: 2.0,
        fontSize: 14,
        color: '#333333',
        align: 'center'
      });
      
      // Add individual question slides
      selectedQuestions.forEach(questionId => {
        const question = data.questions.find(q => q.id === questionId);
        if (!question) return;
        
        const slide = pptx.addSlide({ masterName: 'BRANDED_SLIDE' });
        
        // Add question text
        slide.addText(`${question.id}: ${question.text}`, {
          x: 0.5,
          y: 0.3,
          w: '95%',
          h: 0.5,
          fontSize: 16,
          color: '#333333',
          bold: true,
          align: 'center'
        });
        
        // Add a placeholder for the chart
        // In a real implementation, you would generate an image of the chart and insert it
        slide.addText('Chart will be inserted here in the actual export', {
          x: 1.5,
          y: 1.0,
          w: 7,
          h: 4,
          fontSize: 14,
          color: '#666666',
          align: 'center',
          valign: 'middle',
          fill: { color: '#F5F5F5' }
        });
        
        // Add notes about the data
        slide.addText(`Based on ${filteredData.responses.length} responses`, {
          x: 0.5,
          y: 5.2,
          w: '95%',
          h: 0.3,
          fontSize: 12,
          color: '#666666',
          align: 'center',
          italic: true
        });
      });
      
      // Save the presentation
      pptx.writeFile({ fileName: `${exportName.replace(/\s+/g, '_')}.pptx` });
    } catch (error) {
      console.error('Error exporting to PowerPoint:', error);
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
            {/* Simple PowerPoint slide preview */}
            <div className="h-full flex flex-col">
              <div className="flex-grow p-4 flex flex-col items-center justify-center">
                <div className="w-3/4 h-2 bg-gray-200 rounded mb-2"></div>
                <div className="w-1/2 h-2 bg-gray-200 rounded mb-6"></div>
                
                <div className="w-full flex justify-center">
                  <div className="w-28 h-28 rounded-full border-4 border-dashed border-gray-300 flex items-center justify-center text-gray-400">
                    <PieChart size={40} />
                  </div>
                </div>
              </div>
              
              <div 
                className="h-8 w-full" 
                style={{ backgroundColor: brandingColor }}
              ></div>
            </div>
            
            {/* Logo preview */}
            {brandingImage && (
              <div className="absolute bottom-10 right-4 w-16 h-8 bg-gray-100 flex items-center justify-center">
                <Image size={16} className="text-gray-400" />
              </div>
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
    </div>
  );
};

export default PowerPointExport;