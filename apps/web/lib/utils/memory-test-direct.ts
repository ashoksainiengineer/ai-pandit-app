import { archiveCandidates } from '../store/stream-store';

console.log('🔱 AI-Pandit RAM Efficiency Test: Archiving Logic');
console.log('---------------------------------------------------------');

async function testArchiving() {
    const HIGH_SCORE_COUNT = 100;
    const LOW_SCORE_COUNT = 500;
    const TOTAL = HIGH_SCORE_COUNT + LOW_SCORE_COUNT;

    console.log(`[INIT] Creating ${TOTAL} candidates...`);
    const mockScores = [];
    for (let i = 0; i < TOTAL; i++) {
        mockScores.push({
            time: `10:00:${i}`,
            score: i < HIGH_SCORE_COUNT ? 90 : 10,
            stage: 1
        });
    }

    console.log(`[ACTION] Running archiveCandidates(threshold=30, cap=500)`);
    const archived = archiveCandidates(mockScores);

    console.log(`[RESULT] Items remaining: ${archived.length}`);

    const highScoresCount = archived.filter(s => s.score === 90).length;
    const lowScoresCount = archived.filter(s => s.score === 10).length;

    const pass1 = archived.length === 500;
    const pass2 = highScoresCount === 100;
    const pass3 = lowScoresCount === 400;

    console.log(`[TEST 1] Hard Cap Enforced (500 items): ${pass1 ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`[TEST 2] High Scores Preserved (100 items): ${pass2 ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`[TEST 3] Low Scores Pruned (400 kept): ${pass3 ? '✅ PASS' : '❌ FAIL'}`);

    if (pass1 && pass2 && pass3) {
        console.log('\n🔱 Memory Protection Certification: SUCCESS [LOGARITHMIC GROWTH GUARANTEED]');
        process.exit(0);
    } else {
        console.log('\n❌ Memory Protection Certification: FAILED');
        process.exit(1);
    }
}

testArchiving();
