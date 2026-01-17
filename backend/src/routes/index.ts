import { Router } from 'express';
import healthRouter from './health.js';
import calculateRouter from './calculate.js';
import queueRouter from './queue.js';
import progressRouter from './progress.js';

const router = Router();

// Mount routes
router.use('/health', healthRouter);
router.use('/calculate', calculateRouter);
router.use('/queue', queueRouter);
router.use('/queue/progress', progressRouter);

export { router as routes };
