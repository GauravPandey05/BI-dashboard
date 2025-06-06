import type { SurveyData, Response } from '../types'; // <-- Fix import

export const loadMockData = (): SurveyData => {
  return {
    title: "Travel Survey 2025",
    description: "Annual travel habits and preferences survey",
    questions: [
      {
        id: "Q1",
        text: "Do you plan on traveling domestically or internationally in the next 12 months?",
        type: "single_choice",
        choices: [
          { id: "Q1_1", text: "Domestic only" },
          { id: "Q1_2", text: "International only" },
          { id: "Q1_3", text: "Both domestic and international" },
          { id: "Q1_4", text: "No travel plans" }
        ]
      },
      {
        id: "Q2",
        text: "What type of trip are you planning next for travel in the coming 12 months?",
        type: "single_choice",
        choices: [
          { id: "Q2_1", text: "Beach vacation" },
          { id: "Q2_2", text: "City break" },
          { id: "Q2_3", text: "Adventure trip" },
          { id: "Q2_4", text: "Cruise" },
          { id: "Q2_5", text: "Cultural tour" }
        ]
      },
      {
        id: "Q3",
        text: "Which of the following resources would you use the most during listed phases of a travel booking journey?",
        type: "multiple_choice",
        choices: [
          { id: "Q3_1", text: "Travel websites" },
          { id: "Q3_2", text: "Social media" },
          { id: "Q3_3", text: "Travel agents" },
          { id: "Q3_4", text: "Friends and family recommendations" },
          { id: "Q3_5", text: "Review sites" }
        ]
      },
      {
        id: "Q4",
        text: "How likely are you to agree with the following statements?",
        type: "scale",
        choices: [
          { id: "Q4_1", text: "I prefer to book all-inclusive packages" },
          { id: "Q4_2", text: "I like to plan my own itinerary" },
          { id: "Q4_3", text: "Price is more important than destination" },
          { id: "Q4_4", text: "I prefer luxury travel experiences" }
        ]
      },
      {
        id: "Q5",
        text: "Considering your potential trip in the next 12 months, how best do you like to travel and explore the destination and various experiences?",
        type: "single_choice",
        choices: [
          { id: "Q5_1", text: "Guided tours" },
          { id: "Q5_2", text: "Self-guided exploration" },
          { id: "Q5_3", text: "Mix of guided and self-guided" },
          { id: "Q5_4", text: "Resort/hotel stay with limited exploration" }
        ]
      },
      {
        id: "Q6",
        text: "Once you have decided your destination and travel dates, How likely are you to change your destination if you find a cheaper flight?",
        type: "single_choice",
        choices: [
          { id: "Q6_1", text: "Very likely" },
          { id: "Q6_2", text: "Somewhat likely" },
          { id: "Q6_3", text: "Not very likely" },
          { id: "Q6_4", text: "Not at all likely" }
        ]
      },
      {
        id: "Q7",
        text: "Once you have decided your destination and travel dates, How likely are you to change your destination if you find a cheaper packed holiday deal?",
        type: "single_choice",
        choices: [
          { id: "Q7_1", text: "Very likely" },
          { id: "Q7_2", text: "Somewhat likely" },
          { id: "Q7_3", text: "Not very likely" },
          { id: "Q7_4", text: "Not at all likely" }
        ]
      },
      {
        id: "Q8",
        text: "Have you recently booked any trip in the last 6 months?",
        type: "single_choice",
        choices: [
          { id: "Q8_1", text: "Yes" },
          { id: "Q8_2", text: "No" }
        ]
      }
    ],
    responses: generateMockResponses(500)
  };
};

// Helper function to generate realistic mock responses
function generateMockResponses(count: number): Response[] { // <-- Fix type
  const ageGroups = ["18-24", "25-34", "35-44", "45-54", "55-64", "65+"];
  const genders = ["Male", "Female", "Non-binary", "Prefer not to say"];
  const familyCompositions = ["Single", "Couple, no children", "Family with young children", "Family with older children", "Empty nester"];
  const incomeRanges = ["Under $30k", "$30k-$60k", "$60k-$100k", "$100k-$150k", "Over $150k"];
  const regions = ["Northeast", "Southeast", "Midwest", "Southwest", "West", "Outside US"];

  const responses: Response[] = []; // <-- Fix type

  for (let i = 0; i < count; i++) {
    // Create weighted distributions for more realistic data
    let q1Answer;
    const q1Random = Math.random();
    if (q1Random < 0.53) q1Answer = "Q1_1"; // Domestic only - 53%
    else if (q1Random < 0.69) q1Answer = "Q1_2"; // International only - 16%
    else if (q1Random < 0.85) q1Answer = "Q1_3"; // Both - 16%
    else q1Answer = "Q1_4"; // No plans - 15%

    let q2Answer;
    const q2Random = Math.random();
    if (q2Random < 0.29) q2Answer = "Q2_1"; // Beach - 29%
    else if (q2Random < 0.57) q2Answer = "Q2_2"; // City break - 28%
    else if (q2Random < 0.78) q2Answer = "Q2_3"; // Adventure - 21%
    else if (q2Random < 0.89) q2Answer = "Q2_4"; // Cruise - 11%
    else q2Answer = "Q2_5"; // Cultural - 11%

    // Generate random Q3 answers (multiple choice)
    const q3Options = ["Q3_1", "Q3_2", "Q3_3", "Q3_4", "Q3_5"];
    const q3Count = Math.floor(Math.random() * 3) + 1; // Select 1-3 options
    const q3Answer = [];
    for (let j = 0; j < q3Count; j++) {
      const randomIndex = Math.floor(Math.random() * q3Options.length);
      q3Answer.push(q3Options.splice(randomIndex, 1)[0]);
    }

    // Generate Q6 answer with realistic distribution
    let q6Answer;
    const q6Random = Math.random();
    if (q6Random < 0.25) q6Answer = "Q6_1"; // Very likely - 25%
    else if (q6Random < 0.55) q6Answer = "Q6_2"; // Somewhat likely - 30%
    else if (q6Random < 0.80) q6Answer = "Q6_3"; // Not very likely - 25%
    else q6Answer = "Q6_4"; // Not at all likely - 20%

    // Generate Q7 answer with realistic distribution
    let q7Answer;
    const q7Random = Math.random();
    if (q7Random < 0.30) q7Answer = "Q7_1"; // Very likely - 30%
    else if (q7Random < 0.60) q7Answer = "Q7_2"; // Somewhat likely - 30%
    else if (q7Random < 0.85) q7Answer = "Q7_3"; // Not very likely - 25%
    else q7Answer = "Q7_4"; // Not at all likely - 15%

    // Generate Q8 answer
    const q8Answer = Math.random() < 0.65 ? "Q8_1" : "Q8_2"; // 65% Yes, 35% No

    responses.push({
      id: `resp_${i}`,
      demographics: {
        ageGroup: ageGroups[Math.floor(Math.random() * ageGroups.length)],
        gender: genders[Math.floor(Math.random() * genders.length)],
        familyComposition: familyCompositions[Math.floor(Math.random() * familyCompositions.length)],
        incomeRange: incomeRanges[Math.floor(Math.random() * incomeRanges.length)],
        region: regions[Math.floor(Math.random() * regions.length)]
      },
      answers: {
        "Q1": q1Answer,
        "Q2": q2Answer,
        "Q3": q3Answer,
        "Q4": {
          "Q4_1": Math.floor(Math.random() * 5) + 1,
          "Q4_2": Math.floor(Math.random() * 5) + 1,
          "Q4_3": Math.floor(Math.random() * 5) + 1,
          "Q4_4": Math.floor(Math.random() * 5) + 1
        },
        "Q5": `Q5_${Math.floor(Math.random() * 4) + 1}`,
        "Q6": q6Answer,
        "Q7": q7Answer,
        "Q8": q8Answer
      },
      weight: 1 + Math.random() * 0.5 // Weight between 1.0 and 1.5
    });
  }

  return responses;
}