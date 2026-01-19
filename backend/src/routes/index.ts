import { Router } from 'express';
import healthRouter from './health.js';
import calculateRouter from './calculate.js';
import queueRouter from './queue.js';
import progressRouter from './progress.js';
import streamRouter from './stream.js';

const router = Router();

// Mount routes
router.use((req, res, next) => {
    console.log(`[DEBUG] Router Index Hit: ${req.path}`);
    next();
});

router.use('/health', healthRouter);
router.use('/calculate', calculateRouter);
router.use('/queue/progress', progressRouter); // Order matters: more specific first
router.use('/queue', queueRouter);
router.use('/stream', streamRouter);

export { router as routes };

