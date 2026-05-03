import { describe, it, expect } from 'vitest';
import { sessions, jobs, users } from '../schema.js';

describe('Database Schema', () => {
  describe('Sessions Table', () => {
    it('should be defined', () => {
      expect(sessions).toBeDefined();
    });

    it('should have id column', () => {
      expect(sessions.id).toBeDefined();
    });

    it('should have userId column', () => {
      expect(sessions.userId).toBeDefined();
    });

    it('should have status column', () => {
      expect(sessions.status).toBeDefined();
    });

    it('should have createdAt column', () => {
      expect(sessions.createdAt).toBeDefined();
    });
  });

  describe('Jobs Table', () => {
    it('should be defined', () => {
      expect(jobs).toBeDefined();
    });

    it('should have id column', () => {
      expect(jobs.id).toBeDefined();
    });

    it('should have sessionId column', () => {
      expect(jobs.sessionId).toBeDefined();
    });

    it('should have status column', () => {
      expect(jobs.status).toBeDefined();
    });
  });

  describe('Users Table', () => {
    it('should be defined', () => {
      expect(users).toBeDefined();
    });

    it('should have id column', () => {
      expect(users.id).toBeDefined();
    });

    it('should have email column', () => {
      expect(users.email).toBeDefined();
    });
  });

  describe('Enums', () => {
    it('should have job status enum', () => {
      const { jobStatusEnum } = require('../schema');
      expect(jobStatusEnum).toBeDefined();
    });

    it('should have job kind enum', () => {
      const { jobKindEnum } = require('../schema');
      expect(jobKindEnum).toBeDefined();
    });
  });
});
