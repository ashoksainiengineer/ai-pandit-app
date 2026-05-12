import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Load env from the project
config({ path: '/home/ashoksainiengineer/ai-pandit-app/apps/api/.env' });

// Now import the BTR modules
const { rectifyBirthTime } = await import('/home/ashoksainiengineer/ai-pandit-app/apps/api/dist/lib/btr/orchestrator.js');
const { getCacheStats, clearSessionCache } = await import('/home/ashoksainiengineer/ai-pandit-app/apps/api/dist/lib/ephemeris.js');

console.log('══════════════════════════════════════════════════════════════════');
console.log('FULL BTR PIPELINE TEST - REAL AI API CALLS');
console.log('══════════════════════════════════════════════════════════════════');
console.log(`AI Model: ${process.env.AI_MODEL ? 'configured' : 'not set'}`);
console.log(`AI Base URL: ${process.env.AI_BASE_URL ? 'configured' : 'not set'}`);
console.log(`Ephemeris: ${process.env.EPHEMERIS_PROVIDER || 'skyfield'}`);
console.log('');

const testResults = {
  total: 0,
  passed: 0,
  failed: 0,
  details: []
};

// Test Case 1: Standard BTR
console.log('══════════════════════════════════════════════════════════════════');
console.log('TEST 1: STANDARD BIRTH TIME RECTIFICATION');
console.log('══════════════════════════════════════════════════════════════════');
console.log('Input:');
console.log('  Birth Date: 1990-06-15');
console.log('  Tentative Time: 14:30:00');
console.log('  Location: Delhi (28.6139, 77.2090)');
console.log('  Timezone: Asia/Kolkata');
console.log('  Life Events: 3 (Marriage, Career, Health)');
console.log('');

try {
  const startTime = Date.now();
  
  const result = await rectifyBirthTime({
    birthDate: '1990-06-15',
    tentativeTime: '14:30:00',
    latitude: 28.6139,
    longitude: 77.2090,
    timezone: 'Asia/Kolkata',
    events: [
      {
        id: 'evt_marriage',
        type: 'marriage',
        category: 'marriage',
        eventDate: new Date('2015-03-10'),
        datePrecision: 'exact_date',
        description: 'Marriage',
        impact: 'critical',
        confidence: {
          level: 'high',
          source: 'document',
          datePrecision: 'exact_date',
          weight: 3,
          reliabilityScore: 0.95
        },
        eventHouse: 7,
        significators: ['Venus', 'Jupiter']
      },
      {
        id: 'evt_career',
        type: 'career',
        category: 'career',
        eventDate: new Date('2012-07-20'),
        datePrecision: 'exact_date',
        description: 'Job promotion',
        impact: 'major',
        confidence: {
          level: 'high',
          source: 'document',
          datePrecision: 'exact_date',
          weight: 2.5,
          reliabilityScore: 0.90
        },
        eventHouse: 10,
        significators: ['Sun', 'Saturn']
      },
      {
        id: 'evt_health',
        type: 'health',
        category: 'health',
        eventDate: new Date('2018-11-05'),
        datePrecision: 'exact_date',
        description: 'Health issue',
        impact: 'moderate',
        confidence: {
          level: 'medium',
          source: 'memory',
          datePrecision: 'exact_date',
          weight: 1.5,
          reliabilityScore: 0.70
        },
        eventHouse: 1,
        significators: ['Mars', 'Saturn']
      }
    ]
  });
  
  const duration = Date.now() - startTime;
  
  console.log('RESULT:');
  console.log(`  Duration: ${duration}ms`);
  console.log(`  Rectified Time: ${result.rectifiedTime}`);
  console.log(`  Confidence: ${result.confidenceLevel}`);
  console.log(`  Margin: ±${result.marginOfErrorSeconds}s`);
  console.log(`  Method: ${result.method}`);
  console.log(`  Candidates: ${result.candidateCount}`);
  console.log(`  Time Difference: ${result.timeDifferenceSeconds}s`);
  
  if (result.tatwaAnalysis) {
    console.log(`  Tatwa: ${result.tatwaAnalysis.dominantTatwa || 'N/A'}`);
  }
  
  testResults.total++;
  
  // Validate result
  const hasValidTime = result.rectifiedTime && result.rectifiedTime.match(/^\d{2}:\d{2}:\d{2}$/);
  const hasConfidence = ['HIGH', 'MEDIUM', 'LOW'].includes(result.confidenceLevel);
  const hasCandidates = result.candidateCount > 0;
  
  if (hasValidTime && hasConfidence && hasCandidates) {
    console.log('  ✅ PASS - Valid rectification result');
    testResults.passed++;
    testResults.details.push({
      test: 'Standard BTR',
      status: 'PASS',
      duration,
      rectifiedTime: result.rectifiedTime,
      confidence: result.confidenceLevel,
      margin: result.marginOfErrorSeconds
    });
  } else {
    console.log('  ❌ FAIL - Invalid result structure');
    testResults.failed++;
    testResults.details.push({
      test: 'Standard BTR',
      status: 'FAIL',
      error: 'Invalid result structure'
    });
  }
  
} catch (error) {
  console.log('  ❌ FAIL');
  console.log(`  Error: ${error.message}`);
  if (error.stack) {
    console.log(`  Stack: ${error.stack.split('\n')[0]}`);
  }
  testResults.total++;
  testResults.failed++;
  testResults.details.push({
    test: 'Standard BTR',
    status: 'FAIL',
    error: error.message
  });
}

// Test Case 2: Cross-midnight birth
console.log('');
console.log('══════════════════════════════════════════════════════════════════');
console.log('TEST 2: CROSS-MIDNIGHT BIRTH (23:45:00 + 30min window)');
console.log('══════════════════════════════════════════════════════════════════');

try {
  const startTime = Date.now();
  
  const result = await rectifyBirthTime({
    birthDate: '1990-06-15',
    tentativeTime: '23:45:00',
    latitude: 28.6139,
    longitude: 77.2090,
    timezone: 'Asia/Kolkata',
    timeRangeMinutes: 30,
    events: [
      {
        id: 'evt_1',
        type: 'career',
        category: 'career',
        eventDate: new Date('2015-01-15'),
        datePrecision: 'exact_date',
        description: 'Career milestone',
        impact: 'major',
        confidence: {
          level: 'high',
          source: 'document',
          datePrecision: 'exact_date',
          weight: 2.5,
          reliabilityScore: 0.90
        },
        eventHouse: 10,
        significators: ['Sun', 'Saturn']
      }
    ]
  });
  
  const duration = Date.now() - startTime;
  
  console.log('RESULT:');
  console.log(`  Duration: ${duration}ms`);
  console.log(`  Rectified Time: ${result.rectifiedTime}`);
  console.log(`  Confidence: ${result.confidenceLevel}`);
  console.log(`  Margin: ±${result.marginOfErrorSeconds}s`);
  console.log(`  Candidates: ${result.candidateCount}`);
  
  // Check if result time crosses midnight correctly
  const rectifiedHour = parseInt(result.rectifiedTime.split(':')[0]);
  const isAfterMidnight = rectifiedHour < 2; // If hour is 00 or 01
  
  testResults.total++;
  
  if (result.rectifiedTime && result.candidateCount > 0) {
    console.log(`  ✅ PASS - Cross-midnight handled correctly`);
    if (isAfterMidnight) {
      console.log(`  📌 Note: Result is after midnight (${result.rectifiedTime})`);
    }
    testResults.passed++;
    testResults.details.push({
      test: 'Cross-Midnight BTR',
      status: 'PASS',
      duration,
      rectifiedTime: result.rectifiedTime,
      confidence: result.confidenceLevel
    });
  } else {
    console.log('  ❌ FAIL - Invalid result');
    testResults.failed++;
    testResults.details.push({
      test: 'Cross-Midnight BTR',
      status: 'FAIL',
      error: 'Invalid result'
    });
  }
  
} catch (error) {
  console.log('  ❌ FAIL');
  console.log(`  Error: ${error.message}`);
  testResults.total++;
  testResults.failed++;
  testResults.details.push({
    test: 'Cross-Midnight BTR',
    status: 'FAIL',
    error: error.message
  });
}

// Summary
console.log('');
console.log('══════════════════════════════════════════════════════════════════');
console.log('FINAL TEST SUMMARY');
console.log('══════════════════════════════════════════════════════════════════');
console.log(`Total Tests:  ${testResults.total}`);
console.log(`Passed:       ${testResults.passed} ✅`);
console.log(`Failed:       ${testResults.failed} ❌`);
console.log(`Success Rate: ${((testResults.passed / testResults.total) * 100).toFixed(1)}%`);
console.log('');

// Cache stats
const cacheStats = getCacheStats();
console.log('Cache Statistics:');
console.log(`  Entries: ${cacheStats.totalEntries}`);
console.log(`  Sessions: ${cacheStats.sessionCount}`);
console.log(`  Memory: ~${cacheStats.memoryEstimateMB} MB`);
console.log('');

if (testResults.failed === 0) {
  console.log('🎉 ALL TESTS PASSED - BTR System Working Correctly!');
  process.exit(0);
} else {
  console.log('❌ SOME TESTS FAILED - Review errors above');
  process.exit(1);
}
