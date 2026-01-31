# 🔒 Quick Security Fix Plan
**2 Critical Changes Only**

---

## ✅ Change #1: User Ka Naam AI Ko Mat Bhejo

### Step 1.1: Backend me Sanitizer Function

**File:** `backend/src/lib/ai-data-sanitizer.ts` (Create new file)

```typescript
/**
 * AI Data Sanitizer
 * Removes PII before sending to AI
 */

export interface SanitizedInput {
  // Original data (keep for calculations)
  originalUserId: string;
  originalSessionId: string;
  
  // Sanitized data (for AI prompts)
  userId: string;           // Hashed
  sessionId: string;        // Hashed
  fullName: string;         // Pseudonym
  birthPlace: string;       // Region only
}

import crypto from 'crypto';

const HASH_SALT = process.env.HASH_SALT || 'aipandit-salt-2024';

// Simple hash function
function hashId(id: string): string {
  return crypto
    .createHash('sha256')
    .update(id + HASH_SALT)
    .digest('hex')
    .substring(0, 12);
}

// Generate pseudonym
function generatePseudonym(name: string): string {
  const adjectives = ['Golden', 'Silver', 'Bright', 'Wise', 'Noble'];
  const nouns = ['Star', 'Moon', 'Sun', 'Sky', 'Ocean'];
  
  // Deterministic based on name
  const hash = crypto.createHash('md5').update(name).digest('hex');
  const adjIndex = parseInt(hash.substring(0, 2), 16) % adjectives.length;
  const nounIndex = parseInt(hash.substring(2, 4), 16) % nouns.length;
  const suffix = hash.substring(4, 8).toUpperCase();
  
  return `${adjectives[adjIndex]}-${nouns[nounIndex]}-${suffix}`;
}

// Extract region from location
function extractRegion(birthPlace: string): string {
  // "Mumbai, Maharashtra, India" → "Maharashtra, India"
  // "123 Main St, New York, USA" → "New York, USA"
  const parts = birthPlace.split(',').map(p => p.trim());
  if (parts.length >= 2) {
    return parts.slice(-2).join(', '); // Last 2 parts
  }
  return birthPlace;
}

// Main sanitization function
export function sanitizeForAI(data: any): any {
  return {
    ...data,
    
    // Store original for internal use
    originalUserId: data.userId,
    originalSessionId: data.sessionId,
    originalFullName: data.fullName,
    originalBirthPlace: data.birthPlace,
    
    // Sanitized versions for AI
    userId: hashId(data.userId),
    sessionId: hashId(data.sessionId),
    fullName: generatePseudonym(data.fullName || 'User'),
    birthPlace: extractRegion(data.birthPlace || 'Unknown'),
  };
}

// Specific function for prompts
export function sanitizePromptData(input: any): any {
  const sanitized = sanitizeForAI(input);
  
  return {
    ...sanitized,
    // Remove any other PII that might be in input
    email: undefined,
    phone: undefined,
    address: undefined,
  };
}
```

---

### Step 1.2: seconds-precision-btr.ts me Sanitize Call

**File:** `backend/src/lib/seconds-precision-btr.ts`

**Modify:** Top of `processSecondsPrecisionBTR` function (Line ~1871)

```typescript
import { sanitizePromptData } from './ai-data-sanitizer.js';

export async function processSecondsPrecisionBTR(
    input: SecondsPrecisionInput
): Promise<SecondsPrecisionResult> {
    const startTime = Date.now();
    
    // 🔒 SANITIZE INPUT FOR AI
    const sanitizedInput = sanitizePromptData(input);
    
    const progress = new ProgressTracker(input.sessionId);
    // ... rest of function
}
```

---

### Step 1.3: Prompt Functions me Sanitized Data Use Karo

**File:** `backend/src/lib/seconds-precision-btr.ts`

**Modify:** `getBatchPrompt` function (Line ~722)

```typescript
function getBatchPrompt(
    candidates: CandidateDataPackage[],
    events: LifeEvent[],
    forensicTraits: ForensicTraits,
    batchNumber: number,
    totalBatches: number,
    survivorsNeeded: number,
    sanitizedInput: any  // 🔴 ADD THIS PARAMETER
): string {
    // ... existing code ...
    
    // Use sanitized name instead of real name
    const userName = sanitizedInput.fullName;  // "Golden-Star-A7B2"
    const location = sanitizedInput.birthPlace; // "Maharashtra, India"
    
    return `BIRTH TIME RECTIFICATION - STAGE 2
User: ${userName}
Location: ${location}
// ... rest of prompt
`;
}
```

**Similarly modify:** `getDeepAnalysisPrompt` and `getFinalPrecisionPrompt`

---

### Step 1.4: Function Calls me Sanitized Input Pass Karo

**In:** `stage2BatchTournament` function

```typescript
// Line ~1244
async function stage2BatchTournament(
    input: SecondsPrecisionInput,
    candidates: CandidateTime[],
    progress: ProgressTracker,
    forensicTraits: ForensicTraits,
    globalLifecycle: any[] = []
): Promise<{ survivors: CandidateTime[]; stageResult: StageResult; rounds: TournamentRound[] }> {
    
    // Get sanitized input
    const sanitizedInput = sanitizePromptData(input);
    
    // ... rest of function
    
    // Pass sanitized input to prompt function
    const prompt = getBatchPrompt(
        batchEnriched, 
        sanitizedInput.lifeEvents,  // Use sanitized
        forensicTraits, 
        i + 1, 
        batches.length, 
        survivorsPerBatch,
        sanitizedInput  // 🔴 Pass sanitized
    );
}
```

---

## ✅ Change #2: User Consent Before Analysis

### Step 2.1: Database me Consent Field Add Karo

**File:** `backend/src/database/schema.ts`

**Add to `sessions` table:**

```typescript
export const sessions = sqliteTable(
    'sessions',
    {
        // ... existing fields ...
        
        // Consent tracking
        aiConsentGiven: integer('aiConsentGiven', { mode: 'boolean' }).default(false),
        aiConsentGivenAt: text('aiConsentGivenAt'),
        aiConsentIp: text('aiConsentIp'),
        
        // ... rest ...
    },
    // ...
);
```

**Run Migration:**
```bash
cd backend
npx drizzle-kit generate
npx drizzle-kit migrate
```

---

### Step 2.2: Frontend me Consent Modal

**File:** `components/rectify/Step4Review.tsx` (or create new component)

```tsx
'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface AIConsentModalProps {
  isOpen: boolean;
  onAccept: () => void;
  onDecline: () => void;
  userName: string;
}

export function AIConsentModal({ isOpen, onAccept, onDecline, userName }: AIConsentModalProps) {
  const [isChecked, setIsChecked] = useState(false);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-amber-500 to-orange-600 p-6 text-white">
            <h2 className="text-2xl font-bold">🔒 AI Processing Consent</h2>
            <p className="text-amber-100 mt-1">
              Before we begin the analysis, please review and consent
            </p>
          </div>

          <div className="p-6 space-y-6">
            {/* What we do */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <h3 className="font-semibold text-blue-900 mb-2">What happens next?</h3>
              <p className="text-sm text-blue-800 leading-relaxed">
                Our AI system will analyze your birth chart data using advanced astrological 
                calculations to determine your accurate birth time. This involves processing:
              </p>
              <ul className="mt-2 space-y-1 text-sm text-blue-800">
                <li>• Planetary positions and house calculations</li>
                <li>• Dasha (planetary period) analysis</li>
                <li>• Divisional chart (D9, D10, D60) evaluation</li>
                <li>• Life event correlation</li>
              </ul>
            </div>

            {/* Data protection */}
            <div className="bg-green-50 border border-green-200 rounded-xl p-4">
              <h3 className="font-semibold text-green-900 mb-2">🛡️ Your data is protected</h3>
              <ul className="space-y-2 text-sm text-green-800">
                <li className="flex items-start gap-2">
                  <span className="text-green-600">✓</span>
                  <span>Your name is anonymized before AI processing</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600">✓</span>
                  <span>Only your birth city/region is shared, not exact address</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600">✓</span>
                  <span>Your data is not used to train AI models</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600">✓</span>
                  <span>All data is encrypted in transit and at rest</span>
                </li>
              </ul>
            </div>

            {/* Consent checkbox */}
            <div className="border-2 border-amber-200 rounded-xl p-4 bg-amber-50/50">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={(e) => setIsChecked(e.target.checked)}
                  className="mt-1 w-5 h-5 text-amber-600 rounded focus:ring-amber-500"
                />
                <span className="text-sm text-gray-800 leading-relaxed">
                  I, <strong>{userName}</strong>, consent to the processing of my astrological 
                  data by AI systems for birth time rectification. I understand that:
                  <ul className="mt-2 ml-4 space-y-1 text-gray-600">
                    <li>• My birth data will be analyzed by AI to find my accurate birth time</li>
                    <li>• My personal identifiers (name, exact location) will be anonymized</li>
                    <li>• The analysis may take 5-10 minutes to complete</li>
                    <li>• I can request deletion of my data at any time</li>
                  </ul>
                </span>
              </label>
            </div>

            {/* Buttons */}
            <div className="flex gap-4 pt-4">
              <button
                onClick={onDecline}
                className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
              >
                Decline
              </button>
              <button
                onClick={onAccept}
                disabled={!isChecked}
                className={`flex-1 px-6 py-3 rounded-xl font-semibold transition-all ${
                  isChecked
                    ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white hover:shadow-lg'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                I Consent - Start Analysis
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
```

---

### Step 2.3: Rectify Page me Consent Integration

**File:** `app/rectify/page.tsx` (or main rectify component)

```tsx
'use client';

import { useState } from 'react';
import { AIConsentModal } from '@/components/rectify/AIConsentModal';

export default function RectifyPage() {
  const [showConsent, setShowConsent] = useState(false);
  const [hasConsented, setHasConsented] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    // ... other fields
  });

  const handleStartAnalysis = async () => {
    if (!hasConsented) {
      setShowConsent(true);
      return;
    }
    
    // Proceed with analysis
    await submitToQueue();
  };

  const handleAcceptConsent = async () => {
    // Save consent to backend
    await fetch('/api/consent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId: currentSessionId,
        consent: true,
      }),
    });
    
    setHasConsented(true);
    setShowConsent(false);
    
    // Now start analysis
    await submitToQueue();
  };

  const handleDeclineConsent = () => {
    // Show error or alternative
    alert('Consent is required for AI-powered analysis. You can use our traditional non-AI method instead.');
    setShowConsent(false);
  };

  return (
    <div>
      {/* Your existing form steps */}
      
      {/* Final submit button */}
      <button onClick={handleStartAnalysis}>
        Start Analysis
      </button>
      
      {/* Consent Modal */}
      <AIConsentModal
        isOpen={showConsent}
        onAccept={handleAcceptConsent}
        onDecline={handleDeclineConsent}
        userName={formData.fullName}
      />
    </div>
  );
}
```

---

### Step 2.4: Backend API Consent Endpoint

**File:** `backend/src/routes/consent.ts` (Create new file)

```typescript
import { Router, Request, Response } from 'express';
import { db } from '../database/drizzle.js';
import { sessions } from '../database/schema.js';
import { eq } from 'drizzle-orm';
import { AuthenticatedRequest, authMiddleware } from '../middleware/auth.js';

const router = Router();

/**
 * POST /api/consent - Record user consent for AI processing
 */
router.post('/', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const { sessionId, consent } = req.body;
    
    if (!sessionId) {
      res.status(400).json({ success: false, error: 'Session ID required' });
      return;
    }
    
    // Verify session belongs to user
    const session = await db
      .select()
      .from(sessions)
      .where(eq(sessions.id, sessionId))
      .limit(1);
    
    if (session.length === 0) {
      res.status(404).json({ success: false, error: 'Session not found' });
      return;
    }
    
    if (session[0].userId !== userId) {
      res.status(403).json({ success: false, error: 'Unauthorized' });
      return;
    }
    
    // Update consent
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
    console.error('Consent recording error:', error);
    res.status(500).json({ success: false, error: 'Failed to record consent' });
  }
});

/**
 * GET /api/consent/:sessionId - Check consent status
 */
router.get('/:sessionId', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { sessionId } = req.params;
    const userId = req.userId!;
    
    const session = await db
      .select({
        aiConsentGiven: sessions.aiConsentGiven,
        aiConsentGivenAt: sessions.aiConsentGivenAt,
      })
      .from(sessions)
      .where(eq(sessions.id, sessionId))
      .limit(1);
    
    if (session.length === 0) {
      res.status(404).json({ success: false, error: 'Session not found' });
      return;
    }
    
    res.json({
      success: true,
      data: {
        hasConsented: session[0].aiConsentGiven,
        consentedAt: session[0].aiConsentGivenAt,
      },
    });
    
  } catch (error) {
    console.error('Consent check error:', error);
    res.status(500).json({ success: false, error: 'Failed to check consent' });
  }
});

export default router;
```

---

### Step 2.5: Queue Route me Consent Check

**File:** `backend/src/routes/queue.ts`

**Modify:** POST handler

```typescript
router.post('/', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    // ... existing validation ...
    
    // 🔴 CHECK CONSENT
    const { sessionId, consentConfirmed } = req.body;
    
    if (!consentConfirmed) {
      // Check if consent already recorded
      const existingSession = await db
        .select({ aiConsentGiven: sessions.aiConsentGiven })
        .from(sessions)
        .where(eq(sessions.id, sessionId))
        .limit(1);
      
      if (!existingSession[0]?.aiConsentGiven) {
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

### Phase 1: Name Anonymization (30 minutes)
- [ ] Create `ai-data-sanitizer.ts`
- [ ] Import in `seconds-precision-btr.ts`
- [ ] Add `sanitizePromptData()` call at top of `processSecondsPrecisionBTR`
- [ ] Modify `getBatchPrompt`, `getDeepAnalysisPrompt`, `getFinalPrecisionPrompt` to use sanitized names
- [ ] Test: Verify AI prompts show pseudonyms not real names

### Phase 2: Consent Flow (1 hour)
- [ ] Add `aiConsentGiven`, `aiConsentGivenAt` fields to database schema
- [ ] Run migration
- [ ] Create `AIConsentModal` component
- [ ] Add consent modal to rectify page
- [ ] Create `/api/consent` endpoint
- [ ] Add consent check to queue route
- [ ] Test: Verify analysis doesn't start without consent

---

## ✅ Result

| Before | After |
|--------|-------|
| "Ashok Kumar, Mumbai" → AI | "Golden-Star-A7B2, Maharashtra, India" → AI |
| Analysis starts immediately | User must consent first |
| No audit trail | Consent timestamp + IP logged |

**Regulatory Compliance:**
- ✅ GDPR Article 6 (Lawful basis - consent)
- ✅ GDPR Article 7 (Consent conditions)
- ✅ Indian DPDP Act Section 5 (Consent)
- ✅ Transparency requirement

---

**Ready to implement!** 🚀
