/**
 * 🔱 AI-Pandit BTR Engine - Server Entry Point
 * ===========================================
 * Production-grade Express server with robust middleware,
 * error handling, and performance monitoring.
 */

import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { createServer } from 'http';
import { config } from './config/index.js';
import { routes } from './routes/index.js';
import { logger } from './utils/logger.js';
import { requestIdMiddleware } from './middleware/request-id.js';
import { errorHandlerMiddleware, notFoundHandler, setupUncaughtExceptionHandlers } from './middleware/error-handler-new.js';
import { initSwissEph } from './lib/ephemeris.js';

// ═════════════════════════════════════════════════════════════════════════════
// APP FACTORY
// ═════════════════════════════════════════════════════════════════════════════

export function createApp() {
    const app = express();

    // ═══════════════════════════════════════════════════════════════════════════
    // SECURITY & BASIS MIDDLEWARE
    // ═══════════════════════════════════════════════════════════════════════════

    app.set('trust proxy', 1); // Essential for HF Spaces / Vercel

    app.use(helmet({
        contentSecurityPolicy: false, // Disabled for internal UI/Admin if needed
        crossOriginResourcePolicy: { policy: "cross-origin" }
    }));

    app.use(cors({
        origin: config.app.allowedOrigins === '*' ? '*' : config.app.allowedOrigins?.split(','),
        credentials: true,
        maxAge: 86400, // Pre-flight cache
    }));

    app.use(express.json({ limit: '10mb' }));
    app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Tracing & Logging
    app.use(requestIdMiddleware());
    app.use(morgan(':method :url :status :res[content-length] - :response-time ms', {
        stream: { write: (message) => logger.http(message.trim()) },
        skip: (req) => req.path === '/health' || req.path === '/ready'
    }));

    // ═══════════════════════════════════════════════════════════════════════════
    // ROUTES
    // ═══════════════════════════════════════════════════════════════════════════

    // Mounting API routes
    app.use('/api', routes);

    // Direct Health check (Bypass /api for standard load balancers)
    app.get(['/', '/health', '/ready', '/live'], (req, res) => {
        res.json({
            status: 'healthy',
            timestamp: new Date().toISOString(),
            uptime: process.uptime()
        });
    });

    // ═══════════════════════════════════════════════════════════════════════════
    // ERROR HANDLING
    // ═══════════════════════════════════════════════════════════════════════════

    app.use(notFoundHandler());
    app.use(errorHandlerMiddleware());

    return app;
}

const app = createApp();
export default app;

// ═════════════════════════════════════════════════════════════════════════════
// BOOTSTRAP
// ═════════════════════════════════════════════════════════════════════════════

async function bootstrap() {
    const httpServer = createServer(app);

    // Setup uncaught exception handlers before anything else
    setupUncaughtExceptionHandlers();

    // ═══════════════════════════════════════════════════════════════════════════
    // SERVER STARTUP
    // ═══════════════════════════════════════════════════════════════════════════

    const PORT = config.server.port;

    // Initialize Swiss Ephemeris before listening
    try {
        logger.info('Initializing Swiss Ephemeris...');
        await initSwissEph();
        logger.info('✅ Swiss Ephemeris initialized');
    } catch (error) {
        logger.error('❌ Failed to initialize Swiss Ephemeris', error);
        // Continue anyway as we have fallback logic in ephemeris.ts
    }

    httpServer.listen(PORT, '0.0.0.0', () => {
        logger.info('🚀 AI Pandit BTR Engine is live', {
            env: config.app.nodeEnv,
            port: PORT,
            nodeVersion: process.version,
            platform: process.platform,
            swissephPath: process.env.SWISSEPH_PATH || 'ephe/'
        });
    });

    // Graceful shutdown
    const shutdown = () => {
        logger.info('SIGTERM/SIGINT received. Starting graceful shutdown...');
        httpServer.close(() => {
            logger.info('HTTP server closed. Exiting process.');
            process.exit(0);
        });

        // Force shutdown after 30s
        setTimeout(() => {
            logger.error('Could not close connections in time, forceful shutdown');
            process.exit(1);
        }, 30000);
    };

    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);
}

// Ignition
bootstrap().catch((error) => {
    logger.error('🔥 CRITICAL: Failed to bootstrap server', error);
    process.exit(1);
});
