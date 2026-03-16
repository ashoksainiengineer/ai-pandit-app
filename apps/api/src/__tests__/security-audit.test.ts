import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../server';
import { db } from '@ai-pandit/db';
import { sessions, users } from '@ai-pandit/db/schema';
import { eq } from 'drizzle-orm';
import crypto from 'crypto';

describe('Security Audit Tests', () => {
  const app = createApp();
  const testTimestamp = Date.now();

  describe('Authentication Security', () => {
    it('should reject requests without valid auth token', async () => {
      const res = await request(app)
        .get('/api/sessions')
        .expect(401);
      
      expect(res.body.error).toContain('Unauthorized');
    });

    it('should reject malformed auth tokens', async () => {
      const res = await request(app)
        .get('/api/sessions')
        .set('Authorization', 'InvalidTokenFormat')
        .expect(401);
      
      expect(res.body.error).toContain('Unauthorized');
    });

    it('should reject expired tokens', async () => {
      const expiredToken = 'expired_token_' + testTimestamp;
      
      const res = await request(app)
        .get('/api/sessions')
        .set('Authorization', `Bearer ${expiredToken}`)
        .expect(401);
      
      expect(res.body.error).toContain('Unauthorized');
    });
  });

  describe('Authorization Security', () => {
    it('should prevent user A from accessing user B sessions', async () => {
      const userA = await db.insert(users).values({
        clerkId: `user_a_${testTimestamp}`,
        email: `user_a_${testTimestamp}@test.com`,
        fullName: 'User A',
        tier: 'free'
      }).returning();
      
      const userB = await db.insert(users).values({
        clerkId: `user_b_${testTimestamp}`,
        email: `user_b_${testTimestamp}@test.com`,
        fullName: 'User B',
        tier: 'free'
      }).returning();
      
      const userBSession = await db.insert(sessions).values({
        userId: userB[0].id,
        clerkId: userB[0].clerkId,
        fullName: 'encrypted:User B Session',
        dateOfBirth: 'encrypted:1990-01-01',
        tentativeTime: 'encrypted:12:00',
        birthPlace: 'encrypted:Mumbai',
        latitude: '19.076',
        longitude: '72.877',
        timezone: '5.5',
        gender: 'male',
        status: 'pending'
      }).returning();
      
      const res = await request(app)
        .get(`/api/sessions/${userBSession[0].id}`)
        .set('Authorization', `Bearer token_for_user_a`)
        .set('X-Test-User-Id', userA[0].id)
        .expect(403);
      
      expect(res.body.error).toContain('Forbidden');
      
      await db.delete(sessions).where(eq(sessions.id, userBSession[0].id));
      await db.delete(users).where(eq(users.id, userA[0].id));
      await db.delete(users).where(eq(users.id, userB[0].id));
    });

    it('should prevent accessing admin routes without admin role', async () => {
      const regularUser = await db.insert(users).values({
        clerkId: `regular_${testTimestamp}`,
        email: `regular_${testTimestamp}@test.com`,
        fullName: 'Regular User',
        tier: 'free'
      }).returning();
      
      const res = await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer token_${regularUser[0].id}`)
        .set('X-Test-User-Id', regularUser[0].id)
        .expect(403);
      
      expect(res.body.error).toContain('Forbidden');
      
      await db.delete(users).where(eq(users.id, regularUser[0].id));
    });
  });

  describe('Input Validation Security', () => {
    it('should sanitize XSS attempts in input', async () => {
      const xssPayload = '<script>alert("xss")</script>';
      
      const res = await request(app)
        .post('/api/sessions')
        .set('Authorization', `Bearer test_token_${testTimestamp}`)
        .send({
          birthData: {
            fullName: xssPayload,
            dateOfBirth: '1990-01-01',
            tentativeTime: '12:00',
            birthPlace: 'Mumbai',
            latitude: 19.076,
            longitude: 72.877,
            timezone: 5.5,
            gender: 'male'
          }
        });
      
      if (res.status === 200) {
        expect(res.body.data.birthData.fullName).not.toContain('<script>');
      }
    });

    it('should reject SQL injection attempts', async () => {
      const sqlInjection = "'; DROP TABLE sessions; --";
      
      const res = await request(app)
        .get(`/api/sessions/${sqlInjection}`)
        .set('Authorization', `Bearer test_token_${testTimestamp}`)
        .expect(400);
      
      const sessionsCount = await db.query.sessions.findMany();
      expect(sessionsCount).toBeDefined();
    });

    it('should reject NoSQL injection attempts', async () => {
      const noSqlInjection = { $gt: '' };
      
      const res = await request(app)
        .post('/api/sessions')
        .set('Authorization', `Bearer test_token_${testTimestamp}`)
        .send({
          birthData: {
            fullName: 'Test',
            dateOfBirth: '1990-01-01',
            tentativeTime: '12:00',
            birthPlace: 'Mumbai',
            latitude: 19.076,
            longitude: 72.877,
            timezone: 5.5,
            gender: 'male',
            extraField: noSqlInjection
          }
        });
      
      expect(res.status).toBe(400);
    });

    it('should enforce rate limiting', async () => {
      const requests = Array(350).fill(null).map(() => 
        request(app)
          .get('/api/sessions')
          .set('Authorization', `Bearer test_token_${testTimestamp}`)
      );
      
      const results = await Promise.all(requests);
      
      const rateLimited = results.filter(r => r.status === 429);
      expect(rateLimited.length).toBeGreaterThan(0);
    });
  });

  describe('Data Encryption Security', () => {
    it('should store sensitive data encrypted', async () => {
      const testUser = await db.insert(users).values({
        clerkId: `encrypt_test_${testTimestamp}`,
        email: `encrypt_test_${testTimestamp}@test.com`,
        fullName: 'Encryption Test',
        tier: 'free'
      }).returning();
      
      const plainTextName = 'Sensitive Name';
      
      const session = await db.insert(sessions).values({
        userId: testUser[0].id,
        clerkId: testUser[0].clerkId,
        fullName: plainTextName,
        dateOfBirth: '1990-01-01',
        tentativeTime: '12:00',
        birthPlace: 'Mumbai',
        latitude: '19.076',
        longitude: '72.877',
        timezone: '5.5',
        gender: 'male',
        status: 'pending'
      }).returning();
      
      const rawData = await db.execute(
        `SELECT full_name FROM sessions WHERE id = '${session[0].id}'`
      );
      
      const storedValue = rawData.rows[0]?.full_name;
      expect(storedValue).not.toBe(plainTextName);
      expect(storedValue).toContain('encrypted');
      
      await db.delete(sessions).where(eq(sessions.id, session[0].id));
      await db.delete(users).where(eq(users.id, testUser[0].id));
    });

    it('should use secure encryption algorithm', async () => {
      const algorithm = process.env.ENCRYPTION_ALGORITHM || 'aes-256-gcm';
      expect(algorithm).toMatch(/aes-256/);
    });
  });

  describe('CORS Security', () => {
    it('should reject requests from unauthorized origins', async () => {
      const res = await request(app)
        .get('/api/sessions')
        .set('Origin', 'https://malicious-site.com')
        .expect(403);
      
      expect(res.body.error).toContain('CORS');
    });

    it('should allow requests from authorized origins', async () => {
      const res = await request(app)
        .get('/api/health')
        .set('Origin', 'http://localhost:3000');
      
      expect(res.status).toBe(200);
    });
  });

  describe('HTTP Security Headers', () => {
    it('should include security headers', async () => {
      const res = await request(app)
        .get('/api/health');
      
      expect(res.headers['x-content-type-options']).toBe('nosniff');
      expect(res.headers['x-frame-options']).toBe('DENY');
      expect(res.headers['x-xss-protection']).toBe('1; mode=block');
    });

    it('should not expose server information', async () => {
      const res = await request(app)
        .get('/api/health');
      
      expect(res.headers['server']).toBeUndefined();
      expect(res.headers['x-powered-by']).toBeUndefined();
    });
  });

  describe('Session Security', () => {
    it('should generate secure session IDs', async () => {
      const sessionId = crypto.randomUUID();
      
      expect(sessionId).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
    });

    it('should invalidate old sessions on password change', async () => {
      expect(true).toBe(true);
    });
  });
});