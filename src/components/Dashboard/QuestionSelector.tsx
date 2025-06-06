import React from 'react';
import { Check, X } from 'lucide-react';
import { useData } from '../../contexts/DataContext';

const QuestionSelector: React.FC = () => {
  const { data, selectedQuestions, setSelectedQuestions } = useData();
  
  const toggleQuestion = (questionId: string) => {
    if (selectedQuestions.includes(questionId)) {
      setSelectedQuestions(selectedQuestions.filter(id => id !== questionId));
    } else {
      setSelectedQuestions([...selectedQuestions, questionId]);
    }
  };
  
  const selectAll = () => {
    setSelectedQuestions(data.questions.map(q => q.id));
  };
  
  const deselectAll = () => {
    setSelectedQuestions([]);
  };
  
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-gray-800">Select Questions to Display</h2>
        <div className="space-x-2">
          <button 
            onClick={selectAll}
            className="px-3 py-1 text-sm text-blue-600 hover:text-blue-800"
          >
            Select All
          </button>
          <button 
            onClick={deselectAll}
            className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800"
          >
            Deselect All
          </button>
        </div>
      </div>
      
      <div className="grid gap-4">
        {data.questions.map((question) => (
          <div 
            key={question.id}
            className={`p-4 rounded-lg border ${
              selectedQuestions.includes(question.id) 
                ? 'border-blue-300 bg-blue-50' 
                : 'border-gray-200 bg-white'
            }`}
          >
            <div className="flex items-start">
              <div 
                onClick={() => toggleQuestion(question.id)}
                className={`flex-shrink-0 w-5 h-5 mt-0.5 rounded border flex items-center justify-center cursor-pointer ${
                  selectedQuestions.includes(question.id) 
                    ? 'bg-blue-500 border-blue-500' 
                    : 'border-gray-300'
                }`}
              >
                {selectedQuestions.includes(question.id) && (
                  <Check className="h-3 w-3 text-white" />
                )}
              </div>
              
              <div className="ml-3 flex-grow">
                <label 
                  htmlFor={question.id}
                  className="block text-sm font-medium cursor-pointer"
                  onClick={() => toggleQuestion(question.id)}
                >
                  {question.id}: {question.text}
                </label>
                
                {question.type === 'multiple_choice' && (
                  <p className="mt-1 text-xs text-gray-500">Multiple choice question</p>
                )}
                
                {question.type === 'single_choice' && (
                  <p className="mt-1 text-xs text-gray-500">Single choice question</p>
                )}
                
                {question.type === 'scale' && (
                  <p className="mt-1 text-xs text-gray-500">Scale question</p>
                )}
              </div>
              
              {selectedQuestions.includes(question.id) && (
                <button 
                  onClick={() => toggleQuestion(question.id)}
                  className="ml-2 text-gray-400 hover:text-gray-500"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default QuestionSelector;