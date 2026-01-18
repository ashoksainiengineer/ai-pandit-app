"use strict";
// lib/logger.ts
// Simple logger for the application
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = void 0;
exports.logger = {
    debug: (message, data) => {
        if (data)
            console.debug(`[DEBUG] ${message}`, data);
        else
            console.debug(`[DEBUG] ${message}`);
    },
    info: (message, data) => {
        if (data)
            console.info(`[INFO] ${message}`, data);
        else
            console.info(`[INFO] ${message}`);
    },
    warn: (message, data) => {
        if (data)
            console.warn(`[WARN] ${message}`, data);
        else
            console.warn(`[WARN] ${message}`);
    },
    error: (message, data) => {
        if (data)
            console.error(`[ERROR] ${message}`, data);
        else
            console.error(`[ERROR] ${message}`);
    },
};
//# sourceMappingURL=logger.js.map