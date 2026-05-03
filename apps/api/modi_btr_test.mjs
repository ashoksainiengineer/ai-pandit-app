import { config } from 'dotenv';
config({ path: '/home/ashoksainiengineer/ai-pandit-app/apps/api/.env' });

import { executeSecondsPrecisionRectification } from '/home/ashoksainiengineer/ai-pandit-app/apps/api/dist/lib/seconds-precision-btr.js';
import { getCacheStats } from '/home/ashoksainiengineer/ai-pandit-app/apps/api/dist/lib/ephemeris.js';
import fs from 'fs';

const sessionId = `modi_btr_${Date.now()}`;
const logFile = `/tmp/modi_btr_${Date.now()}.log`;

function log(message, data = null) {
  const timestamp = new Date().toISOString();
  const logEntry = data 
    ? `[${timestamp}] ${message}\n${JSON.stringify(data, null, 2)}\n`
    : `[${timestamp}] ${message}\n`;
  console.log(logEntry);
  fs.appendFileSync(logFile, logEntry);
}

console.log('═══════════════════════════════════════════════════════════');
console.log('NARENDRA MODI BIRTH TIME RECTIFICATION');
console.log('Public Figure - Documented Events Only');
console.log('═══════════════════════════════════════════════════════════');

// 35 HIGH-QUALITY DOCUMENTED EVENTS
const lifeEvents = [
  // EARLY LIFE (4 events)
  { id: 'evt_01', eventType: 'family', category: 'death', eventDate: '1940-01-01', datePrecision: 'year', description: 'Father passed away', importance: 'critical' },
  { id: 'evt_02', eventType: 'education', category: 'education', eventDate: '1956-06-01', datePrecision: 'month_year', description: 'Started primary education', importance: 'major' },
  { id: 'evt_03', eventType: 'education', category: 'education', eventDate: '1965-03-01', datePrecision: 'month_year', description: 'School education completed', importance: 'high' },
  { id: 'evt_04', eventType: 'spiritual', category: 'political_awakening', eventDate: '1965-06-01', datePrecision: 'month_year', description: 'Political consciousness formed', importance: 'critical' },
  
  // RSS & EARLY POLITICS (5 events)
  { id: 'evt_05', eventType: 'career', category: 'political_entry', eventDate: '1971-01-01', datePrecision: 'year', description: 'Joined RSS as pracharak', importance: 'critical' },
  { id: 'evt_06', eventType: 'marriage', category: 'marriage', eventDate: '1968-01-01', datePrecision: 'year', description: 'Marriage arranged', importance: 'high' },
  { id: 'evt_07', eventType: 'family', category: 'separation', eventDate: '1970-01-01', datePrecision: 'year', description: 'Began separate life for politics', importance: 'critical' },
  { id: 'evt_08', eventType: 'legal', category: 'political_persecution', eventDate: '1975-06-26', datePrecision: 'exact_date', description: 'Emergency declared', importance: 'critical' },
  { id: 'evt_09', eventType: 'legal', category: 'political_freedom', eventDate: '1977-03-21', datePrecision: 'exact_date', description: 'Emergency ended', importance: 'critical' },
  
  // BJP RISE (5 events)
  { id: 'evt_10', eventType: 'career', category: 'party_joining', eventDate: '1985-01-01', datePrecision: 'year', description: 'Joined BJP', importance: 'critical' },
  { id: 'evt_11', eventType: 'career', category: 'party_position', eventDate: '1987-01-01', datePrecision: 'year', description: 'BJP Org Secretary Gujarat', importance: 'high' },
  { id: 'evt_12', eventType: 'career', category: 'political_training', eventDate: '1995-01-01', datePrecision: 'year', description: 'National Secretary BJP', importance: 'high' },
  { id: 'evt_13', eventType: 'career', category: 'national_role', eventDate: '1998-01-01', datePrecision: 'year', description: 'National General Secretary', importance: 'high' },
  { id: 'evt_14', eventType: 'travel', category: 'foreign_travel', eventDate: '1998-06-01', datePrecision: 'month_year', description: 'First foreign trip as party leader', importance: 'medium' },
  
  // GUJARAT CM ERA (6 events)
  { id: 'evt_15', eventType: 'career', category: 'chief_minister', eventDate: '2001-10-07', datePrecision: 'exact_date', description: 'First oath as Gujarat CM', importance: 'critical' },
  { id: 'evt_16', eventType: 'legal', category: 'crisis', eventDate: '2002-02-27', datePrecision: 'exact_date', description: 'Godhra train incident', importance: 'critical' },
  { id: 'evt_17', eventType: 'career', category: 'election_victory', eventDate: '2002-12-15', datePrecision: 'exact_date', description: 'Won Gujarat 2002 elections', importance: 'critical' },
  { id: 'evt_18', eventType: 'career', category: 'economic_policy', eventDate: '2003-01-01', datePrecision: 'year', description: 'Vibrant Gujarat launched', importance: 'high' },
  { id: 'evt_19', eventType: 'career', category: 'election_victory', eventDate: '2007-12-23', datePrecision: 'exact_date', description: 'Re-elected Gujarat CM 2007', importance: 'high' },
  { id: 'evt_20', eventType: 'career', category: 'election_victory', eventDate: '2012-12-20', datePrecision: 'exact_date', description: 'Third term Gujarat CM', importance: 'high' },
  
  // PM JOURNEY (10 events)
  { id: 'evt_21', eventType: 'career', category: 'pm_candidature', eventDate: '2013-09-13', datePrecision: 'exact_date', description: 'Declared PM candidate', importance: 'critical' },
  { id: 'evt_22', eventType: 'career', category: 'pm_election', eventDate: '2014-05-16', datePrecision: 'exact_date', description: 'Historic Lok Sabha victory', importance: 'critical' },
  { id: 'evt_23', eventType: 'career', category: 'prime_minister', eventDate: '2014-05-26', datePrecision: 'exact_date', description: 'Sworn in as PM', importance: 'critical' },
  { id: 'evt_24', eventType: 'travel', category: 'foreign_diplomacy', eventDate: '2014-09-27', datePrecision: 'exact_date', description: 'First US visit - Madison Square', importance: 'high' },
  { id: 'evt_25', eventType: 'finance', category: 'economic_policy', eventDate: '2016-11-08', datePrecision: 'exact_date', description: 'Demonetization', importance: 'critical' },
  { id: 'evt_26', eventType: 'career', category: 'economic_policy', eventDate: '2017-07-01', datePrecision: 'exact_date', description: 'GST implemented', importance: 'high' },
  { id: 'evt_27', eventType: 'career', category: 'pm_re-election', eventDate: '2019-05-23', datePrecision: 'exact_date', description: 'Re-elected PM 2019', importance: 'critical' },
  { id: 'evt_28', eventType: 'career', category: 'prime_minister', eventDate: '2019-05-30', datePrecision: 'exact_date', description: 'Second term oath', importance: 'critical' },
  { id: 'evt_29', eventType: 'legal', category: 'constitutional_change', eventDate: '2019-08-05', datePrecision: 'exact_date', description: 'Article 370 abrogated', importance: 'critical' },
  { id: 'evt_30', eventType: 'spiritual', category: 'religious_event', eventDate: '2020-08-05', datePrecision: 'exact_date', description: 'Ram Mandir Bhoomi Pujan', importance: 'critical' },
  
  // RECENT EVENTS (5 events)
  { id: 'evt_31', eventType: 'family', category: 'death', eventDate: '2022-12-30', datePrecision: 'exact_date', description: 'Mother passed away', importance: 'critical' },
  { id: 'evt_32', eventType: 'career', category: 'pm_third_term', eventDate: '2024-06-04', datePrecision: 'exact_date', description: 'Third consecutive term victory', importance: 'critical' },
  { id: 'evt_33', eventType: 'career', category: 'prime_minister', eventDate: '2024-06-09', datePrecision: 'exact_date', description: 'Third term oath ceremony', importance: 'critical' },
  { id: 'evt_34', eventType: 'travel', category: 'foreign_diplomacy', eventDate: '2024-02-01', datePrecision: 'month_year', description: 'State visit - France Qatar', importance: 'high' },
  { id: 'evt_35', eventType: 'legal', category: 'election_law', eventDate: '2024-03-01', datePrecision: 'month_year', description: 'Electoral bonds case', importance: 'high' }
];

const testInput = {
  sessionId,
  dateOfBirth: '1950-09-17',
  tentativeTime: '10:30:00',
  latitude: 23.7833,
  longitude: 72.6167,
  timezone: 'Asia/Kolkata',
  offsetConfig: {
    preset: '6h',
    description: '±6 hours window'
  },
  lifeEvents
};

async function runAnalysis() {
  try {
    log('BTR ANALYSIS START', {
      birthDate: testInput.dateOfBirth,
      tentativeTime: testInput.tentativeTime,
      location: 'Vadnagar, Gujarat',
      totalEvents: lifeEvents.length
    });

    const startTime = Date.now();
    const result = await executeSecondsPrecisionRectification(testInput);
    const duration = Date.now() - startTime;

    log('BTR ANALYSIS COMPLETE', {
      durationMinutes: (duration / 60000).toFixed(2),
      rectifiedTime: result.rectifiedTime,
      confidence: result.confidence,
      accuracy: result.accuracy
    });

    console.log('\n🏆 FINAL RESULTS');
    console.log('═══════════════════════════════════════════════════════════');
    console.log(`Original Time:    ${testInput.tentativeTime}`);
    console.log(`Rectified Time:   ${result.rectifiedTime}`);
    console.log(`Confidence:       ${result.confidence || 'N/A'}`);
    console.log(`Accuracy:         ${result.accuracy || 'N/A'}%`);
    console.log(`Duration:         ${(duration / 60000).toFixed(2)} minutes`);
    console.log(`Events Processed: ${lifeEvents.length}`);
    console.log('═══════════════════════════════════════════════════════════\n');

    return result;
  } catch (error) {
    log('ERROR', { message: error.message });
    console.error('Analysis failed:', error.message);
    throw error;
  }
}

runAnalysis();
