import { config } from 'dotenv';
config({ path: '/home/ashoksainiengineer/ai-pandit-app/apps/api/.env' });

const { rectifyBirthTime } = await import('/home/ashoksainiengineer/ai-pandit-app/apps/api/dist/lib/btr/orchestrator.js');
const { getCacheStats } = await import('/home/ashoksainiengineer/ai-pandit-app/apps/api/dist/lib/ephemeris.js');

console.log('══════════════════════════════════════════════════════════════════');
console.log('SIMPLIFIED BTR TEST - REAL AI API');
console.log('══════════════════════════════════════════════════════════════════\n');

// Test with minimal events to avoid memory issues
const startTime = Date.now();

try {
  const result = await rectifyBirthTime({
    birthDate: '1990-06-15',
    tentativeTime: '14:30:00',
    latitude: 28.6139,
    longitude: 77.2090,
    timezone: 'Asia/Kolkata',
    timeRangeMinutes: 10, // Small window to save memory
    events: [
      {
        id: 'evt_1',
        type: 'career',
        category: 'career',
        eventDate: new Date('2015-03-10'),
        datePrecision: 'exact_date',
        description: 'Career event',
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
  
  console.log('✅ BTR COMPLETED SUCCESSFULLY');
  console.log('');
  console.log('RESULTS:');
  console.log(`  Duration: ${duration}ms (${(duration/1000).toFixed(1)}s)`);
  console.log(`  Rectified Time: ${result.rectifiedTime}`);
  console.log(`  Original Time: 14:30:00`);
  console.log(`  Confidence: ${result.confidenceLevel}`);
  console.log(`  Margin: ±${result.marginOfErrorSeconds}s`);
  console.log(`  Method: ${result.method || 'N/A'}`);
  console.log(`  Adjusted: ${result.rectifiedTime !== '14:30:00' ? 'YES' : 'NO (tentative was optimal)'}`);
  console.log('');
  console.log('FULL RESULT OBJECT:');
  console.log(JSON.stringify(result, null, 2));
  
} catch (error) {
  console.log('❌ BTR FAILED');
  console.log(`Error: ${error.message}`);
  console.log('');
  console.log('Stack trace:');
  console.log(error.stack);
}

const cacheStats = getCacheStats();
console.log('');
console.log('CACHE STATS:');
console.log(`  Entries: ${cacheStats.totalEntries}`);
console.log(`  Sessions: ${cacheStats.sessionCount}`);
console.log(`  Memory: ~${cacheStats.memoryEstimateMB} MB`);
