"use strict";
// ═══════════════════════════════════════════════════════════════════════════
// RESOURCE MANAGER - Optimized for Scalable AI Infrastructure
// Monitors and manages memory usage during BTR calculations
// ═══════════════════════════════════════════════════════════════════════════
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMemoryStats = getMemoryStats;
exports.logMemory = logMemory;
exports.checkMemory = checkMemory;
exports.triggerGC = triggerGC;
exports.withMemoryCheck = withMemoryCheck;
exports.withConcurrencyLimit = withConcurrencyLimit;
exports.getActiveCalculations = getActiveCalculations;
const MB = 1024 * 1024;
const MAX_HEAP = 1024 * MB; // 1GB - High-Performance AI baseline
const WARNING_THRESHOLD = 0.80; // 80% of max heap
const CRITICAL_THRESHOLD = 0.95; // 95% of max heap
function getMemoryStats() {
    const mem = process.memoryUsage();
    return {
        heapUsed: mem.heapUsed,
        heapTotal: mem.heapTotal,
        external: mem.external,
        rss: mem.rss,
        percentUsed: mem.heapUsed / MAX_HEAP
    };
}
function logMemory(label) {
    const stats = getMemoryStats();
    const heapMB = (stats.heapUsed / MB).toFixed(1);
    const percent = (stats.percentUsed * 100).toFixed(1);
    if (stats.percentUsed > CRITICAL_THRESHOLD) {
        console.error(`🔴 CRITICAL MEMORY [${label}]: ${heapMB}MB (${percent}%)`);
    }
    else if (stats.percentUsed > WARNING_THRESHOLD) {
        console.warn(`🟡 HIGH MEMORY [${label}]: ${heapMB}MB (${percent}%)`);
    }
    else {
        console.log(`🟢 Memory [${label}]: ${heapMB}MB (${percent}%)`);
    }
}
function checkMemory() {
    const stats = getMemoryStats();
    return stats.percentUsed < CRITICAL_THRESHOLD;
}
function triggerGC() {
    if (global.gc) {
        global.gc();
        console.log('🧹 Garbage collection triggered');
    }
}
async function withMemoryCheck(label, fn) {
    logMemory(`Before ${label}`);
    if (!checkMemory()) {
        triggerGC();
        if (!checkMemory()) {
            throw new Error(`Memory limit exceeded before ${label}`);
        }
    }
    const result = await fn();
    // Clean up after operation
    if (global.gc && getMemoryStats().percentUsed > WARNING_THRESHOLD) {
        triggerGC();
    }
    logMemory(`After ${label}`);
    return result;
}
// Queue resource management
let activeCalculations = 0;
const MAX_CONCURRENT = 4; // Scaled for high-performance infrastructure
async function withConcurrencyLimit(fn) {
    while (activeCalculations >= MAX_CONCURRENT) {
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
    activeCalculations++;
    try {
        return await fn();
    }
    finally {
        activeCalculations--;
    }
}
function getActiveCalculations() {
    return activeCalculations;
}
//# sourceMappingURL=memory-manager.js.map