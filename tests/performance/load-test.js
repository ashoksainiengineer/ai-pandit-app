/**
 * AI-Pandit Load Testing with k6
 * 
 * Industry-standard load testing following k6 best practices.
 * Tests API endpoints under realistic load patterns.
 * 
 * Run: k6 run tests/performance/load-test.js
 */

import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';
import { randomIntBetween } from 'https://jslib.k6.io/k6-utils/1.2.0/index.js';

// ═══════════════════════════════════════════════════════════════════════════════
// CUSTOM METRICS
// ═══════════════════════════════════════════════════════════════════════════════

const errorRate = new Rate('errors');
const apiLatency = new Trend('api_latency');
const successfulRequests = new Counter('successful_requests');
const failedRequests = new Counter('failed_requests');

// ═══════════════════════════════════════════════════════════════════════════════
// TEST CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════════

export const options = {
    // Test stages - ramp up, sustain, ramp down
    stages: [
        { duration: '2m', target: 100 },   // Ramp up to 100 users
        { duration: '5m', target: 100 },   // Stay at 100 users
        { duration: '2m', target: 200 },   // Ramp up to 200 users
        { duration: '5m', target: 200 },   // Stay at 200 users
        { duration: '2m', target: 0 },     // Ramp down to 0
    ],
    
    // Thresholds - fail the test if these are breached
    thresholds: {
        http_req_duration: ['p(95)<2000'], // 95% of requests under 2s
        http_req_failed: ['rate<0.1'],     // Error rate under 10%
        errors: ['rate<0.05'],              // Custom error rate under 5%
        api_latency: ['p(99)<3000'],        // 99th percentile under 3s
    },
    
    // Test metadata
    ext: {
        loadimpact: {
            name: 'AI-Pandit API Load Test',
            projectID: 1,
        },
    },
};

// ═══════════════════════════════════════════════════════════════════════════════
// TEST DATA
// ═══════════════════════════════════════════════════════════════════════════════

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';
const API_KEY = __ENV.API_KEY || 'test-key';

const testBirthCharts = [
    {
        dateOfBirth: '1990-05-15',
        time: '12:00:00',
        latitude: 28.6139,
        longitude: 77.2090,
        timezone: 5.5,
    },
    {
        dateOfBirth: '1985-08-20',
        time: '06:30:00',
        latitude: 19.0760,
        longitude: 72.8777,
        timezone: 5.5,
    },
    {
        dateOfBirth: '1995-12-25',
        time: '18:45:00',
        latitude: 40.7128,
        longitude: -74.0060,
        timezone: -5,
    },
];

// ═══════════════════════════════════════════════════════════════════════════════
// SETUP
// ═══════════════════════════════════════════════════════════════════════════════

export function setup() {
    console.log(`Starting load test against: ${BASE_URL}`);
    
    // Health check
    const healthCheck = http.get(`${BASE_URL}/api/health`);
    check(healthCheck, {
        'health check passes': (r) => r.status === 200,
    });
    
    return { baseUrl: BASE_URL, apiKey: API_KEY };
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN TEST SCENARIO
// ═══════════════════════════════════════════════════════════════════════════════

export default function (data) {
    const baseUrl = data.baseUrl;
    const params = {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${data.apiKey}`,
        },
    };
    
    group('Health & Status', () => {
        const start = Date.now();
        const res = http.get(`${baseUrl}/api/health`, params);
        const duration = Date.now() - start;
        
        apiLatency.add(duration);
        
        const success = check(res, {
            'health status is 200': (r) => r.status === 200,
            'health response time < 500ms': (r) => r.timings.duration < 500,
        });
        
        errorRate.add(!success);
        success ? successfulRequests.add(1) : failedRequests.add(1);
    });
    
    group('Ephemeris Calculations', () => {
        const chart = testBirthCharts[randomIntBetween(0, testBirthCharts.length - 1)];
        
        const start = Date.now();
        const res = http.post(
            `${baseUrl}/api/calculate`,
            JSON.stringify(chart),
            params
        );
        const duration = Date.now() - start;
        
        apiLatency.add(duration);
        
        const success = check(res, {
            'calculate status is 200': (r) => r.status === 200,
            'calculate response has data': (r) => r.json('data') !== null,
            'calculate response time < 3000ms': (r) => r.timings.duration < 3000,
        });
        
        errorRate.add(!success);
        success ? successfulRequests.add(1) : failedRequests.add(1);
    });
    
    group('Session Management', () => {
        // Create session
        const createStart = Date.now();
        const createRes = http.post(
            `${baseUrl}/api/sessions`,
            JSON.stringify({
                fullName: `Test User ${__VU}`,
                dateOfBirth: '1990-05-15',
                tentativeTime: '12:00:00',
                birthPlace: 'Mumbai, India',
                latitude: 19.0760,
                longitude: 72.8777,
                timezone: 5.5,
            }),
            params
        );
        apiLatency.add(Date.now() - createStart);
        
        if (createRes.status === 201) {
            const sessionId = createRes.json('data.id');
            
            // Get session
            const getStart = Date.now();
            const getRes = http.get(`${baseUrl}/api/sessions/${sessionId}`, params);
            apiLatency.add(Date.now() - getStart);
            
            check(getRes, {
                'get session status is 200': (r) => r.status === 200,
            });
            
            successfulRequests.add(2);
        } else {
            failedRequests.add(1);
            errorRate.add(1);
        }
    });
    
    // Random sleep between requests (think time)
    sleep(randomIntBetween(1, 3));
}

// ═══════════════════════════════════════════════════════════════════════════════
// TEARDOWN
// ═══════════════════════════════════════════════════════════════════════════════

export function teardown(data) {
    console.log('Load test completed');
    console.log(`Base URL: ${data.baseUrl}`);
}
