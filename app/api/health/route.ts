export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { getMemoryStats, getActiveCalculations } from '@/lib/memory-manager';
import { isHighPrecisionMode } from '@/lib/ephemeris';

export async function GET() {
    const memory = getMemoryStats();
    const activeCalcs = getActiveCalculations();

    const status = memory.percentUsed < 0.9 ? 'healthy' : 'degraded';

    return NextResponse.json({
        status,
        timestamp: new Date().toISOString(),
        memory: {
            heapUsed: `${(memory.heapUsed / 1024 / 1024).toFixed(1)}MB`,
            heapTotal: `${(memory.heapTotal / 1024 / 1024).toFixed(1)}MB`,
            percentUsed: `${(memory.percentUsed * 100).toFixed(1)}%`,
            rss: `${(memory.rss / 1024 / 1024).toFixed(1)}MB`
        },
        ephemeris: {
            mode: isHighPrecisionMode() ? 'swiss-ephemeris' : 'algorithmic',
            precision: isHighPrecisionMode() ? '0.0001°' : '0.01°'
        },
        queue: {
            activeCalculations: activeCalcs,
            maxConcurrent: 2
        },
        version: '1.0.0'
    });
}
