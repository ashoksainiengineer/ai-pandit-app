"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const index_js_1 = require("./routes/index.js");
const error_handler_js_1 = require("./middleware/error-handler.js");
// Load environment variables
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 8080;
// =============================================================================
// CORS Configuration - Ultra-Permissive for Debugging
// =============================================================================
// CORS Configuration - Secure with Credentials Support
app.use((0, cors_1.default)({
    origin: (origin, callback) => {
        const allowedOrigins = [
            'http://localhost:3000',
            'http://127.0.0.1:3000',
            process.env.FRONTEND_URL || ''
        ];
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin)
            return callback(null, true);
        if (allowedOrigins.includes(origin) || origin.startsWith('http://localhost')) {
            callback(null, true);
        }
        else {
            console.warn(`[CORS] Blocked origin: ${origin}`);
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Cache-Control', 'Last-Event-ID', 'baggage', 'sentry-trace'],
    exposedHeaders: ['Content-Type'],
}));
// =============================================================================
// Middleware
// =============================================================================
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true }));
// Request logging
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    next();
});
// =============================================================================
// Routes
// =============================================================================
app.use('/api', index_js_1.routes);
// Health check at root
app.get('/', (req, res) => {
    res.json({
        status: 'ok',
        service: 'AI Pandit BTR Engine',
        version: '1.0.0',
        timestamp: new Date().toISOString(),
        env: process.env.NODE_ENV || 'development'
    });
});
// Diagnostic ping
app.get('/api/debug/ping', (req, res) => {
    console.log('[DEBUG] Ping received');
    res.json({ pong: true, timestamp: new Date().toISOString(), headers: req.headers });
});
// =============================================================================
// Error Handling
// =============================================================================
app.use(error_handler_js_1.errorHandler);
// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Not Found', path: req.path });
});
const queue_manager_js_1 = require("./lib/queue-manager.js");
const ephemeris_js_1 = require("./lib/ephemeris.js");
// =============================================================================
// Start Server
// =============================================================================
async function bootstrap() {
    try {
        app.listen(PORT, () => {
            console.log(`🚀 AI Pandit BTR Engine running on port ${PORT}`);
            console.log(`📍 Health check: http://localhost:${PORT}/api/health`);
            console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
            // 1. ASYNC Warming Up (Non-blocking)
            console.log('⏳ Initializing Swiss Ephemeris engine in background...');
            (0, ephemeris_js_1.initSwissEph)().catch(err => {
                console.error('❌ Async Swiss Eph Initialization Failed:', err);
            });
            // 2. Start processing queue on startup
            console.log('🔄 Starting queue processor...');
            (0, queue_manager_js_1.cleanupZombiesOnStartup)().then(() => {
                (0, queue_manager_js_1.startQueueProcessor)();
            });
        });
    }
    catch (err) {
        console.error('❌ Failed to start server:', err);
        process.exit(1);
    }
}
bootstrap();
exports.default = app;
// 🔱 GOD-TIER STABILITY PATCH V2: Finalised & Verified
//# sourceMappingURL=server.js.map