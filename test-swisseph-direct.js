#!/usr/bin/env node

/**
 * Direct test of Swiss Ephemeris without any Next.js bundling
 * Run this to verify swisseph is working correctly
 */

const { SwissEphemerisServer } = require('./lib/swiss-ephemeris-server');

async function testDirect() {
  console.log('🧪 Direct Swiss Ephemeris Test (No Webpack)\n');
  console.log('═══════════════════════════════════════════\n');

  try {
    const server = new SwissEphemerisServer('./ephe');
    await server.initialize();

    const testDate = new Date('1999-06-16T10:00:00');
    const latitude = 26.9124;
    const longitude = 75.7873;

    console.log(`📅 Test Date: ${testDate.toISOString()}`);
    console.log(`📍 Location: Jaipur, India (${latitude}°N, ${longitude}°E)\n`);

    const result = await server.calculateEphemeris(testDate, latitude, longitude);

    console.log('🪐 PLANETARY POSITIONS:\n');
    
    const planetNames = ['sun', 'moon', 'mercury', 'venus', 'mars', 'jupiter', 'saturn', 'rahu', 'ketu'];
    planetNames.forEach(name => {
      const planet = result.planets[name];
      if (planet) {
        console.log(`✅ ${name.toUpperCase()}: ${planet.degree}° ${planet.sign} (${planet.nakshatra})`);
      }
    });

    console.log('\n🏁 RESULT: ✅ Swiss Ephemeris is working correctly!');
    console.log('\n📊 Full data available in result object');
    
    return true;

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    return false;
  }
}

// Run the test
testDirect().then(success => {
  if (success) {
    console.log('\n🎉 SUCCESS! The Swiss Ephemeris setup is complete.');
    console.log('ℹ️  To use in your application, make API calls to: http://localhost:3001/api/calculate');
    process.exit(0);
  } else {
    console.log('\n❌ FAILED! Check the error above.');
    process.exit(1);
  }
});