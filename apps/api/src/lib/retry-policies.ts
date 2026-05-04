// lib/retry-policies.ts
// Retry configuration, reason-code derivation, and retryable-error detection.

import { type CircuitDependency } from './resilience/dependency-circuit-breaker.js';

// ═════════════════════════════════════════════════════════════════════════════
// C4 FIX: Retry & Circuit Breaker Configuration
// ═════════════════════════════════════════════════════════════════════════════

export const RETRY_CONFIG = {
  maxRetries: 3,
  baseDelayMs: 1000,
  maxDelayMs: 60000,  // 1 minute max
  backoffMultiplier: 2,
};

export type RetryReasonCode =
  | 'network_error'
  | 'upstream_timeout'
  | 'rate_limited'
  | 'service_unavailable'
  | 'database_busy'
  | 'worker_restart'
  | 'processing_error';

export function deriveRetryReasonCode(error: unknown): RetryReasonCode {
  const message = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();

  if (message.includes('429') || message.includes('rate limit') || message.includes('too many requests')) {
    return 'rate_limited';
  }

  if (message.includes('timeout') || message.includes('etimedout')) {
    return 'upstream_timeout';
  }

  if (
    message.includes('network') ||
    message.includes('econnrefused') ||
    message.includes('enotfound') ||
    message.includes('econnreset')
  ) {
    return 'network_error';
  }

  if (message.includes('503') || message.includes('service unavailable') || message.includes('temporarily unavailable')) {
    return 'service_unavailable';
  }

  if (message.includes('database is locked') || message.includes('busy') || message.includes('sqlite_busy')) {
    return 'database_busy';
  }

  return 'processing_error';
}

/**
 * Calculate exponential backoff delay
 */
export function getRetryDelay(attempt: number): number {
  const delay = RETRY_CONFIG.baseDelayMs * Math.pow(RETRY_CONFIG.backoffMultiplier, attempt);
  return Math.min(delay, RETRY_CONFIG.maxDelayMs) + Math.random() * 1000;
}

export function mapReasonToDependency(reasonCode: RetryReasonCode): CircuitDependency {
  switch (reasonCode) {
    case 'database_busy':
      return 'database';
    case 'rate_limited':
    case 'service_unavailable':
      return 'ai_provider';
    case 'network_error':
    case 'upstream_timeout':
      return 'network';
    default:
      return 'processing';
  }
}

/**
 * Determine if error is retryable
 */
export function isRetryableError(error: unknown): boolean {
  if (error instanceof Error) {
    const msg = error.message.toLowerCase();

    // Network errors - retry
    if (msg.includes('timeout') ||
      msg.includes('network') ||
      msg.includes('econnrefused') ||
      msg.includes('enotfound') ||
      msg.includes('rate limit') ||
      msg.includes('429') ||
      msg.includes('503') ||
      msg.includes('too many requests') ||
      msg.includes('etimedout') ||
      msg.includes('econnreset')) {
      return true;
    }

    // AI service errors - retry (only transient/network issues)
    // NOTE: ai_analysis_incomplete is NOT retryable — it's a parsing failure,
    // and retrying restarts ALL 6 stages (~19 AI calls each time = credit drain)
    if (msg.includes('openrouter') ||
      msg.includes('temporarily unavailable') ||
      msg.includes('service unavailable')) {
      return true;
    }

    // Database transient errors - retry
    if (msg.includes('database is locked') ||
      msg.includes('busy') ||
      msg.includes('sqlITE_BUSY')) {
      return true;
    }
  }

  return false;
}
