// lib/logger.ts
// Simple logger for the application

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface Logger {
  debug: (message: string, data?: any) => void;
  info: (message: string, data?: any) => void;
  warn: (message: string, data?: any) => void;
  error: (message: string, data?: any) => void;
}

export const logger: Logger = {
  debug: (message: string, data?: any) => {
    if (data) console.debug(`[DEBUG] ${message}`, data);
    else console.debug(`[DEBUG] ${message}`);
  },
  info: (message: string, data?: any) => {
    if (data) console.info(`[INFO] ${message}`, data);
    else console.info(`[INFO] ${message}`);
  },
  warn: (message: string, data?: any) => {
    if (data) console.warn(`[WARN] ${message}`, data);
    else console.warn(`[WARN] ${message}`);
  },
  error: (message: string, data?: any) => {
    if (data) console.error(`[ERROR] ${message}`, data);
    else console.error(`[ERROR] ${message}`);
  },
};