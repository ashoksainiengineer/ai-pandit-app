import { RedisBullMqQueueDriver } from './drivers/redis-bullmq.js';
import type { QueueDriver } from './driver.js';

let queueDriver: QueueDriver | null = null;

/**
 * Returns the Redis BullMQ queue driver (the ONLY queue driver).
 * No architecture switch — Redis is the single transport for job queuing.
 */
export function getQueueDriver(): QueueDriver {
  if (queueDriver) {
    return queueDriver;
  }
  const driver = new RedisBullMqQueueDriver();
  queueDriver = driver;
  return driver;
}

/** Reset singleton for test isolation. */
export function __resetQueueDriverForTests(): void {
  queueDriver = null;
}
