import 'dotenv/config';

/**
 * Professional AI-Pandit BTR Engine Server
 * ===============================
 * Production-grade Express server with comprehensive middleware stack.
 * Version 3.0.0 - Refactored with new infrastructure
 */

import express from 'express';
import cors from 'cors';
import cluster from 'cluster';
import os from 'os';
import helmet from 'helmet';
import compression from 'compression';

// Configuration (validates on import)
import { config, serverConfig } from './config/index.js';

// Utilities
import { logger } from './utils/logger.js';

// Middleware
import { requestIdMiddleware, requestContextMiddleware, performanceMiddleware } from './middleware/request-id.js';
import { errorHandlerMiddleware, notFoundHandler, setupUncaughtExceptionHandlers } from './middleware/error-handler-new.js';
import { defaultRateLimiter, calculateRateLimiter } from './middleware/rate-limit.js';

// Routes
import { routes } from './routes/index.js';
import healthRoutes from './routes/health.js';

// Services
import { startQueueProcessor, cleanupZombiesOnStartup } from './lib/queue-manager.js';
import { initSwissEph } from './lib/ephemeris.js';

// ═════════════════════════════════════════════════════════════════════════════
// APPLICATION SETUP
// ═════════════════════════════════════════════════════════════════════════════

const app = express();

// ═════════════════════════════════════════════════════════════════════════════
// SECURITY MIDDLEWARE
// ═════════════════════════════════════════════════════════════════════════════

app.use(helmet({
  contentSecurityPolicy: false, // API-only service
  crossOriginEmbedderPolicy: false,
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
}));

// CORS with strict origin validation (deduped via Set to prevent log noise)
const allowedOrigins = Array.from(new Set([
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:5173',
  // Trim trailing slash — a common misconfiguration that causes silent CORS failures
  process.env.FRONTEND_URL?.replace(/\/+$/, ''),
  process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined,
  // Additional frontend URLs from environment (comma-separated)
  ...(process.env.ALLOWED_ORIGINS?.split(',').map(o => o.trim()).filter(Boolean) || []),
].filter((origin): origin is string => Boolean(origin))));

// Match any *.vercel.app deployment (production, preview, etc.)
const isVercelOrigin = (origin: string): boolean =>
  /^https:\/\/[\w-]+\.vercel\.app$/.test(origin);

// Log at startup so we can debug CORS issues from logs
logger.info('🛰️ Starting Engine with CORS constraints', {
  allowedOrigins,
  allowVercelPreviews: true,
  env: serverConfig.env
});

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin) || isVercelOrigin(origin || '') || serverConfig.isDevelopment) {
      callback(null, true);
    } else {
      logger.warn('CORS blocked origin', { origin, allowedOrigins });
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Request-Id',
    'X-Clerk-Auth-Status',
    'X-Clerk-Auth-Reason',
  ],
  exposedHeaders: ['X-Request-Id', 'X-Response-Time'],
  maxAge: 86400,
}));


// ═════════════════════════════════════════════════════════════════════════════
// GLOBAL ROUTE DEBUGGER & LOGGING
// Consolidated single logger — covers ALL requests including real-time endpoints
// ═════════════════════════════════════════════════════════════════════════════

app.use((req, res, next) => {
  const start = Date.now();
  const requestId = req.headers['x-request-id'] || 'no-id';
  const path = req.path;
  const isRealtime = path.startsWith('/api/stream') || path.startsWith('/api/queue/progress');

  // Log request start
  logger.info(`✨ [API] ${req.method} ${req.originalUrl}`, {
    requestId,
    ip: req.ip,
    userAgent: req.get('user-agent')?.substring(0, 50),
    authHeader: req.headers.authorization ? 'PRESENT' : 'MISSING',
    query: Object.keys(req.query),
    ...(isRealtime ? { type: 'realtime' } : {}),
  });

  res.on('finish', () => {
    const duration = Date.now() - start;
    if (res.statusCode >= 400) {
      logger.warn(`🛑 [API] Error ${res.statusCode} on ${req.method} ${req.originalUrl}`, {
        duration: `${duration}ms`,
        requestId,
      });
    } else if (isRealtime) {
      logger.info(`📡 Real-time request finished: ${req.method} ${path}`, {
        status: res.statusCode,
        duration: `${duration}ms`,
      });
    }
  });
  next();
});

// ═════════════════════════════════════════════════════════════════════════════
// RESPONSE COMPRESSION (~30% bandwidth savings)
// Skip SSE streams — they need real-time uncompressed delivery
// ═════════════════════════════════════════════════════════════════════════════

app.use(compression({
  filter: (req, res) => {
    // Don't compress SSE streams or polling progress (they need real-time delivery)
    const path = req.originalUrl;
    if (path.includes('/stream') || path.includes('/queue/progress')) {
      return false;
    }
    return compression.filter(req, res);
  },
  threshold: 1024,
}));

// Body parsing with limits
app.use(express.json({
  limit: '5mb',
  verify: (req, _res, buf) => {
    (req as any).rawBody = buf;
  },
}));

app.use(express.urlencoded({ extended: true, limit: '5mb' }));

// Request ID and tracing
app.use(requestIdMiddleware());
app.use(requestContextMiddleware());
app.use(performanceMiddleware());

// Rate limiting - selective application
// SSE stream and polling endpoints have their own dedicated limiters in routes/index.ts
// Skip global rate limit for these to prevent double-limiting
app.use((req, res, next) => {
  const path = req.path;

  // Whitelist real-time endpoints from global rate limit
  if (path.startsWith('/api/stream') ||
    path.startsWith('/api/queue/progress') ||
    path.startsWith('/health')) {
    return next();
  }

  // Apply global rate limiter to all other routes
  return defaultRateLimiter(req, res, next);
});

// ═════════════════════════════════════════════════════════════════════════════
// HEALTH ENDPOINTS (Must be before API routes for HF Spaces)
// ═════════════════════════════════════════════════════════════════════════════

app.use('/health', healthRoutes);

// Legacy root endpoint for backward compatibility
app.get('/', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'AI Pandit BTR Engine',
    version: '3.0.0',
    timestamp: new Date().toISOString(),
    environment: serverConfig.env,
    uptime: process.uptime(),
    requestId: req.requestId,
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// API ROUTES
// ═════════════════════════════════════════════════════════════════════════════

app.use('/api', routes);

// ═════════════════════════════════════════════════════════════════════════════
// ERROR HANDLING (Must be last)
// ═════════════════════════════════════════════════════════════════════════════

app.use(notFoundHandler());
app.use(errorHandlerMiddleware());

// ═════════════════════════════════════════════════════════════════════════════
// SERVER STARTUP
// ═════════════════════════════════════════════════════════════════════════════

let queueStarted = false;

async function bootstrap(): Promise<void> {
  // PRODUCTION STABILITY: Disable clustering for HF Spaces
  // In-memory state (SSE emitters, ProgressTracker) is NOT shared across workers.
  // We run as a single process to ensure real-time consistency.
  logger.info(`🚀 Starting engine in single-process mode for memory consistency`);
  startWorkerServer();
}

async function startWorkerServer() {
  try {
    const workerId = cluster.isWorker ? `Worker ${process.pid}` : 'Single Process';
    logger.info(`🚀 AI Pandit BTR Engine v3.0.0 Starting (${workerId})...`);
    logger.info('📍 Environment', {
      env: serverConfig.env,
      port: serverConfig.port,
      nodeVersion: process.version,
    });

    // Log configuration (sanitized)
    logger.info('⚙️ Configuration loaded', {
      maxConcurrent: config.queue.maxConcurrent,
      aiModel: config.ai.model,
      enablePrecisionEnhancement: config.features.enablePrecisionEnhancement,
    });

    // Initialize Swiss Ephemeris FIRST (blocking with timeout)
    logger.info('🔭 Initializing Swiss Ephemeris...');
    const swissEphTimeout = new Promise<boolean>((resolve) =>
      setTimeout(() => resolve(false), 15000)
    );
    try {
      const ready = await Promise.race([initSwissEph(), swissEphTimeout]);
      if (ready) {
        logger.info('✅ Swiss Ephemeris ready');
      } else {
        logger.warn('⚠️ Swiss Ephemeris init timed out (15s), using algorithmic fallback');
      }
    } catch (err) {
      logger.warn('⚠️ Swiss Ephemeris init failed, using algorithmic fallback', { error: String(err) });
    }

    // Start HTTP server AFTER ephemeris is ready
    const server = app.listen(serverConfig.port, '0.0.0.0', () => {
      logger.info('✅ Server listening', { port: serverConfig.port });
    });

    // Graceful shutdown
    const gracefulShutdown = (signal: string): void => {
      logger.info('📥 Graceful shutdown initiated', { signal });

      server.close(() => {
        logger.info('✅ HTTP server closed');
        process.exit(0);
      });

      // Force shutdown after timeout
      setTimeout(() => {
        logger.error('❌ Forced shutdown after timeout');
        process.exit(1);
      }, 30000);
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    // Cleanup and start queue
    logger.info('🧹 Cleaning up zombie sessions...');
    await cleanupZombiesOnStartup();

    logger.info('🔄 Starting queue processor...');
    startQueueProcessor();
    queueStarted = true;

    logger.info(`✨ AI Pandit BTR Engine fully operational (${workerId})`);

  } catch (err) {
    logger.error('❌ Fatal bootstrap error', err);
    process.exit(1);
  }
}

// Setup global error handlers
setupUncaughtExceptionHandlers();

// Start the server
bootstrap();

export default app;
