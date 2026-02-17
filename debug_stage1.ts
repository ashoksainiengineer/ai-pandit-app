
import { generateCandidateTimes, injectSafetyNetCandidates } from './backend/src/lib/time-offset-manager';

const tentativeTime = "10:14:00";
const offsetConfig = {
    preset: "custom",
    customMinutes: 15, // From debug_encryption.ts
    description: "±15 min"
};

console.log("Testing time-offset-manager...");

try {
    const raw = generateCandidateTimes(tentativeTime, offsetConfig as any);
    console.log(`✅ Generated ${raw.length} raw candidates`);
    console.log("First:", raw[0]);
    console.log("Last:", raw[raw.length - 1]);

    const safety = injectSafetyNetCandidates(tentativeTime, raw);
    console.log(`✅ Injected safety net: ${safety.length} candidates`);

    // Check for NaNs or invalid times
    const invalid = safety.filter(c => c.time.includes("NaN") || c.time.includes("undefined"));
    if (invalid.length > 0) {
        console.error("❌ Found invalid candidates:", invalid);
    } else {
        console.log("✅ All candidates look valid string-wise");
    }

} catch (e) {
    console.error("❌ Crashed:", e);
}
