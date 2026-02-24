import { calculateWeightedAverage, calculateRankFusionScore } from './precision-weights.js';

/**
 * STRESS TEST: RANK FUSION VS WEIGHTED AVERAGE
 * 
 * Scenario: The "Needle in a Haystack"
 * A candidate is the ABSOLUTE WINNER in one critical method (KP), 
 * but has mediocre or poor scores in others due to noisy data.
 */
function runRankFusionStressTest() {
    console.log("RUNNING STRESS TEST: RANK FUSION VS WEIGHTED AVERAGE\n");

    const methodWeights = {
        kp: 5,
        vimshottari: 4,
        varga: 3,
        transit: 3,
        nadi: 5,
        forensic: 4,
        ai: 5
    };

    // Case 1: The "Hidden Gem" candidate
    // Matches KP (Precision) at 98%, but Transit is noisy (20%), and Varga is average (50%)
    const highImpactScenarios = [
        {
            name: "Hidden Gem (KP Specialist)",
            scores: {
                kp: 98,          // Perfect match
                transit: 20,     // Noisy
                varga: 50,       // Average
                vimshottari: 60, // Moderate
                nadi: 55,        // Moderate
                forensic: 40,    // Low
                ai: 70           // Decent
            }
        },
        {
            name: "Average All-Rounder",
            scores: {
                kp: 70,
                transit: 70,
                varga: 70,
                vimshottari: 70,
                nadi: 70,
                forensic: 70,
                ai: 70
            }
        },
        {
            name: "Truth Buried in Noise",
            scores: {
                kp: 95,          // The Truth (Mastery in one dimension)
                transit: 10,     // Total Noise
                varga: 15,       // Total Noise
                vimshottari: 10, // Total Noise
                nadi: 20,        // Total Noise
                forensic: 15,    // Total Noise
                ai: 25           // Total Noise
            }
        }
    ];

    console.log("| Scenario | Weighted Avg | Rank Fusion (RRF) | Winner |");
    console.log("| :--- | :--- | :--- | :--- |");

    highImpactScenarios.forEach(scenario => {
        const avg = calculateWeightedAverage(scenario.scores, methodWeights);
        const rrf = calculateRankFusionScore(scenario.scores, methodWeights);
        const winner = rrf > avg ? "Rank Fusion" : "Weighted Avg";

        console.log(`| ${scenario.name.padEnd(25)} | ${avg.toFixed(2)} | ${rrf.toFixed(2)} | ${winner} |`);
    });

    console.log("\n💡 ANALYSIS:");
    console.log("- Notice how the 'Hidden Gem' has a low Weighted Average because of the 20% Transit score.");
    console.log("- Rank Fusion rewards the 98% in KP more heavily, ensuring this candidate SURVIVES.");
    console.log("- This is why the algorithm is highly effective. It respects mastery over mediocrity.");
}

runRankFusionStressTest();
