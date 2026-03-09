import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createStreamTicket, consumeStreamTicket, getActiveStreamTicketCount } from '../stream-ticket-manager.js';

describe('StreamTicketManager', () => {
    beforeEach(() => {
        vi.restoreAllMocks();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('should create and consume a valid ticket exactly once', () => {
        const ticket = createStreamTicket('clerk_1', 'session_1');
        expect(typeof ticket).toBe('string');
        expect(getActiveStreamTicketCount()).toBeGreaterThan(0);

        const payload = consumeStreamTicket(ticket);
        expect(payload).toEqual({
            clerkId: 'clerk_1',
            sessionId: 'session_1',
        });

        const secondAttempt = consumeStreamTicket(ticket);
        expect(secondAttempt).toBeNull();
    });

    it('should expire ticket after ttl and reject consumption', () => {
        const nowSpy = vi.spyOn(Date, 'now');
        nowSpy.mockReturnValue(1_000_000);
        const ticket = createStreamTicket('clerk_2', 'session_2', 1000);

        nowSpy.mockReturnValue(1_001_001);
        const payload = consumeStreamTicket(ticket);
        expect(payload).toBeNull();
    });

    it('should purge expired tickets while creating new tickets', () => {
        const nowSpy = vi.spyOn(Date, 'now');
        nowSpy.mockReturnValue(2_000_000);
        createStreamTicket('clerk_old', 'session_old', 1000);

        nowSpy.mockReturnValue(2_010_000);
        createStreamTicket('clerk_new', 'session_new', 10_000);

        // only the fresh ticket should remain active after cleanup
        expect(getActiveStreamTicketCount()).toBe(1);
    });
});
