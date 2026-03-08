/**
 * 🔱 AI-Pandit BTR Engine - Server Entry Point
 * ===========================================
 * Production-grade Express server with robust middleware,
 * error handling, and performance monitoring.
 */

// ═════════════════════════════════════════════════════════════════════════════
// IMMEDIATE STARTUP OBSERVABILITY - Must be first
// ═════════════════════════════════════════════════════════════════════════════
console.log(`[STARTUP ${new Date().toISOString()}] Server process starting...`);
console.log(`[STARTUP] Node version: ${process.version}`);
console.log(`[STARTUP] Platform: ${process.platform}`);
console.log(`[STARTUP] Environment: ${process.env.NODE_ENV || 'not set'}`);
console.log(`[STARTUP] Port: ${process.env.PORT || '7860'}`);

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
    const configuredOrigins = (config.app.allowedOrigins || '')
        .split(',')
        .map((origin) => origin.trim())
        .filter(Boolean);
    const allowAllOrigins = configuredOrigins.includes('*') && config.app.isDevelopment;

    // ═══════════════════════════════════════════════════════════════════════════
    // SECURITY & BASIS MIDDLEWARE
    // ═══════════════════════════════════════════════════════════════════════════

    app.set('trust proxy', 1); // Essential for HF Spaces / Vercel

    app.use(helmet({
        contentSecurityPolicy: false, // Disabled for internal UI/Admin if needed
        crossOriginResourcePolicy: { policy: "cross-origin" }
    }));

    app.use(cors({
        origin: (origin, callback) => {
            // Allow non-browser clients and same-origin server-to-server calls.
            if (!origin) {
                callback(null, true);
                return;
            }

            // When wildcard is configured, reflect caller origin instead of returning '*'
            // so credentialed requests remain standards-compliant.
            if (allowAllOrigins || configuredOrigins.includes(origin)) {
                callback(null, true);
                return;
            }

            callback(new Error('Not allowed by CORS'));
        },
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
    console.log(`[STARTUP] Bootstrap starting...`);
    const startTime = Date.now();
    
    const httpServer = createServer(app);

    // Setup uncaught exception handlers before anything else
    setupUncaughtExceptionHandlers();

    // ═══════════════════════════════════════════════════════════════════════════
    // SERVER STARTUP
    // ═══════════════════════════════════════════════════════════════════════════

    const PORT = config.server.port;

    // Ensure database is initialized before starting server
    // This prevents race conditions where requests arrive before DB is ready
    try {
        console.log('[STARTUP] Waiting for database initialization...');
        const { ensureDatabaseInitialized } = await import('@ai-pandit/db');
        await ensureDatabaseInitialized();
        console.log(`[STARTUP] Database ready in ${Date.now() - startTime}ms`);
    } catch (error) {
        console.warn('[STARTUP] Database initialization warning:', (error as Error).message);
        // Continue - DB will retry on demand
    }

    // Initialize Swiss Ephemeris before listening
    try {
        console.log('[STARTUP] Initializing Swiss Ephemeris...');
        await initSwissEph();
        console.log('[STARTUP] Swiss Ephemeris initialized');
    } catch (error) {
        console.error('[STARTUP] Failed to initialize Swiss Ephemeris:', error);
        // Continue anyway as we have fallback logic in ephemeris.ts
    }

    httpServer.timeout = config.server.requestTimeoutMs;

    httpServer.listen(PORT, '0.0.0.0', () => {
        const elapsed = Date.now() - startTime;
        console.log(`[STARTUP] 🚀 AI Pandit BTR Engine is live (${elapsed}ms)`);
        logger.info('🚀 AI Pandit BTR Engine is live', {
            env: config.app.nodeEnv,
            port: PORT,
            nodeVersion: process.version,
            platform: process.platform,
            swissephPath: 'ephe/',
            startupMs: elapsed
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
if (process.env.NODE_ENV !== 'test' && process.env.VITEST !== 'true') {
    bootstrap().catch((error) => {
        logger.error('🔥 CRITICAL: Failed to bootstrap server', error);
        process.exit(1);
    });
}
