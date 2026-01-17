"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const memory_manager_js_1 = require("../lib/memory-manager.js");
const ephemeris_js_1 = require("../lib/ephemeris.js");
const router = (0, express_1.Router)();
/**
 * GET /api/health - Health check endpoint
 */
router.get('/', async (req, res) => {
    try {
        const memory = (0, memory_manager_js_1.getMemoryStats)();
        const activeCalcs = (0, memory_manager_js_1.getActiveCalculations)();
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
                mode: (0, ephemeris_js_1.isHighPrecisionMode)() ? 'swiss-ephemeris' : 'algorithmic',
                precision: (0, ephemeris_js_1.isHighPrecisionMode)() ? '0.0001°' : '0.01°',
            },
            queue: {
                activeCalculations: activeCalcs,
                maxConcurrent: 2,
            },
            version: '1.0.0',
        });
    }
    catch (error) {
        console.error('Health check error:', error);
        res.status(500).json({
            status: 'error',
            error: error instanceof Error ? error.message : 'Unknown error',
        });
    }
});
exports.default = router;
//# sourceMappingURL=health.js.map