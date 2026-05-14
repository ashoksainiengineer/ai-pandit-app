import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createStreamTicket, consumeStreamTicket, getActiveStreamTicketCount, getTicketStoreMode } from '../stream-ticket-manager.js';

describe('StreamTicketManager', () => {
    beforeEach(() => {
        vi.restoreAllMocks();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('should create and consume a valid ticket exactly once', async () => {
        const ticket = await createStreamTicket('clerk_1', 'session_1');
        expect(typeof ticket).toBe('string');
        expect(getTicketStoreMode()).toBe('memory');

        const payload = await consumeStreamTicket(ticket);
        expect(payload).toEqual({
            externalId: 'clerk_1',
            sessionId: 'session_1',
        });

        const secondAttempt = await consumeStreamTicket(ticket);
        expect(secondAttempt).toBeNull();
    });

    it('should expire ticket after ttl and reject consumption', async () => {
        const nowSpy = vi.spyOn(Date, 'now');
        nowSpy.mockReturnValue(1_000_000);
        const ticket = await createStreamTicket('clerk_2', 'session_2', 1000);

        nowSpy.mockReturnValue(1_001_001);
        const payload = await consumeStreamTicket(ticket);
        expect(payload).toBeNull();
    });

    it('should purge expired tickets while creating new tickets', async () => {
        const nowSpy = vi.spyOn(Date, 'now');
        nowSpy.mockReturnValue(2_000_000);
        await createStreamTicket('clerk_old', 'session_old', 1000);

        nowSpy.mockReturnValue(2_010_000);
        await createStreamTicket('clerk_new', 'session_new', 10_000);

        expect(getActiveStreamTicketCount()).toBe(1);
    });
});
