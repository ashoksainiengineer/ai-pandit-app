import { executeSecondsPrecisionRectification } from './src/lib/seconds-precision-btr.js';

const input = {
  sessionId: 'test-session-123',
  jobId: 'test-job-123',
  dateOfBirth: '1990-01-01',
  tentativeTime: '12:00:00',
  latitude: 19.076,
  longitude: 72.877,
  timezone: 5.5,
  lifeEvents: [
    { date: '2010-06-15', event: 'Graduated college', category: 'education' },
    { date: '2015-03-20', event: 'Started first job', category: 'career' }
  ],
  offsetConfig: { preset: '2hours' },
  abortSignal: null
};

console.log('=== STARTING BTR ANALYSIS ===');
console.log('Model:', process.env.AI_MODEL);
console.log('Base URL:', process.env.AI_BASE_URL);
console.log('Ephemeris URL:', process.env.EPHEMERIS_SERVICE_URL);
console.log('');

executeSecondsPrecisionRectification(input).then(result => {
  console.log('=== ANALYSIS COMPLETE ===');
  console.log('Rectified Time:', result.rectifiedTime);
  console.log('Accuracy:', result.accuracy);
  console.log('Confidence:', result.confidence);
  console.log('Stages Completed:', result.stagesCompleted);
  console.log('Processing Time:', result.processingTimeMs, 'ms');
}).catch(error => {
  console.error('=== ANALYSIS FAILED ===');
  console.error('Error:', error.message);
  console.error('Stack:', error.stack);
});
