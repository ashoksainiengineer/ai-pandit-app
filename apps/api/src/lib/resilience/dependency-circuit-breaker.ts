export type CircuitDependency = 'ai_provider' | 'database' | 'network' | 'processing';

interface CircuitState {
  consecutiveFailures: number;
  lastFailureAt: number;
  openUntil: number;
}

export interface CircuitSnapshot {
  dependency: CircuitDependency;
  consecutiveFailures: number;
  isOpen: boolean;
  remainingMs: number;
}

interface CircuitOptions {
  threshold: number;
  resetMs: number;
}

const DEFAULT_OPTIONS: Record<CircuitDependency, CircuitOptions> = {
  ai_provider: { threshold: 5, resetMs: 300_000 },
  database: { threshold: 5, resetMs: 300_000 },
  network: { threshold: 6, resetMs: 120_000 },
  processing: { threshold: 8, resetMs: 120_000 },
};

const state: Record<CircuitDependency, CircuitState> = {
  ai_provider: { consecutiveFailures: 0, lastFailureAt: 0, openUntil: 0 },
  database: { consecutiveFailures: 0, lastFailureAt: 0, openUntil: 0 },
  network: { consecutiveFailures: 0, lastFailureAt: 0, openUntil: 0 },
  processing: { consecutiveFailures: 0, lastFailureAt: 0, openUntil: 0 },
};

function nowMs(): number {
  return Date.now();
}

function touchHalfOpenReset(dependency: CircuitDependency): void {
  const current = nowMs();
  const options = DEFAULT_OPTIONS[dependency];
  const entry = state[dependency];

  if (entry.lastFailureAt > 0 && current - entry.lastFailureAt > options.resetMs) {
    entry.consecutiveFailures = 0;
    entry.openUntil = 0;
  }
}

export function recordDependencyFailure(dependency: CircuitDependency): void {
  touchHalfOpenReset(dependency);

  const current = nowMs();
  const options = DEFAULT_OPTIONS[dependency];
  const entry = state[dependency];

  entry.consecutiveFailures += 1;
  entry.lastFailureAt = current;

  if (entry.consecutiveFailures >= options.threshold) {
    entry.openUntil = current + options.resetMs;
  }
}

export function recordDependencySuccess(dependency: CircuitDependency): void {
  const entry = state[dependency];
  entry.consecutiveFailures = 0;
  entry.lastFailureAt = 0;
  entry.openUntil = 0;
}

export function recordGlobalProcessingSuccess(): void {
  (Object.keys(state) as CircuitDependency[]).forEach((dependency) => {
    recordDependencySuccess(dependency);
  });
}

export function getCircuitSnapshots(): CircuitSnapshot[] {
  const current = nowMs();
  return (Object.keys(state) as CircuitDependency[]).map((dependency) => {
    touchHalfOpenReset(dependency);
    const entry = state[dependency];
    const remainingMs = Math.max(0, entry.openUntil - current);

    return {
      dependency,
      consecutiveFailures: entry.consecutiveFailures,
      isOpen: remainingMs > 0,
      remainingMs,
    };
  });
}

export function getBlockingCircuitBreakers(): CircuitSnapshot[] {
  // Network and processing can degrade locally; only hard-block for AI/DB outages.
  return getCircuitSnapshots().filter((snapshot) =>
    snapshot.isOpen && (snapshot.dependency === 'ai_provider' || snapshot.dependency === 'database')
  );
}

export function resetAllCircuitBreakersForTests(): void {
  (Object.keys(state) as CircuitDependency[]).forEach((dependency) => {
    state[dependency] = { consecutiveFailures: 0, lastFailureAt: 0, openUntil: 0 };
  });
}
