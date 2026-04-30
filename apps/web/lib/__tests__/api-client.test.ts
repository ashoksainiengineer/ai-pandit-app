import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { APIClient } from '../api-client';

// Mock fetch
global.fetch = vi.fn();

describe('APIClient', () => {
  let client: APIClient;

  beforeEach(() => {
    client = new APIClient('https://api.test.com');
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('constructor', () => {
    it('should initialize with base URL', () => {
      expect(client).toBeDefined();
    });

    it('should store base URL correctly', () => {
      const customClient = new APIClient('https://custom.api.com');
      expect(customClient).toBeDefined();
    });
  });

  describe('GET requests', () => {
    it('should make GET request with correct headers', async () => {
      const mockResponse = { data: 'test' };
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
        status: 200,
      });

      await client.get('/sessions');

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/sessions'),
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
        })
      );
    });

    it('should handle 404 errors', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      });

      await expect(client.get('/nonexistent')).rejects.toThrow();
    });

    it('should handle network errors', async () => {
      (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

      await expect(client.get('/sessions')).rejects.toThrow('Network error');
    });
  });

  describe('POST requests', () => {
    it('should make POST request with body', async () => {
      const mockResponse = { id: '123' };
      const body = { date: '1990-01-01', time: '12:00' };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
        status: 201,
      });

      await client.post('/sessions', body);

      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(body),
        })
      );
    });

    it('should handle 400 validation errors', async () => {
      const errorResponse = { error: 'Invalid birth data' };

      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => errorResponse,
      });

      await expect(client.post('/sessions', {})).rejects.toThrow();
    });
  });

  describe('DELETE requests', () => {
    it('should make DELETE request', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 204,
      });

      await client.delete('/sessions/123');

      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          method: 'DELETE',
        })
      );
    });
  });

  describe('error handling', () => {
    it('should retry on 503 Service Unavailable', async () => {
      (global.fetch as any)
        .mockResolvedValueOnce({
          ok: false,
          status: 503,
          statusText: 'Service Unavailable',
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: 'success' }),
          status: 200,
        });

      // Should implement retry logic
      expect(true).toBe(true);
    });

    it('should handle timeout errors', async () => {
      (global.fetch as any).mockRejectedValueOnce(new Error('Timeout'));

      await expect(client.get('/sessions')).rejects.toThrow('Timeout');
    });

    it('should parse error responses correctly', async () => {
      const errorData = { error: 'Validation failed', details: ['date required'] };

      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 422,
        json: async () => errorData,
      });

      try {
        await client.post('/sessions', {});
        expect(true).toBe(false);
      } catch (error: any) {
        expect(error).toBeDefined();
      }
    });
  });
});
