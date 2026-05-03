import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../server.js';
import { db, pool } from '@ai-pandit/db';
import { sessions, users } from '@ai-pandit/db/schema';
import { eq } from 'drizzle-orm';

describe('API Integration Tests', () => {
  const app = createApp();
  const testUser = {
    clerkId: 'test_clerk_id_' + Date.now(),
    email: 'test@example.com',
    fullName: 'Test User'
  };
  let authToken: string;

  beforeAll(async () => {
    // Clean up test data
    await db.delete(sessions).where(eq(sessions.clerkId, testUser.clerkId));
    await db.delete(users).where(eq(users.clerkId, testUser.clerkId));
    
    // Create test user
    const [user] = await db.insert(users).values({
      clerkId: testUser.clerkId,
      email: testUser.email,
      fullName: testUser.fullName,
    } as any).returning();
    
    authToken = 'test_token_' + user.id;
  });

  afterAll(async () => {
    // Clean up
    await db.delete(sessions).where(eq(sessions.clerkId, testUser.clerkId));
    await db.delete(users).where(eq(users.clerkId, testUser.clerkId));
    await pool.end();
  });

  describe('Health Endpoints', () => {
    it('GET /health should return 200', async () => {
      const res = await request(app)
        .get('/health')
        .expect(200);
      
      expect(res.body).toHaveProperty('status', 'healthy');
    });

    it('GET /ready should check DB connection', async () => {
      const res = await request(app)
        .get('/ready')
        .expect(200);
      
      expect(res.body).toHaveProperty('ready', true);
      expect(res.body).toHaveProperty('database');
    });
  });

  describe('Session Management', () => {
    it('should create, read, update, delete session', async () => {
      // Create session
      const createRes = await request(app)
        .post('/api/sessions')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          birthData: {
            fullName: 'Test Person',
            dateOfBirth: '1990-01-01',
            tentativeTime: '12:00',
            birthPlace: 'Mumbai, India',
            latitude: 19.076,
            longitude: 72.877,
            timezone: 5.5,
            gender: 'female'
          },
          lifeEvents: [],
          forensicTraits: {},
          offsetConfig: { preset: '2hours', minutes: 120 }
        })
        .expect(200);
      
      const sessionId = createRes.body.data.id;
      expect(sessionId).toBeDefined();
      
      // Get session
      const getRes = await request(app)
        .get(`/api/sessions/${sessionId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      
      expect(getRes.body.data).toHaveProperty('id', sessionId);
      
      // Update session
      await request(app)
        .put(`/api/sessions/${sessionId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          birthData: {
            fullName: 'Updated Name',
            dateOfBirth: '1990-01-01',
            tentativeTime: '12:00',
            birthPlace: 'Delhi, India',
            latitude: 28.6139,
            longitude: 77.209,
            timezone: 5.5,
            gender: 'female'
          }
        })
        .expect(200);
      
      // Delete session
      await request(app)
        .delete(`/api/sessions/${sessionId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      
      // Verify deletion
      await request(app)
        .get(`/api/sessions/${sessionId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });

    it('should list user sessions', async () => {
      // Create test session
      await request(app)
        .post('/api/sessions')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          birthData: {
            fullName: 'List Test',
            dateOfBirth: '1995-05-15',
            tentativeTime: '06:30',
            birthPlace: 'Chennai, India',
            latitude: 13.0827,
            longitude: 80.2707,
            timezone: 5.5,
            gender: 'male'
          }
        });
      
      const res = await request(app)
        .get('/api/sessions')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
    });

    it('should clone session', async () => {
      // Create original
      const original = await request(app)
        .post('/api/sessions')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          birthData: {
            fullName: 'Original',
            dateOfBirth: '1985-08-20',
            tentativeTime: '18:45',
            birthPlace: 'Bangalore, India',
            latitude: 12.9716,
            longitude: 77.5946,
            timezone: 5.5,
            gender: 'female'
          }
        });
      
      const originalId = original.body.data.id;
      
      // Clone
      const clone = await request(app)
        .post(`/api/sessions/${originalId}/clone`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      
      expect(clone.body.data.id).not.toBe(originalId);
      expect(clone.body.data.birthData.fullName).toBe('Original (Copy)');
      
      // Clean up
      await request(app)
        .delete(`/api/sessions/${originalId}`)
        .set('Authorization', `Bearer ${authToken}`);
      
      await request(app)
        .delete(`/api/sessions/${clone.body.data.id}`)
        .set('Authorization', `Bearer ${authToken}`);
    });
  });

  describe('Error Handling', () => {
    it('should return 401 without auth token', async () => {
      await request(app)
        .get('/api/sessions')
        .expect(401);
    });

    it('should return 404 for non-existent session', async () => {
      await request(app)
        .get('/api/sessions/non-existent-id')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });

    it('should validate required fields', async () => {
      const res = await request(app)
        .post('/api/sessions')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          birthData: {
            // Missing required fields
            fullName: '',
            dateOfBirth: ''
          }
        })
        .expect(400);
      
      expect(res.body).toHaveProperty('error');
    });
  });
});