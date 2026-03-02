import http from 'k6/http';
import { check, sleep } from 'k6';

/**
 * 🚀 AI-Pandit Elite Load Testing (Backend Resilience)
 * Purpose: Identify the exact breaking point of the Express Event Loop and Turso SQLite locks.
 * How to run: 
 *   1. Start the backend: `npm run dev` in apps/api
 *   2. Run K6: `k6 run scripts/load-tests/btr-flow.js`
 */

export const options = {
    stages: [
        { duration: '10s', target: 50 },  // Ramp-up to 50 users quickly
        { duration: '30s', target: 100 }, // Sustain 100 concurrent users hitting DB/Memory
        { duration: '10s', target: 10 },  // Scale down
        { duration: '10s', target: 0 },   // Cool down
    ],
    thresholds: {
        // 95% of requests must complete within 2 seconds (strict for nodejs + DB)
        http_req_duration: ['p(95)<2000'],
        // Less than 1% of requests are allowed to fail (verifies SQLite lock handling)
        http_req_failed: ['rate<0.01'],
    },
};

const BASE_URL = __ENV.API_URL || 'http://localhost:8080';

export default function () {
    // We hit the /api/health/metrics endpoint recursively because:
    // 1. It makes an active connection to the Turso Database (`checkDatabaseHealth`)
    // 2. It calculates memory and CPU (`collectMetrics`), stressing the event loop
    const res = http.get(`${BASE_URL}/api/health/metrics`);

    check(res, {
        'status is 200': (r) => r.status === 200,
        'database is healthy': (r) => {
            try {
                const body = JSON.parse(r.body);
                return body.database && body.database.healthy === true;
            } catch (e) {
                return false;
            }
        },
        'response time OK (<2s)': (r) => r.timings.duration < 2000,
    });

    // Short sleep to simulate real-world request patterns
    sleep(Math.random() * 1);
}
