import { Router, Request, Response } from 'express';
import { config } from '../config/index.js';
import { logger } from '../utils/logger.js';

const router = Router();

// Deduplicate warmup within 60s window to avoid hammering downstream services
const WARMUP_COOLDOWN_MS = 60_000;
let lastWarmupAt = 0;

router.get('/', async (_req: Request, res: Response) => {
  const now = Date.now();

  // If warmed up recently, skip ephemeris ping
  if (now - lastWarmupAt < WARMUP_COOLDOWN_MS) {
    res.json({ warmed: true, cached: true });
    return;
  }

  lastWarmupAt = now;

  // Fire-and-forget ephemeris warmup — don't block the response.
  // Ephemeris cold start (~3-8s for Python + DE440 kernel) is the
  // longest delay the pipeline encounters. Warming it proactively on
  // form load means it's ready by the time the user hits submit.
  const ephemerisUrl = config.ephemeris?.serviceUrl;
  if (ephemerisUrl) {
    const healthUrl = new URL('/health', ephemerisUrl).toString();
    fetch(healthUrl, { signal: AbortSignal.timeout(10_000) })
      .then((resp) => {
        if (resp.ok) logger.info('[WARMUP] Ephemeris pre-warmed');
        else logger.warn('[WARMUP] Ephemeris returned non-OK', { status: resp.status });
      })
      .catch((err: Error) => {
        // Ephemeris unreachable is acceptable during warmup — it'll be
        // checked again when the pipeline actually runs.
        logger.warn('[WARMUP] Ephemeris not reachable yet', { error: err.message });
      });
  }

  res.json({ warmed: true, cached: false });
});

export default router;
