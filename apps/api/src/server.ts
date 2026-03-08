import 'dotenv/config';
import express from 'express';
import { config } from './config/index.js';
import { logger } from './utils/logger.js';

const app = express();
app.use(express.json());

app.get('/health', (req, res) => {
    res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

app.listen(config.server.port, '0.0.0.0', () => {
    logger.info('🚀 AI Pandit BTR Engine Starting...', {
        env: config.server.env,
        port: config.server.port,
        swissephPath: process.env.SWISSEPH_PATH || '/app/ephe'
    });
});

export default app;
