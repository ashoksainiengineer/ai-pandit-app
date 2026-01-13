import type { BirthData, PhysicalDescription, LifeEvent } from '@/types';

// Weighted scoring system for BTR form completion
export interface ProgressWeights {
  birthDetails: {
    fullName: number;
    dateOfBirth: number;
    tentativeTime: number;
    timeUncertainty: number;
    birthPlace: number;
    latitude: number;
    longitude: number;
    timezone: number;
    gender: number;
    maritalStatus: number;
  };
  physicalDescription: {
    bodyStructure: number;
    height: number;
    faceShape: number;
    complexion: number;
    distinctiveFeatures: number;
  };
  lifeEvents: {
    eventCount: number;
    eventQuality: number;
    eventDiversity: number;
    eventDetails: number;
  };
}

// Optimal weights based on astrological importance
const WEIGHTS: ProgressWeights = {
  birthDetails: {
    fullName: 8,           // Important for calculations
    dateOfBirth: 15,       // Critical - exact date needed
    tentativeTime: 15,     // Critical - birth time to rectify
    timeUncertainty: 10,   // Important - affects confidence
    birthPlace: 12,        // Critical - for coordinates
    latitude: 12,          // Critical - exact location
    longitude: 12,         // Critical - exact location
    timezone: 8,           // Important - time accuracy
    gender: 8,             // Important - for verification
    maritalStatus: 10,     // Important - for life event suggestions
  },
  physicalDescription: {
    bodyStructure: 25,     // Important for ascendant verification
    height: 20,            // Important for ascendant verification
    faceShape: 25,         // Important for ascendant verification
    complexion: 20,        // Important for ascendant verification
    distinctiveFeatures: 10, // Bonus points for extra details
  },
  lifeEvents: {
    eventCount: 40,        // More events = better accuracy
    eventQuality: 25,      // Detailed events with descriptions
    eventDiversity: 20,    // Different categories of events
    eventDetails: 15,      // Complete information (dates, descriptions)
  },
};

// Maximum possible scores
const MAX_SCORES = {
  birthDetails: Object.values(WEIGHTS.birthDetails).reduce((sum, weight) => sum + weight, 0),
  physicalDescription: Object.values(WEIGHTS.physicalDescription).reduce((sum, weight) => sum + weight, 0),
  lifeEvents: Object.values(WEIGHTS.lifeEvents).reduce((sum, weight) => sum + weight, 0),
  total: 0,
};

MAX_SCORES.total = MAX_SCORES.birthDetails + MAX_SCORES.physicalDescription + MAX_SCORES.lifeEvents;

export interface ProgressBreakdown {
  birthDetails: number;
  physicalDescription: number;
  lifeEvents: number;
  total: number;
  percentage: number;
  message: string;
  recommendations: string[];
}

export function calculateProgress(
  birthData: Partial<BirthData>,
  physicalDesc: Partial<PhysicalDescription>,
  lifeEvents: LifeEvent[]
): ProgressBreakdown {
  // Calculate Birth Details progress
  let birthDetailsScore = 0;
  if (birthData.fullName?.trim()) birthDetailsScore += WEIGHTS.birthDetails.fullName;
  if (birthData.dateOfBirth) birthDetailsScore += WEIGHTS.birthDetails.dateOfBirth;
  if (birthData.tentativeTime) birthDetailsScore += WEIGHTS.birthDetails.tentativeTime;
  if (birthData.timeUncertainty) birthDetailsScore += WEIGHTS.birthDetails.timeUncertainty;
  if (birthData.birthPlace?.trim()) birthDetailsScore += WEIGHTS.birthDetails.birthPlace;
  if (birthData.latitude && birthData.latitude !== 0) birthDetailsScore += WEIGHTS.birthDetails.latitude;
  if (birthData.longitude && birthData.longitude !== 0) birthDetailsScore += WEIGHTS.birthDetails.longitude;
  if (birthData.timezone) birthDetailsScore += WEIGHTS.birthDetails.timezone;
  if (birthData.gender) birthDetailsScore += WEIGHTS.birthDetails.gender;
  if (birthData.maritalStatus) birthDetailsScore += WEIGHTS.birthDetails.maritalStatus;

  // Calculate Physical Description progress
  let physicalDescScore = 0;
  if (physicalDesc.bodyStructure) physicalDescScore += WEIGHTS.physicalDescription.bodyStructure;
  if (physicalDesc.height) physicalDescScore += WEIGHTS.physicalDescription.height;
  if (physicalDesc.faceShape) physicalDescScore += WEIGHTS.physicalDescription.faceShape;
  if (physicalDesc.complexion) physicalDescScore += WEIGHTS.physicalDescription.complexion;
  if (physicalDesc.distinctiveFeatures?.trim()) physicalDescScore += WEIGHTS.physicalDescription.distinctiveFeatures;

  // Calculate Life Events progress
  let lifeEventsScore = 0;
  
  // Event count (diminishing returns after 5 events)
  const eventCount = lifeEvents.length;
  const eventCountScore = Math.min(eventCount * 8, 40); // Max 40 points for 5+ events
  lifeEventsScore += eventCountScore;

  // Event quality (detailed events)
  const detailedEvents = lifeEvents.filter(event => 
    event.description?.trim() && event.description.length > 10
  ).length;
  const qualityScore = (detailedEvents / Math.max(eventCount, 1)) * 25;
  lifeEventsScore += qualityScore;

  // Event diversity (different categories)
  const uniqueCategories = new Set(lifeEvents.map(event => event.category)).size;
  const diversityScore = Math.min(uniqueCategories * 4, 20);
  lifeEventsScore += diversityScore;

  // Event details (complete information)
  const completeEvents = lifeEvents.filter(event => 
    event.eventType && event.eventDate && event.importance && event.dateAccuracy
  ).length;
  const detailsScore = (completeEvents / Math.max(eventCount, 1)) * 15;
  lifeEventsScore += detailsScore;

  const totalScore = birthDetailsScore + physicalDescScore + lifeEventsScore;
  const percentage = Math.min((totalScore / MAX_SCORES.total) * 100, 100);

  // Generate encouraging message
  let message = "";
  if (percentage === 0) {
    message = "🌟 Let's start your journey! Add your birth details to begin.";
  } else if (percentage < 25) {
    message = "📅 Great start! Keep adding more details for better accuracy.";
  } else if (percentage < 50) {
    message = "🎯 You're doing well! Add physical traits and life events.";
  } else if (percentage < 75) {
    message = "✨ Excellent progress! More events will improve accuracy.";
  } else if (percentage < 90) {
    message = "🚀 Fantastic! Add a few more events for optimal results.";
  } else {
    message = "🏆 Outstanding! You have comprehensive data for accurate results.";
  }

  // Generate specific recommendations
  const recommendations: string[] = [];
  
  if (birthDetailsScore < MAX_SCORES.birthDetails * 0.8) {
    if (!birthData.dateOfBirth) recommendations.push("Add your date of birth");
    if (!birthData.tentativeTime) recommendations.push("Provide your birth time");
    if (!birthData.birthPlace) recommendations.push("Enter your birth place");
    if (!birthData.maritalStatus) recommendations.push("Select your marital status");
  }
  
  if (physicalDescScore < MAX_SCORES.physicalDescription * 0.8) {
    if (!physicalDesc.bodyStructure) recommendations.push("Describe your body type");
    if (!physicalDesc.faceShape) recommendations.push("Select your face shape");
    if (!physicalDesc.height) recommendations.push("Choose your height category");
  }
  
  if (lifeEventsScore < MAX_SCORES.lifeEvents * 0.7) {
    if (eventCount < 3) recommendations.push("Add at least 3 life events");
    if (eventCount < 5) recommendations.push("Add more events for better accuracy");
    if (detailedEvents < eventCount * 0.5) recommendations.push("Add descriptions to your events");
    if (uniqueCategories < 3) recommendations.push("Include events from different life categories");
  }

  return {
    birthDetails: Math.round((birthDetailsScore / MAX_SCORES.birthDetails) * 100),
    physicalDescription: Math.round((physicalDescScore / MAX_SCORES.physicalDescription) * 100),
    lifeEvents: Math.round((lifeEventsScore / MAX_SCORES.lifeEvents) * 100),
    total: Math.round(totalScore),
    percentage: Math.round(percentage),
    message,
    recommendations: recommendations.slice(0, 3), // Show max 3 recommendations
  };
}

// Helper function to get progress color based on percentage
export function getProgressColor(percentage: number): string {
  if (percentage < 25) return "#EF4444"; // Red
  if (percentage < 50) return "#F59E0B"; // Orange  
  if (percentage < 75) return "#10B981"; // Green
  return "#059669"; // Dark green
}

// Helper function to get progress message
export function getProgressMessage(percentage: number): string {
  if (percentage === 0) return "Let's get started! 🌟";
  if (percentage < 25) return "Good start! Keep going! 📈";
  if (percentage < 50) return "You're making progress! 🎯";
  if (percentage < 75) return "Excellent work! Almost there! ✨";
  if (percentage < 90) return "Fantastic! Just a bit more! 🚀";
  return "Outstanding! Comprehensive data! 🏆";
}