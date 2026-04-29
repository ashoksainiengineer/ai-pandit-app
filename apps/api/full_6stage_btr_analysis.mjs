import { config } from 'dotenv';
config({ path: '/home/ashoksainiengineer/ai-pandit-app/apps/api/.env' });

import { processSecondsPrecisionBTR } from '/home/ashoksainiengineer/ai-pandit-app/apps/api/dist/lib/seconds-precision-btr.js';
import { getCacheStats } from '/home/ashoksainiengineer/ai-pandit-app/apps/api/dist/lib/ephemeris.js';
import fs from 'fs';

const sessionId = `full_btr_analysis_${Date.now()}`;
const logFile = `/tmp/full_btr_stage_analysis_${Date.now()}.log`;

function log(message, data = null) {
  const timestamp = new Date().toISOString();
  const logEntry = data 
    ? `[${timestamp}] ${message}\n${JSON.stringify(data, null, 2)}\n`
    : `[${timestamp}] ${message}\n`;
  
  console.log(logEntry);
  fs.appendFileSync(logFile, logEntry);
}

console.log('══════════════════════════════════════════════════════════════════');
console.log('FULL 6-STAGE BTR ANALYSIS - Complete Logging');
console.log('══════════════════════════════════════════════════════════════════');
console.log(`Session ID: ${sessionId}`);
console.log(`Log File: ${logFile}`);
console.log(`Window: ±30 minutes`);
console.log(`Test Start: ${new Date().toISOString()}`);
console.log('');

// Correct input format for SecondsPrecisionInput
const testInput = {
  sessionId,
  dateOfBirth: '1990-06-15',
  tentativeTime: '14:30:00',
  latitude: 28.6139,
  longitude: 77.2090,
  timezone: 'Asia/Kolkata',
  offsetConfig: {
    preset: '30min',
    description: '±30 minutes window'
  },
  lifeEvents: [
    // ========== CAREER/BUSINESS (10th House) ==========
    {
      id: 'evt_career_2012',
      eventType: 'career',
      category: 'career',
      eventDate: '2012-07-15',
      datePrecision: 'exact_date',
      description: 'First job appointment letter received',
      importance: 'critical',
      significators: ['Sun', 'Saturn', '10th House Lord']
    },
    {
      id: 'evt_career_2015_promo',
      eventType: 'career',
      category: 'career',
      eventDate: '2015-03-10',
      datePrecision: 'exact_date',
      description: 'Major promotion to managerial position',
      importance: 'critical',
      significators: ['Sun', 'Jupiter', '10th House']
    },
    {
      id: 'evt_career_2017_job_change',
      eventType: 'career',
      category: 'career',
      eventDate: '2017-08-22',
      datePrecision: 'exact_date',
      description: 'Job change to multinational company',
      importance: 'high',
      significators: ['Saturn', 'Rahu', '10th House']
    },
    {
      id: 'evt_career_2019_award',
      eventType: 'career',
      category: 'career',
      eventDate: '2019-12-05',
      datePrecision: 'exact_date',
      description: 'Received industry excellence award',
      importance: 'high',
      significators: ['Sun', 'Venus']
    },
    {
      id: 'evt_career_2021_startup',
      eventType: 'career',
      category: 'career',
      eventDate: '2021-04-18',
      datePrecision: 'exact_date',
      description: 'Started own business venture',
      importance: 'critical',
      significators: ['Sun', 'Mars', 'Jupiter']
    },
    {
      id: 'evt_career_2023_expansion',
      eventType: 'career',
      category: 'career',
      eventDate: '2023-09-30',
      datePrecision: 'exact_date',
      description: 'Business expansion to international markets',
      importance: 'high',
      significators: ['Jupiter', 'Rahu']
    },

    // ========== MARRIAGE/PARTNERSHIP (7th House) ==========
    {
      id: 'evt_marriage_engagement',
      eventType: 'marriage',
      category: 'marriage',
      eventDate: '2017-12-10',
      datePrecision: 'exact_date',
      description: 'Engagement ceremony',
      importance: 'high',
      significators: ['Venus', 'Jupiter', '7th House Lord']
    },
    {
      id: 'evt_marriage_wedding',
      eventType: 'marriage',
      category: 'marriage',
      eventDate: '2018-05-15',
      datePrecision: 'exact_date',
      description: 'Marriage ceremony (wedding day)',
      importance: 'critical',
      significators: ['Venus', 'Jupiter', '7th House']
    },
    {
      id: 'evt_partnership_2020',
      eventType: 'career',
      category: 'partnership',
      eventDate: '2020-11-20',
      datePrecision: 'exact_date',
      description: 'Business partnership formed',
      importance: 'high',
      significators: ['Mercury', 'Venus', '7th House']
    },

    // ========== CHILDREN/FAMILY (5th House) ==========
    {
      id: 'evt_child_birth_1',
      eventType: 'family',
      category: 'children',
      eventDate: '2019-08-25',
      datePrecision: 'exact_date',
      description: 'First child born (son)',
      importance: 'critical',
      significators: ['Jupiter', 'Venus', '5th House Lord']
    },
    {
      id: 'evt_child_birth_2',
      eventType: 'family',
      category: 'children',
      eventDate: '2022-03-12',
      datePrecision: 'exact_date',
      description: 'Second child born (daughter)',
      importance: 'critical',
      significators: ['Jupiter', 'Moon', '5th House']
    },
    {
      id: 'evt_family_father_demise',
      eventType: 'family',
      category: 'death',
      eventDate: '2014-11-08',
      datePrecision: 'exact_date',
      description: 'Father passed away',
      importance: 'critical',
      significators: ['Sun', 'Saturn', '9th House']
    },

    // ========== EDUCATION (4th & 9th House) ==========
    {
      id: 'evt_edu_10th',
      eventType: 'education',
      category: 'education',
      eventDate: '2006-05-20',
      datePrecision: 'exact_date',
      description: '10th standard board exams passed',
      importance: 'high',
      significators: ['Mercury', 'Jupiter', '4th House']
    },
    {
      id: 'evt_edu_12th',
      eventType: 'education',
      category: 'education',
      eventDate: '2008-05-15',
      datePrecision: 'exact_date',
      description: '12th standard board exams passed',
      importance: 'high',
      significators: ['Mercury', 'Jupiter']
    },
    {
      id: 'evt_edu_graduation',
      eventType: 'education',
      category: 'education',
      eventDate: '2012-06-30',
      datePrecision: 'exact_date',
      description: 'Graduation degree completed (B.Tech)',
      importance: 'high',
      significators: ['Jupiter', 'Mercury', '9th House']
    },
    {
      id: 'evt_edu_postgrad',
      eventType: 'education',
      category: 'education',
      eventDate: '2014-06-25',
      datePrecision: 'exact_date',
      description: 'Post-graduation completed (MBA)',
      importance: 'high',
      significators: ['Jupiter', 'Mercury', '9th House']
    },

    // ========== HEALTH/MEDICAL (1st & 6th House) ==========
    {
      id: 'evt_health_2016_surgery',
      eventType: 'health',
      category: 'health',
      eventDate: '2016-09-14',
      datePrecision: 'exact_date',
      description: 'Major surgery (appendix)',
      importance: 'critical',
      significators: ['Mars', 'Saturn', '6th House Lord']
    },
    {
      id: 'evt_health_2020_accident',
      eventType: 'health',
      category: 'health',
      eventDate: '2020-02-18',
      datePrecision: 'exact_date',
      description: 'Road accident and hospitalization',
      importance: 'critical',
      significators: ['Mars', 'Saturn', 'Rahu', '8th House']
    },
    {
      id: 'evt_health_2021_covid',
      eventType: 'health',
      category: 'health',
      eventDate: '2021-05-10',
      datePrecision: 'exact_date',
      description: 'COVID-19 infection and recovery',
      importance: 'high',
      significators: ['Saturn', 'Ketu', '6th House']
    },

    // ========== PROPERTY/VEHICLES (4th House) ==========
    {
      id: 'evt_property_2016_first_home',
      eventType: 'property',
      category: 'property',
      eventDate: '2016-12-20',
      datePrecision: 'exact_date',
      description: 'First home purchased',
      importance: 'high',
      significators: ['Mars', 'Saturn', 'Venus', '4th House']
    },
    {
      id: 'evt_vehicle_2013_first_car',
      eventType: 'vehicle',
      category: 'vehicle',
      eventDate: '2013-10-05',
      datePrecision: 'exact_date',
      description: 'First car purchased',
      importance: 'medium',
      significators: ['Venus', 'Mars']
    },
    {
      id: 'evt_property_2022_second_home',
      eventType: 'property',
      category: 'property',
      eventDate: '2022-07-30',
      datePrecision: 'exact_date',
      description: 'Second property investment',
      importance: 'high',
      significators: ['Mars', 'Jupiter', '4th House']
    },

    // ========== TRAVEL/FOREIGN (9th & 12th House) ==========
    {
      id: 'evt_travel_2015_first_abroad',
      eventType: 'travel',
      category: 'foreign_travel',
      eventDate: '2015-06-15',
      datePrecision: 'exact_date',
      description: 'First foreign trip (USA)',
      importance: 'high',
      significators: ['Rahu', 'Ketu', '9th House', '12th House']
    },
    {
      id: 'evt_travel_2018_relocation',
      eventType: 'travel',
      category: 'relocation',
      eventDate: '2018-01-10',
      datePrecision: 'exact_date',
      description: 'Relocated to different city for job',
      importance: 'high',
      significators: ['Rahu', 'Saturn', '4th House']
    },
    {
      id: 'evt_travel_2023_foreign_settle',
      eventType: 'travel',
      category: 'foreign_settlement',
      eventDate: '2023-02-28',
      datePrecision: 'exact_date',
      description: 'Temporary foreign assignment (6 months)',
      importance: 'high',
      significators: ['Rahu', '12th House Lord']
    },

    // ========== FINANCIAL/WEALTH (2nd & 11th House) ==========
    {
      id: 'evt_finance_2017_big_loss',
      eventType: 'finance',
      category: 'financial_loss',
      eventDate: '2017-03-08',
      datePrecision: 'exact_date',
      description: 'Major financial loss in stocks',
      importance: 'high',
      significators: ['Rahu', 'Saturn', '8th House', '12th House']
    },
    {
      id: 'evt_finance_2020_inheritance',
      eventType: 'finance',
      category: 'inheritance',
      eventDate: '2020-08-15',
      datePrecision: 'exact_date',
      description: 'Received ancestral property share',
      importance: 'high',
      significators: ['Saturn', '8th House Lord']
    },
    {
      id: 'evt_finance_2024_big_gain',
      eventType: 'finance',
      category: 'financial_gain',
      eventDate: '2024-01-20',
      datePrecision: 'exact_date',
      description: 'Major investment returns/profit',
      importance: 'high',
      significators: ['Jupiter', 'Venus', '11th House']
    },

    // ========== LEGAL/DISPUTES (6th House) ==========
    {
      id: 'evt_legal_2019_case',
      eventType: 'legal',
      category: 'court_case',
      eventDate: '2019-04-12',
      datePrecision: 'exact_date',
      description: 'Legal dispute filed',
      importance: 'high',
      significators: ['Saturn', 'Mars', '6th House']
    },
    {
      id: 'evt_legal_2021_resolution',
      eventType: 'legal',
      category: 'court_resolution',
      eventDate: '2021-09-05',
      datePrecision: 'exact_date',
      description: 'Legal case resolved in favor',
      importance: 'high',
      significators: ['Jupiter', 'Mercury', '6th House Lord']
    },

    // ========== SPIRITUAL/RELIGIOUS (9th & 12th House) ==========
    {
      id: 'evt_spiritual_2018_pilgrimage',
      eventType: 'spiritual',
      category: 'pilgrimage',
      eventDate: '2018-02-20',
      datePrecision: 'exact_date',
      description: 'Major pilgrimage to religious place',
      importance: 'medium',
      significators: ['Jupiter', '9th House', '12th House']
    },
    {
      id: 'evt_spiritual_2024_initiation',
      eventType: 'spiritual',
      category: 'spiritual_initiation',
      eventDate: '2024-03-15',
      datePrecision: 'exact_date',
      description: 'Spiritual initiation/mantra diksha',
      importance: 'medium',
      significators: ['Jupiter', 'Ketu', '9th House']
    }
  ],
  forensicTraits: {
    dominantElement: 'earth',
    prakriti: {
      vata: 20,
      pitta: 40,
      kapha: 40,
      dominant: 'pitta-kapha'
    }
  }
};

// Progress tracking
let progressInterval;
let currentStage = 'INITIALIZING';
let stageProgress = 0;
let stageStartTime = Date.now();

// Progress updater - runs every 20 seconds
function startProgressTracking() {
  const startTime = Date.now();
  
  progressInterval = setInterval(() => {
    const elapsed = Math.floor((Date.now() - startTime) / 1000);
    const elapsedMin = Math.floor(elapsed / 60);
    const elapsedSec = elapsed % 60;
    
    console.log('\n' + '═'.repeat(70));
    console.log(`📊 LIVE STATUS UPDATE [${elapsedMin}m ${elapsedSec}s elapsed]`);
    console.log('═'.repeat(70));
    console.log(`🎯 Current Stage: ${currentStage}`);
    console.log(`📈 Stage Progress: ${stageProgress}%`);
    console.log(`⏱️  Stage Time: ${Math.floor((Date.now() - stageStartTime) / 1000)}s`);
    
    // Memory usage
    const memUsage = process.memoryUsage();
    console.log(`💾 Memory: ${(memUsage.heapUsed / 1024 / 1024).toFixed(1)} MB / ${(memUsage.heapTotal / 1024 / 1024).toFixed(1)} MB`);
    
    // Cache stats if available
    try {
      const cacheStats = getCacheStats();
      console.log(`🗄️  Cache: ${cacheStats.totalEntries} entries, ~${cacheStats.memoryEstimateMB} MB`);
    } catch (e) {
      console.log(`🗄️  Cache: unavailable`);
    }
    
    console.log('═'.repeat(70) + '\n');
    
    // Also log to file
    log(`PROGRESS UPDATE - Stage: ${currentStage}, Progress: ${stageProgress}%, Time: ${elapsedMin}m ${elapsedSec}s`);
    
  }, 20000); // Every 20 seconds
}

function stopProgressTracking() {
  if (progressInterval) {
    clearInterval(progressInterval);
    progressInterval = null;
  }
}

function updateStage(stageName, progress = 0) {
  currentStage = stageName;
  stageProgress = progress;
  stageStartTime = Date.now();
  
  console.log('\n' + '🔄'.repeat(35));
  console.log(`🚀 ENTERING STAGE: ${stageName}`);
  console.log('🔄'.repeat(35) + '\n');
  
  log(`STAGE START: ${stageName}`);
}

async function runFullBTR() {
  try {
    log('BTR ANALYSIS START');
    log('Input Configuration', {
      birthDate: testInput.dateOfBirth,
      tentativeTime: testInput.tentativeTime,
      offsetConfig: testInput.offsetConfig,
      totalEvents: testInput.lifeEvents.length,
      eventBreakdown: {
        career: testInput.lifeEvents.filter(e => e.category === 'career').length,
        marriage: testInput.lifeEvents.filter(e => e.category === 'marriage').length,
        health: testInput.lifeEvents.filter(e => e.category === 'health').length,
        education: testInput.lifeEvents.filter(e => e.category === 'education').length,
        property: testInput.lifeEvents.filter(e => e.category === 'property').length,
        children: testInput.lifeEvents.filter(e => e.category === 'children').length,
        travel: testInput.lifeEvents.filter(e => e.category === 'foreign_travel' || e.category === 'relocation').length,
        finance: testInput.lifeEvents.filter(e => e.category?.includes('financial')).length,
        legal: testInput.lifeEvents.filter(e => e.category?.includes('court')).length,
        spiritual: testInput.lifeEvents.filter(e => e.category === 'pilgrimage' || e.category === 'spiritual_initiation').length
      }
    });

    // Start progress tracking
    startProgressTracking();
    
    const startTime = Date.now();
    log('Starting processSecondsPrecisionBTR...');
    
    // Simulate stage tracking (the actual orchestrator will handle stages internally)
    updateStage('STAGE 1: INITIAL_SCAN', 0);
    
    const result = await processSecondsPrecisionBTR(testInput);
    
    const totalDuration = Date.now() - startTime;
    
    // Stop progress tracking
    stopProgressTracking();
    
    log('BTR ANALYSIS COMPLETE');
    log('Total Duration', {
      seconds: (totalDuration / 1000).toFixed(2),
      minutes: (totalDuration / 60000).toFixed(2),
      hours: (totalDuration / 3600000).toFixed(2)
    });
    
    log('Final Result', {
      rectifiedTime: result.rectifiedTime,
      confidence: result.confidence,
      accuracy: result.accuracy,
      status: result.status,
      totalEvents: testInput.lifeEvents.length
    });
    
    // Print final leaderboard
    console.log('\n' + '🏆'.repeat(35));
    console.log('🏆 FINAL BTR RESULTS - 35 HIGH-QUALITY EVENTS');
    console.log('🏆'.repeat(35));
    console.log(`🎯 Original Time: ${testInput.tentativeTime}`);
    console.log(`✨ Rectified Time: ${result.rectifiedTime}`);
    console.log(`📊 Confidence: ${result.confidence || 'N/A'}`);
    console.log(`⏱️  Total Time: ${(totalDuration / 60000).toFixed(2)} minutes`);
    console.log(`🗓️  Events Processed: ${testInput.lifeEvents.length}`);
    console.log('🏆'.repeat(35) + '\n');
    
    return result;
    
  } catch (error) {
    // Stop progress tracking on error
    stopProgressTracking();
    
    log('ERROR - BTR Failed', {
      message: error.message,
      stack: error.stack
    });
    
    console.log('\n' + '❌'.repeat(35));
    console.log('❌ BTR ANALYSIS FAILED');
    console.log('❌'.repeat(35));
    console.log(`Error: ${error.message}`);
    console.log('❌'.repeat(35) + '\n');
    
    throw error;
  }
}

runFullBTR().then(() => {
  console.log('\n✅ Analysis complete!');
  process.exit(0);
}).catch(error => {
  console.error('\n❌ Analysis failed:', error.message);
  process.exit(1);
});
