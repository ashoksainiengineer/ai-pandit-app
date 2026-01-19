import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { routes } from './routes/index.js';
import { errorHandler } from './middleware/error-handler.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 8080;

// =============================================================================
// CORS Configuration - Allow Vercel Frontend
// =============================================================================
app.use(cors({
    origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);

        // 🔓 REFLECTING CORS: Allow ANY origin to connect for debugging
        // This eliminates CORS as a failure cause.
        // In production, we can lock this down later effectively throughout enviroment variables.
        callback(null, true);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Cache-Control', 'Last-Event-ID'],
    exposedHeaders: ['Content-Type'],
}));

// =============================================================================
// Middleware
// =============================================================================
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    next();
});

// =============================================================================
// Routes
// =============================================================================
app.use('/api', routes);

// Health check at root
app.get('/', (req, res) => {
    res.json({
        status: 'ok',
        service: 'AI Pandit BTR Engine',
        version: '1.0.0',
        timestamp: new Date().toISOString()
    });
});

// =============================================================================
// Error Handling
// =============================================================================
app.use(errorHandler);

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Not Found', path: req.path });
});

import { startQueueProcessor, cleanupZombiesOnStartup } from './lib/queue-manager.js';
import { initSwissEph } from './lib/ephemeris.js';

// =============================================================================
// Start Server
// =============================================================================
async function bootstrap() {
    try {
        console.log('⏳ Initializing Swiss Ephemeris engine...');
        await initSwissEph();

        app.listen(PORT, () => {
            console.log(`🚀 AI Pandit BTR Engine running on port ${PORT}`);
            console.log(`📍 Health check: http://localhost:${PORT}/api/health`);
            console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);

            // Start processing queue on startup
            console.log('🔄 Starting queue processor...');
            cleanupZombiesOnStartup().then(() => {
                startQueueProcessor();
            });
        });
    } catch (err) {
        console.error('❌ Failed to start server:', err);
        process.exit(1);
    }
}

bootstrap();

export default app;
