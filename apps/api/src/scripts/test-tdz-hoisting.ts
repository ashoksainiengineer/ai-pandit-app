// test-tdz-hoisting.ts
// This script specifically imports the stages that previously had the TDZ
// 'getMinifiedEphemerisInline' bug to ensure they initialize cleanly.

import '../lib/btr/stages/stage2-batch-tournament.js';
import '../lib/btr/stages/stage4-deep-analysis.js';
import '../lib/btr/stages/stage6-final-precision.js';

console.log("✅ Stage 2 imported successfully without TDZ crash.");
console.log("✅ Stage 4 imported successfully without TDZ crash.");
console.log("✅ Stage 6 imported successfully without TDZ crash.");

console.log("All modules initialized perfectly. The Temporal Dead Zone bug is permanently fixed.");
process.exit(0);
