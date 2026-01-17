import { Router, Request, Response } from 'express';
import { getMemoryStats, getActiveCalculations } from '../lib/memory-manager.js';
import { isHighPrecisionMode } from '../lib/ephemeris.js';

const router = Router();

/**
 * GET /api/health - Health check endpoint
 */
router.get('/', async (req: Request, res: Response) => {
    try {
        const memory = getMemoryStats();
        const activeCalcs = getActiveCalculations();

        const status = memory.percentUsed < 0.9 ? 'healthy' : 'degraded';

        res.json({
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
        console.error('Health check error:', error);
        res.status(500).json({
            status: 'error',
            error: error instanceof Error ? error.message : 'Unknown error',
        });
    }
});

export default router;
