// ═══════════════════════════════════════════════════════════════════════════
// MEMORY MANAGER - Optimized for 512MB RAM (Leapcell)
// Monitors and manages memory usage during BTR calculations
// ═══════════════════════════════════════════════════════════════════════════

interface MemoryStats {
    heapUsed: number;
    heapTotal: number;
    external: number;
    rss: number;
    percentUsed: number;
}

const MB = 1024 * 1024;
const MAX_HEAP = 384 * MB; // Leave 128MB for OS + buffers
const WARNING_THRESHOLD = 0.75; // 75% of max heap
const CRITICAL_THRESHOLD = 0.90; // 90% of max heap

export function getMemoryStats(): MemoryStats {
    const mem = process.memoryUsage();
    return {
        heapUsed: mem.heapUsed,
        heapTotal: mem.heapTotal,
        external: mem.external,
        rss: mem.rss,
        percentUsed: mem.heapUsed / MAX_HEAP
    };
}

export function logMemory(label: string): void {
    const stats = getMemoryStats();
    const heapMB = (stats.heapUsed / MB).toFixed(1);
    const percent = (stats.percentUsed * 100).toFixed(1);

    if (stats.percentUsed > CRITICAL_THRESHOLD) {
        console.error(`🔴 CRITICAL MEMORY [${label}]: ${heapMB}MB (${percent}%)`);
    } else if (stats.percentUsed > WARNING_THRESHOLD) {
        console.warn(`🟡 HIGH MEMORY [${label}]: ${heapMB}MB (${percent}%)`);
    } else {
        console.log(`🟢 Memory [${label}]: ${heapMB}MB (${percent}%)`);
    }
}

export function checkMemory(): boolean {
    const stats = getMemoryStats();
    return stats.percentUsed < CRITICAL_THRESHOLD;
}

export function triggerGC(): void {
    if (global.gc) {
        global.gc();
        console.log('🧹 Garbage collection triggered');
    }
}

export async function withMemoryCheck<T>(
    label: string,
    fn: () => Promise<T>
): Promise<T> {
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

// Queue memory management
let activeCalculations = 0;
const MAX_CONCURRENT = 2; // Max 2 concurrent BTR calculations

export async function withConcurrencyLimit<T>(
    fn: () => Promise<T>
): Promise<T> {
    while (activeCalculations >= MAX_CONCURRENT) {
        await new Promise(resolve => setTimeout(resolve, 1000));
    }

    activeCalculations++;
    try {
        return await fn();
    } finally {
        activeCalculations--;
    }
}

export function getActiveCalculations(): number {
    return activeCalculations;
}
