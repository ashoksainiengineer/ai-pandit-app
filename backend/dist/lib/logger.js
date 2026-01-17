"use strict";
// lib/logger.ts
// Simple logger for the application
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = void 0;
exports.logger = {
    debug: (message, data) => {
        console.debug(`[DEBUG] ${message}`, data);
    },
    info: (message, data) => {
        console.info(`[INFO] ${message}`, data);
    },
    warn: (message, data) => {
        console.warn(`[WARN] ${message}`, data);
    },
    error: (message, data) => {
        console.error(`[ERROR] ${message}`, data);
    },
};
//# sourceMappingURL=logger.js.map