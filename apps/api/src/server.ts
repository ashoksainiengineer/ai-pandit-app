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
import { ForbiddenError } from './errors/index.js';
import { routes } from './routes/index.js';
import { logger } from './utils/logger.js';
import { requestIdMiddleware } from './middleware/request-id.js';
import { errorHandlerMiddleware, notFoundHandler, setupUncaughtExceptionHandlers } from './middleware/error-handler-new.js';
import { getEphemerisProviderStatus, initEphemerisProvider } from './lib/ephemeris.js';

type StartupState = {
    initializing: boolean;
    dbReady: boolean;
    ephemerisReady: boolean;
    dbError: string | null;
    ephemerisError: string | null;
    startedAt: number;
};

const startupState: StartupState = {
    initializing: true,
    dbReady: false,
    ephemerisReady: false,
    dbError: null,
    ephemerisError: null,
    startedAt: Date.now(),
};

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number, label: string): Promise<T> {
    return Promise.race([
        promise,
        new Promise<T>((_, reject) => {
            setTimeout(() => reject(new Error(`${label} timed out after ${timeoutMs}ms`)), timeoutMs);
        }),
    ]);
}

async function initializeStartupDependencies(): Promise<void> {
    const initStart = Date.now();
    logger.info('[STARTUP] Background dependency initialization started');

    try {
        const { ensureDatabaseInitialized } = await import('@ai-pandit/db');
        await withTimeout(ensureDatabaseInitialized(), 45000, 'Database initialization');
        startupState.dbReady = true;
        startupState.dbError = null;
        logger.info('[STARTUP] Database ready');

        if (config.features.useAsyncJobPipeline) {
            const { recoverInterruptedJobsOnStartup } = await import('./lib/queue-manager.js');
            const recovery = await recoverInterruptedJobsOnStartup();
            logger.info('[STARTUP] Job recovery completed', recovery);
        }
    } catch (error) {
        startupState.dbReady = false;
        startupState.dbError = (error as Error).message;
        logger.warn('[STARTUP] Database initialization failed/deferred', { error: startupState.dbError });
    }

    try {
        await withTimeout(initEphemerisProvider(), 45000, 'Ephemeris provider initialization');
        startupState.ephemerisReady = true;
        startupState.ephemerisError = null;
        logger.info('[STARTUP] Ephemeris provider ready', {
            ephemerisProvider: getEphemerisProviderStatus(),
        });
    } catch (error) {
        startupState.ephemerisReady = false;
        startupState.ephemerisError = (error as Error).message;
        logger.warn('[STARTUP] Ephemeris provider initialization failed/deferred', { error: startupState.ephemerisError });
    }

    startupState.initializing = false;
    logger.info('[STARTUP] Background dependency initialization completed', {
        elapsedMs: Date.now() - initStart,
        dbReady: startupState.dbReady,
        ephemerisReady: startupState.ephemerisReady,
    });
}

// ═════════════════════════════════════════════════════════════════════════════
// APP FACTORY
// ═════════════════════════════════════════════════════════════════════════════

export function createApp() {
    const app = express();
    const normalizeOrigin = (value: string): string | null => {
        const trimmed = value.trim();
        if (!trimmed) return null;

        if (trimmed === '*') return '*';

        try {
            return new URL(trimmed).origin;
        } catch {
            return trimmed.replace(/\/+$/, '');
        }
    };

    const configuredOrigins = (config.app.allowedOrigins || '')
        .split(',')
        .map((origin) => normalizeOrigin(origin))
        .filter((origin): origin is string => Boolean(origin));

    const frontendOrigin = config.app.frontendUrl ? normalizeOrigin(config.app.frontendUrl) : null;
    if (frontendOrigin && !configuredOrigins.includes(frontendOrigin)) {
        configuredOrigins.push(frontendOrigin);
    }

    const defaultProductionOrigins = ['https://aipandit.app', 'https://www.aipandit.app'];
    if (config.app.isProduction) {
        for (const origin of defaultProductionOrigins) {
            if (!configuredOrigins.includes(origin)) {
                configuredOrigins.push(origin);
            }
        }
    }

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

            const normalizedRequestOrigin = normalizeOrigin(origin);
            if (!normalizedRequestOrigin) {
                callback(new ForbiddenError('Not allowed by CORS'));
                return;
            }

            // When wildcard is configured, reflect caller origin instead of returning '*'
            // so credentialed requests remain standards-compliant.
            if (allowAllOrigins || configuredOrigins.includes(normalizedRequestOrigin)) {
                callback(null, true);
                return;
            }

            callback(new ForbiddenError('Not allowed by CORS'));
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
        if (req.path === '/ready') {
            const ready = startupState.dbReady;
            res.status(ready ? 200 : 503).json({
                ready,
                initializing: startupState.initializing,
                timestamp: new Date().toISOString(),
                startupElapsedMs: Date.now() - startupState.startedAt,
                dependencies: {
                    database: startupState.dbReady ? 'ready' : 'not-ready',
                    ephemeris: startupState.ephemerisReady ? 'ready' : 'not-ready',
                },
                errors: {
                    database: startupState.dbError,
                    ephemeris: startupState.ephemerisError,
                },
                ephemerisProvider: getEphemerisProviderStatus(),
            });
            return;
        }

        res.json({
            status: 'healthy', // Liveness only. Readiness is exposed via /ready.
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            initializing: startupState.initializing,
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

    httpServer.timeout = config.server.requestTimeoutMs;

    httpServer.listen(PORT, '0.0.0.0', () => {
        const elapsed = Date.now() - startTime;
        console.log(`[STARTUP] 🚀 AI Pandit BTR Engine is live (${elapsed}ms)`);
        logger.info('🚀 AI Pandit BTR Engine is live', {
            env: config.app.nodeEnv,
            port: PORT,
            nodeVersion: process.version,
            platform: process.platform,
            ephemerisProvider: config.ephemeris.provider,
            startupMs: elapsed
        });
    });

    // Initialize heavy dependencies in background so container becomes live quickly.
    void initializeStartupDependencies();

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
