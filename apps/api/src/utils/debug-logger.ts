import fs from 'fs';
import path from 'path';

const DEBUG_LOG_FILE = path.join(process.cwd(), 'logs', 'debug-analysis.log');

export function logAnalysisContainerAction(stage: number | string, context: string, payload: any) {
    const entry = JSON.stringify({
        timestamp: new Date().toISOString(),
        stage,
        context,
        payload
    }) + '\n';

    try {
        if (!fs.existsSync(path.dirname(DEBUG_LOG_FILE))) {
            fs.mkdirSync(path.dirname(DEBUG_LOG_FILE), { recursive: true });
        }
        fs.appendFileSync(DEBUG_LOG_FILE, entry);
    } catch (e) {
        // Soft fail
    }
}

export function clearDebugLog() {
    try {
        if (fs.existsSync(DEBUG_LOG_FILE)) {
            fs.unlinkSync(DEBUG_LOG_FILE);
        }
    } catch (e) { }
}

export function readDebugLog() {
    try {
        if (!fs.existsSync(DEBUG_LOG_FILE)) return [];
        const content = fs.readFileSync(DEBUG_LOG_FILE, 'utf-8');
        return content.split('\n').filter(Boolean).map(line => {
            try { return JSON.parse(line); } catch (e) { return null; }
        }).filter(Boolean);
    } catch (e) {
        return [];
    }
}
