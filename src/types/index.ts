// Types for survey data and responses
export interface Demographics {
  ageGroup: string;
  gender: string;
  familyComposition: string;
  incomeRange: string;
  region: string;
}

export interface Response {
  id: string;
  demographics: Demographics;
  answers: Record<string, string | string[] | Record<string, number>>; // <-- Allow object for scale
  weight: number; // For weighted responses
}

export interface Choice {
  id: string;
  text: string;
}

export interface Question {
  id: string;
  text: string;
  type: 'multiple_choice' | 'single_choice' | 'scale' | 'open_ended';
  choices?: Choice[];
}

export interface SurveyData {
  title: string;
  description: string;
  questions: Question[];
  responses: Response[];
}

// Types for filters
export interface FilterOptions {
  ageGroups: string[];
  genders: string[];
  familyCompositions: string[];
  incomeRanges: string[];
  regions: string[];
}

export interface SelectedFilters {
  ageGroups: string[];
  genders: string[];
  familyCompositions: string[];
  incomeRanges: string[];
  regions: string[];
}

// Types for chart data
export interface ChartData {
  labels: string[];
  datasets: {
    data: number[];
    backgroundColor: string[];
    hoverBackgroundColor: string[];
  }[];
}

// Types for chat
export interface ChatMessage {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
}