// ═══════════════════════════════════════════════════════════════════════════
// RESOURCE MANAGER - Optimized for Scalable AI Infrastructure
// Monitors and manages memory usage during BTR calculations
// ═══════════════════════════════════════════════════════════════════════════

import { config } from '../config/index.js';
import { logger } from '../utils/logger.js';
import { ProcessingError } from '../errors/index.js';

interface MemoryStats {
    heapUsed: number;
    heapTotal: number;
    external: number;
    rss: number;
    percentUsed: number;
}

const MB = 1024 * 1024;
const GB = 1024 * MB;
const memoryConfig = {
    heapThresholdGB: config.memory?.heapThresholdGB ?? 12,
    pressureThresholdGB: config.memory?.pressureThresholdGB ?? 10,
    criticalThresholdGB: config.memory?.criticalThresholdGB ?? 11,
    gcThresholdGB: config.memory?.gcThresholdGB ?? 10,
};
const queueConfig = {
    maxConcurrent: config.queue?.maxConcurrent ?? 3,
};
const MAX_HEAP = memoryConfig.heapThresholdGB * GB;
const WARNING_THRESHOLD = memoryConfig.pressureThresholdGB / memoryConfig.heapThresholdGB;
const CRITICAL_THRESHOLD = memoryConfig.criticalThresholdGB / memoryConfig.heapThresholdGB;

export interface MemoryPressureSnapshot {
    heapUsedGB: number;
    heapTotalGB: number;
    rssGB: number;
    rssThresholdGB: number;
    heapThresholdGB: number;
    isUnderPressure: boolean;
}

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
        logger.error(`🔴 CRITICAL MEMORY [${label}]`, { heapMB, percent });
    } else if (stats.percentUsed > WARNING_THRESHOLD) {
        logger.warn(`🟡 HIGH MEMORY [${label}]`, { heapMB, percent });
    } else {
        logger.debug(`🟢 Memory [${label}]`, { heapMB, percent });
    }
}

export function checkMemory(): boolean {
    const pressure = getMemoryPressureSnapshot();
    return !pressure.isUnderPressure;
}

export function triggerGC(): void {
    if (global.gc) {
        global.gc();
        logger.info('🧹 Garbage collection triggered');
    }
}

export function getMemoryPressureSnapshot(): MemoryPressureSnapshot {
    const memory = process.memoryUsage();
    const heapUsedGB = memory.heapUsed / GB;
    const heapTotalGB = memory.heapTotal / GB;
    const rssGB = memory.rss / GB;
    const rssThresholdGB = memoryConfig.gcThresholdGB;
    const heapThresholdGB = memoryConfig.heapThresholdGB;

    return {
        heapUsedGB,
        heapTotalGB,
        rssGB,
        rssThresholdGB,
        heapThresholdGB,
        isUnderPressure: rssGB > rssThresholdGB || heapUsedGB > heapThresholdGB,
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
            throw new ProcessingError(`Memory limit exceeded before ${label}`);
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
const MAX_CONCURRENT = queueConfig.maxConcurrent;

export async function withConcurrencyLimit<T>(
    fn: () => Promise<T>
): Promise<T> {
    // BUG-FIX: Use atomic check-increment to prevent race condition
    // While this isn't truly atomic in JS, the await point makes concurrent access possible
    // Add a small random jitter to reduce contention
    while (activeCalculations >= MAX_CONCURRENT) {
        await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 500));
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
