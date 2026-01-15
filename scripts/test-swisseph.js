#!/usr/bin/env node

/**
 * Swiss Ephemeris Test Script
 * Run this directly with Node.js (not through Next.js)
 * 
 * Usage: node scripts/test-swisseph.js
 */

const swisseph = require('swisseph');
const path = require('path');

console.log('🧪 Swiss Ephemeris Test Script\n');
console.log('════════════════════════════════\n');

// Set ephemeris path relative to this script
const ephePath = path.join(__dirname, '../ephe');
console.log(`📁 Ephemeris path: ${ephePath}`);

// Check if ephemeris files exist
const fs = require('fs');
const requiredFiles = ['seas_18.se1', 'semo_18.se1', 'sepl_18.se1'];

console.log('📂 Checking ephemeris files:\n');
let filesOk = true;

requiredFiles.forEach(file => {
  const filePath = path.join(ephePath, file);
  if (fs.existsSync(filePath)) {
    const stats = fs.statSync(filePath);
    console.log(`✅ ${file} - ${(stats.size / 1024).toFixed(0)} KB`);
  } else {
    console.log(`❌ ${file} - NOT FOUND`);
    filesOk = false;
  }
});

if (!filesOk) {
  console.log('\n❌ Some ephemeris files are missing!');
  process.exit(1);
}

console.log('\n🎯 Initializing Swiss Ephemeris...\n');

try {
  // Set ephemeris path
  swisseph.swe_set_ephe_path(ephePath);
  console.log('✅ Ephemeris path set');
  
  // Set Lahiri ayanamsha
  swisseph.swe_set_sid_mode(swisseph.SE_SIDM_LAHIRI, 0, 0);
  console.log('✅ Lahiri ayanamsha applied');
  
} catch (error) {
  console.log('❌ Failed to initialize:', error.message);
  process.exit(1);
}

// Test date: June 16, 1999, 10:00 AM
const testDate = new Date('1999-06-16T10:00:00');
console.log(`\n📅 Test date: ${testDate.toISOString()}`);

// Calculate Julian Day
const jd = swisseph.swe_julday(
  testDate.getUTCFullYear(),
  testDate.getUTCMonth() + 1,
  testDate.getUTCDate(),
  testDate.getUTCHours() + testDate.getUTCMinutes() / 60
);
console.log(`📊 Julian Day: ${jd.toFixed(6)}\n`);

// Test planets
const planets = [
  { name: 'Sun', id: swisseph.SE_SUN },
  { name: 'Moon', id: swisseph.SE_MOON },
  { name: 'Mercury', id: swisseph.SE_MERCURY },
  { name: 'Venus', id: swisseph.SE_VENUS },
  { name: 'Mars', id: swisseph.SE_MARS },
  { name: 'Jupiter', id: swisseph.SE_JUPITER },
  { name: 'Saturn', id: swisseph.SE_SATURN }
];

console.log('🪐 Calculating planetary positions:\n');

let allPassed = true;
const results = {};

planets.forEach(planet => {
  try {
    const result = swisseph.swe_calc_ut(jd, planet.id, swisseph.SEFLG_SPEED | swisseph.SEFLG_SIDEREAL);
    
    if (result.error) {
      console.log(`❌ ${planet.name}: Error - ${result.error}`);
      allPassed = false;
    } else {
      const longitude = result.longitude;
      const sign = Math.floor(longitude / 30);
      const signNames = ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 
                        'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'];
      const signDegree = longitude % 30;
      
      results[planet.name.toLowerCase()] = {
        sign: signNames[sign],
        degree: signDegree.toFixed(2),
        longitude: longitude.toFixed(2)
      };
      
      console.log(`✅ ${planet.name}: ${signDegree.toFixed(2)}° ${signNames[sign]} (${longitude.toFixed(2)}°)`);
    }
  } catch (error) {
    console.log(`❌ ${planet.name}: Exception - ${error.message}`);
    allPassed = false;
  }
});

// Test Rahu/Ketu
try {
  const rahuResult = swisseph.swe_calc_ut(jd, swisseph.SE_TRUE_NODE, swisseph.SEFLG_SPEED | swisseph.SEFLG_SIDEREAL);
  
  if (rahuResult.error) {
    console.log(`❌ Rahu: Error - ${rahuResult.error}`);
    allPassed = false;
  } else {
    const longitude = rahuResult.longitude;
    const sign = Math.floor(longitude / 30);
    const signNames = ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 
                      'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'];
    const signDegree = longitude % 30;
    
    results.rahu = {
      sign: signNames[sign],
      degree: signDegree.toFixed(2),
      longitude: longitude.toFixed(2)
    };
    
    console.log(`✅ Rahu: ${signDegree.toFixed(2)}° ${signNames[sign]} (${longitude.toFixed(2)}°)`);
    
    // Ketu is 180° opposite Rahu
    const ketuLongitude = (longitude + 180) % 360;
    const ketuSign = Math.floor(ketuLongitude / 30);
    const ketuSignDegree = ketuLongitude % 30;
    
    results.ketu = {
      sign: signNames[ketuSign],
      degree: ketuSignDegree.toFixed(2),
      longitude: ketuLongitude.toFixed(2)
    };
    
    console.log(`✅ Ketu: ${ketuSignDegree.toFixed(2)}° ${signNames[ketuSign]} (${ketuLongitude.toFixed(2)}°)`);
  }
} catch (error) {
  console.log(`❌ Rahu/Ketu: Exception - ${error.message}`);
  allPassed = false;
}

console.log('\n🏁 FINAL RESULT:');
console.log('════════════════\n');

if (allPassed) {
  console.log('🎉 SUCCESS! Swiss Ephemeris is working correctly!');
  console.log('✅ All ephemeris files loaded');
  console.log('✅ Planetary calculations working');
  console.log('✅ Lahiri ayanamsha applied');
  console.log('✅ All 9 planets calculated with real positions');
  console.log('\n🎯 Your Birth Time Rectification system is ready!');
  console.log('\n📊 Test Results Summary:');
  console.log(JSON.stringify(results, null, 2));
  process.exit(0);
} else {
  console.log('❌ Some tests failed. Check errors above.');
  process.exit(1);
}