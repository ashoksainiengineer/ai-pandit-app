import { Redis as IORedis } from 'ioredis';
import type { RedisClient } from './event-store.js';

export function adaptIORedis(redis: IORedis): RedisClient {
  return {
    async get(key: string): Promise<string | null> {
      const result = await redis.get(key);
      return result ?? null;
    },

    async set(key: string, value: string, ttl?: number): Promise<void> {
      if (ttl) {
        await redis.set(key, value, 'EX', ttl);
      } else {
        await redis.set(key, value);
      }
    },

    async lpush(key: string, ...values: string[]): Promise<number> {
      return redis.lpush(key, ...values);
    },

    async rpop(key: string, count?: number): Promise<string[]> {
      const result = await redis.rpop(key, count ?? 1);
      if (result === null) return [];
      return Array.isArray(result) ? result : [result];
    },

    async lrange(key: string, start: number, stop: number): Promise<string[]> {
      return redis.lrange(key, start, stop);
    },

    async llen(key: string): Promise<number> {
      return redis.llen(key);
    },

    async ltrim(key: string, start: number, stop: number): Promise<void> {
      await redis.ltrim(key, start, stop);
    },

    async hset(key: string, field: string, value: string): Promise<number> {
      return redis.hset(key, field, value);
    },

    async hget(key: string, field: string): Promise<string | null> {
      const result = await redis.hget(key, field);
      return result ?? null;
    },

    async hgetall(key: string): Promise<Record<string, string>> {
      return redis.hgetall(key);
    },

    async hdel(key: string, ...fields: string[]): Promise<number> {
      return redis.hdel(key, ...fields);
    },

    async expire(key: string, seconds: number): Promise<boolean> {
      const result = await redis.expire(key, seconds);
      return result === 1;
    },

    async del(key: string): Promise<number> {
      return redis.del(key);
    },

    async exists(key: string): Promise<number> {
      return redis.exists(key);
    },

    async publish(channel: string, message: string): Promise<number> {
      return redis.publish(channel, message);
    },

    async subscribe(channel: string, callback: (message: string) => void): Promise<void> {
      await redis.subscribe(channel);
      redis.on('message', (chan: string, msg: string) => {
        if (chan === channel) {
          callback(msg);
        }
      });
    },

    async ping(): Promise<boolean> {
      try {
        const result = await redis.ping();
        return result === 'PONG';
      } catch {
        return false;
      }
    },
  };
}
