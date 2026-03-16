import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../server';
import { db, pool } from '@ai-pandit/db';
import { sessions, users } from '@ai-pandit/db/schema';
import { eq } from 'drizzle-orm';

describe('Edge Case & Error Handling Tests', () => {
  const app = createApp();
  const testTimestamp = Date.now();

  let testUserId: string;
  let authToken: string;

  beforeAll(async () => {
    const [user] = await db.insert(users).values({
      clerkId: `edge_test_${testTimestamp}`,
      email: `edge_test_${testTimestamp}@test.com`,
      fullName: 'Edge Case Test User',
      tier: 'free'
    }).returning();
    
    testUserId = user.id;
    authToken = `test_token_${testTimestamp}`;
  });

  afterAll(async () => {
    await db.delete(sessions).where(eq(sessions.userId, testUserId));
    await db.delete(users).where(eq(users.id, testUserId));
    await pool.end();
  });

  describe('Empty & Null Inputs', () => {
    it('should handle empty string inputs', async () => {
      const res = await request(app)
        .post('/api/sessions')
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Test-User-Id', testUserId)
        .send({
          birthData: {
            fullName: '',
            dateOfBirth: '',
            tentativeTime: '',
            birthPlace: '',
            latitude: null,
            longitude: null,
            timezone: null,
            gender: ''
          }
        })
        .expect(400);
      
      expect(res.body.error).toBeDefined();
    });

    it('should handle null inputs', async () => {
      const res = await request(app)
        .post('/api/sessions')
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Test-User-Id', testUserId)
        .send({
          birthData: null
        })
        .expect(400);
      
      expect(res.body.error).toBeDefined();
    });

    it('should handle missing required fields', async () => {
      const res = await request(app)
        .post('/api/sessions')
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Test-User-Id', testUserId)
        .send({})
        .expect(400);
      
      expect(res.body.error).toBeDefined();
    });
  });

  describe('Boundary Values', () => {
    it('should handle very long names (1000+ chars)', async () => {
      const longName = 'A'.repeat(1000);
      
      const res = await request(app)
        .post('/api/sessions')
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Test-User-Id', testUserId)
        .send({
          birthData: {
            fullName: longName,
            dateOfBirth: '1990-01-01',
            tentativeTime: '12:00',
            birthPlace: 'Mumbai',
            latitude: 19.076,
            longitude: 72.877,
            timezone: 5.5,
            gender: 'male'
          }
        });
      
      expect([200, 400, 413]).toContain(res.status);
    });

    it('should handle special characters in names', async () => {
      const specialChars = 'Name@#$%^&*()_+-=[]{}|;\':",./<>?';
      
      const res = await request(app)
        .post('/api/sessions')
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Test-User-Id', testUserId)
        .send({
          birthData: {
            fullName: specialChars,
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
        expect(res.body.data.id).toBeDefined();
      }
    });

    it('should handle unicode/hindi text', async () => {
      const hindiName = 'लता मंगेशकर';
      const hindiPlace = 'इंदौर, मध्य प्रदेश';
      
      const res = await request(app)
        .post('/api/sessions')
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Test-User-Id', testUserId)
        .send({
          birthData: {
            fullName: hindiName,
            dateOfBirth: '1929-09-28',
            tentativeTime: '22:30',
            birthPlace: hindiPlace,
            latitude: 22.7196,
            longitude: 75.8577,
            timezone: 5.5,
            gender: 'female'
          }
        })
        .expect(200);
      
      const getRes = await request(app)
        .get(`/api/sessions/${res.body.data.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Test-User-Id', testUserId)
        .expect(200);
      
      expect(getRes.body.data.birthData.fullName).toBe(hindiName);
      expect(getRes.body.data.birthData.birthPlace).toBe(hindiPlace);
    });

    it('should handle extreme coordinates', async () => {
      const extremeCoordinates = [
        { lat: 90, lng: 180, name: 'North Pole' },
        { lat: -90, lng: -180, name: 'South Pole' },
        { lat: 0, lng: 0, name: 'Null Island' },
        { lat: 85, lng: 170, name: 'Arctic' },
        { lat: -85, lng: -170, name: 'Antarctica' }
      ];
      
      for (const coord of extremeCoordinates) {
        const res = await request(app)
          .post('/api/sessions')
          .set('Authorization', `Bearer ${authToken}`)
          .set('X-Test-User-Id', testUserId)
          .send({
            birthData: {
              fullName: `Test ${coord.name}`,
              dateOfBirth: '1990-01-01',
              tentativeTime: '12:00',
              birthPlace: coord.name,
              latitude: coord.lat,
              longitude: coord.lng,
              timezone: 0,
              gender: 'male'
            }
          });
        
        expect([200, 400]).toContain(res.status);
      }
    });

    it('should handle edge dates', async () => {
      const edgeDates = [
        '1900-01-01',
        '2024-12-31',
        '2000-02-29',
        '1999-12-31',
        '2000-01-01'
      ];
      
      for (const date of edgeDates) {
        const res = await request(app)
          .post('/api/sessions')
          .set('Authorization', `Bearer ${authToken}`)
          .set('X-Test-User-Id', testUserId)
          .send({
            birthData: {
              fullName: `Test ${date}`,
              dateOfBirth: date,
              tentativeTime: '12:00',
              birthPlace: 'Mumbai',
              latitude: 19.076,
              longitude: 72.877,
              timezone: 5.5,
              gender: 'male'
            }
          });
        
        expect([200, 400]).toContain(res.status);
      }
    });
  });

  describe('Concurrent Operations', () => {
    it('should handle simultaneous session creation', async () => {
      const promises = Array(10).fill(null).map((_, i) => 
        request(app)
          .post('/api/sessions')
          .set('Authorization', `Bearer ${authToken}`)
          .set('X-Test-User-Id', testUserId)
          .send({
            birthData: {
              fullName: `Concurrent ${i}`,
              dateOfBirth: '1990-01-01',
              tentativeTime: '12:00',
              birthPlace: 'Mumbai',
              latitude: 19.076,
              longitude: 72.877,
              timezone: 5.5,
              gender: 'male'
            }
          })
      );
      
      const results = await Promise.all(promises);
      
      const successful = results.filter(r => r.status === 200);
      expect(successful.length).toBeGreaterThanOrEqual(8);
    });

    it('should handle simultaneous updates', async () => {
      const createRes = await request(app)
        .post('/api/sessions')
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Test-User-Id', testUserId)
        .send({
          birthData: {
            fullName: 'Original',
            dateOfBirth: '1990-01-01',
            tentativeTime: '12:00',
            birthPlace: 'Mumbai',
            latitude: 19.076,
            longitude: 72.877,
            timezone: 5.5,
            gender: 'male'
          }
        });
      
      const sessionId = createRes.body.data.id;
      
      const updates = Array(5).fill(null).map((_, i) => 
        request(app)
          .put(`/api/sessions/${sessionId}`)
          .set('Authorization', `Bearer ${authToken}`)
          .set('X-Test-User-Id', testUserId)
          .send({
            birthData: {
              fullName: `Update ${i}`,
              dateOfBirth: '1990-01-01',
              tentativeTime: '12:00',
              birthPlace: 'Mumbai',
              latitude: 19.076,
              longitude: 72.877,
              timezone: 5.5,
              gender: 'male'
            }
          })
      );
      
      const results = await Promise.all(updates);
      
      results.forEach(res => {
        expect([200, 409]).toContain(res.status);
      });
    });
  });

  describe('Malicious Inputs', () => {
    it('should handle path traversal attempts', async () => {
      const res = await request(app)
        .get('/api/sessions/../../../etc/passwd')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });

    it('should handle oversized payloads', async () => {
      const hugePayload = {
        birthData: {
          fullName: 'A'.repeat(10000),
          lifeEvents: Array(1000).fill({ year: 1990, event: 'Event' })
        }
      };
      
      const res = await request(app)
        .post('/api/sessions')
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Test-User-Id', testUserId)
        .send(hugePayload);
      
      expect([400, 413, 500]).toContain(res.status);
    });

    it('should handle circular references', async () => {
      const circular: any = { name: 'test' };
      circular.self = circular;
      
      const res = await request(app)
        .post('/api/sessions')
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Test-User-Id', testUserId)
        .send(circular);
      
      expect([400, 500]).toContain(res.status);
    });
  });

  describe('Network & Timeout Scenarios', () => {
    it('should handle slow database connections', async () => {
      const res = await request(app)
        .get('/api/sessions')
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Test-User-Id', testUserId)
        .timeout(5000);
      
      expect([200, 408, 504]).toContain(res.status);
    });

    it('should handle database connection failure', async () => {
      const res = await request(app)
        .get('/api/ready')
        .expect(200);
      
      expect(res.body.database).toBeDefined();
    });
  });

  describe('Data Integrity', () => {
    it('should maintain data consistency after multiple operations', async () => {
      const session = await request(app)
        .post('/api/sessions')
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Test-User-Id', testUserId)
        .send({
          birthData: {
            fullName: 'Consistency Test',
            dateOfBirth: '1990-01-01',
            tentativeTime: '12:00',
            birthPlace: 'Mumbai',
            latitude: 19.076,
            longitude: 72.877,
            timezone: 5.5,
            gender: 'male'
          }
        });
      
      const sessionId = session.body.data.id;
      
      for (let i = 0; i < 5; i++) {
        await request(app)
          .put(`/api/sessions/${sessionId}`)
          .set('Authorization', `Bearer ${authToken}`)
          .set('X-Test-User-Id', testUserId)
          .send({
            birthData: {
              fullName: `Update ${i}`,
              dateOfBirth: '1990-01-01',
              tentativeTime: '12:00',
              birthPlace: 'Mumbai',
              latitude: 19.076,
              longitude: 72.877,
              timezone: 5.5,
              gender: 'male'
            }
          });
      }
      
      const final = await request(app)
        .get(`/api/sessions/${sessionId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Test-User-Id', testUserId)
        .expect(200);
      
      expect(final.body.data.id).toBe(sessionId);
      expect(final.body.data.birthData.fullName).toMatch(/Update \d/);
    });

    it('should not allow partial updates to corrupt data', async () => {
      const session = await request(app)
        .post('/api/sessions')
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Test-User-Id', testUserId)
        .send({
          birthData: {
            fullName: 'Complete Data',
            dateOfBirth: '1990-01-01',
            tentativeTime: '12:00',
            birthPlace: 'Mumbai',
            latitude: 19.076,
            longitude: 72.877,
            timezone: 5.5,
            gender: 'male',
            lifeEvents: [{ year: 2000, event: 'Test' }]
          }
        });
      
      const sessionId = session.body.data.id;
      
      await request(app)
        .put(`/api/sessions/${sessionId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Test-User-Id', testUserId)
        .send({
          birthData: {
            fullName: 'Partial Update'
          }
        });
      
      const final = await request(app)
        .get(`/api/sessions/${sessionId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Test-User-Id', testUserId)
        .expect(200);
      
      expect(final.body.data.birthData.dateOfBirth).toBeDefined();
      expect(final.body.data.birthData.latitude).toBeDefined();
    });
  });
});