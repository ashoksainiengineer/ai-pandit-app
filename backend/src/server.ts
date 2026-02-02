import 'dotenv/config';
import express, { Request } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';

import { routes } from './routes/index.js';
import { errorHandler } from './middleware/error-handler.js';
import { startQueueProcessor, cleanupZombiesOnStartup } from './lib/queue-manager.js';
import { initSwissEph } from './lib/ephemeris.js';
import { logger } from './lib/logger.js';
import { validateSecrets } from './lib/encryption/config.js';

// Extend Express Request type to include id
declare global {
    namespace Express {
        interface Request {
            id: string;
        }
    }
}



const app = express();
const PORT = parseInt(process.env.PORT || '3001', 10);

// ═════════════════════════════════════════════════════════════════════════════
// SECURITY MIDDLEWARE (Production-Ready)
// ═════════════════════════════════════════════════════════════════════════════

app.use(helmet({
    contentSecurityPolicy: false, // Disabled for API-only service
    crossOriginEmbedderPolicy: false,
}));

// CORS Configuration - Strict allowlist (no regex patterns)
const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:5173',
    'https://localhost:3000',
    process.env.FRONTEND_URL,
    process.env.VERCEL_URL,
].filter((origin): origin is string => typeof origin === 'string' && origin.length > 0);

app.use(cors({
    origin: (origin, callback) => {
        // Allow requests with no origin (mobile apps, curl, internal requests)
        if (!origin) return callback(null, true);

        // In development, allow all origins
        if (process.env.NODE_ENV === 'development') {
            return callback(null, true);
        }

        // Strict origin matching in production
        const isAllowed = allowedOrigins.some(allowed => allowed === origin);

        if (isAllowed) {
            callback(null, true);
        } else {
            logger.warn(`[CORS] Blocked origin: ${origin}`);
            callback(new Error(`Origin ${origin} not allowed by CORS`));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
        'Content-Type',
        'Authorization',
        'X-Requested-With',
        'X-Clerk-Auth-Status',
        'X-Clerk-Auth-Reason',
        'X-Clerk-Auth-Message'
    ],
    exposedHeaders: ['Content-Type', 'X-Session-Id'],
    maxAge: 86400, // 24 hours
}));

// ═════════════════════════════════════════════════════════════════════════════
// COMPRESSION MIDDLEWARE (PERF8)
// ═════════════════════════════════════════════════════════════════════════════

app.use(compression({
    level: 6, // Balance between speed and compression ratio
    filter: (req, res) => {
        // Don't compress responses with this header
        if (req.headers['x-no-compression']) {
            return false;
        }
        // Use compression filter for other cases
        return compression.filter(req, res);
    },
    // Compress responses larger than 1KB
    threshold: 1024,
}));

// ═════════════════════════════════════════════════════════════════════════════
// REQUEST MIDDLEWARE
// ═════════════════════════════════════════════════════════════════════════════

// Body parsing with limits
app.use(express.json({
    limit: '5mb',
    verify: (req, res, buf) => {
        // Store raw body for webhook verification if needed
        (req as any).rawBody = buf;
    }
}));
app.use(express.urlencoded({ extended: true, limit: '5mb' }));

// Logging
app.use(morgan('combined', {
    stream: {
        write: (message) => logger.info(message.trim())
    }
}));

// Request ID tracking
app.use((req, res, next) => {
    req.id = crypto.randomUUID();
    res.setHeader('X-Request-Id', req.id);
    next();
});

// ═════════════════════════════════════════════════════════════════════════════
// HEALTH & STATUS ENDPOINTS
// ═════════════════════════════════════════════════════════════════════════════

// Hugging Face Spaces health check (must be at root)
app.get('/', (req, res) => {
    res.json({
        status: 'healthy',
        service: 'AI Pandit BTR Engine',
        version: '2.0.0',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development',
        uptime: process.uptime(),
        memory: {
            used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + 'MB',
            total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024) + 'MB',
        }
    });
});

// Detailed health check
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        checks: {
            server: 'up',
            swissEph: swissEphReady ? 'ready' : 'initializing',
            queue: queueStarted ? 'running' : 'starting',
            database: 'connected' // TODO: Add actual DB health check
        },
        timestamp: new Date().toISOString()
    });
});

// ═════════════════════════════════════════════════════════════════════════════
// API ROUTES
// ═════════════════════════════════════════════════════════════════════════════

app.use('/api', routes);

// ═════════════════════════════════════════════════════════════════════════════
// ERROR HANDLING
// ═════════════════════════════════════════════════════════════════════════════

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        error: 'Not Found',
        path: req.path,
        method: req.method,
        requestId: req.id
    });
});

// Global error handler
app.use(errorHandler);

// ═════════════════════════════════════════════════════════════════════════════
// SERVER STARTUP
// ═════════════════════════════════════════════════════════════════════════════

import crypto from 'crypto';

let swissEphReady = false;
let queueStarted = false;

async function bootstrap() {
    try {
        logger.info('🚀 AI Pandit BTR Engine v2.0.0 Starting...');
        validateSecrets();
        logger.info(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
        logger.info(`🔌 Port: ${PORT}`);

        // Validate critical environment variables
        const requiredEnv = ['TURSO_DATABASE_URL', 'TURSO_AUTH_TOKEN', 'CLERK_SECRET_KEY'];
        const missing = requiredEnv.filter(key => !process.env[key]);
        if (missing.length > 0) {
            logger.error(`❌ Missing required env vars: ${missing.join(', ')}`);
            process.exit(1);
        }

        // Check AI configuration
        if (!process.env.AI_API_KEY) {
            logger.warn('⚠️ AI_API_KEY not set - BTR processing will fail');
        }

        // Start HTTP server first (HF Spaces requirement)
        const server = app.listen(PORT, '0.0.0.0', () => {
            logger.info(`✅ Server listening on port ${PORT}`);
        });

        // Configure graceful shutdown
        const gracefulShutdown = (signal: string) => {
            logger.info(`📥 Received ${signal}. Starting graceful shutdown...`);
            server.close(() => {
                logger.info('✅ HTTP server closed');
                process.exit(0);
            });

            // Force shutdown after 30s
            setTimeout(() => {
                logger.error('❌ Forced shutdown after timeout');
                process.exit(1);
            }, 30000);
        };

        process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
        process.on('SIGINT', () => gracefulShutdown('SIGINT'));

        // Initialize Swiss Ephemeris (non-blocking)
        logger.info('🔭 Initializing Swiss Ephemeris...');
        initSwissEph()
            .then(ready => {
                swissEphReady = ready;
                logger.info(`✅ Swiss Ephemeris ${ready ? 'ready' : 'fallback mode'}`);
            })
            .catch(err => {
                logger.error('❌ Swiss Ephemeris init failed:', err);
                swissEphReady = false;
            });

        // Cleanup zombie sessions
        logger.info('🧹 Cleaning up zombie sessions...');
        await cleanupZombiesOnStartup();

        // Start queue processor
        logger.info('🔄 Starting queue processor...');
        startQueueProcessor();
        queueStarted = true;

        logger.info('✨ AI Pandit BTR Engine fully operational');

    } catch (err) {
        logger.error('❌ Fatal bootstrap error:', err);
        process.exit(1);
    }
}

// Handle uncaught errors
process.on('uncaughtException', (err) => {
    logger.error('💥 Uncaught Exception:', err);
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    logger.error('💥 Unhandled Rejection at:', { promise, reason });
});

bootstrap();

export default app;
