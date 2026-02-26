import { describe, it, expect } from 'vitest';
import { users, sessions, calculations, payments, auditLogs, dataRetention } from '../schema.js';

describe('Database Schema Constraints & Metadata', () => {

    describe('users schema', () => {
        it('should have required fields configured correctly', () => {
            expect(users.clerkId.notNull).toBe(true);
            expect(users.email.notNull).toBe(true);
            expect(users.isActive.notNull).toBe(true);
            expect(users.role.notNull).toBe(true);
        });

        it('should have correct default values', () => {
            expect(users.isActive.default).toBe(true);
            expect(users.role.default).toBe('user');
        });
    });

    describe('sessions schema', () => {
        it('should have correct relations and required fields', () => {
            expect(sessions.userId.notNull).toBe(true);
            expect(sessions.clerkId.notNull).toBe(true);
            expect(sessions.fullName.notNull).toBe(true);
            expect(sessions.dateOfBirth.notNull).toBe(true);
            expect(sessions.tentativeTime.notNull).toBe(true);
            expect(sessions.birthPlace.notNull).toBe(true);
            expect(sessions.latitude.notNull).toBe(true);
            expect(sessions.longitude.notNull).toBe(true);
        });

        it('should allow nullable fields for optional data', () => {
            expect(sessions.physicalTraits.notNull).toBe(false);
            expect(sessions.forensicTraits.notNull).toBe(false);
            expect(sessions.lifeEvents.notNull).toBe(false);
            expect(sessions.spouseData.notNull).toBe(false);
            expect(sessions.rectifiedTime.notNull).toBe(false);
        });

        it('should have correct defaults', () => {
            expect(sessions.status.default).toBe('draft');
            expect(sessions.aiConsentGiven.default).toBe(false);
            expect(sessions.isEncrypted.default).toBe(true);
        });
    });

    describe('calculations schema (Cache)', () => {
        it('should enforce metadata requirements', () => {
            expect((calculations as any).version).toBeUndefined(); // Checking name
            expect(calculations.algorithmVersion.default).toBe('2.0.0');
            expect(calculations.ephemerisVersion.default).toBe('de440');
            expect(calculations.cacheHitCount.default).toBe(0);
        });
    });

    describe('payments schema', () => {
        it('should enforce financial data constraints', () => {
            expect(payments.amountPaise.notNull).toBe(true);
            expect(payments.currency.default).toBe('INR');
            expect(payments.status.default).toBe('pending');
            expect(payments.refundAmountPaise.default).toBe(0);
        });
    });

    describe('auditLogs & dataRetention schemas', () => {
        it('should enforce compliance-related constraints', () => {
            expect(auditLogs.action.notNull).toBe(true);
            expect(auditLogs.resource.notNull).toBe(true);
            expect(auditLogs.success.default).toBe(true);

            expect(dataRetention.dataType.notNull).toBe(true);
            expect(dataRetention.retentionDays.notNull).toBe(true);
            expect(dataRetention.scheduledDeletionAt.notNull).toBe(true);
            expect(dataRetention.status.default).toBe('scheduled');
            expect(dataRetention.retryCount.default).toBe(0);
        });
    });
});
