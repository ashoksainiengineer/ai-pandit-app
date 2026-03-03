import { formatDMS, formatSignDegree } from './astrology.js';

async function runTests() {
    console.log('🔱 AI-Pandit Heavy Testing: Phase 1 (Mathematical Precision)');
    console.log('---------------------------------------------------------');

    const cases = [
        { input: 15.0, expected: '15° 00\' 00"', label: 'Base Degrees' },
        { input: 15.2345, expected: '15° 14\' 04"', label: 'High Precision DMS' },
        { input: 15.99999, expected: '16° 00\' 00"', label: 'Boundary Rounding' },
        { input: 0, expected: '0° 00\' 00"', label: 'Zero Value' }
    ];

    let passed = 0;
    for (const c of cases) {
        const result = formatDMS(c.input);
        const status = result === c.expected ? '✅ PASS' : '❌ FAIL';
        console.log(`[${status}] ${c.label}: Input(${c.input}) -> Output(${result})`);
        if (result === c.expected) passed++;
    }

    console.log('\n🔱 AI-Pandit Heavy Testing: Phase 2 (Sign-Degree Parsing)');
    console.log('---------------------------------------------------------');

    const signCases = [
        { input: 'Aries 15.2345', expected: 'Aries 15° 14\' 04"', label: 'Standard Sign Degree' },
        { input: 'Leo 23.4567890', expected: 'Leo 23° 27\' 24"', label: 'Deep Decimal Precision' }
    ];

    for (const c of signCases) {
        const result = formatSignDegree(c.input);
        const status = result === c.expected ? '✅ PASS' : '❌ FAIL';
        console.log(`[${status}] ${c.label}: Input(${c.input}) -> Output(${result})`);
        if (result === c.expected) passed++;
    }

    console.log(`\nFinal Result: ${passed}/${cases.length + signCases.length} Tests Passed`);
    process.exit(passed === cases.length + signCases.length ? 0 : 1);
}

runTests().catch(err => {
    console.error('❌ Test Runner Crash:', err);
    process.exit(1);
});
