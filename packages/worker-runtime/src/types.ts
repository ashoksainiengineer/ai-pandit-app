/**
 * Worker Runtime Types
 * Shared types for worker runtime operations
 */

export interface WorkerRuntimeOptions {
  pollIntervalMs?: number;
}

export interface WorkerInitializationResult {
  pollIntervalMs: number;
  recoveredJobs: number;
}

export interface WorkerStopResult {
  drained: boolean;
  activeJobs: number;
  waitedMs: number;
}

export interface WorkerRuntimeStatus {
  initialized: boolean;
  shutdownRequested: boolean;
  activeJobs: number;
  running: boolean;
}

export interface RecoveryResult {
  recoveredJobs: number;
  abandonedAttempts: number;
}

/**
 * Dependencies required to create a worker runtime
 */
export interface WorkerDependencies {
  /** Poll interval in milliseconds */
  pollIntervalMs?: number;
  
  /** Function to initialize the worker (DB connection, etc.) */
  initialize?: () => Promise<void>;
  
  /** Function to process a single job iteration */
  processJob: () => Promise<void>;
  
  /** Function to get the current active job count */
  getActiveCount: () => number;
  
  /** Function to drain active jobs */
  drain?: (timeoutMs: number) => Promise<void>;
  
  /** Function to recover interrupted jobs on startup */
  recover: () => Promise<RecoveryResult>;
}

/**
 * Worker runtime interface
 */
export interface WorkerRuntime {
  /** Initialize the worker runtime */
  initialize(options?: WorkerRuntimeOptions): Promise<WorkerInitializationResult>;
  
  /** Run the main worker loop */
  runLoop(): Promise<void>;
  
  /** Stop the worker gracefully */
  stop(options?: { drainTimeoutMs?: number }): Promise<WorkerStopResult>;
  
  /** Get current runtime status */
  getStatus(): WorkerRuntimeStatus;
}


export interface QueueJob {
  id: string;
  sessionId: string;
  userId: string;
  payload: Record<string, unknown>;
  attempt: number;
  maxAttempts: number;
}

export interface QueueStatus {
  queued: number;
  running: number;
  failed: number;
  completed: number;
}

export interface WorkerConfig {
  pollIntervalMs: number;
  drainTimeoutMs: number;
  maxConcurrent: number;
  staleTimeoutMs: number;
  recoveryAlertThreshold: number;
}

export type JobProcessor = (job: QueueJob, signal: AbortSignal) => Promise<void>;
