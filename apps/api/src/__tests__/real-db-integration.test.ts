import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../server';
import { db, pool } from '@ai-pandit/db';
import { sessions, users, jobs } from '@ai-pandit/db/schema';
import { eq } from 'drizzle-orm';

describe('Real Database Integration Tests', () => {
  const app = createApp();
  const testTimestamp = Date.now();

  const testUser = {
    clerkId: `test_clerk_${testTimestamp}`,
    email: `test_${testTimestamp}@example.com`,
    fullName: 'Test User'
  };

  let testUserId: string;
  let authToken: string;

  beforeAll(async () => {
    await db.delete(sessions).where(eq(sessions.clerkId, testUser.clerkId));
    await db.delete(users).where(eq(users.clerkId, testUser.clerkId));
    
    const [user] = await db.insert(users).values({
      clerkId: testUser.clerkId,
      email: testUser.email,
      fullName: testUser.fullName,
      tier: 'free',
      createdAt: new Date(),
      updatedAt: new Date()
    }).returning();
    
    testUserId = user.id;
    authToken = `test_token_${testTimestamp}`;
  });

  beforeEach(async () => {
    await db.delete(sessions).where(eq(sessions.userId, testUserId));
    await db.delete(jobs).where(eq(jobs.userId, testUserId));
  });

  afterAll(async () => {
    await db.delete(sessions).where(eq(sessions.userId, testUserId));
    await db.delete(jobs).where(eq(jobs.userId, testUserId));
    await db.delete(users).where(eq(users.id, testUserId));
    await pool.end();
  });

  describe('Database Connection', () => {
    it('should connect to real Neon database', async () => {
      const result = await pool.query('SELECT NOW() as now');
      expect(result.rows[0].now).toBeDefined();
    });

    it('should perform CRUD operations on users table', async () => {
      const [newUser] = await db.insert(users).values({
        clerkId: `temp_${testTimestamp}`,
        email: `temp_${testTimestamp}@test.com`,
        fullName: 'Temp User',
        tier: 'free'
      }).returning();
      
      expect(newUser).toBeDefined();
      expect(newUser.email).toBe(`temp_${testTimestamp}@test.com`);
      
      const [updated] = await db.update(users)
        .set({ fullName: 'Updated Name' })
        .where(eq(users.id, newUser.id))
        .returning();
      
      expect(updated.fullName).toBe('Updated Name');
      
      await db.delete(users).where(eq(users.id, newUser.id));
      
      const deleted = await db.query.users.findFirst({
        where: eq(users.id, newUser.id)
      });
      expect(deleted).toBeUndefined();
    });
  });

  describe('Session CRUD with Real DB', () => {
    it('should create session with encrypted data in real DB', async () => {
      const res = await request(app)
        .post('/api/sessions')
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Test-User-Id', testUserId)
        .send({
          birthData: {
            fullName: 'Lata Mangeshkar',
            dateOfBirth: '1929-09-28',
            tentativeTime: '22:30',
            birthPlace: 'Indore, Madhya Pradesh, India',
            latitude: 22.7196,
            longitude: 75.8577,
            timezone: 5.5,
            gender: 'female'
          },
          lifeEvents: [
            { year: 1942, event: 'First major song recording' }
          ],
          forensicTraits: {
            height: 'short',
            build: 'slim'
          },
          offsetConfig: { preset: '2hours', minutes: 120, customMinutes: 120 }
        })
        .expect(200);
      
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBeDefined();
      
      const sessionId = res.body.data.id;
      
      const dbSession = await db.query.sessions.findFirst({
        where: eq(sessions.id, sessionId)
      });
      
      expect(dbSession).toBeDefined();
      expect(dbSession?.userId).toBe(testUserId);
      expect(dbSession?.fullName).not.toBe('Lata Mangeshkar');
      expect(dbSession?.fullName).toContain('encrypted');
    });

    it('should retrieve and decrypt session from real DB', async () => {
      const createRes = await request(app)
        .post('/api/sessions')
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Test-User-Id', testUserId)
        .send({
          birthData: {
            fullName: 'Test Person',
            dateOfBirth: '1990-01-01',
            tentativeTime: '12:00',
            birthPlace: 'Mumbai, India',
            latitude: 19.076,
            longitude: 72.877,
            timezone: 5.5,
            gender: 'male'
          }
        });
      
      const sessionId = createRes.body.data.id;
      
      const getRes = await request(app)
        .get(`/api/sessions/${sessionId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Test-User-Id', testUserId)
        .expect(200);
      
      expect(getRes.body.data.birthData.fullName).toBe('Test Person');
      expect(getRes.body.data.birthData.dateOfBirth).toBe('1990-01-01');
    });

    it('should update session in real DB', async () => {
      const createRes = await request(app)
        .post('/api/sessions')
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Test-User-Id', testUserId)
        .send({
          birthData: {
            fullName: 'Original Name',
            dateOfBirth: '1985-05-15',
            tentativeTime: '06:30',
            birthPlace: 'Delhi, India',
            latitude: 28.6139,
            longitude: 77.209,
            timezone: 5.5,
            gender: 'female'
          }
        });
      
      const sessionId = createRes.body.data.id;
      
      await request(app)
        .put(`/api/sessions/${sessionId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Test-User-Id', testUserId)
        .send({
          birthData: {
            fullName: 'Updated Name',
            dateOfBirth: '1985-05-15',
            tentativeTime: '07:00',
            birthPlace: 'Mumbai, India',
            latitude: 19.076,
            longitude: 72.877,
            timezone: 5.5,
            gender: 'female'
          }
        })
        .expect(200);
      
      const dbSession = await db.query.sessions.findFirst({
        where: eq(sessions.id, sessionId)
      });
      
      expect(dbSession).toBeDefined();
      expect(dbSession?.updatedAt).not.toBe(dbSession?.createdAt);
    });

    it('should delete session from real DB', async () => {
      const createRes = await request(app)
        .post('/api/sessions')
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Test-User-Id', testUserId)
        .send({
          birthData: {
            fullName: 'To Be Deleted',
            dateOfBirth: '2000-01-01',
            tentativeTime: '00:00',
            birthPlace: 'Pune, India',
            latitude: 18.5204,
            longitude: 73.8567,
            timezone: 5.5,
            gender: 'male'
          }
        });
      
      const sessionId = createRes.body.data.id;
      
      await request(app)
        .delete(`/api/sessions/${sessionId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Test-User-Id', testUserId)
        .expect(200);
      
      const deletedSession = await db.query.sessions.findFirst({
        where: eq(sessions.id, sessionId)
      });
      
      expect(deletedSession).toBeUndefined();
    });

    it('should list all user sessions from real DB', async () => {
      await db.insert(sessions).values([
        {
          userId: testUserId,
          clerkId: testUser.clerkId,
          fullName: 'encrypted:session1',
          dateOfBirth: 'encrypted:1990-01-01',
          tentativeTime: 'encrypted:12:00',
          birthPlace: 'encrypted:Mumbai',
          latitude: '19.076',
          longitude: '72.877',
          timezone: '5.5',
          gender: 'male',
          status: 'completed',
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          userId: testUserId,
          clerkId: testUser.clerkId,
          fullName: 'encrypted:session2',
          dateOfBirth: 'encrypted:1995-05-15',
          tentativeTime: 'encrypted:06:30',
          birthPlace: 'encrypted:Delhi',
          latitude: '28.6139',
          longitude: '77.209',
          timezone: '5.5',
          gender: 'female',
          status: 'pending',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ]);
      
      const res = await request(app)
        .get('/api/sessions')
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Test-User-Id', testUserId)
        .expect(200);
      
      expect(res.body.data).toBeInstanceOf(Array);
      expect(res.body.data.length).toBeGreaterThanOrEqual(2);
    });

    it('should clone session with real DB transaction', async () => {
      const createRes = await request(app)
        .post('/api/sessions')
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Test-User-Id', testUserId)
        .send({
          birthData: {
            fullName: 'Original Session',
            dateOfBirth: '1988-08-20',
            tentativeTime: '18:45',
            birthPlace: 'Bangalore, India',
            latitude: 12.9716,
            longitude: 77.5946,
            timezone: 5.5,
            gender: 'female'
          },
          lifeEvents: [{ year: 2010, event: 'Marriage' }]
        });
      
      const originalId = createRes.body.data.id;
      
      const cloneRes = await request(app)
        .post(`/api/sessions/${originalId}/clone`)
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Test-User-Id', testUserId)
        .expect(200);
      
      expect(cloneRes.body.data.id).not.toBe(originalId);
      expect(cloneRes.body.data.id).toBeDefined();
      
      const originalInDb = await db.query.sessions.findFirst({
        where: eq(sessions.id, originalId)
      });
      
      const cloneInDb = await db.query.sessions.findFirst({
        where: eq(sessions.id, cloneRes.body.data.id)
      });
      
      expect(originalInDb).toBeDefined();
      expect(cloneInDb).toBeDefined();
      expect(cloneInDb?.lifeEvents).toBe(originalInDb?.lifeEvents);
    });

    it('should handle concurrent session creation', async () => {
      const promises = Array(5).fill(null).map((_, i) => 
        request(app)
          .post('/api/sessions')
          .set('Authorization', `Bearer ${authToken}`)
          .set('X-Test-User-Id', testUserId)
          .send({
            birthData: {
              fullName: `Concurrent ${i}`,
              dateOfBirth: '1990-01-01',
              tentativeTime: '12:00',
              birthPlace: 'Mumbai, India',
              latitude: 19.076,
              longitude: 72.877,
              timezone: 5.5,
              gender: 'male'
            }
          })
      );
      
      const results = await Promise.all(promises);
      
      results.forEach(res => {
        expect(res.status).toBe(200);
        expect(res.body.data.id).toBeDefined();
      });
      
      const userSessions = await db.query.sessions.findMany({
        where: eq(sessions.userId, testUserId)
      });
      
      expect(userSessions.length).toBeGreaterThanOrEqual(5);
    });
  });

  describe('Foreign Key Constraints', () => {
    it('should not allow session without valid user', async () => {
      const res = await request(app)
        .post('/api/sessions')
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Test-User-Id', 'non-existent-user-id')
        .send({
          birthData: {
            fullName: 'Orphan Session',
            dateOfBirth: '1990-01-01',
            tentativeTime: '12:00',
            birthPlace: 'Mumbai, India',
            latitude: 19.076,
            longitude: 72.877,
            timezone: 5.5,
            gender: 'male'
          }
        });
      
      expect(res.status).toBe(401);
    });

    it('should cascade delete jobs when session is deleted', async () => {
      const sessionRes = await request(app)
        .post('/api/sessions')
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Test-User-Id', testUserId)
        .send({
          birthData: {
            fullName: 'Session With Jobs',
            dateOfBirth: '1990-01-01',
            tentativeTime: '12:00',
            birthPlace: 'Mumbai, India',
            latitude: 19.076,
            longitude: 72.877,
            timezone: 5.5,
            gender: 'male'
          }
        });
      
      const sessionId = sessionRes.body.data.id;
      
      await db.insert(jobs).values({
        sessionId: sessionId,
        userId: testUserId,
        status: 'pending',
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      const jobsBefore = await db.query.jobs.findMany({
        where: eq(jobs.sessionId, sessionId)
      });
      expect(jobsBefore.length).toBe(1);
      
      await request(app)
        .delete(`/api/sessions/${sessionId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Test-User-Id', testUserId);
      
      const jobsAfter = await db.query.jobs.findMany({
        where: eq(jobs.sessionId, sessionId)
      });
      expect(jobsAfter.length).toBe(0);
    });
  });
});