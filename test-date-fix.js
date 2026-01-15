/**
 * Test script for date validation and BTR flow
 * Run with: node test-date-fix.js
 */

const { createValidDate, safeCreateDate, isValidISODate, isValidTimeString, combineDateTimeToISO } = require('./lib/dateUtils');

console.log('🧪 Testing Date Validation Utilities\n');

// Test 1: Valid date and time
console.log('Test 1: Valid date and time');
const test1 = createValidDate('1990-08-15', '07:30:00');
console.log('Input: date="1990-08-15", time="07:30:00"');
console.log('Result:', test1.isValid ? '✅ PASS' : '❌ FAIL', test1.error || '');
if (test1.date) {
  console.log('Date object:', test1.date.toISOString());
}
console.log('');

// Test 2: Valid date and time (HH:MM format)
console.log('Test 2: Valid date and time (HH:MM format)');
const test2 = createValidDate('1990-08-15', '07:30');
console.log('Input: date="1990-08-15", time="07:30"');
console.log('Result:', test2.isValid ? '✅ PASS' : '❌ FAIL', test2.error || '');
if (test2.date) {
  console.log('Date object:', test2.date.toISOString());
}
console.log('');

// Test 3: Invalid date format
console.log('Test 3: Invalid date format');
const test3 = createValidDate('15-08-1990', '07:30:00');
console.log('Input: date="15-08-1990", time="07:30:00"');
console.log('Result:', !test3.isValid ? '✅ PASS' : '❌ FAIL', 'Should fail with invalid format');
console.log('Error:', test3.error);
console.log('');

// Test 4: Invalid time format
console.log('Test 4: Invalid time format');
const test4 = createValidDate('1990-08-15', '7:30 AM');
console.log('Input: date="1990-08-15", time="7:30 AM"');
console.log('Result:', !test4.isValid ? '✅ PASS' : '❌ FAIL', 'Should fail with invalid format');
console.log('Error:', test4.error);
console.log('');

// Test 5: Missing date
console.log('Test 5: Missing date');
const test5 = createValidDate('', '07:30:00');
console.log('Input: date="", time="07:30:00"');
console.log('Result:', !test5.isValid ? '✅ PASS' : '❌ FAIL', 'Should fail with missing date');
console.log('Error:', test5.error);
console.log('');

// Test 6: Missing time
console.log('Test 6: Missing time');
const test6 = createValidDate('1990-08-15', '');
console.log('Input: date="1990-08-15", time=""');
console.log('Result:', !test6.isValid ? '✅ PASS' : '❌ FAIL', 'Should fail with missing time');
console.log('Error:', test6.error);
console.log('');

// Test 7: Edge case - midnight
console.log('Test 7: Edge case - midnight');
const test7 = createValidDate('1990-08-15', '00:00:00');
console.log('Input: date="1990-08-15", time="00:00:00"');
console.log('Result:', test7.isValid ? '✅ PASS' : '❌ FAIL', test7.error || '');
if (test7.date) {
  console.log('Date object:', test7.date.toISOString());
}
console.log('');

// Test 8: Edge case - end of day
console.log('Test 8: Edge case - end of day');
const test8 = createValidDate('1990-08-15', '23:59:59');
console.log('Input: date="1990-08-15", time="23:59:59"');
console.log('Result:', test8.isValid ? '✅ PASS' : '❌ FAIL', test8.error || '');
if (test8.date) {
  console.log('Date object:', test8.date.toISOString());
}
console.log('');

// Test 9: Invalid year (too old)
console.log('Test 9: Invalid year (too old)');
const test9 = createValidDate('1800-08-15', '07:30:00');
console.log('Input: date="1800-08-15", time="07:30:00"');
console.log('Result:', !test9.isValid ? '✅ PASS' : '❌ FAIL', 'Should fail with year < 1900');
console.log('Error:', test9.error);
console.log('');

// Test 10: Invalid year (future)
console.log('Test 10: Invalid year (future)');
const test10 = createValidDate('2150-08-15', '07:30:00');
console.log('Input: date="2150-08-15", time="07:30:00"');
console.log('Result:', !test10.isValid ? '✅ PASS' : '❌ FAIL', 'Should fail with year > 2100');
console.log('Error:', test10.error);
console.log('');

// Test 11: ISO date validation
console.log('Test 11: ISO date validation');
console.log('Valid ISO date "1990-08-15":', isValidISODate('1990-08-15') ? '✅ PASS' : '❌ FAIL');
console.log('Invalid ISO date "15-08-1990":', !isValidISODate('15-08-1990') ? '✅ PASS' : '❌ FAIL');
console.log('Invalid ISO date "1990/08/15":', !isValidISODate('1990/08/15') ? '✅ PASS' : '❌ FAIL');
console.log('');

// Test 12: Time string validation
console.log('Test 12: Time string validation');
console.log('Valid time "07:30:00":', isValidTimeString('07:30:00') ? '✅ PASS' : '❌ FAIL');
console.log('Valid time "07:30":', isValidTimeString('07:30') ? '✅ PASS' : '❌ FAIL');
console.log('Invalid time "7:30 AM":', !isValidTimeString('7:30 AM') ? '✅ PASS' : '❌ FAIL');
console.log('Invalid time "25:00:00":', !isValidTimeString('25:00:00') ? '✅ PASS' : '❌ FAIL');
console.log('');

// Test 13: Combine date and time to ISO
console.log('Test 13: Combine date and time to ISO');
const test13 = combineDateTimeToISO('1990-08-15', '07:30:00');
console.log('Input: date="1990-08-15", time="07:30:00"');
console.log('Result:', test13 ? '✅ PASS' : '❌ FAIL');
if (test13) {
  console.log('ISO string:', test13);
}
console.log('');

// Test 14: Safe date creation from string
console.log('Test 14: Safe date creation from string');
const test14 = safeCreateDate('1990-08-15T07:30:00.000Z');
console.log('Input: "1990-08-15T07:30:00.000Z"');
console.log('Result:', test14.isValid ? '✅ PASS' : '❌ FAIL', test14.error || '');
if (test14.date) {
  console.log('Date object:', test14.date.toISOString());
}
console.log('');

// Test 15: Safe date creation from Date object
console.log('Test 15: Safe date creation from Date object');
const originalDate = new Date('1990-08-15T07:30:00.000Z');
const test15 = safeCreateDate(originalDate);
console.log('Input: Date object');
console.log('Result:', test15.isValid ? '✅ PASS' : '❌ FAIL', test15.error || '');
if (test15.date) {
  console.log('Date object:', test15.date.toISOString());
}
console.log('');

// Test 16: Safe date creation from invalid string
console.log('Test 16: Safe date creation from invalid string');
const test16 = safeCreateDate('invalid-date');
console.log('Input: "invalid-date"');
console.log('Result:', !test16.isValid ? '✅ PASS' : '❌ FAIL', 'Should fail with invalid date');
console.log('Error:', test16.error);
console.log('');

// Summary
console.log('📊 Test Summary');
console.log('================');

const tests = [
  test1.isValid, test2.isValid, !test3.isValid, !test4.isValid,
  !test5.isValid, !test6.isValid, test7.isValid, test8.isValid,
  !test9.isValid, !test10.isValid, isValidISODate('1990-08-15'),
  !isValidISODate('15-08-1990'), isValidTimeString('07:30:00'),
  !isValidTimeString('7:30 AM'), !!test13, test14.isValid, test15.isValid,
  !test16.isValid
];

const passedTests = tests.filter(t => t).length;
const totalTests = tests.length;

console.log(`Total tests: ${totalTests}`);
console.log(`Passed: ${passedTests}`);
console.log(`Failed: ${totalTests - passedTests}`);
console.log(`Success rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);

if (passedTests === totalTests) {
  console.log('\n🎉 All tests passed!');
} else {
  console.log('\n⚠️  Some tests failed. Please review the errors above.');
}

// Simulate BTR data transformation
console.log('\n🔄 Testing BTR Data Transformation');
console.log('=====================================');

try {
  const mockFormData = {
    birthData: {
      fullName: 'John Doe',
      dateOfBirth: '1990-08-15',
      tentativeTime: '07:30',
      timeUncertainty: '30min',
      birthPlace: 'New Delhi, India',
      latitude: 28.6139,
      longitude: 77.2090,
      timezone: 'UTC+5:30',
      gender: 'male',
      maritalStatus: 'single',
      currentAge: 33
    },
    physicalDescription: {
      bodyStructure: 'average',
      height: 'tall',
      faceShape: 'oval',
      complexion: 'wheatish',
      distinctiveFeatures: ''
    },
    lifeEvents: [
      {
        eventType: 'Marriage',
        eventDate: '2020-06-15',
        importance: 'critical'
      }
    ]
  };

  // Simulate the transformation that happens in the frontend
  const dateTimeISO = combineDateTimeToISO(
    mockFormData.birthData.dateOfBirth,
    mockFormData.birthData.tentativeTime
  );

  if (!dateTimeISO) {
    throw new Error('Failed to combine date and time');
  }

  const transformedData = {
    birthData: {
      ...mockFormData.birthData,
      date: dateTimeISO
    },
    physicalDescription: mockFormData.physicalDescription,
    lifeEvents: mockFormData.lifeEvents
  };

  console.log('✅ BTR data transformation successful');
  console.log('Original date:', mockFormData.birthData.dateOfBirth);
  console.log('Original time:', mockFormData.birthData.tentativeTime);
  console.log('Transformed ISO:', transformedData.birthData.date);
  console.log('');
  console.log('📤 API Request Payload:');
  console.log(JSON.stringify(transformedData, null, 2));

} catch (error) {
  console.error('❌ BTR data transformation failed:', error.message);
}

console.log('\n🏁 Test Complete');