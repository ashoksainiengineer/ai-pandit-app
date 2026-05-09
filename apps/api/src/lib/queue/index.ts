import { config } from '../../config/index.js';
import type { QueueDriver } from './driver.js';
import { DbPollingQueueDriver } from './drivers/db-polling.js';
import { RedisBullMqQueueDriver } from './drivers/redis-bullmq.js';
import { AppError, ErrorCodes } from '../../errors/index.js';

let queueDriver: QueueDriver | null = null;

export function getQueueDriver(): QueueDriver {
  if (queueDriver) {
    return queueDriver;
  }

  const architecture = config.queue?.architecture ?? 'db_polling';

  switch (architecture) {
    case 'db_polling':
      queueDriver = new DbPollingQueueDriver();
      return queueDriver;
    case 'redis_bullmq':
      queueDriver = new RedisBullMqQueueDriver();
      return queueDriver;
    default:
      throw new AppError(ErrorCodes.INTERNAL_ERROR, `Unsupported queue architecture: ${architecture}`);
  }
}

export function __resetQueueDriverForTests(): void {
  queueDriver = null;
}
