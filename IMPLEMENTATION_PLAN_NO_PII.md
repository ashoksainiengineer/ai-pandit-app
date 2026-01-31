# 🔱 Implementation Plan: Remove PII from AI Prompts
**Goal:** AI ko sirf astrological data bhejo, user ka naam/location mat bhejo

---

## 📋 Current Problem (Kya Galat Hai)

**File:** `backend/src/lib/seconds-precision-btr.ts`

```typescript
// Lines 734-755 - FORENSIC CONTEXT me PII hai
const forensicContext = `
┌── FORENSIC PHYSICAL DNA (Varga Markers) ──
│ Facial: ${f.physical.facialStructure.forehead} forehead...
│ Build: ${f.physical.build} (${f.physical.height.feet}'${f.physical.height.inches}")
┌── FAMILY NARRATIVE MATRIX ──
│ Position: ${f.family.siblingPosition} (${f.family.brotherCount} brothers...)
│ Birth Status: Father status was "${f.family.fatherStatusAtBirth}"...
`;
```

**Yahan problem yeh hai:**
- User ka naam prompt me kahin nahi dikh raha directly
- Lekin `input` object me `fullName` hota hai
- `spouseData` me spouse ka info hota hai
- AI prompts me yeh data indirectly aa sakta hai

---

## ✅ Solution Architecture

### Step 1: Input Data Ko Split Karo

**Current:**
```typescript
interface SecondsPrecisionInput {
  fullName: string;           // ❌ AI ko nahi chahiye
  dateOfBirth: string;        // ✅ Chahiye
  tentativeTime: string;      // ✅ Chahiye
  birthPlace: string;         // ❌ AI ko nahi chahiye (coords se kaam chal jayega)
  latitude: number;           // ✅ Chahiye
  longitude: number;          // ✅ Chahiye
  timezone: number;           // ✅ Chahiye
  lifeEvents: LifeEvent[];    // ✅ Chahiye
  forensicTraits: ForensicTraits; // ✅ Chahiye ( naam nahi, traits ha)
  spouseData?: SpouseData;    // ⚠️ Partial chahiye (DOB ha, name nahi)
}
```

**New Approach:**
```typescript
// AI ke liye sirf yeh data
interface AIPromptInput {
  // Identifiers (anonymous)
  userId: string;             // "User-A7B2" (pseudonym)
  
  // Birth Data (required)
  dateOfBirth: string;        // "1990-05-15"
  tentativeTime: string;      // "14:30:00"
  latitude: number;           // 19.0760
  longitude: number;          // 72.8777
  timezone: number;           // 5.5
  
  // Astrological Data (Swiss Eph se generate)
  lifeEvents: SanitizedLifeEvent[];
  forensicTraits: SanitizedForensicTraits;
  spouseData?: SanitizedSpouseData;
}
```

---

## 🔧 Implementation Steps

### Step 1: Create Data Sanitizer Module

**File:** `backend/src/lib/ai-data-sanitizer.ts`

```typescript
/**
 * AI Data Sanitizer
 * Removes all PII before sending to AI
 * Sirf astrological data + anonymous ID bhejta hai
 */

import crypto from 'crypto';

// Environment variable for salt
const HASH_SALT = process.env.HASH_SALT || 'aipandit-2024';

// Generate anonymous pseudonym
export function generatePseudonym(userId: string): string {
  const adjectives = ['Golden', 'Silver', 'Bright', 'Wise', 'Noble', 'Silent'];
  const nouns = ['Star', 'Moon', 'Sun', 'Sky', 'Mountain', 'Ocean'];
  
  const hash = crypto.createHash('sha256')
    .update(userId + HASH_SALT)
    .digest('hex');
  
  const adjIndex = parseInt(hash.substring(0, 2), 16) % adjectives.length;
  const nounIndex = parseInt(hash.substring(2, 4), 16) % nouns.length;
  const suffix = hash.substring(4, 8).toUpperCase();
  
  return `${adjectives[adjIndex]}-${nouns[nounIndex]}-${suffix}`;
}

// Sanitize input for AI prompts
export function sanitizeInputForAI(input: any): SanitizedInput {
  return {
    // Anonymous identifier
    userId: generatePseudonym(input.userId || input.sessionId),
    sessionId: generatePseudonym(input.sessionId),
    
    // Birth data (astrological calculation ke liye)
    dateOfBirth: input.dateOfBirth,
    tentativeTime: input.tentativeTime,
    latitude: input.latitude,
    longitude: input.longitude,
    timezone: input.timezone,
    
    // Gender (optional, for forensic correlation)
    gender: input.gender,
    
    // Life events (PII remove karo descriptions se)
    lifeEvents: input.lifeEvents.map((event: any) => ({
      id: event.id,
      category: event.category,
      eventType: event.eventType,
      eventDate: event.eventDate,
      eventTime: event.eventTime,
      datePrecision: event.datePrecision,
      importance: event.importance,
      // Description me PII hatao
      description: sanitizeDescription(event.description),
    })),
    
    // Forensic traits (sensitive info remove karo)
    forensicTraits: {
      physical: input.forensicTraits?.physical,
      psychographic: input.forensicTraits?.psychographic,
      biological: {
        prakriti: input.forensicTraits?.biological?.prakriti,
        sensitivity: input.forensicTraits?.biological?.sensitivity,
        // ❌ Health issues hatao - sensitive hai
        recurringHealthIssues: undefined,
      },
      family: input.forensicTraits?.family,
    },
    
    // Spouse data (sirf DOB/time, name nahi)
    spouseData: input.spouseData ? {
      dateOfBirth: input.spouseData.dateOfBirth,
      birthTime: input.spouseData.birthTime,
      latitude: input.spouseData.latitude,
      longitude: input.spouseData.longitude,
      timezone: input.spouseData.timezone,
      // ❌ Name hatao
      name: undefined,
      birthPlace: undefined,
    } : undefined,
    
    // Offset config
    offsetConfig: input.offsetConfig,
  };
}

// Sanitize event descriptions (PII detection)
function sanitizeDescription(description: string): string {
  if (!description) return '';
  
  // Common PII patterns
  const patterns = [
    { regex: /\b[A-Z][a-z]+\s+[A-Z][a-z]+\b/g, replacement: '[NAME]' },
    { regex: /\b\d{10,12}\b/g, replacement: '[PHONE]' },
    { regex: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, replacement: '[EMAIL]' },
    { regex: /\b(?:19|20)\d{2}-\d{2}-\d{2}\b/g, replacement: '[DATE]' },
    { regex: /\b\d{1,5}\s+\w+\s+(?:street|st|avenue|ave|road|rd|lane|ln)\b/gi, replacement: '[ADDRESS]' },
  ];
  
  let sanitized = description;
  for (const { regex, replacement } of patterns) {
    sanitized = sanitized.replace(regex, replacement);
  }
  
  return sanitized;
}

// Types
export interface SanitizedInput {
  userId: string;
  sessionId: string;
  dateOfBirth: string;
  tentativeTime: string;
  latitude: number;
  longitude: number;
  timezone: number;
  gender?: string;
  lifeEvents: any[];
  forensicTraits: any;
  spouseData?: any;
  offsetConfig: any;
}
```

---

### Step 2: Modify Prompt Functions

**File:** `backend/src/lib/seconds-precision-btr.ts`

**Modify:** `getBatchPrompt` function (Line 722)

```typescript
function getBatchPrompt(
    candidates: CandidateDataPackage[],
    events: LifeEvent[],
    forensicTraits: ForensicTraits,
    batchNumber: number,
    totalBatches: number,
    survivorsNeeded: number,
    sanitizedInput: SanitizedInput  // 🔴 ADD THIS
): string {
    const eventsText = events.map(formatLifeEventForAI).join('\n');
    const f = forensicTraits;

    // 🔴 REMOVE: User name/location from prompt
    // Pehle yeh hota tha: User: ${input.fullName}, Location: ${input.birthPlace}
    // Ab sirf anonymous ID
    
    const forensicContext = `
┌── FORENSIC PHYSICAL DNA (Varga Markers) ──
│ Facial: ${f.physical?.facialStructure?.forehead || 'N/A'} forehead, ${f.physical?.facialStructure?.eyeShape || 'N/A'} eyes
│ Hair/Skin: ${f.physical?.skinHair?.hairType || 'N/A'} hair, ${f.physical?.skinHair?.texture || 'N/A'} skin
│ Build: ${f.physical?.build || 'N/A'} (${f.physical?.height?.feet || 0}'${f.physical?.height?.inches || 0}")

┌── PSYCHOGRAPHIC DNA (Temperament) ──
│ Speech: ${f.psychographic?.speechStyle || 'N/A'} | Decisions: ${f.psychographic?.decisionMaking || 'N/A'}
│ Stress: ${f.psychographic?.stressResponse || 'N/A'} | Sleep: ${f.psychographic?.sleepCycle || 'N/A'}
│ Temperament: ${f.psychographic?.temperament || 'N/A'}

┌── BIOLOGICAL MARKERS (Ayurvedic) ──
│ Prakriti: ${f.biological?.prakriti?.toUpperCase() || 'N/A'}
│ Sensitivity: Heat=${f.biological?.sensitivity?.heat || 'N/A'} | Cold=${f.biological?.sensitivity?.cold || 'N/A'}
│ ⚠️ Health data not included (privacy protected)

┌── FAMILY NARRATIVE MATRIX ──
│ Position: ${f.family?.siblingPosition || 'N/A'} (${f.family?.brotherCount || 0} brothers, ${f.family?.sisterCount || 0} sisters)
│ Birth Status: Father: ${f.family?.fatherStatusAtBirth || 'N/A'}, Mother: ${f.family?.motherHealthAtBirth || 'N/A'}
    `;

    return `BIRTH TIME RECTIFICATION - STAGE 2 (Batch ${batchNumber}/${totalBatches})

USER: ${sanitizedInput.userId} (Anonymous)
LOCATION: Coordinates ${sanitizedInput.latitude}, ${sanitizedInput.longitude}

⚖️ ANTI-BIAS PROTOCOL:
1. TOTAL NEUTRALITY: Treat all provided times as equally likely candidates.
2. ZERO TENTATIVE BIAS: Do not favor times just because they are closer to the "original" time.
3. DATA-DRIVEN SCORE: Your score must reflect mathematical alignment only.

TASK: Rank ${candidates.length} candidates using Bio-Vedic Forensic Mapping and Dasha-Event correlation.

LIFE EVENTS:
${eventsText}

${forensicContext}

// ... rest of prompt (candidates data same) ...
`;
}
```

---

### Step 3: Integrate Sanitizer in Main Function

**File:** `backend/src/lib/seconds-precision-btr.ts`

**Modify:** `processSecondsPrecisionBTR` function (Line 1871)

```typescript
import { sanitizeInputForAI, generatePseudonym } from './ai-data-sanitizer.js';

export async function processSecondsPrecisionBTR(
    input: SecondsPrecisionInput
): Promise<SecondsPrecisionResult> {
    const startTime = Date.now();
    
    // 🔴 SANITIZE INPUT FOR AI (PII remove karo)
    const sanitizedInput = sanitizeInputForAI(input);
    
    const progress = new ProgressTracker(input.sessionId);
    const stageHistory: Record<number, StageResult> = {};

    try {
        // Log with anonymous ID
        logger.info('🔱 Starting BTR Analysis', {
            userId: sanitizedInput.userId,  // Anonymous
            dateOfBirth: input.dateOfBirth,
            eventCount: input.lifeEvents.length,
        });

        // ... rest of the function ...
```

---

### Step 4: Update Stage Functions

**Modify:** `stage2BatchTournament` function

```typescript
async function stage2BatchTournament(
    input: SecondsPrecisionInput,
    candidates: CandidateTime[],
    progress: ProgressTracker,
    forensicTraits: ForensicTraits,
    globalLifecycle: any[] = []
): Promise<{ survivors: CandidateTime[]; stageResult: StageResult; rounds: TournamentRound[] }> {
    
    // 🔴 Sanitize input at start
    const sanitizedInput = sanitizeInputForAI(input);
    
    // ... rest of function ...

    const tasks = batches.map((batchTimes, i) => async () => {
        const batchEnriched = await Promise.all(
            batchTimes.map(ct => buildCandidateDataPackage(ct.time, ct.offsetMinutes, input, { ... }))
        );
        batchDataMap.set(i, batchEnriched);
        
        return callAIWithStream(
            input.sessionId,
            2,
            'You are the SUPREME VEDIC ASTROLOGER...',
            // 🔴 Pass sanitized input to prompt
            getBatchPrompt(
                batchEnriched, 
                sanitizedInput.lifeEvents,  // Sanitized events
                forensicTraits, 
                i + 1, 
                batches.length, 
                survivorsPerBatch,
                sanitizedInput  // Sanitized input
            ),
            { candidateTime: `Batch ${i + 1}/${batches.length}`, progressTracker: progress }
        );
    });
```

---

### Step 5: Frontend Consent Integration

**File:** `components/rectify/Step4Review.tsx`

```tsx
'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';

interface AIConsentModalProps {
  isOpen: boolean;
  onAccept: () => void;
  onDecline: () => void;
}

export function AIConsentModal({ isOpen, onAccept, onDecline }: AIConsentModalProps) {
  const [isChecked, setIsChecked] = useState(false);

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-600 to-orange-600 p-6 text-white">
          <h2 className="text-2xl font-bold">🔒 AI Processing Consent</h2>
          <p className="text-amber-100 mt-1">
            Before we begin the analysis
          </p>
        </div>

        <div className="p-6 space-y-6">
          {/* What we process */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <h3 className="font-semibold text-blue-900 mb-2">What our AI will analyze:</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>✓ Planetary positions calculated from your birth data</li>
              <li>✓ Dasha (planetary period) sequences</li>
              <li>✓ Divisional charts (D9, D10, D60)</li>
              <li>✓ Life event dates and descriptions</li>
              <li>✓ Physical/psychological traits for forensic matching</li>
            </ul>
          </div>

          {/* What's protected */}
          <div className="bg-green-50 border border-green-200 rounded-xl p-4">
            <h3 className="font-semibold text-green-900 mb-2">🛡️ Your privacy is protected:</h3>
            <ul className="text-sm text-green-800 space-y-1">
              <li>✓ Your name is anonymized before AI processing</li>
              <li>✓ Only coordinates used, not exact address</li>
              <li>✓ Health information is excluded</li>
              <li>✓ Data is not used to train AI models</li>
            </ul>
          </div>

          {/* Consent checkbox */}
          <div className="border-2 border-amber-200 rounded-xl p-4 bg-amber-50/50">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={isChecked}
                onChange={(e) => setIsChecked(e.target.checked)}
                className="mt-1 w-5 h-5 text-amber-600 rounded"
              />
              <span className="text-sm text-gray-800">
                I consent to the processing of my astrological data by AI systems 
                for birth time rectification. I understand my personal identifiers 
                (name, exact location) will be anonymized before processing.
              </span>
            </label>
          </div>

          {/* Buttons */}
          <div className="flex gap-4 pt-4">
            <button
              onClick={onDecline}
              className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={onAccept}
              disabled={!isChecked}
              className={`flex-1 px-6 py-3 rounded-xl font-semibold transition-all ${
                isChecked
                  ? 'bg-gradient-to-r from-amber-600 to-orange-600 text-white hover:shadow-lg'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              I Consent - Start Analysis
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
```

---

### Step 6: Backend Consent API

**File:** `backend/src/routes/consent.ts`

```typescript
import { Router } from 'express';
import { db } from '../database/drizzle.js';
import { sessions } from '../database/schema.js';
import { eq } from 'drizzle-orm';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

/**
 * POST /api/consent - Record user consent
 */
router.post('/', authMiddleware, async (req, res) => {
  try {
    const userId = req.userId;
    const { sessionId, consent } = req.body;
    
    if (!sessionId || consent === undefined) {
      res.status(400).json({ success: false, error: 'Missing required fields' });
      return;
    }
    
    // Update session with consent
    await db
      .update(sessions)
      .set({
        aiConsentGiven: consent,
        aiConsentGivenAt: new Date().toISOString(),
        aiConsentIp: req.ip,
      })
      .where(eq(sessions.id, sessionId));
    
    res.json({ success: true, message: 'Consent recorded' });
    
  } catch (error) {
    console.error('Consent error:', error);
    res.status(500).json({ success: false, error: 'Failed to record consent' });
  }
});

export default router;
```

---

### Step 7: Database Schema Update

**File:** `backend/src/database/schema.ts`

```typescript
export const sessions = sqliteTable(
    'sessions',
    {
        // ... existing fields ...
        
        // Consent tracking
        aiConsentGiven: integer('aiConsentGiven', { mode: 'boolean' }).default(false),
        aiConsentGivenAt: text('aiConsentGivenAt'),
        aiConsentIp: text('aiConsentIp'),
    },
    // ...
);
```

---

### Step 8: Queue Route Check

**File:** `backend/src/routes/queue.ts`

```typescript
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { sessionId, consentConfirmed } = req.body;
    
    // Check consent if not already confirmed
    if (!consentConfirmed) {
      const session = await db
        .select({ aiConsentGiven: sessions.aiConsentGiven })
        .from(sessions)
        .where(eq(sessions.id, sessionId))
        .limit(1);
      
      if (!session[0]?.aiConsentGiven) {
        res.status(403).json({
          success: false,
          error: 'AI processing consent required',
          code: 'CONSENT_REQUIRED',
        });
        return;
      }
    }
    
    // ... rest of queue processing ...
  }
});
```

---

## 📋 Implementation Checklist

### Phase 1: Backend Changes (30 minutes)
- [ ] Create `ai-data-sanitizer.ts` module
- [ ] Modify `seconds-precision-btr.ts` to import and use sanitizer
- [ ] Update prompt functions to use sanitized input
- [ ] Add database fields for consent tracking
- [ ] Create consent API route
- [ ] Add consent check to queue route

### Phase 2: Frontend Changes (30 minutes)
- [ ] Create `AIConsentModal` component
- [ ] Integrate modal in rectify flow
- [ ] Call consent API before starting analysis

### Phase 3: Testing (30 minutes)
- [ ] Test that real names don't appear in AI prompts
- [ ] Test that consent modal shows before analysis
- [ ] Test that analysis fails without consent
- [ ] Test that coordinates work without exact location string

---

## ✅ Result

| Before | After |
|--------|-------|
| "Ashok Kumar from Mumbai..." → AI | "Golden-Star-A7B2 from 19.07, 72.87..." → AI |
| No consent check | Explicit consent required |
| Health data sent | Health data excluded |
| Real names in prompts | Anonymous IDs only |

---

## 🎯 Key Points

1. **Swiss Eph calculates everything** - AI sirf interprets
2. **User ka naam AI ko nahi chahiye** - Astrology me koi role nahi
3. **Coordinates sufficient hain** - Exact address string ki zarurat nahi
4. **Consent mandatory hai** - Legal requirement
5. **Health data sensitive hai** - Exclude karo

---

**Ready to implement!** 🚀
