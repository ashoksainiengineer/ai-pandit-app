# Subsystem Audit: 1.5 AI Response Extractors

## 📋 Metadata

| Property | Value |
|----------|-------|
| **Subsystem** | AI Response Extractors |
| **Category** | Core BTR Engine |
| **Files** | 2 |
| **Total Lines** | ~250 |
| **Last Audited** | March 2026 |
| **Status** | ✅ Production Ready |

---

## 📁 Files in this Subsystem

| File | Lines | Purpose |
|------|-------|---------|
| [`extractors/index.ts`](../../apps/api/src/lib/btr/extractors/index.ts) | 12 | Extractor exports |
| [`extractors/ai-response-extractors.ts`](../../apps/api/src/lib/btr/extractors/ai-response-extractors.ts) | 212 | Parse AI responses, extract scores |

---

## 🎯 Purpose

The AI Response Extractors provide **robust parsing of AI responses** to extract structured data from DeepSeek's text outputs. They:

1. **Parse AI text responses** - Extract scores and verdicts
2. **Handle multiple formats** - XML, JSON, regex patterns
3. **Validate extracted data** - Ensure data integrity
4. **Provide fallbacks** - Graceful degradation on parse failures
5. **Match candidates** - Map AI responses to candidate times

---

## 📦 Module Details

### 1. Batch Survivor Extractor

**File:** [`extractors/ai-response-extractors.ts`](../../apps/api/src/lib/btr/extractors/ai-response-extractors.ts)

**Purpose:** Extract top survivor times and their scores from AI batch analysis response

**Key Function:**
```typescript
export function extractBatchSurvivors(
  aiContent: string,
  candidateTimes: string[],
  neededCount: number
): { time: string; score: number; reason: string }[]
```

**Extraction Priority:**

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                          EXTRACTION PRIORITY ORDER                               │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  PRIORITY 1: XML TAG EXTRACTION                                             │
│  ┌─────────────────────────────────────────────────────────────────────────────┐   │
│  │ <FINAL_SCORES>                                                          │   │
│  │   [                                                                    │   │
│  │     {"time": "10:30:15", "score": 85, "reason": "Strong match"},      │   │
│  │     {"time": "10:31:00", "score": 78, "reason": "Good correlation"}     │   │
│  │   ]                                                                    │   │
│  │ </FINAL_SCORES>                                                         │   │
│  └─────────────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
│  PRIORITY 2: ROBUST REGEX (Multi-Pattern)                                   │
│  ┌─────────────────────────────────────────────────────────────────────────────┐   │
│  │ Pattern: CANDIDATE [10:30:15] FINAL WEIGHTED SCORE: 85                 │   │
│  │ Pattern: SCORE: 78 for time 10:31:00                                   │   │
│  │ Pattern: FINAL SCORE=85 for candidate at 10:30:15                        │   │
│  └─────────────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
│  PRIORITY 3: PER-LINE ANALYSIS                                              │
│  ┌─────────────────────────────────────────────────────────────────────────────┐   │
│  │ Scan each line for candidate time + score combination                      │   │
│  │ Highest precision for reason capture                                      │   │
│  └─────────────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
│  FALLBACK: NEUTRAL BASELINE                                                  │
│  ┌─────────────────────────────────────────────────────────────────────────────┐   │
│  │ If extraction fails, assign score: 50, reason: "AI Extraction Failed"  │   │
│  └─────────────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

**Extraction Logic:**

```typescript
// Priority 1: XML Tag Extraction
const xmlMatch = aiContent.match(/<FINAL_SCORES>([\s\S]*?)<\/FINAL_SCORES>/i);
if (xmlMatch) {
  const parsedArray = JSON.parse(xmlMatch[1]);
  // Map to candidate times
}

// Priority 2: Robust Regex
const timeScorePattern = /(?:CANDIDATE|TIME)[\]\|\s:-]*\[?(\d{2}:\d{2}:?\d{0,2})\]?[\s\S]{0,1000}?(?:FINAL SCORE)[=:;>|]*\s*(\d+)/gi;
// Extract time-score pairs

// Priority 3: Per-line analysis
for (const line of lines) {
  if (line.includes('score')) {
    // Extract candidate time and score from line
  }
}

// Fallback: Neutral baseline
scores.push({
  time,
  score: 50,
  reason: "AI Extraction Failed - Applying Neutral Baseline"
});
```

---

### 2. Final Verdict Extractor

**File:** [`extractors/ai-response-extractors.ts`](../../apps/api/src/lib/btr/extractors/ai-response-extractors.ts)

**Purpose:** Extract final verdict from Stage 6 AI response

**Key Function:**
```typescript
export function extractFinalVerdict(
  aiContent: string,
  candidateTimes: string[]
): FinalVerdict
```

**Expected Response Format:**
```json
{
  "rectifiedTime": "10:30:45",
  "confidence": 87,
  "consensusLevel": "high",
  "methodScores": {
    "vimshottari": 90,
    "kpSublord": 88,
    "varga": 82,
    "transit": 75,
    "forensic": 85,
    "event": 80
  },
  "reasoning": "Detailed explanation of why this time was selected..."
}
```

**Extraction Methods:**

1. **JSON Block Extraction** - Extract JSON from markdown code blocks
2. **XML Tag Extraction** - Extract from `<FINAL_VERDICT>` tags
3. **Regex Pattern Matching** - Fallback pattern matching
4. **Candidate Matching** - Match AI time to nearest candidate

---

### 3. Nearest Candidate Finder

**Purpose:** Find nearest candidate time for hallucinated AI times

```typescript
function findNearestCandidate(
  hallucinatedTime: string,
  candidates: string[],
  thresholdSeconds = 30
): string | null
```

**Logic:**
1. Parse both times to seconds
2. Calculate absolute difference
3. Return if within threshold
4. Return best match (minimum difference)

**Example:**
```
AI says: "10:30:17"
Candidates: ["10:30:00", "10:30:30", "10:31:00"]
Threshold: 30 seconds

Differences:
- 10:30:00: 17 seconds diff ✓
- 10:30:30: 13 seconds diff ✓ (best match)
- 10:31:00: 43 seconds diff ✗ (exceeds threshold)

Result: "10:30:30"
```

---

## 🔗 Extraction Flow

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                           AI RESPONSE EXTRACTION FLOW                            │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  AI Response Text                                                             │
│       │                                                                      │
│       ▼                                                                      │
│  ┌─────────────────────────────────────────────────────────────────────────────┐   │
│  │  PRIORITY 1: XML Tag Extraction                                        │   │
│  │  • Look for <FINAL_SCORES>...</FINAL_SCORES>                           │   │
│  │  • Parse JSON inside tags                                               │   │
│  │  • Map to candidate times                                               │   │
│  └────────┬────────────────────────────────────────────────────────────────────┘   │
│           │                                                                      │
│           ▼ (if failed)                                                         │
│  ┌─────────────────────────────────────────────────────────────────────────────┐   │
│  │  PRIORITY 2: Robust Regex                                            │   │
│  │  • Multi-pattern matching                                              │   │
│  │  • Time-Score pairs                                                   │   │
│  │  • Score-Time pairs (reverse)                                          │   │
│  └────────┬────────────────────────────────────────────────────────────────────┘   │
│           │                                                                      │
│           ▼ (if failed)                                                         │
│  ┌─────────────────────────────────────────────────────────────────────────────┐   │
│  │  PRIORITY 3: Per-Line Analysis                                        │   │
│  │  • Scan each line                                                     │   │
│  │  • Extract time + score                                              │   │
│  │  • Capture reasoning text                                              │   │
│  └────────┬────────────────────────────────────────────────────────────────────┘   │
│           │                                                                      │
│           ▼ (if failed)                                                         │
│  ┌─────────────────────────────────────────────────────────────────────────────┐   │
│  │  FALLBACK: Neutral Baseline                                            │   │
│  │  • Assign score: 50                                                   │   │
│  │  • Reason: "AI Extraction Failed"                                      │   │
│  └─────────────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
│  Extracted Data                                                              │
│       │                                                                      │
│       ▼                                                                      │
│  Validate & Return                                                            │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 📊 Regex Patterns

### Time-Score Pattern
```regex
(?:CANDIDATE|TIME|BIRTH|RESULT|RECTIFIED)[\]\|\s:-]*\[?(\d{2}:\d{2}:?\d{0,2})\]?[\s\S]{0,1000}?(?:FINAL SCORE|SCORE)[=:;>|]*\s*(\d+)
```

### Score-Time Pattern (Reverse)
```regex
(?:FINAL SCORE|SCORE)[=:;>|]*\s*(\d+)[\s\S]{0,500}?(?:for|at|time|candidate)[\]\|\s:-]*\[?(\d{2}:\d{2}:?\d{0,2})\]?
```

### JSON Block Pattern
```regex
```json\s*({[\s\S]*?})\s*```
```

### XML Tag Pattern
```regex
<(FINAL_SCORES|FINAL_VERDICT)>([\s\S]*?)</\1>
```

---

## ⚠️ Critical Considerations

### 1. Hallucination Handling
- AI may return times not in candidate list
- Use `findNearestCandidate()` to match
- Threshold: 30 seconds (configurable)

### 2. Multiple Extraction Methods
- Priority-based fallback system
- XML → Regex → Line analysis → Fallback
- Ensures robust extraction even with varied AI responses

### 3. Score Normalization
- Extracted scores normalized to 0-100 range
- Neutral baseline: 50 (if extraction fails)
- Prevents AI from skewing results

### 4. Reason Capture
- Capture AI reasoning for display
- Truncate to 150 characters for display
- Full reasoning stored in database

---

## 🧪 Test Coverage

| Module | Unit Tests | Integration | Coverage |
|--------|------------|-------------|----------|
| extractBatchSurvivors | ✅ | ✅ | ~85% |
| extractFinalVerdict | ✅ | ✅ | ~80% |
| findNearestCandidate | ✅ | ✅ | ~90% |

---

## 📝 Improvement Recommendations

### High Priority
1. **Add more regex patterns** - Handle edge cases
2. **Improve XML parsing** - Better error handling
3. **Add logging** - Track extraction failures

### Medium Priority
1. **Implement ML fallback** - Use ML for extraction
2. **Add validation** - Check extracted data integrity
3. **Optimize performance** - Reduce regex overhead

### Low Priority
1. **Add extraction playground** - UI for testing
2. **Create pattern library** - Reusable regex patterns
3. **Add analytics** - Track extraction success rates

---

## 📚 Related Documentation

- [SUBSYSTEM_01_BTR_ENGINE.md](./SUBSYSTEM_01_BTR_ENGINE.md) - Parent overview
- [SUBSYSTEM_01_2_PIPELINE_STAGES.md](./SUBSYSTEM_01_2_PIPELINE_STAGES.md) - Stage implementations
- [SUBSYSTEM_01_4_AI_PROMPT_SYSTEM.md](./SUBSYSTEM_01_4_AI_PROMPT_SYSTEM.md) - AI prompts

---

*Last Updated: March 2026*
