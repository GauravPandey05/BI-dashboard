import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { SurveyData, Question, FilterOptions, SelectedFilters } from '../types';

interface DataContextType {
  data: SurveyData;
  setData: React.Dispatch<React.SetStateAction<SurveyData>>;
  selectedQuestions: string[];
  setSelectedQuestions: React.Dispatch<React.SetStateAction<string[]>>;
  filters: FilterOptions;
  selectedFilters: SelectedFilters;
  setSelectedFilters: React.Dispatch<React.SetStateAction<SelectedFilters>>;
  filteredData: SurveyData;
  applyFilters: () => void;
  resetFilters: () => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

interface DataProviderProps {
  children: ReactNode;
  initialData: SurveyData;
}

export const DataProvider: React.FC<DataProviderProps> = ({ children, initialData }) => {
  const [data, setData] = useState<SurveyData>(initialData);
  const [filteredData, setFilteredData] = useState<SurveyData>(initialData);
  const [selectedQuestions, setSelectedQuestions] = useState<string[]>(() => {
    // Initially select all questions
    return initialData.questions.map(q => q.id);
  });

  // Extract filter options from data
  const filters: FilterOptions = {
    ageGroups: Array.from(new Set(initialData.responses.map(r => r.demographics.ageGroup))),
    genders: Array.from(new Set(initialData.responses.map(r => r.demographics.gender))),
    familyCompositions: Array.from(new Set(initialData.responses.map(r => r.demographics.familyComposition))),
    incomeRanges: Array.from(new Set(initialData.responses.map(r => r.demographics.incomeRange))),
    regions: Array.from(new Set(initialData.responses.map(r => r.demographics.region)))
  };

  const [selectedFilters, setSelectedFilters] = useState<SelectedFilters>({
    ageGroups: [],
    genders: [],
    familyCompositions: [],
    incomeRanges: [],
    regions: []
  });

  const applyFilters = () => {
    let filtered = [...data.responses];
    
    // Apply demographic filters
    if (selectedFilters.ageGroups.length > 0) {
      filtered = filtered.filter(r => selectedFilters.ageGroups.includes(r.demographics.ageGroup));
    }
    
    if (selectedFilters.genders.length > 0) {
      filtered = filtered.filter(r => selectedFilters.genders.includes(r.demographics.gender));
    }
    
    if (selectedFilters.familyCompositions.length > 0) {
      filtered = filtered.filter(r => selectedFilters.familyCompositions.includes(r.demographics.familyComposition));
    }
    
    if (selectedFilters.incomeRanges.length > 0) {
      filtered = filtered.filter(r => selectedFilters.incomeRanges.includes(r.demographics.incomeRange));
    }
    
    if (selectedFilters.regions.length > 0) {
      filtered = filtered.filter(r => selectedFilters.regions.includes(r.demographics.region));
    }
    
    setFilteredData({
      ...data,
      responses: filtered
    });
  };

  const resetFilters = () => {
    setSelectedFilters({
      ageGroups: [],
      genders: [],
      familyCompositions: [],
      incomeRanges: [],
      regions: []
    });
  };

  useEffect(() => {
    applyFilters();
  }, [selectedFilters, data]);

  return (
    <DataContext.Provider value={{
      data,
      setData,
      selectedQuestions,
      setSelectedQuestions,
      filters,
      selectedFilters,
      setSelectedFilters,
      filteredData,
      applyFilters,
      resetFilters
    }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};