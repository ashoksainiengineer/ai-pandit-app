import {
  describe,
  it,
  expect,
  beforeEach
} from 'vitest';
import {
  getQueueRecoveryTelemetry,
  updateRecoveryMetrics,
  recoveryTelemetry,
  getRecoveryTelemetryInstance,
} from '../metrics-reporter.js';

describe('metrics-reporter', () => {
  beforeEach(() => {
    // Ensure recoveryTelemetry is initialized, then reset
    const t = getRecoveryTelemetryInstance();
    t.lastRunAt = null;
    t.lastRecoveredJobs = 0;
    t.lastAbandonedAttempts = 0;
    t.totalRecoveredJobs = 0;
    t.totalAbandonedAttempts = 0;
    t.alertActive = false;
  });

  describe('getQueueRecoveryTelemetry', () => {
    it('should return a copy of telemetry', () => {
      const telemetry = getQueueRecoveryTelemetry();
      expect(telemetry.lastRunAt).toBeNull();
      expect(telemetry.lastRecoveredJobs).toBe(0);
      expect(telemetry.alertActive).toBe(false);
    });

    it('should not mutate original when modifying copy', () => {
      const telemetry = getQueueRecoveryTelemetry();
      telemetry.lastRecoveredJobs = 999;
      expect(recoveryTelemetry!.lastRecoveredJobs).toBe(0);
    });
  });

  describe('updateRecoveryMetrics', () => {
    it('should update last run metrics', () => {
      updateRecoveryMetrics(5, 2);
      expect(recoveryTelemetry!.lastRecoveredJobs).toBe(5);
      expect(recoveryTelemetry!.lastAbandonedAttempts).toBe(2);
      expect(recoveryTelemetry!.lastRunAt).not.toBeNull();
    });

    it('should accumulate totals', () => {
      updateRecoveryMetrics(3, 1);
      updateRecoveryMetrics(2, 1);
      expect(recoveryTelemetry!.totalRecoveredJobs).toBe(5);
      expect(recoveryTelemetry!.totalAbandonedAttempts).toBe(2);
    });

    it('should activate alert when threshold exceeded', () => {
      updateRecoveryMetrics(10, 0);
      expect(recoveryTelemetry!.alertActive).toBe(true);
    });

    it('should keep alert inactive when below threshold', () => {
      updateRecoveryMetrics(0, 0);
      expect(recoveryTelemetry!.alertActive).toBe(false);
    });
  });
});
