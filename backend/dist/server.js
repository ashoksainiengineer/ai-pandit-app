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
// CORS Configuration - Allow Vercel Frontend
// =============================================================================
const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:3001',
    process.env.FRONTEND_URL,
    /\.vercel\.app$/,
].filter(Boolean);
app.use((0, cors_1.default)({
    origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin)
            return callback(null, true);
        // Check if origin matches allowed patterns
        const isAllowed = allowedOrigins.some(allowed => {
            if (allowed instanceof RegExp) {
                return allowed.test(origin);
            }
            return allowed === origin;
        });
        if (isAllowed) {
            callback(null, true);
        }
        else {
            console.warn(`CORS blocked origin: ${origin}`);
            callback(null, true); // Allow anyway for development
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
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
        timestamp: new Date().toISOString()
    });
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
        console.log('⏳ Initializing Swiss Ephemeris engine...');
        await (0, ephemeris_js_1.initSwissEph)();
        app.listen(PORT, () => {
            console.log(`🚀 AI Pandit BTR Engine running on port ${PORT}`);
            console.log(`📍 Health check: http://localhost:${PORT}/api/health`);
            console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
            // Start processing queue on startup
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
//# sourceMappingURL=server.js.map