import React from 'react';
import { useData } from '../../contexts/DataContext';
import ChartCard from './ChartCard';

const ChartGrid: React.FC = () => {
  const { data, filteredData, selectedQuestions } = useData();
  
  // Filter only selected questions
  const questionsToDisplay = data.questions.filter(q => 
    selectedQuestions.includes(q.id)
  );
  
  // Group questions by categories (example: intent, booking, preferences)
  const groupedQuestions: Record<string, typeof data.questions> = {
    'Travel Intent': questionsToDisplay.filter(q => 
      q.id === 'Q1' || q.id === 'Q2' || q.id === 'Q5'
    ),
    'Booking Behavior': questionsToDisplay.filter(q => 
      q.id === 'Q3' || q.id === 'Q6' || q.id === 'Q7' || q.id === 'Q8'
    ),
    'Travel Preferences': questionsToDisplay.filter(q => 
      q.id === 'Q4'
    )
  };
  
  return (
    <div className="space-y-8">
      {Object.entries(groupedQuestions).map(([category, questions]) => 
        questions.length > 0 && (
          <div key={category} className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-800 py-2 border-b border-gray-200">
              {category}
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {questions.map(question => (
                <ChartCard 
                  key={question.id}
                  question={question}
                  data={filteredData}
                />
              ))}
            </div>
          </div>
        )
      )}
    </div>
  );
};

export default ChartGrid;