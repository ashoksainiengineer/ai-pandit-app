import 'dotenv/config';
import { createServer } from 'node:http';
import {
  initializeWorkerRuntime,
  runStandaloneWorkerLoop,
} from '../../api/src/lib/jobs/worker-runtime.js';

const pollIntervalMs = Number(process.env.WORKER_POLL_INTERVAL_MS || 2000);
const port = Number(process.env.PORT || 8080);

let workerStarted = false;
let workerHealthy = false;
let startupError: string | null = null;

const server = createServer((req, res) => {
  const path = req.url || '/';

  if (path === '/' || path === '/health' || path === '/live' || path === '/ready') {
    const healthy = workerStarted && workerHealthy;
    const statusCode = path === '/ready' && !healthy ? 503 : 200;

    res.writeHead(statusCode, { 'content-type': 'application/json' });
    res.end(
      JSON.stringify({
        service: 'worker',
        healthy,
        workerStarted,
        startupError,
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

void (async () => {
  try {
    await initializeWorkerRuntime({ pollIntervalMs });
    workerStarted = true;
    workerHealthy = true;
    await runStandaloneWorkerLoop();
  } catch (error) {
    startupError = error instanceof Error ? error.message : String(error);
    const message = error instanceof Error ? error.stack ?? error.message : String(error);
    console.error('[WORKER] Fatal startup failure');
    console.error(message);
    process.exit(1);
  }
})();
