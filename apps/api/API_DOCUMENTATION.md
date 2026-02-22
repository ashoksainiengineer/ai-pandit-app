# AI-Pandit API Documentation

## Overview

Production-grade Birth Time Rectification (BTR) system API. All endpoints return JSON responses with standardized formatting.

**Base URL:** `https://api.ai-pandit.com` (production) / `http://localhost:3001` (development)

**Authentication:** Clerk JWT tokens via `Authorization: Bearer <token>` header

---

## Response Format

### Success Response
```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "timestamp": "2026-01-31T13:42:19.662Z",
    "requestId": "uuid-v4"
  }
}
```

### Error Response
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input provided",
    "details": { ... }
  },
  "meta": {
    "timestamp": "2026-01-31T13:42:19.662Z"
  }
}
```

---

## Authentication

All endpoints (except health check) require authentication via Clerk JWT.

**Header:** `Authorization: Bearer <clerk_jwt_token>`

### Auth Errors
| Status | Code | Description |
|--------|------|-------------|
| 401 | UNAUTHORIZED | Missing or invalid token |
| 403 | FORBIDDEN | Valid token but insufficient permissions |

---

## Endpoints

### Health Check

#### GET `/health`
System health status - no authentication required.

**Response:**
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "timestamp": "2026-01-31T13:42:19.662Z",
    "version": "2.0.0",
    "uptime": 86400
  }
}
```

#### GET `/health/ready`
Readiness probe for Kubernetes.

#### GET `/health/live`
Liveness probe for Kubernetes.

#### GET `/health/metrics`
System metrics (memory, database connections, queue size).

---

### Sessions

#### POST `/api/sessions`
Create a new BTR session.

**Request Body:**
```json
{
  "fullName": "Rahul Sharma",
  "dateOfBirth": "1990-05-15",
  "tentativeTime": "14:30:00",
  "birthPlace": "Mumbai, India",
  "latitude": 19.076,
  "longitude": 72.877,
  "timezone": "Asia/Kolkata",
  "gender": "male",
  "physicalTraits": { ... },
  "forensicTraits": { ... },
  "lifeEvents": [ ... ],
  "spouseData": { ... },
  "offsetConfig": {
    "preset": "1hour",
    "customMinutes": null
  }
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "sessionId": "sess_abc123",
    "status": "draft",
    "createdAt": "2026-01-31T13:42:19.662Z"
  }
}
```

#### GET `/api/sessions/:id`
Get session details.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "sess_abc123",
    "status": "completed",
    "fullName": "Rahul Sharma",
    "dateOfBirth": "1990-05-15",
    "tentativeTime": "14:30:00",
    "rectifiedTime": "14:28:32",
    "accuracy": 92,
    "confidence": "HIGH",
    "analysisResult": { ... },
    "createdAt": "2026-01-31T13:42:19.662Z",
    "completedAt": "2026-01-31T13:47:23.891Z"
  }
}
```

#### PATCH `/api/sessions/:id`
Update session data (only when status is 'draft').

#### DELETE `/api/sessions/:id`
Soft delete a session.

---

### BTR Processing

#### POST `/api/calculate`
Submit session for BTR processing.

**Request Body:**
```json
{
  "sessionId": "sess_abc123",
  "consentGiven": true
}
```

**Response (202 Accepted):**
```json
{
  "success": true,
  "data": {
    "sessionId": "sess_abc123",
    "status": "queued",
    "queuePosition": 3,
    "estimatedWaitSeconds": 480
  }
}
```

**Error Codes:**
- `QUEUE_FULL` (503) - Processing queue is at capacity
- `SESSION_NOT_FOUND` (404) - Invalid session ID
- `AI_SERVICE_ERROR` (502) - AI service unavailable

---

### Queue Management

#### GET `/api/queue/status/:sessionId`
Get current queue status and progress.

**Response:**
```json
{
  "success": true,
  "data": {
    "sessionId": "sess_abc123",
    "status": "processing",
    "position": null,
    "progress": {
      "currentStep": 4,
      "totalSteps": 6,
      "message": "Deep Multi-Dasha Analysis: 7 survivors"
    },
    "estimatedTimeRemaining": 120
  }
}
```

**Status Values:**
- `pending` - Awaiting submission
- `queued` - In queue, waiting for processing
- `processing` - Currently being analyzed
- `complete` - Analysis finished
- `failed` - Error occurred
- `cancelled` - Cancelled by user

#### POST `/api/queue/cancel`
Cancel a queued/processing session.

**Request Body:**
```json
{
  "sessionId": "sess_abc123"
}
```

---

### Streaming

#### GET `/api/stream/:sessionId`
Server-sent events (SSE) stream for real-time progress updates.

**Headers:**
```
Accept: text/event-stream
Authorization: Bearer <token>
```

**Event Types:**

```
event: progress
data: {"step": 2, "totalSteps": 6, "message": "Batch Tournament..."}

event: candidateScore
data: {"time": "14:28:30", "score": 85, "stage": 2}

event: stageStats
data: {"stage": 2, "candidatesIn": 120, "candidatesOut": 36}

event: aiThinking
data: {"thinking": "Analyzing Dasha patterns..."}

event: complete
data: {"rectifiedTime": "14:28:32", "accuracy": 92, "confidence": "HIGH"}

event: error
data: {"code": "AI_TIMEOUT", "message": "..."}
```

---

### Consent

#### POST `/api/consent`
Record AI processing consent.

**Request Body:**
```json
{
  "sessionId": "sess_abc123",
  "consentGiven": true,
  "ipAddress": "192.168.1.1"
}
```

---

## Data Types

### BirthData
```typescript
interface BirthData {
  fullName: string;
  dateOfBirth: string; // YYYY-MM-DD
  tentativeTime: string; // HH:MM:SS
  birthPlace: string;
  latitude: number;
  longitude: number;
  timezone: string; // IANA format
  gender?: 'male' | 'female' | 'other';
}
```

### ForensicTraits
```typescript
interface ForensicTraits {
  physical: {
    facialStructure: {
      forehead: string;
      eyeShape: string;
      noseType: string;
      teethAlignment: string;
      voicePitch: string;
    };
    skinHair: {
      hairType: string;
      texture: string;
      complexion: string;
      marks: string[];
    };
    build: string;
    height: { feet: number; inches: number };
  };
  psychographic: {
    temperament: string;
    speechStyle: string;
    decisionMaking: string;
    stressResponse: string;
    sleepCycle: string;
  };
  biological: {
    prakriti: 'vata' | 'pitta' | 'kapha';
    sensitivity: { heat: number; cold: number };
    recurringHealthIssues: string[];
  };
  family: {
    siblingPosition: string;
    brotherCount: number;
    sisterCount: number;
    fatherStatusAtBirth: string;
    motherHealthAtBirth: string;
  };
}
```

### LifeEvent
```typescript
interface LifeEvent {
  eventType: string;
  category: 'career' | 'education' | 'marriage' | 'family' | 'health' | 'children' | 'travel' | 'other';
  eventDate: string; // YYYY-MM-DD
  eventTime?: string; // HH:MM:SS
  endDate?: string;
  datePrecision: 'exact_date_time' | 'exact_date' | 'month_year' | 'month_range' | 'year_range' | 'date_range';
  description?: string;
  importance: 'low' | 'medium' | 'high';
}
```

### BTRResult
```typescript
interface BTRResult {
  rectifiedTime: string; // HH:MM:SS
  accuracy: number; // 0-100
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  precisionLevel: 'seconds';
  marginOfError: number; // seconds
  methodsUsed: string[];
  processingTimeMs: number;
  analysisResult: {
    summary: string;
    finalCandidate: {
      time: string;
      score: number;
      confidence: string;
      margin: number;
      thinking?: string;
    };
    technicalProof: {
      ephemeris: EphemerisData;
      divCharts: DivisionalCharts;
      boundary: BoundarySafety;
    };
    stageHistory: Record<number, {
      candidatesIn: number;
      candidatesOut: number;
    }>;
  };
}
```

---

## Error Codes

| Code | HTTP | Description |
|------|------|-------------|
| VALIDATION_ERROR | 400 | Invalid input format |
| INVALID_INPUT | 400 | Missing required fields |
| INSUFFICIENT_LIFE_EVENTS | 400 | Need at least 2 life events |
| UNAUTHORIZED | 401 | Authentication required |
| FORBIDDEN | 403 | Access denied |
| SESSION_NOT_FOUND | 404 | Session doesn't exist |
| RATE_LIMIT_EXCEEDED | 429 | Too many requests |
| AI_SERVICE_ERROR | 502 | AI service unavailable |
| AI_TIMEOUT | 504 | AI request timed out |
| QUEUE_FULL | 503 | Processing queue at capacity |
| PROCESSING_ERROR | 500 | Internal processing error |

---

## Rate Limits

| Endpoint | Limit | Window |
|----------|-------|--------|
| POST /api/calculate | 5 | 1 hour |
| POST /api/sessions | 20 | 1 hour |
| GET /api/stream/* | 10 | 1 minute |
| Other endpoints | 100 | 1 minute |

---

## Webhooks

### Razorpay Payment Webhook
**Endpoint:** `POST /api/webhooks/razorpay`

Handles payment confirmations and updates session status.

---

## SDK Examples

### JavaScript/TypeScript
```typescript
const response = await fetch('https://api.ai-pandit.com/api/calculate', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${clerkToken}`
  },
  body: JSON.stringify({ sessionId: 'sess_abc123', consentGiven: true })
});

const result = await response.json();
```

### Event Stream (SSE)
```javascript
const eventSource = new EventSource(
  `https://api.ai-pandit.com/api/stream/${sessionId}`,
  { headers: { Authorization: `Bearer ${token}` } }
);

eventSource.addEventListener('progress', (e) => {
  const data = JSON.parse(e.data);
  console.log(`Step ${data.step}/${data.totalSteps}: ${data.message}`);
});

eventSource.addEventListener('complete', (e) => {
  const result = JSON.parse(e.data);
  console.log(`Rectified Time: ${result.rectifiedTime}`);
});
```

---

## Changelog

### v2.0.0 (Current)
- Modular BTR architecture
- 6-stage tournament system
- God-Tier precision integration
- Real-time SSE streaming
- Queue-based processing

### v1.0.0
- Initial BTR implementation
- Basic rectification algorithm
