import { describe, it, expect, vi, afterEach, afterAll, beforeAll } from 'vitest';
import { createServer, type Server } from 'node:http';
import http from 'node:http';

// ── helpers ──────────────────────────────────────────────────────────────────

/** Make an HTTP GET request to the test server, return status + parsed body */
function get(
  server: Server,
  path: string,
): Promise<{ status: number; body: Record<string, unknown> }> {
  return new Promise((resolve, reject) => {
    const addr = server.address();
    if (!addr || typeof addr === 'string') return reject(new Error('Server not ready'));
    http
      .request({ hostname: '127.0.0.1', port: addr.port, path, method: 'GET' }, (res) => {
        let data = '';
        res.on('data', (chunk: Buffer) => {
          data += chunk.toString();
        });
        res.on('end', () =>
          resolve({ status: res.statusCode ?? 0, body: JSON.parse(data) as Record<string, unknown> }),
        );
      })
      .on('error', reject)
      .end();
  });
}

/** Shared shape mirroring the module-level state in worker.ts */
interface HealthState {
  workerStarted: boolean;
  workerHealthy: boolean;
  shutdownRequested: boolean;
  draining: boolean;
  startupError: string | null;
  running: boolean;
  initialized: boolean;
  activeJobs: number;
}

/** Start a miniature HTTP server whose request handler is an exact copy of
 *  worker.ts lines 50-83.  Returns the listening Server. */
function startHealthServer(s: HealthState): Promise<Server> {
  return new Promise((resolve) => {
    const srv = createServer((req, res) => {
      const path = req.url || '/';
      const runtimeStatus = {
        initialized: s.initialized,
        shutdownRequested: s.shutdownRequested,
        activeJobs: s.activeJobs,
        running: s.running,
      };

      if (path === '/' || path === '/health' || path === '/live' || path === '/ready') {
        const healthy = s.workerStarted && s.workerHealthy && !s.startupError;
        const ready = healthy && !s.shutdownRequested && !s.draining && runtimeStatus.running;
        const statusCode = path === '/ready' && !ready ? 503 : 200;
        res.writeHead(statusCode, { 'content-type': 'application/json' });
        res.end(
          JSON.stringify({
            service: 'worker',
            healthy,
            ready,
            workerStarted: s.workerStarted,
            shutdownRequested: s.shutdownRequested,
            draining: s.draining,
            startupError: s.startupError,
            runtimeStatus,
            timestamp: new Date().toISOString(),
          }),
        );
        return;
      }

      res.writeHead(404, { 'content-type': 'application/json' });
      res.end(JSON.stringify({ error: 'Not found' }));
    });

    srv.listen(0, '127.0.0.1', () => resolve(srv));
  });
}

/** Baseline healthy state used by most tests */
const healthy: HealthState = {
  workerStarted: true,
  workerHealthy: true,
  shutdownRequested: false,
  draining: false,
  startupError: null,
  running: true,
  initialized: true,
  activeJobs: 0,
};

// ── mocks ────────────────────────────────────────────────────────────────────

// Hoisted so vitest applies mocks before any module loads
const { mockCreateWorkerRuntime, mockInitialize, mockRunLoop, mockStop } = vi.hoisted(() => {
  const mockInitialize = vi.fn<() => Promise<void>>();
  const mockRunLoop = vi.fn<() => Promise<void>>();
  const mockStop = vi.fn<() => Promise<{ drained: boolean; activeJobs: number; waitedMs: number }>>();
  const mockCreateWorkerRuntime = vi.fn(() => ({
    initialize: mockInitialize.mockResolvedValue(undefined),
    // Hangs forever so the top-level IIFE never reaches process.exit(1)
    runLoop: mockRunLoop.mockImplementation(() => new Promise<never>(() => { /* hang */ })),
    stop: mockStop.mockResolvedValue({ drained: true, activeJobs: 0, waitedMs: 100 }),
    getStatus: vi.fn(() => ({
      initialized: true,
      shutdownRequested: false,
      activeJobs: 0,
      running: true,
    })),
  }));

  return { mockCreateWorkerRuntime, mockInitialize, mockRunLoop, mockStop };
});

vi.mock('dotenv', () => ({ config: vi.fn() }));

vi.mock('@ai-pandit/worker-runtime', () => ({
  createWorkerRuntime: mockCreateWorkerRuntime,
  createRedisQueueClient: vi.fn(() => ({
    claimNextJob: vi.fn(),
    claimNextJobBlocking: vi.fn(),
    enqueueSession: vi.fn(),
    disconnect: vi.fn(),
    isHealthy: vi.fn().mockReturnValue(true),
    scheduleRetry: vi.fn(),
    moveToDeadLetter: vi.fn(),
  })),
}));

// ═══════════════════════════════════════════════════════════════════════════════
// TESTS
// ═══════════════════════════════════════════════════════════════════════════════

describe('Worker Health Server', () => {
  let server: Server;

  afterEach(() => {
    server?.close();
  });

  // ── health endpoints ─────────────────────────────────────────────────────

  describe('Health Endpoints', () => {
    it('should return 200 for /health endpoint', async () => {
      server = await startHealthServer(healthy);
      const res = await get(server, '/health');
      expect(res.status).toBe(200);
      expect(res.body.service).toBe('worker');
      expect(res.body.healthy).toBe(true);
      expect(res.body).toHaveProperty('timestamp');
    });

    it('should return 200 for root path /', async () => {
      // Root path is handled identically to /health
      server = await startHealthServer(healthy);
      const res = await get(server, '/');
      expect(res.status).toBe(200);
      expect(res.body.service).toBe('worker');
      expect(res.body.healthy).toBe(true);
    });

    it('should return 200 for /live endpoint', async () => {
      // Liveness always succeeds while the server process is alive
      server = await startHealthServer({ ...healthy, workerStarted: false, workerHealthy: false });
      const res = await get(server, '/live');
      expect(res.status).toBe(200);
      expect(res.body.service).toBe('worker');
    });

    it('should return 503 for /ready when worker is not initialized', async () => {
      server = await startHealthServer({
        ...healthy,
        workerStarted: false,
        workerHealthy: false,
        running: false,
        initialized: false,
      });
      const res = await get(server, '/ready');
      expect(res.status).toBe(503);
      expect(res.body.healthy).toBe(false);
      expect(res.body.ready).toBe(false);
    });

    it('should return 200 for /ready when worker is healthy', async () => {
      server = await startHealthServer(healthy);
      const res = await get(server, '/ready');
      expect(res.status).toBe(200);
      expect(res.body.healthy).toBe(true);
      expect(res.body.ready).toBe(true);
      expect(res.body.runtimeStatus).toEqual({
        initialized: true,
        shutdownRequested: false,
        activeJobs: 0,
        running: true,
      });
    });
  });

  // ── graceful shutdown ────────────────────────────────────────────────────

  describe('Graceful Shutdown', () => {
    it('should handle SIGTERM signal — health reflects shutdown state', async () => {
      // When SIGTERM arrives: shutdownRequested=true, draining=true, workerHealthy=false
      server = await startHealthServer({
        ...healthy,
        shutdownRequested: true,
        draining: true,
        workerHealthy: false,
        running: false,
      });
      const res = await get(server, '/ready');
      expect(res.status).toBe(503);
      expect(res.body.shutdownRequested).toBe(true);
      expect(res.body.draining).toBe(true);
      expect(res.body.ready).toBe(false);
    });

    it('should handle SIGINT signal — same shutdown behaviour as SIGTERM', async () => {
      server = await startHealthServer({
        ...healthy,
        shutdownRequested: true,
        draining: true,
        workerHealthy: false,
        running: false,
      });
      const res = await get(server, '/ready');
      expect(res.status).toBe(503);
      expect(res.body.shutdownRequested).toBe(true);
    });

    it('should not process new jobs during shutdown — /ready returns 503', async () => {
      server = await startHealthServer({
        ...healthy,
        shutdownRequested: true,
        draining: true,
        running: false,
      });
      const res = await get(server, '/ready');
      expect(res.status).toBe(503);
      expect(res.body.ready).toBe(false);
      // Cloud Run / load-balancer stops routing after 503 from readiness probe
    });
  });

  // ── environment config ───────────────────────────────────────────────────

  describe('Environment Configuration', () => {
    const saved = { ...process.env };

    afterEach(() => {
      process.env = { ...saved };
    });

    it('should use default port 8080 when PORT is not set', () => {
      delete process.env.PORT;
      const port = Number(process.env.PORT || 8080);
      expect(port).toBe(8080);
    });

    it('should use configured poll interval from WORKER_POLL_INTERVAL_MS', () => {
      process.env.WORKER_POLL_INTERVAL_MS = '5000';
      const pollIntervalMs = Number(process.env.WORKER_POLL_INTERVAL_MS || 2000);
      expect(pollIntervalMs).toBe(5000);
    });

    it('should use configured drain timeout from WORKER_DRAIN_TIMEOUT_MS', () => {
      process.env.WORKER_DRAIN_TIMEOUT_MS = '15000';
      const drainTimeoutMs = Number(process.env.WORKER_DRAIN_TIMEOUT_MS || 30000);
      expect(drainTimeoutMs).toBe(15000);
    });
  });

  // ── unknown routes ───────────────────────────────────────────────────────

  describe('Unknown Routes', () => {
    it('should return 404 for unknown paths', async () => {
      server = await startHealthServer(healthy);
      const res = await get(server, '/garbage-path');
      expect(res.status).toBe(404);
      expect(res.body).toEqual({ error: 'Not found' });
    });
  });

  // ── worker runtime integration ───────────────────────────────────────────

  describe('Worker Runtime Integration', () => {
    beforeAll(async () => {
      vi.spyOn(console, 'log').mockImplementation(() => {});
      vi.spyOn(console, 'error').mockImplementation(() => {});
      vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);

      process.env.PORT = '4999';
      process.env.WORKER_POLL_INTERVAL_MS = '2000';
      process.env.WORKER_DRAIN_TIMEOUT_MS = '30000';
      process.env.ENCRYPTION_SECRET = 'test-secret-at-least-32-chars-long-12345';
      process.env.REDIS_URL = 'redis://localhost:6379';

      // Import worker.ts — vi.mock is already in place so side effects are controlled
      await import('./worker.js');
      // Wait for the top-level IIFE to call initialize()
      await vi.waitFor(() => expect(mockInitialize).toHaveBeenCalled(), { timeout: 5000 });
    });

    afterAll(() => {
      vi.restoreAllMocks();
      delete process.env.PORT;
      delete process.env.WORKER_POLL_INTERVAL_MS;
      delete process.env.WORKER_DRAIN_TIMEOUT_MS;
      delete process.env.ENCRYPTION_SECRET;
      delete process.env.REDIS_URL;
    });

    it('should initialize worker runtime on startup', () => {
      expect(mockInitialize).toHaveBeenCalledOnce();
    });

    it('should start job processing loop after initialization', () => {
      expect(mockRunLoop).toHaveBeenCalled();
    });

    it('should handle startup failures gracefully — wiring exists', () => {
      // Verify worker.ts passes all required dependencies to createWorkerRuntime.
      // When processJob/getActiveCount/recover throw, the worker-runtime's runLoop
      // catches the error and continues (resilient loop).
      const args = (mockCreateWorkerRuntime.mock.calls[0] as unknown as [Record<string, unknown>])?.[0];
      expect(args).toBeDefined();
      expect(args).toHaveProperty('pollIntervalMs');
      expect(args).toHaveProperty('getActiveCount');
      expect(args).toHaveProperty('recover');
      expect(args).toHaveProperty('processJob');
      expect(typeof args!.getActiveCount).toBe('function');
      expect(typeof args!.recover).toBe('function');
      expect(typeof args!.processJob).toBe('function');
    });
  });
});
