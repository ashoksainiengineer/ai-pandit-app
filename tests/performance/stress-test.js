/**
 * AI-Pandit Stress Testing with k6
 * 
 * Stress testing to find breaking points and test recovery.
 * Pushes the system beyond normal capacity.
 * 
 * Run: k6 run tests/performance/stress-test.js
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

const errorRate = new Rate('errors');

export const options = {
    // Stress test stages - push beyond limits
    stages: [
        { duration: '2m', target: 200 },   // Normal load
        { duration: '5m', target: 200 },   // Sustained normal
        { duration: '2m', target: 400 },   // Stress load
        { duration: '5m', target: 400 },   // Sustained stress
        { duration: '2m', target: 600 },   // Spike to breaking point
        { duration: '5m', target: 600 },   // Sustained spike
        { duration: '5m', target: 0 },     // Recovery
    ],
    
    thresholds: {
        http_req_duration: ['p(95)<5000'], // Relaxed threshold for stress
        http_req_failed: ['rate<0.3'],     // Allow up to 30% errors under extreme stress
    },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

export default function () {
    const endpoints = [
        '/api/health',
        '/api/calculate',
        '/api/sessions',
    ];
    
    const endpoint = endpoints[Math.floor(Math.random() * endpoints.length)];
    
    const res = http.get(`${BASE_URL}${endpoint}`, {
        headers: {
            'Authorization': `Bearer ${__ENV.API_KEY || 'test-key'}`,
        },
    });
    
    const success = check(res, {
        'status is acceptable': (r) => r.status < 500, // Accept 4xx, reject 5xx
    });
    
    errorRate.add(!success);
    
    sleep(Math.random() * 2);
}
