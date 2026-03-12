/**
 * Health Check Endpoint
 * Provides detailed system health information
 * Uses Node.js runtime for memory/process stats
 */

import { NextResponse } from 'next/server';
import { getMemoryStats, getActiveCalculations } from '@/lib/memory-manager';
import { isHighPrecisionMode } from '@/lib/ephemeris';
import { getBuildPhaseRouteResponse } from '@/lib/server/build-phase-route-guard';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  memory: {
    heapUsed: string;
    heapTotal: string;
    percentUsed: string;
    rss: string;
  };
  ephemeris: {
    mode: string;
    precision: string;
  };
  queue: {
    activeCalculations: number;
    maxConcurrent: number;
  };
  version: string;
}

export async function GET(): Promise<NextResponse<HealthStatus>> {
  const buildPhaseResponse = getBuildPhaseRouteResponse();
  if (buildPhaseResponse) return buildPhaseResponse as NextResponse<HealthStatus>;

  try {
    const memory = getMemoryStats();
    const activeCalcs = getActiveCalculations();

    const status: HealthStatus['status'] = memory.percentUsed < 0.9 ? 'healthy' : 'degraded';

    return NextResponse.json({
      status,
      timestamp: new Date().toISOString(),
      memory: {
        heapUsed: `${(memory.heapUsed / 1024 / 1024).toFixed(1)}MB`,
        heapTotal: `${(memory.heapTotal / 1024 / 1024).toFixed(1)}MB`,
        percentUsed: `${(memory.percentUsed * 100).toFixed(1)}%`,
        rss: `${(memory.rss / 1024 / 1024).toFixed(1)}MB`,
      },
      ephemeris: {
        mode: isHighPrecisionMode() ? 'swiss-ephemeris' : 'algorithmic',
        precision: isHighPrecisionMode() ? '0.0001°' : '0.01°',
      },
      queue: {
        activeCalculations: activeCalcs,
        maxConcurrent: 2,
      },
      version: '1.0.0',
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        memory: {
          heapUsed: '0MB',
          heapTotal: '0MB',
          percentUsed: '0%',
          rss: '0MB',
        },
        ephemeris: {
          mode: 'unknown',
          precision: 'unknown',
        },
        queue: {
          activeCalculations: 0,
          maxConcurrent: 2,
        },
        version: '1.0.0',
      },
      { status: 503 }
    );
  }
}
