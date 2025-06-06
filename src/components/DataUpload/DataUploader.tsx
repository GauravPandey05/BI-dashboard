import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { read, utils } from 'xlsx';
import { useData } from '../../contexts/DataContext';
import { Question, Response, SurveyData } from '../../types';
import { FileUp, FilePlus2, Check, AlertCircle } from 'lucide-react';

const DataUploader: React.FC = () => {
  const { setData } = useData();
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<{
    success: boolean;
    message: string;
  } | null>(null);
  const [preview, setPreview] = useState<{
    fileName: string;
    questions: number;
    responses: number;
  } | null>(null);
  
  const processExcelFile = async (file: File) => {
    setIsProcessing(true);
    setUploadStatus(null);
    
    try {
      const buffer = await file.arrayBuffer();
      const workbook = read(buffer);
      
      // Assume first sheet contains questions
      const questionsSheet = workbook.Sheets[workbook.SheetNames[0]];
      const questionsData = utils.sheet_to_json(questionsSheet);
      
      // Assume second sheet contains responses
      const responsesSheet = workbook.Sheets[workbook.SheetNames[1]];
      const responsesData = utils.sheet_to_json(responsesSheet);
      
      // Process questions
      const questions: Question[] = questionsData.map((row: any, index) => ({
        id: row.id || `Q${index + 1}`,
        text: row.text || `Question ${index + 1}`,
        type: row.type || 'single_choice',
        choices: row.choices ? JSON.parse(row.choices) : generateDefaultChoices(index)
      }));
      
      // Process responses
      const responses: Response[] = responsesData.map((row: any, index) => {
        // Extract demographics
        const demographics = {
          ageGroup: row.ageGroup || 'Unknown',
          gender: row.gender || 'Unknown',
          familyComposition: row.familyComposition || 'Unknown',
          incomeRange: row.incomeRange || 'Unknown',
          region: row.region || 'Unknown'
        };
        
        // Extract answers
        const answers: Record<string, any> = {};
        questions.forEach(question => {
          if (row[question.id] !== undefined) {
            // Check if it's multiple choice (comma separated)
            if (typeof row[question.id] === 'string' && row[question.id].includes(',')) {
              answers[question.id] = row[question.id].split(',').map((s: string) => s.trim());
            } else {
              answers[question.id] = row[question.id];
            }
          }
        });
        
        return {
          id: row.id || `resp_${index}`,
          demographics,
          answers,
          weight: row.weight || 1
        };
      });
      
      // Create survey data object
      const surveyData: SurveyData = {
        title: workbook.Props?.Title || "Imported Survey",
        description: workbook.Props?.Subject || "Imported from Excel",
        questions,
        responses
      };
      
      // Set preview data
      setPreview({
        fileName: file.name,
        questions: questions.length,
        responses: responses.length
      });
      
      // Update context data
      setData(surveyData);
      
      setUploadStatus({
        success: true,
        message: `Successfully imported ${questions.length} questions and ${responses.length} responses`
      });
    } catch (error) {
      console.error('Error processing Excel file:', error);
      setUploadStatus({
        success: false,
        message: 'Error processing file. Please check the format and try again.'
      });
    } finally {
      setIsProcessing(false);
    }
  };
  
  // Generate default choices for questions if not provided
  const generateDefaultChoices = (index: number) => {
    return [
      { id: `Q${index + 1}_1`, text: 'Option 1' },
      { id: `Q${index + 1}_2`, text: 'Option 2' },
      { id: `Q${index + 1}_3`, text: 'Option 3' }
    ];
  };
  
  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      processExcelFile(acceptedFiles[0]);
    }
  }, []);
  
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls']
    },
    maxFiles: 1
  });
  
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-lg font-semibold text-gray-800">Upload Survey Data</h2>
        <p className="text-sm text-gray-600">
          Upload an Excel file (.xlsx) containing your survey questions and responses.
          The file should have two sheets: one for questions and one for responses.
        </p>
      </div>
      
      <div 
        {...getRootProps()} 
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
          isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-400'
        }`}
      >
        <input {...getInputProps()} />
        <div className="space-y-3">
          <FileUp className="mx-auto h-12 w-12 text-gray-400" />
          {isDragActive ? (
            <p className="text-blue-600">Drop the Excel file here...</p>
          ) : (
            <>
              <p className="text-gray-700">Drag and drop an Excel file here, or click to select a file</p>
              <p className="text-xs text-gray-500">
                Supported formats: .xlsx, .xls
              </p>
            </>
          )}
        </div>
      </div>
      
      {isProcessing && (
        <div className="flex items-center justify-center p-4 bg-gray-50 rounded-lg">
          <div className="h-5 w-5 border-2 border-t-blue-600 border-r-blue-600 border-b-transparent border-l-transparent rounded-full animate-spin mr-3"></div>
          <span className="text-gray-600">Processing file...</span>
        </div>
      )}
      
      {uploadStatus && (
        <div className={`p-4 rounded-lg ${uploadStatus.success ? 'bg-green-50' : 'bg-red-50'}`}>
          <div className="flex items-start">
            {uploadStatus.success ? (
              <Check className="h-5 w-5 text-green-500 mt-0.5 mr-2" />
            ) : (
              <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 mr-2" />
            )}
            <div>
              <p className={`font-medium ${uploadStatus.success ? 'text-green-800' : 'text-red-800'}`}>
                {uploadStatus.success ? 'Upload Successful' : 'Upload Failed'}
              </p>
              <p className={`text-sm ${uploadStatus.success ? 'text-green-700' : 'text-red-700'}`}>
                {uploadStatus.message}
              </p>
            </div>
          </div>
        </div>
      )}
      
      {preview && (
        <div className="bg-white border rounded-lg overflow-hidden">
          <div className="px-4 py-3 border-b bg-gray-50">
            <h3 className="font-medium text-gray-700">File Preview</h3>
          </div>
          <div className="p-4">
            <div className="flex items-center mb-4">
              <FilePlus2 className="h-8 w-8 text-blue-500 mr-3" />
              <div>
                <p className="font-medium">{preview.fileName}</p>
                <p className="text-sm text-gray-500">
                  {preview.questions} questions, {preview.responses} responses
                </p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="bg-gray-50 p-3 rounded">
                <p className="font-medium text-gray-700 mb-1">Questions</p>
                <p className="text-gray-600">{preview.questions} questions imported</p>
              </div>
              <div className="bg-gray-50 p-3 rounded">
                <p className="font-medium text-gray-700 mb-1">Responses</p>
                <p className="text-gray-600">{preview.responses} responses imported</p>
              </div>
            </div>
          </div>
        </div>
      )}
      
      <div className="bg-blue-50 p-4 rounded-lg">
        <h3 className="font-medium text-blue-800 mb-2">Expected Excel Format</h3>
        <p className="text-sm text-blue-700 mb-3">
          Your Excel file should contain two sheets with the following structure:
        </p>
        
        <div className="space-y-3">
          <div className="bg-white p-3 rounded border border-blue-200">
            <p className="font-medium text-blue-800 mb-1">Sheet 1: Questions</p>
            <p className="text-xs text-blue-700">
              Columns: id, text, type, choices (JSON string for choice options)
            </p>
          </div>
          
          <div className="bg-white p-3 rounded border border-blue-200">
            <p className="font-medium text-blue-800 mb-1">Sheet 2: Responses</p>
            <p className="text-xs text-blue-700">
              Columns: id, ageGroup, gender, familyComposition, incomeRange, region, weight, Q1, Q2, ... (one column per question)
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DataUploader;