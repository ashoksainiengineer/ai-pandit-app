import '../../api/src/scripts/load-env.js';
import { createServer } from 'node:http';
import {
  getWorkerRuntimeStatus,
  initializeWorkerRuntime,
  runStandaloneWorkerLoop,
  stopStandaloneWorker,
} from '../../api/src/lib/jobs/worker-runtime.js';

const pollIntervalMs = Number(process.env.WORKER_POLL_INTERVAL_MS || 2000);
const port = Number(process.env.PORT || 8080);
const drainTimeoutMs = Number(process.env.WORKER_DRAIN_TIMEOUT_MS || 30000);

let workerStarted = false;
let workerHealthy = false;
let shutdownRequested = false;
let draining = false;
let startupError: string | null = null;

async function gracefulShutdown(signal: 'SIGTERM' | 'SIGINT'): Promise<void> {
  if (shutdownRequested) {
    return;
  }

  shutdownRequested = true;
  draining = true;
  workerHealthy = false;
  console.log(`[WORKER] ${signal} received. Starting graceful shutdown...`);

  try {
    const drain = await stopStandaloneWorker({ drainTimeoutMs });
    console.log(`[WORKER] Drain result: drained=${drain.drained} activeJobs=${drain.activeJobs} waitedMs=${drain.waitedMs}`);
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

const server = createServer((req, res) => {
  const path = req.url || '/';
  const runtimeStatus = getWorkerRuntimeStatus();

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
    await initializeWorkerRuntime({ pollIntervalMs });
    workerStarted = true;
    workerHealthy = true;
    await runStandaloneWorkerLoop();
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
