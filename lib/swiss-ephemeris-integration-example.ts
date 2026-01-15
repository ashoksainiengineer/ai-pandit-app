import { calculateEphemerisForTimeSlots, performBTRAnalysis } from './api-client';
import { createMoonshootAIClient, MoonshootAIClient } from './moonshoot-ai-client';
import { generateMoonshootAIPrompt } from './moonshoot-ai-prompt';
import { MoonshootAIPromptData, AlternativeTime } from './types';

export async function performCompleteBTRAnalysis() {
  try {
    const userData = {
      birthData: {
        fullName: 'John Doe',
        dateOfBirth: '1990-08-15',
        tentativeTime: '07:30:00',
        timeUncertainty: '30min',
        birthPlace: 'Mumbai, India',
        latitude: 19.0760,
        longitude: 72.8777,
        timezone: 'Asia/Kolkata',
        gender: 'male' as const,
        maritalStatus: 'married' as const,
        currentAge: 33
      },
      physicalDescription: {
        bodyStructure: 'average',
        height: 'average',
        faceShape: 'oval',
        complexion: 'wheatish',
        distinctiveFeatures: 'Small scar on left eyebrow'
      },
      lifeEvents: [
        { id: '1', category: 'education' as const, eventType: 'Graduated College', eventDate: '2012-05-15', dateAccuracy: 'exact' as const, description: 'Completed B.Tech', importance: 'high' as const, ageAtEvent: 21 },
        { id: '2', category: 'career' as const, eventType: 'First Job', eventDate: '2012-07-01', dateAccuracy: 'exact' as const, description: 'Joined Google', importance: 'high' as const, ageAtEvent: 21 },
        { id: '3', category: 'marriage' as const, eventType: 'Marriage', eventDate: '2018-03-12', dateAccuracy: 'exact' as const, description: 'Married', importance: 'high' as const, ageAtEvent: 27 },
      ]
    };
    
    const uncertaintyMinutes = getUncertaintyMinutes(userData.birthData.timeUncertainty);
    const baseDate = new Date(`${userData.birthData.dateOfBirth}T${userData.birthData.tentativeTime}`);
    
    const ephemerisData = await calculateEphemerisForTimeSlots(baseDate.toISOString(), userData.birthData.latitude, userData.birthData.longitude, userData.birthData.timezone, uncertaintyMinutes, 15);

    if (!ephemerisData.success || !ephemerisData.data) throw new Error(`Failed to calculate ephemeris: ${ephemerisData.error}`);
    
    const btrResult = await performBTRAnalysis({ birthData: { date: baseDate.toISOString(), latitude: userData.birthData.latitude, longitude: userData.birthData.longitude, timezone: userData.birthData.timezone, }, lifeEvents: userData.lifeEvents.map(event => ({ date: event.eventDate, type: event.eventType, description: event.description, })), uncertaintyMinutes: uncertaintyMinutes, slotInterval: 15, });

    if (!btrResult.success || !btrResult.data) throw new Error(`BTR analysis failed: ${btrResult.error}`);
    
    const promptData: MoonshootAIPromptData = {
      userData: {
        birthData: { date: userData.birthData.dateOfBirth, time: userData.birthData.tentativeTime, place: userData.birthData.birthPlace, latitude: userData.birthData.latitude, longitude: userData.birthData.longitude, timezone: userData.birthData.timezone, gender: 'Male' },
        physicalDescription: { bodyStructure: userData.physicalDescription.bodyStructure, height: userData.physicalDescription.height, faceShape: userData.physicalDescription.faceShape, complexion: userData.physicalDescription.complexion, distinctiveFeatures: userData.physicalDescription.distinctiveFeatures },
        lifeEvents: userData.lifeEvents.map(e => ({...e, time: ''})),
        relationship: 'married',
        occupation: 'Software Engineer'
      },
      ephemerisData: ephemerisData.data as any,
      dashaData: btrResult.data.chartData as any,
      timeSlots: btrResult.data.alternativeTimes.map((at: AlternativeTime) => ({...at, time: at.time.toISOString()})) as any,
      dominantSign: 'Leo'
    };
    
    const prompt = generateMoonshootAIPrompt(promptData);
    
    const aiClient = createMoonshootAIClient({apiKey: 'dummy-key'});
    const aiResult = await aiClient.analyzeBirthTime(promptData as any);
    
    aiResult.keyFindings.forEach((finding: any, index: any) => console.log(`${index + 1}. ${finding}`));
    aiResult.alternativeTimes.forEach((alt: any, index: any) => console.log(`${index + 1}. ${alt.time} (${alt.confidence}% confidence) - ${alt.reason}`));
    
    return { success: true, data: { recommendedTime: aiResult.recommendedBirthTime, confidenceLevel: aiResult.confidenceLevel, analysis: aiResult.analysis, alternativeTimes: aiResult.alternativeTimes, keyFindings: aiResult.keyFindings } };
    
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

function getUncertaintyMinutes(uncertainty: string): number {
  return ({ 'exact': 0, '5min': 5, '15min': 15, '30min': 30, '1hour': 60, '2hour': 120, '4hour': 240, 'unknown': 120 })[uncertainty] || 30;
}

export async function runBTRAnalysisExample() {
  const result = await performCompleteBTRAnalysis();
  if (result.success) console.log('✅ Analysis completed successfully!');
  else console.log('❌ Analysis failed:', result.error);
  return result;
}
