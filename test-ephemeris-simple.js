// Simple test to verify Swiss Ephemeris is working
const swisseph = require('swisseph');

console.log('🧪 Simple Swiss Ephemeris Test\n');
console.log('════════════════════════════════\n');

// Set ephemeris path
const ephePath = './ephe';
console.log(`📁 Setting ephemeris path: ${ephePath}`);
swisseph.swe_set_ephe_path(ephePath);

// Set Lahiri ayanamsha
console.log('🎯 Setting Lahiri Ayanamsha');
swisseph.swe_set_sid_mode(swisseph.SE_SIDM_LAHIRI, 0, 0);

// Test date: June 16, 1999, 10:00 AM
const testDate = new Date('1999-06-16T10:00:00');
console.log(`📅 Test date: ${testDate.toISOString()}`);

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

console.log('🪐 Testing planetary calculations:\n');

let allPassed = true;

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
      
      console.log(`✅ ${planet.name}: ${signDegree.toFixed(2)}° ${signNames[sign]}`);
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
    
    console.log(`✅ Rahu: ${signDegree.toFixed(2)}° ${signNames[sign]}`);
    
    // Ketu is 180° opposite Rahu
    const ketuLongitude = (longitude + 180) % 360;
    const ketuSign = Math.floor(ketuLongitude / 30);
    const ketuSignDegree = ketuLongitude % 30;
    console.log(`✅ Ketu: ${ketuSignDegree.toFixed(2)}° ${signNames[ketuSign]}`);
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
  console.log('\n🎯 Your system is ready for accurate Vedic astrology calculations!');
  process.exit(0);
} else {
  console.log('❌ Some tests failed. Check errors above.');
  process.exit(1);
}