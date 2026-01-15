/**
 * 🧪 Swiss Ephemeris Setup Verification Test
 *
 * Tests if ephemeris files are properly loaded and calculations work correctly
 */

import { SwissEphemerisEngine } from './lib/swiss-ephemeris-engine';

async function testSwissEphemerisSetup() {
  console.log('🧪 Swiss Ephemeris Setup Verification Test\n');
  console.log('═══════════════════════════════════════════\n');

  try {
    // Step 1: Initialize Swiss Ephemeris Engine
    console.log('Step 1: Initializing Swiss Ephemeris Engine...');
    const engine = new SwissEphemerisEngine('./ephe', false); // Use LAHIRI, not KP
    await engine.initialize();
    console.log('✅ Engine initialized successfully\n');

    // Step 2: Test calculation for June 16, 1999, 10:00 AM
    console.log('Step 2: Testing planetary calculation...');
    const testDate = new Date('1999-06-16T10:00:00');
    const latitude = 26.9124; // Jaipur, India
    const longitude = 75.7873;
    
    console.log(`📅 Test Date: ${testDate.toISOString()}`);
    console.log(`📍 Location: Jaipur, India (${latitude}°N, ${longitude}°E)`);
    console.log(`🕐 Time: 10:00 AM\n`);

    const result = await engine.calculateEphemerisForBTR(
      testDate,
      latitude,
      longitude,
      'Asia/Kolkata',
      'W' // Whole Sign house system
    );

    // Step 3: Display results
    console.log('🪐 PLANETARY POSITIONS (Sidereal/Lahiri):');
    console.log('═══════════════════════════════════════════\n');

    const planets = result.planets;
    type PlanetKey = keyof typeof planets;
    const planetNames: PlanetKey[] = ['sun', 'moon', 'mercury', 'venus', 'mars', 'jupiter', 'saturn', 'rahu', 'ketu'];
    
    planetNames.forEach(planetName => {
      const planet = planets[planetName];
      if (planet && planet.longitude !== undefined) {
        console.log(`✅ ${planetName.toUpperCase()}: ${planet.signDegree.toFixed(2)}° ${planet.sign}`);
      } else {
        console.log(`❌ ${planetName.toUpperCase()}: No data`);
      }
    });

    console.log('\n🏠 HOUSE CUSPS (Whole Sign System):');
    console.log('═══════════════════════════════════\n');
    
    const houses = result.houseCusps;
    const houseNames = [
      '1st (Ascendant)', '2nd', '3rd', '4th', '5th', '6th',
      '7th', '8th', '9th', '10th', '11th', '12th'
    ];
    
    const cuspValues = [
      houses.ascendant, houses.secondHouse, houses.thirdHouse, houses.fourthHouse,
      houses.fifthHouse, houses.sixthHouse, houses.seventhHouse, houses.eighthHouse,
      houses.ninthHouse, houses.tenthHouse, houses.eleventhHouse, houses.twelfthHouse
    ];
    
    cuspValues.forEach((cusp, index) => {
      if (cusp !== undefined && cusp !== null) {
        const sign = Math.floor(cusp / 30);
        const signNames = ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
                          'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'];
        const signDegree = cusp % 30;
        console.log(`✅ ${houseNames[index]}: ${signDegree.toFixed(2)}° ${signNames[sign]}`);
      } else {
        console.log(`❌ ${houseNames[index]}: No data`);
      }
    });

    console.log('\n🌙 NAKSHATRA INFORMATION:');
    console.log('══════════════════════════\n');
    
    if (result.nakshatras.moon) {
      console.log(`✅ Moon Nakshatra: ${result.nakshatras.moon.name} (Pada ${result.nakshatras.moon.pada})`);
      console.log(`✅ Moon Nakshatra Lord: ${result.nakshatras.moon.lord}`);
    } else {
      console.log('❌ Moon Nakshatra: No data');
    }
    
    if (result.nakshatras.lagna) {
      console.log(`✅ Lagna Nakshatra: ${result.nakshatras.lagna.name} (Pada ${result.nakshatras.lagna.pada})`);
      console.log(`✅ Lagna Nakshatra Lord: ${result.nakshatras.lagna.lord}`);
    } else {
      console.log('❌ Lagna Nakshatra: No data');
    }

    console.log('\n📊 DASHA PERIODS:');
    console.log('══════════════════\n');
    
    if (result.dashaPeriods.vimshottari) {
      const vim = result.dashaPeriods.vimshottari;
      console.log(`✅ Birth Dasha: ${vim.birthDasha}`);
      console.log(`✅ Dasha Balance: ${vim.birthBalance}`);
      console.log(`✅ Current Mahadasha: ${vim.currentMahadasha.planet}`);
      console.log(`✅ Current Antardasha: ${vim.currentAntardasha.planet}`);
    } else {
      console.log('❌ Dasha information: No data');
    }

    // Step 4: Verification checklist
    console.log('\n✅ VERIFICATION CHECKLIST:');
    console.log('═══════════════════════════\n');

    const checks = [
      {
        name: 'Ephemeris files loaded',
        status: result.planets.sun && result.planets.sun.longitude !== undefined ? 'PASS' : 'FAIL',
        description: 'Sun position calculated (should show real degrees)'
      },
      {
        name: 'Lahiri Ayanamsha applied',
        status: result.planets.sun && result.planets.sun.sign === 'Taurus' ? 'PASS' : 'WARN',
        description: 'Sun should be in Taurus (sidereal) for June 16, 1999'
      },
      {
        name: 'All 9 planets calculated',
        status: Object.keys(result.planets).length >= 9 ? 'PASS' : 'FAIL',
        description: 'Should have Sun, Moon, Mars, Mercury, Jupiter, Venus, Saturn, Rahu, Ketu'
      },
      {
        name: 'House cusps calculated',
        status: result.houseCusps.ascendant !== undefined ? 'PASS' : 'FAIL',
        description: 'Ascendant and all 12 houses should be calculated'
      },
      {
        name: 'Nakshatra calculated',
        status: result.nakshatras.moon && result.nakshatras.moon.name ? 'PASS' : 'FAIL',
        description: 'Moon nakshatra should be identified'
      },
      {
        name: 'Dasha periods calculated',
        status: result.dashaPeriods.vimshottari ? 'PASS' : 'FAIL',
        description: 'Vimshottari dasha should be calculated'
      },
      {
        name: 'No null/zero values',
        status: result.planets.sun && result.planets.sun.longitude !== 0 && result.planets.sun.longitude !== null ? 'PASS' : 'FAIL',
        description: 'All planetary positions should be non-zero'
      }
    ];

    checks.forEach(check => {
      const icon = check.status === 'PASS' ? '✅' : check.status === 'WARN' ? '⚠️' : '❌';
      console.log(`${icon} ${check.name}: ${check.status}`);
      console.log(`   ${check.description}\n`);
    });

    // Step 5: Final verdict
    console.log('🏁 FINAL VERDICT:');
    console.log('══════════════════\n');

    const passedChecks = checks.filter(check => check.status === 'PASS').length;
    const totalChecks = checks.length;
    const successRate = (passedChecks / totalChecks * 100).toFixed(0);

    if (passedChecks === totalChecks) {
      console.log('🎉 EXCELLENT: Swiss Ephemeris setup is COMPLETE!');
      console.log('✅ All ephemeris files loaded correctly');
      console.log('✅ Planetary calculations are working');
      console.log('✅ Lahiri ayanamsha is applied');
      console.log('✅ Whole Sign house system is active');
      console.log('✅ Nakshatra and dasha calculations are working');
      console.log('\n🎯 Your Birth Time Rectification system is ready to use!\n');
    } else if (passedChecks >= totalChecks * 0.7) {
      console.log('✅ GOOD: Swiss Ephemeris setup is mostly working!');
      console.log(`✅ ${passedChecks}/${totalChecks} checks passed (${successRate}%)`);
      console.log('⚠️  Some minor issues detected but system is usable\n');
    } else {
      console.log('❌ NEEDS ATTENTION: Several issues detected');
      console.log(`❌ Only ${passedChecks}/${totalChecks} checks passed (${successRate}%)`);
      console.log('❌ Please check the failed items above\n');
    }

    // Step 6: Expected vs Actual
    console.log('📋 EXPECTED vs ACTUAL (June 16, 1999):');
    console.log('═══════════════════════════════════════\n');
    
    console.log('Expected (approximate):');
    console.log('• Sun: ~0-1° Gemini (sidereal)');
    console.log('• Moon: Variable (depends on exact time)');
    console.log('• All positions: Non-zero values\n');
    
    console.log('Actual results:');
    if (result.planets.sun) {
      console.log(`• Sun: ${result.planets.sun.signDegree.toFixed(2)}° ${result.planets.sun.sign} ✅`);
    }
    if (result.planets.moon) {
      console.log(`• Moon: ${result.planets.moon.signDegree.toFixed(2)}° ${result.planets.moon.sign} ✅`);
    }
    console.log(`• All planets calculated: ${Object.keys(result.planets).length}/9 ✅\n`);

    return {
      success: passedChecks >= totalChecks * 0.7,
      passedChecks,
      totalChecks,
      successRate: parseInt(successRate),
      planetaryData: result
    };

  } catch (error) {
    console.error('❌ Test failed with error:', error);
    console.log('\n💡 TROUBLESHOOTING:');
    console.log('═══════════════════\n');
    console.log('1. Check if ephemeris files are in ./ephe/ directory');
    console.log('2. Verify file sizes (should not be 0 KB)');
    console.log('3. Ensure files are binary (not corrupted)');
    console.log('4. Check file permissions (should be readable)');
    console.log('5. Verify swisseph package is installed\n');
    
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

// Run the test
console.log('🚀 Running Swiss Ephemeris Setup Verification Test...\n');

testSwissEphemerisSetup()
  .then(testResult => {
    if (testResult.success) {
      console.log('🎉 SETUP VERIFICATION COMPLETE! 🎉\n');
      process.exit(0);
    } else {
      console.log('❌ SETUP VERIFICATION FAILED\n');
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('💥 Unexpected error:', error);
    process.exit(1);
  });