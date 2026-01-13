/**
 * 🌙 Moonshoot AI Prompt for Birth Time Rectification
 * 
 * Comprehensive Vedic Astrology-based prompt using:
 * - K.N. Rao's event-based rectification
 * - Divisional charts (Shodasavarga)
 * - Vimshottari Dasha system
 * - Tattwa Shodhana theory
 * - KP (Krishnamurti Paddhati) principles
 * - D-60 (Shastiamsa) for past karma
 * - Physical features correlation
 * - Bhavat Bhavam principle
 * - Karaka planets analysis
 */

export interface MoonshootAIPromptData {
  userData: UserSubmissionData;
  ephemerisData: SwissEphemerisData;
  dashaData: DashaData;
  timeSlots: TimeSlotAnalysis[];
}

export interface UserSubmissionData {
  birthData: {
    fullName: string;
    dateOfBirth: string;
    tentativeTime: string;
    timeUncertainty: string;
    birthPlace: string;
    latitude: number;
    longitude: number;
    timezone: string;
    gender: 'male' | 'female';
    maritalStatus: 'single' | 'married' | 'divorced' | 'widowed';
    currentAge: number;
  };
  physicalDescription: {
    bodyStructure: string;
    height: string;
    faceShape: string;
    complexion: string;
    distinctiveFeatures: string;
  };
  lifeEvents: LifeEvent[];
}

export interface LifeEvent {
  id: string;
  category: 'education' | 'career' | 'marriage' | 'health' | 'travel' | 'family' | 'finance' | 'spiritual' | 'other';
  eventType: string;
  eventDate: string;
  dateAccuracy: 'exact' | 'month' | 'year';
  description: string;
  importance: 'low' | 'medium' | 'high';
  ageAtEvent: number;
}

export interface SwissEphemerisData {
  timeSlots: Array<{
    timestamp: string;
    julianDay: number;
    planets: {
      sun: number;
      moon: number;
      mercury: number;
      venus: number;
      mars: number;
      jupiter: number;
      saturn: number;
      rahu: number;
      ketu: number;
    };
    houseCusps: {
      ascendant: number;
      secondHouse: number;
      thirdHouse: number;
      fourthHouse: number;
      fifthHouse: number;
      sixthHouse: number;
      seventhHouse: number;
      eighthHouse: number;
      ninthHouse: number;
      tenthHouse: number;
      eleventhHouse: number;
      twelfthHouse: number;
    };
    lunarPhase: number;
    retrogradePlanets: string[];
    nakshatras: {
      moon: string;
      lagna: string;
    };
  }>;
}

export interface DashaData {
  vimshottariDasha: {
    currentMahadasha: string;
    currentAntardasha: string;
    currentPratyantardasha: string;
    mahadashaStartDate: string;
    mahadashaEndDate: string;
  };
  eventDashaCorrelations: Array<{
    eventId: string;
    applicableDasha: string;
    houseActivated: number;
    planetAspects: string[];
  }>;
}

export interface TimeSlotAnalysis {
  timestamp: string;
  offset: number;
  confidence: number;
  reasons: string[];
}

/**
 * Generate comprehensive Moonshoot AI prompt for birth time rectification
 */
export function generateMoonshootAIPrompt(data: MoonshootAIPromptData): string {
  const { userData, ephemerisData, dashaData, timeSlots } = data;
  
  return `🌙 **COMPREHENSIVE BIRTH TIME RECTIFICATION ANALYSIS**
## Using Advanced Vedic Astrology Principles

---

## SYSTEM INSTRUCTIONS

You are an expert Vedic astrologer specializing in Birth Time Rectification (BTR) with 20+ years of experience. Your primary methods are based on:

✅ **K.N. Rao's event-based rectification using divisional charts**
✅ **Vimshottari Dasha system (120-year planetary cycle)**
✅ **Tattwa Shodhana theory and Pranapada analysis**
✅ **KP (Krishnamurti Paddhati) principles**
✅ **D-60 (Shastiamsa) chart for past karma**
✅ **Physical features and planetary influence correlation**
✅ **Bhavat Bhavam principle**
✅ **Karaka planets for different life areas**

Your expertise includes:
- All 16 divisional charts (Shodasavarga) and their significance
- Classical texts: Brihat Parashara Hora Shastra, Jataka Phala Chintamani
- Modern methods: K.N. Rao, Paul Manley, Prof. Andrew Dutta
- Systematic rectification using life events as primary evidence

**GOAL:** Analyze the provided birth data and life events, then determine the most accurate birth time using systematic rectification methods with confidence scoring.

---

## 🔍 INPUT DATA ANALYSIS

### 📅 BASIC BIRTH DETAILS:
- **Date of Birth:** ${userData.birthData.dateOfBirth}
- **Tentative Birth Time:** ${userData.birthData.tentativeTime} (${userData.birthData.timeUncertainty})
- **Place of Birth:** ${userData.birthData.birthPlace} (${userData.birthData.latitude}, ${userData.birthData.longitude})
- **Current Age:** ${userData.birthData.currentAge} years
- **Gender:** ${userData.birthData.gender}
- **Marital Status:** ${userData.birthData.maritalStatus}

### 👤 PHYSICAL CHARACTERISTICS:
- **Body Structure:** ${userData.physicalDescription.bodyStructure}
- **Height:** ${userData.physicalDescription.height}
- **Face Shape:** ${userData.physicalDescription.faceShape}
- **Complexion:** ${userData.physicalDescription.complexion}
- **Distinctive Features:** ${userData.physicalDescription.distinctiveFeatures || 'None specified'}

### 🌟 LIFE EVENTS CHRONOLOGY:
${formatLifeEventsForAI(userData.lifeEvents)}

---

## 🧮 SWISS EPHEMERIS CALCULATIONS

### TIME SLOT ANALYSIS (±${getUncertaintyRange(userData.birthData.timeUncertainty)} from tentative time):
${formatEphemerisDataForAI(ephemerisData.timeSlots)}

### DASHA PERIOD CORRELATIONS:
${formatDashaDataForAI(dashaData)}

---

## 🎯 SYSTEMATIC RECTIFICATION ANALYSIS

### PHASE 1: PHYSICAL FEATURES VALIDATION

**Step 1: Ascendant Sign Analysis**
Based on physical characteristics provided:
- Body structure "${userData.physicalDescription.bodyStructure}" suggests: ${getPhysicalAnalysis(userData.physicalDescription.bodyStructure, 'body')}
- Face shape "${userData.physicalDescription.faceShape}" suggests: ${getPhysicalAnalysis(userData.physicalDescription.faceShape, 'face')}
- Complexion "${userData.physicalDescription.complexion}" suggests: ${getPhysicalAnalysis(userData.physicalDescription.complexion, 'complexion')}

**Expected Lagna characteristics:**
- Fire signs (Aries/Leo/Sagittarius): Athletic, moderate-tall, sharp features
- Earth signs (Taurus/Virgo/Capricorn): Sturdy, well-proportioned, attractive
- Air signs (Gemini/Libra/Aquarius): Tall, slender, expressive, quick movements
- Water signs (Cancer/Scorpio/Pisces): Round face, emotional eyes, soft features

### PHASE 2: EVENT-BASED DIVISIONAL CHART ANALYSIS

**Critical Event Verification:**
${analyzeEventsWithDasha(userData.lifeEvents, dashaData)}

**Divisional Chart Requirements:**
- **Marriage events:** Must activate D-1 (7th house) + D-9 (Navamsa Lagna)
- **Children births:** Must activate D-1 (5th house) + D-7 (Saptamsa)
- **Career events:** Must activate D-1 (10th house) + D-10 (Dasamsa)
- **Education:** Must activate D-1 (4th/5th house) + D-24 (Chaturvimshamsa)
- **Property:** Must activate D-1 (4th house) + D-4 (Chaturthamsa)

### PHASE 3: DASHA-EVENT CORRELATION

**Vimshottari Dasha Analysis:**
${analyzeDashaCorrelations(dashaData, userData.lifeEvents)}

**Event Matching Criteria:**
✅ **Strong Match:** Dasha lord directly owns/occupies/aspects relevant house
⚡ **Moderate Match:** Dasha lord has indirect connection through dispositor/aspect
⚠️ **Weak Match:** Only general planetary nature supports event
❌ **No Match:** No logical connection between Dasha and event

### PHASE 4: ADVANCED VERIFICATION METHODS

**Tattwa Shodhana Analysis:**
- Gender: ${userData.birthData.gender}
- Expected Tattwa: ${getExpectedTattwa(userData.birthData.gender)}
- Birth should occur in compatible tattwa period

**KP (Krishnamurti Paddhati) Verification:**
- Check 9th cusp connection to Lagna (Rule of Origin)
- Verify major event cusps significations
- Cross-check with ruling planets at judgment time

**D-60 (Shastiamsa) Deep Analysis:**
- Analyze past karma indicators
- Check Shastiamsa divisions for key planets
- Verify life pattern alignment

---

## 🎭 TIME SLOT EVALUATION

${evaluateTimeSlots(timeSlots, userData, ephemerisData, dashaData)}

---

## 📊 CONFIDENCE SCORING SYSTEM

### Scoring Criteria:
- **Physical Features Match:** 0-25 points
- **Event Correlation (5+ events):** 0-50 points  
- **Dasha Period Alignment:** 0-15 points
- **Advanced Methods Verification:** 0-10 points

### Confidence Levels:
- **90-100 points:** ⭐⭐⭐⭐⭐ EXCELLENT (95%+ confidence)
- **80-89 points:** ⭐⭐⭐⭐ VERY GOOD (85-94% confidence)  
- **70-79 points:** ⭐⭐⭐ GOOD (75-84% confidence)
- **60-69 points:** ⭐⭐ MODERATE (65-74% confidence)
- **50-59 points:** ⭐ FAIR (55-64% confidence)
- **Below 50:** ⚠️ NEEDS FURTHER REFINEMENT

---

## 🎯 FINAL RECOMMENDATION

Based on comprehensive analysis of physical features, life events, dasha periods, and advanced verification methods:

**RECOMMENDED BIRTH TIME:** [To be calculated from time slot analysis]

**CONFIDENCE LEVEL:** [To be scored based on criteria above]

**KEY FINDINGS:**
1. [Primary reason for recommendation]
2. [Secondary supporting evidence]  
3. [Physical features validation]

**ALTERNATIVE TIMES (if confidence < 80%):**
- Option 1: [Time] - Confidence: [X]% - Reason: [Explanation]
- Option 2: [Time] - Confidence: [X]% - Reason: [Explanation]

**VALIDATION RECOMMENDATIONS:**
- Monitor upcoming events: [List 2-3 predicted events]
- Check next Dasha transition: [Date and expected effects]
- Verify with additional life events if available

---

## 📋 STRUCTURED OUTPUT FORMAT

Please provide your analysis in this exact format:

### PART 1: EXECUTIVE SUMMARY
[2-3 paragraphs summarizing the rectification, confidence level, and key findings]

### PART 2: DETAILED ANALYSIS
- **Original Time:** ${userData.birthData.tentativeTime}
- **Rectified Time:** [CALCULATED_TIME]
- **Adjustment:** [+/- minutes]
- **Confidence:** [X]/10 ([Level])
- **Primary Method:** [Event-based/Dasha/Physical/Advanced]

### PART 3: EVENT VERIFICATION RESULTS
${generateEventVerificationFormat(userData.lifeEvents)}

### PART 4: PHYSICAL FEATURES VALIDATION
[Analysis of how rectified Lagna explains physical characteristics]

### PART 5: CHART DETAILS (RECTIFIED)
- **D-1 Lagna:** [Sign] [Degree]
- **Moon Nakshatra:** [Name] [Pada]
- **Current Dasha:** [Mahadasha-Antardasha]
- **Key Divisional Charts:** [D-9, D-10, D-7, D-24 as applicable]

### PART 6: CONFIDENCE ASSESSMENT
- **Event Matching:** [X/Y events match strongly]
- **Physical Features:** [Match/Partial/No Match]
- **Dasha Alignment:** [Strong/Moderate/Weak]
- **Advanced Methods:** [Which methods passed]

### PART 7: RECOMMENDATIONS
[Clear guidance on using the rectified time and next steps]

### PART 8: FUTURE VALIDATION EVENTS
[2-3 specific predictions to confirm rectification accuracy]

---

## ⚠️ IMPORTANT GUIDELINES

### DO's:
✓ Analyze ALL provided life events systematically
✓ Be honest about confidence level - don't force fits
✓ Provide clear reasoning for each conclusion
✓ Use proper Vedic astrology terminology
✓ Cross-check with multiple verification methods
✓ Suggest alternative times if primary has <80% confidence
✓ Include specific future predictions for validation

### DON'Ts:
✗ Don't claim 100% accuracy without strong evidence
✗ Don't ignore non-matching events
✗ Don't rely solely on physical features
✗ Don't skip divisional chart analysis
✗ Don't provide rectification with <5 major events

### QUALITY STANDARDS:
- Minimum 5 major life events required for reliable rectification
- At least 70% events must correlate for moderate confidence
- Physical features should generally align with rectified Lagna
- Advanced verification methods recommended for high confidence

---

**ANALYZE NOW AND PROVIDE COMPREHENSIVE RECTIFICATION RESULTS WITH FULL JUSTIFICATION.**

**Remember:** This is a systematic scientific analysis, not guesswork. Show your complete reasoning process.`;
}

/**
 * Format life events for AI analysis
 */
function formatLifeEventsForAI(events: LifeEvent[]): string {
  if (events.length === 0) return "No life events provided.";
  
  const sortedEvents = [...events].sort((a, b) => 
    new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime()
  );
  
  return sortedEvents.map((event, index) => {
    const date = new Date(event.eventDate);
    const formattedDate = date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
    
    return `${index + 1}. **${event.ageAtEvent} years:** ${event.eventType} (${event.category}) - ${formattedDate}
   - Description: ${event.description}
   - Importance: ${event.importance.toUpperCase()}
   - Date Accuracy: ${event.dateAccuracy}`;
  }).join('\n\n');
}

/**
 * Format ephemeris data for AI analysis
 */
function formatEphemerisDataForAI(timeSlots: any[]): string {
  if (timeSlots.length === 0) return "No ephemeris data available.";
  
  return timeSlots.map((slot, index) => {
    const time = new Date(slot.timestamp).toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
    
    return `${index + 1}. **Time: ${time}** (Offset: ${slot.offset} minutes)
   - **Lagna:** ${Math.round(slot.houseCusps.ascendant)}° ${getZodiacSign(slot.houseCusps.ascendant)}
   - **Moon:** ${Math.round(slot.planets.moon)}° ${getZodiacSign(slot.planets.moon)} (${slot.nakshatras.moon})
   - **Sun:** ${Math.round(slot.planets.sun)}° ${getZodiacSign(slot.planets.sun)}
   - **Retrograde:** ${slot.retrogradePlanets.length > 0 ? slot.retrogradePlanets.join(', ') : 'None'}
   - **Lunar Phase:** ${Math.round(slot.lunarPhase)}°`;
  }).join('\n\n');
}

/**
 * Format dasha data for AI analysis
 */
function formatDashaDataForAI(dashaData: DashaData): string {
  return `**Current Vimshottari Dasha:**
- Mahadasha: ${dashaData.vimshottariDasha.currentMahadasha}
- Antardasha: ${dashaData.vimshottariDasha.currentAntardasha}
- Pratyantardasha: ${dashaData.vimshottariDasha.currentPratyantardasha}
- Period: ${dashaData.vimshottariDasha.mahadashaStartDate} to ${dashaData.vimshottariDasha.mahadashaEndDate}

**Event-Dasha Correlations:**
${dashaData.eventDashaCorrelations.map(correlation => 
  `- Event: ${correlation.eventId} → Dasha: ${correlation.applicableDasha} → House: ${correlation.houseActivated}`
).join('\n')}`;
}

/**
 * Analyze events with dasha periods
 */
function analyzeEventsWithDasha(events: LifeEvent[], dashaData: DashaData): string {
  const eventAnalysis = events.map(event => {
    const correlation = dashaData.eventDashaCorrelations.find(c => c.eventId === event.id);
    
    return `**${event.eventType}** (${event.category})
- Date: ${event.eventDate} (Age: ${event.ageAtEvent})
- Expected Houses: ${getExpectedHousesForEvent(event.category)}
- Dasha Correlation: ${correlation ? '✓ VERIFIED' : '⚠ NO DIRECT CORRELATION'}
- Analysis Required: Check if Dasha lord connects to ${getExpectedHousesForEvent(event.category)}`;
  }).join('\n\n');
  
  return eventAnalysis;
}

/**
 * Get expected houses for different event categories
 */
function getExpectedHousesForEvent(category: string): string {
  const houseMap: Record<string, string> = {
    'education': '4th (basic), 5th (higher), 9th (advanced)',
    'career': '10th (profession), 6th (service), 2nd (income)',
    'marriage': '7th (spouse), 2nd (family), 11th (fulfillment)',
    'health': '6th (disease), 8th (chronic), 12th (hospital)',
    'travel': '9th (foreign), 3rd (short), 12th (settlement)',
    'family': '2nd (family), 4th (mother), 9th (father)',
    'finance': '2nd (wealth), 11th (gains), 5th (speculation)',
    'spiritual': '12th (moksha), 9th (dharma), 8th (occult)',
    'other': 'Multiple houses depending on nature'
  };
  
  return houseMap[category] || 'Context dependent';
}

/**
 * Get zodiac sign from degree
 */
function getZodiacSign(degree: number): string {
  const signs = ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 
                 'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'];
  return signs[Math.floor(degree / 30)];
}

/**
 * Analyze dasha correlations
 */
function analyzeDashaCorrelations(dashaData: DashaData, events: LifeEvent[]): string {
  return `**Dasha-Event Correlation Analysis:**
${dashaData.eventDashaCorrelations.map(correlation => {
  const event = events.find(e => e.id === correlation.eventId);
  return `- ${event?.eventType}: House ${correlation.houseActivated} activated by ${correlation.applicableDasha}`;
}).join('\n')}

**Correlation Strength Assessment:**
- Strong correlations: ${dashaData.eventDashaCorrelations.length} events
- Events requiring deeper analysis: ${events.length - dashaData.eventDashaCorrelations.length} events`;
}

/**
 * Get uncertainty range
 */
function getUncertaintyRange(uncertainty: string): string {
  const ranges: Record<string, string> = {
    'exact': '0 minutes',
    '5min': '±5 minutes',
    '15min': '±15 minutes',
    '30min': '±30 minutes',
    '1hour': '±1 hour',
    '2hour': '±2 hours',
    '4hour': '±4 hours',
    'unknown': 'wide range'
  };
  
  return ranges[uncertainty] || '±30 minutes';
}

/**
 * Get expected tattwa
 */
function getExpectedTattwa(gender: string): string {
  return gender === 'female' 
    ? 'Jala (Moon/Venus) or Vayu (Saturn) - feminine tattwas'
    : 'Tejo (Sun/Mars), Akasha (Jupiter), or Prithvi (Mercury) - masculine tattwas';
}

/**
 * Get physical analysis
 */
function getPhysicalAnalysis(value: string, type: string): string {
  const analyses: Record<string, Record<string, string>> = {
    body: {
      'veryThin': 'Air sign influence (Gemini/Libra/Aquarius)',
      'thin': 'Air or Fire sign influence',
      'average': 'Balanced planetary influence',
      'muscular': 'Fire sign influence (Aries/Leo/Sagittarius) + Mars',
      'heavy': 'Earth sign influence (Taurus/Virgo/Capricorn)',
      'veryHeavy': 'Strong Earth influence + Jupiter'
    },
    face: {
      'oval': 'Air signs (Gemini/Libra/Aquarius) or Venus influence',
      'round': 'Water signs (Cancer/Scorpio/Pisces) or Moon influence',
      'square': 'Earth signs (Taurus/Virgo/Capricorn) or Saturn influence',
      'long': 'Fire signs (Aries/Leo/Sagittarius) or Sun influence',
      'heart': 'Venus influence, Libra/Taurus likely',
      'diamond': 'Mixed influences, angular features'
    },
    complexion: {
      'veryFair': 'Moon/Venus influence, water signs likely',
      'fair': 'Moon, Venus, or Jupiter influence',
      'wheatish': 'Mercury or Jupiter influence',
      'medium': 'Balanced planetary influence',
      'dark': 'Saturn or Mars influence',
      'veryDark': 'Strong Saturn influence'
    }
  };
  
  return analyses[type]?.[value] || 'General planetary influence';
}

/**
 * Evaluate time slots
 */
function evaluateTimeSlots(timeSlots: TimeSlotAnalysis[], userData: UserSubmissionData, ephemerisData: SwissEphemerisData, dashaData: DashaData): string {
  if (timeSlots.length === 0) return "No time slot analysis available.";
  
  const topSlots = timeSlots
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, 3);
  
  return `**TOP 3 TIME SLOT RECOMMENDATIONS:**

${topSlots.map((slot, index) => `${index + 1}. **Time: ${new Date(slot.timestamp).toLocaleTimeString('en-GB')}**
   - Confidence: ${slot.confidence}%
   - Key Reasons:
${slot.reasons.map(reason => `     • ${reason}`).join('\n')}`).join('\n\n')}

**Detailed Evaluation Required:**
Each time slot needs systematic verification against all life events, physical features, and advanced methods.`;
}

/**
 * Generate event verification format
 */
function generateEventVerificationFormat(events: LifeEvent[]): string {
  return events.map((event, index) => {
    return `EVENT ${index + 1}: ${event.eventType}
- Date: ${event.eventDate} (Age: ${event.ageAtEvent})
- Dasha Period: [To be calculated]
- Relevant Charts: D-1, D-${getDivisionalChartNumber(event.category)}
- Dasha Lord Connection: [To be analyzed]
- Divisional Chart Analysis: [To be verified]
- Match Quality: [Strong/Moderate/Weak/No Match]
- Explanation: [Detailed reasoning]`;
  }).join('\n\n');
}

/**
 * Get divisional chart number
 */
function getDivisionalChartNumber(category: string): number {
  const chartMap: Record<string, number> = {
    'education': 24,
    'career': 10,
    'marriage': 9,
    'health': 30,
    'travel': 4,
    'family': 12,
    'finance': 2,
    'spiritual': 20,
    'other': 1
  };
  
  return chartMap[category] || 1;
}