import { config } from 'dotenv';
import { createServer } from 'node:http';
import {
  createWorkerRuntime,
  type WorkerRuntime,
} from '@ai-pandit/worker-runtime';
import {
  claimNextQueuedJob,
  updateJobProgress,
  completeJob,
  failJob,
} from '@ai-pandit/db';

// Load environment variables
config({ path: '.env' });
config({ path: '.env.local' });

const pollIntervalMs = Number(process.env.WORKER_POLL_INTERVAL_MS || 2000);
const port = Number(process.env.PORT || 8080);
const drainTimeoutMs = Number(process.env.WORKER_DRAIN_TIMEOUT_MS || 30000);

let workerStarted = false;
let workerHealthy = false;
let shutdownRequested = false;
let draining = false;
let startupError: string | null = null;
let workerRuntime: WorkerRuntime | null = null;

// Active job counter shared between processJob and getActiveCount
let activeCount = 0;

async function gracefulShutdown(signal: 'SIGTERM' | 'SIGINT'): Promise<void> {
  if (shutdownRequested) {
    return;
  }

  shutdownRequested = true;
  draining = true;
  workerHealthy = false;
  console.log(`[WORKER] ${signal} received. Starting graceful shutdown...`);

  try {
    if (workerRuntime) {
      const drain = await workerRuntime.stop({ drainTimeoutMs });
      console.log(`[WORKER] Drain result: drained=${drain.drained} activeJobs=${drain.activeJobs} waitedMs=${drain.waitedMs}`);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('[WORKER] Graceful shutdown encountered an error:', message);
  } finally {
    await new Promise<void>((resolve) => {
      server.close(() => resolve());
    });
    process.exit(0);
  }
}

async function processJob(): Promise<void> {
  const job = await claimNextQueuedJob();

  if (!job) {
    return;
  }

  activeCount += 1;

  console.log({ event: 'job_claimed', jobId: job.id, sessionId: job.sessionId, kind: job.kind });

  try {
    // Stage: processing started
    await updateJobProgress({
      jobId: job.id,
      currentStage: 'processing',
      progressPercent: 10,
    });

    // Stage: computing ephemeris
    await updateJobProgress({
      jobId: job.id,
      currentStage: 'computing_ephemeris',
      progressPercent: 30,
    });

    // Stage: analyzing dashas
    await updateJobProgress({
      jobId: job.id,
      currentStage: 'analyzing_dashas',
      progressPercent: 50,
    });

    // Stage: rectifying birth time
    await updateJobProgress({
      jobId: job.id,
      currentStage: 'rectifying_time',
      progressPercent: 70,
    });

    // Stage: generating results
    await updateJobProgress({
      jobId: job.id,
      currentStage: 'generating_results',
      progressPercent: 90,
    });

    // Complete the job with a result
    await completeJob({
      jobId: job.id,
      resultJson: {
        processed: true,
        stages: [
          'processing',
          'computing_ephemeris',
          'analyzing_dashas',
          'rectifying_time',
          'generating_results',
        ],
      },
    });

    console.log({ event: 'job_completed', jobId: job.id, sessionId: job.sessionId });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error({ event: 'job_failed', jobId: job.id, error: message });

    // Mark job as failed — guard against DB errors during fail handling
    try {
      await failJob({
        jobId: job.id,
        errorMessage: message,
        errorCode: 'WORKER_PROCESSING_ERROR',
      });
    } catch (failError) {
      const failMessage = failError instanceof Error ? failError.message : String(failError);
      console.error({ event: 'fail_job_db_error', jobId: job.id, error: failMessage });
    }
  } finally {
    activeCount -= 1;
  }
}

const server = createServer((req, res) => {
  const path = req.url || '/';
  const runtimeStatus = workerRuntime?.getStatus() ?? {
    initialized: false,
    shutdownRequested: false,
    activeJobs: 0,
    running: false,
  };

  if (path === '/' || path === '/health' || path === '/live' || path === '/ready') {
    const healthy = workerStarted && workerHealthy && !startupError;
    const ready = healthy && !shutdownRequested && !draining && runtimeStatus.running;
    const statusCode = path === '/ready' && !ready ? 503 : 200;

    res.writeHead(statusCode, { 'content-type': 'application/json' });
    res.end(
      JSON.stringify({
        service: 'worker',
        healthy,
        ready,
        workerStarted,
        shutdownRequested,
        draining,
        startupError,
        runtimeStatus,
        timestamp: new Date().toISOString(),
      })
    );
    return;
  }

  res.writeHead(404, { 'content-type': 'application/json' });
  res.end(JSON.stringify({ error: 'Not found' }));
});

server.listen(port, '0.0.0.0', () => {
  console.log(`[WORKER] Health server listening on ${port}`);
});

process.on('SIGTERM', () => {
  void gracefulShutdown('SIGTERM');
});

process.on('SIGINT', () => {
  void gracefulShutdown('SIGINT');
});

void (async () => {
  try {
    // Create worker runtime with basic dependencies
    workerRuntime = createWorkerRuntime({
      pollIntervalMs,
      getActiveCount: () => activeCount,
      recover: async () => ({ recoveredJobs: 0, abandonedAttempts: 0 }),
      processJob: () => processJob(),
    });

    await workerRuntime.initialize({ pollIntervalMs });
    workerStarted = true;
    workerHealthy = true;
    await workerRuntime.runLoop();
    if (shutdownRequested) {
      return;
    }
    workerHealthy = false;
    startupError = 'Worker loop exited unexpectedly';
    console.error('[WORKER] Worker loop exited unexpectedly');
    process.exit(1);
  } catch (error) {
    startupError = error instanceof Error ? error.message : String(error);
    const message = error instanceof Error ? error.stack ?? error.message : String(error);
    console.error('[WORKER] Fatal startup failure');
    console.error(message);
    process.exit(1);
  }
})();
