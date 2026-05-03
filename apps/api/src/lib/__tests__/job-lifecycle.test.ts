import { describe, it, expect } from 'vitest';
import { mapJobStatusToQueueStatus } from '../job-lifecycle.js';

describe('job-lifecycle', () => {
  describe('mapJobStatusToQueueStatus', () => {
    it('should map running to processing', () => {
      expect(mapJobStatusToQueueStatus('running')).toBe('processing');
    });

    it('should map completed to complete', () => {
      expect(mapJobStatusToQueueStatus('completed')).toBe('complete');
    });

    it('should map failed to failed', () => {
      expect(mapJobStatusToQueueStatus('failed')).toBe('failed');
    });

    it('should map cancelled to failed', () => {
      expect(mapJobStatusToQueueStatus('cancelled')).toBe('failed');
    });

    it('should map unknown to queued', () => {
      expect(mapJobStatusToQueueStatus('unknown')).toBe('queued');
    });

    it('should map null to queued', () => {
      expect(mapJobStatusToQueueStatus(null)).toBe('queued');
    });

    it('should map undefined to queued', () => {
      expect(mapJobStatusToQueueStatus(undefined)).toBe('queued');
    });
  });
});
