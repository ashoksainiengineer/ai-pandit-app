import fs from 'fs';
import path from 'path';
import { config } from '../config/index.js';
import { safeJsonParse } from '../lib/utils/safe-json-parse.js';

const DEBUG_LOG_FILE = path.join(process.cwd(), 'logs', 'debug-analysis.log');

const REDACT_KEYS = ['token', 'authorization', 'apiKey', 'secret', 'cookie', 'sid', 'password'];

function sanitizePayload(payload: unknown, depth: number = 0): unknown {
    if (depth > 5) return '[TRUNCATED_DEPTH]';

    if (typeof payload === 'string') {
        return payload.length > 1000 ? `${payload.slice(0, 1000)}...[TRUNCATED]` : payload;
    }

    if (!payload || typeof payload !== 'object') {
        return payload;
    }

    if (Array.isArray(payload)) {
        return payload.slice(0, 50).map((item) => sanitizePayload(item, depth + 1));
    }

    const out: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(payload as Record<string, unknown>)) {
        const lower = key.toLowerCase();
        if (REDACT_KEYS.some((k) => lower.includes(k))) {
            out[key] = '[REDACTED]';
            continue;
        }
        out[key] = sanitizePayload(value, depth + 1);
    }
    return out;
}

export function logAnalysisContainerAction(stage: number | string, context: string, payload: unknown) {
    if (!config.app.isDevelopment) return;

    const entry = JSON.stringify({
        timestamp: new Date().toISOString(),
        stage,
        context,
        payload: sanitizePayload(payload)
    }) + '\n';

    try {
        // BUG-FIX: mkdirSync recursive is idempotent — no existsSync TOCTOU
        fs.mkdirSync(path.dirname(DEBUG_LOG_FILE), { recursive: true });
        fs.appendFileSync(DEBUG_LOG_FILE, entry);
    } catch (e) {
        console.error('Failed to write debug log:', e);
    }
}

export function clearDebugLog() {
    if (!config.app.isDevelopment) return;

    try {
        if (fs.existsSync(DEBUG_LOG_FILE)) {
            fs.unlinkSync(DEBUG_LOG_FILE);
        }
    } catch (e) {
        console.error('Failed to clear debug log:', e);
    }
}

export function readDebugLog() {
    if (!config.app.isDevelopment) return [];

    try {
        if (!fs.existsSync(DEBUG_LOG_FILE)) return [];
        const content = fs.readFileSync(DEBUG_LOG_FILE, 'utf-8');
        return content.split('\n').filter(Boolean).map(line => safeJsonParse(line, null)).filter(Boolean);
    } catch (e) {
        return [];
    }
}
