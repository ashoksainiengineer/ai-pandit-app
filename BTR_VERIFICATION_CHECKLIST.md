# BTR System Verification Checklist

## Pre-Test Status
**Date:** 2026-03-17  
**Claim:** All P0, P1, P2, P3 issues resolved  
**Goal:** 100% concrete verification before claiming confidence

---

## Phase 1: Infrastructure Verification

### 1.1 Skyfield Service Health
- [ ] Service running on port 8000
- [ ] Health endpoint returns `ready: true`
- [ ] Kernel file loaded (de440s.bsp)
- [ ] `/v1/positions` endpoint accessible
- [ ] `/v1/sunrise` endpoint accessible

### 1.2 AI API Accessibility
- [ ] AI_API_KEY configured
- [ ] AI_BASE_URL reachable
- [ ] Test ping successful

### 1.3 Database Connectivity
- [ ] NEON_DATABASE_URL configured
- [ ] Connection pool healthy
- [ ] Migrations current

---

## Phase 2: Ephemeris Calculation Verification

### 2.1 High-Precision Mode (Skyfield)
**Test:** Calculate chart for known birth data
```
Date: 1990-01-01
Time: 12:00:00
Location: Delhi (28.6139, 77.2090)
```

**Expected Results:**
- [ ] Ayanamsha: ~23.71° (Lahiri)
- [ ] Sun: ~257.10° sidereal
- [ ] Moon: ~309.56° sidereal
- [ ] Ascendant: ~76.86°
- [ ] Mercury shows retrograde: true
- [ ] All 9 planets calculated
- [ ] 12 house cusps calculated
- [ ] Julian day precise to 10+ decimals

**Verification Method:**
- Compare with Swisseph online calculator
- Tolerance: ±0.001° for planets

### 2.2 Cross-Midnight Handling
**Test Cases:**
- [ ] 23:30:00 + 45min offset → 00:15:00 next day
- [ ] 00:30:00 - 45min offset → 23:45:00 previous day
- [ ] Date correctly calculated for each candidate

**Verify:**
- [ ] candidateDate field populated correctly
- [ ] dayOffset field shows -1, 0, or +1
- [ ] Ephemeris uses correct date for calculation

### 2.3 Algorithmic Fallback
**Test:** Stop Skyfield service, verify graceful degradation
- [ ] Falls back to algorithmic mode
- [ ] Logs show fallback reason
- [ ] Still returns results (~0.1° accuracy)
- [ ] No crash or hanging

---

## Phase 3: Candidate Generation Verification

### 3.1 Time Range Generation
**Test:** Generate candidates for different ranges
- [ ] ±30 min: ~61 candidates
- [ ] ±2 hours: ~160 candidates
- [ ] ±12 hours: ~288 candidates
- [ ] Never exceeds 500 candidates (memory limit)

**Verify:**
- [ ] Candidates in chronological order
- [ ] Tentative time included
- [ ] No duplicates
- [ ] candidateKey unique per time+date

### 3.2 Memory Limits
**Test:** Request ±24 hours (extreme case)
- [ ] Should auto-adjust interval to stay under 500 candidates
- [ ] Warning logged about adjustment
- [ ] System doesn't crash

---

## Phase 4: Session Cache Verification

### 4.1 Session Isolation
**Test:** Run 3 parallel BTR sessions
- [ ] Each session gets unique sessionId
- [ ] Cache keys prefixed with sessionId
- [ ] Session 1 cache not visible to Session 2

### 4.2 Cache Cleanup
**Test:** Complete a BTR session
- [ ] Cache populated during run
- [ ] clearSessionCache() called on completion
- [ ] Memory released after session
- [ ] getCacheStats() shows cleanup

---

## Phase 5: BTR Stage Verification (Real AI)

### 5.1 Stage 1: Exhaustive Data
**Test:** Full data package built
- [ ] Ephemeris data complete
- [ ] Dasha tree calculated
- [ ] Transit data for all events
- [ ] Varga charts generated
- [ ] rawVimshottari populated

### 5.2 Stage 2: Batch Tournament
**Test:** 100 candidates, ±60 min window
- [ ] Candidates split into batches of 10
- [ ] AI receives correct prompt format
- [ ] Winners selected by AI (not batch order)
- [ ] Fallback preserves merit if AI fails

**Verify No Regression:**
- [ ] No first-batch bias
- [ ] Merit scores determine survivors

### 5.3 Stage 3: Refinement Grid
**Test:** Focus on top 20 candidates
- [ ] 30-second intervals around winners
- [ ] Grid generated correctly
- [ ] AI re-evaluates with higher precision

### 5.4 Stage 4: Deep Analysis
**Test:** Top 10 candidates
- [ ] AI model = reasoner (if configured)
- [ ] Life events mapped to candidates
- [ ] Dasha correlation analyzed
- [ ] Fallback preserves deterministic order

### 5.5 Stage 5: Micro Grid
**Test:** 5 finalists
- [ ] 6-second intervals
- [ ] Precise D60 boundary check
- [ ] Tatwa analysis included

### 5.6 Stage 6: Final Precision
**Test:** 2-3 finalists
- [ ] AI model = reasoner
- [ ] Comparative analysis prompt
- [ ] Present-day transit locks per candidate
- [ ] Winner selection with confidence score
- [ ] Verdict time mapped to nearest candidate

---

## Phase 6: Event Date Handling

### 6.1 Valid Date Formats
- [ ] YYYY-MM-DD (exact_date)
- [ ] YYYY-MM (month_year)
- [ ] YYYY (year)
- [ ] Date ranges with endDate
- [ ] With and without eventTime

### 6.2 Edge Cases
- [ ] Leap year: 2020-02-29
- [ ] Invalid date: 2021-02-30 → graceful fallback
- [ ] Year out of range: 1700 → rejected
- [ ] Future date: 2030-01-01 → valid

### 6.3 Date Precision Scoring
- [ ] exact_date_time: 3.0 weight
- [ ] exact_date: 2.0 weight
- [ ] date_range: 1.0 weight
- [ ] month_year: 0.5 weight
- [ ] year: 0.25 weight

---

## Phase 7: Scoring & Consensus

### 7.1 Event Scoring
**Test:** Different confidence levels
- [ ] Document source: 0.95 reliability
- [ ] Memory source: 0.70 reliability
- [ ] Approximate source: 0.50 reliability

### 7.2 Transit Scoring
- [ ] Exact match: 100 points
- [ ] 1-day window: 50 points
- [ ] 1-month window: 25 points
- [ ] No match: 0 points (not 50)

### 7.3 Consensus Engine
- [ ] Multiple methods aggregated
- [ ] Weighted by method reliability
- [ ] Confidence level calculated
- [ ] No neutral 50-score fallbacks

---

## Phase 8: Error Handling & Resilience

### 8.1 AI Failure Scenarios
- [ ] Stage 2 AI timeout → fallback to merit
- [ ] Stage 4 AI error → preserve candidates
- [ ] Stage 6 no verdict → use deterministic winner
- [ ] All stages log fallback reason

### 8.2 Ephemeris Failures
- [ ] Skyfield unavailable → algorithmic fallback
- [ ] Invalid coordinates → validation error
- [ ] Invalid date/time → validation error

### 8.3 Data Validation
- [ ] Latitude > 90° → rejected
- [ ] Longitude > 180° → rejected
- [ ] Invalid timezone → rejected
- [ ] Missing required fields → validation error

---

## Phase 9: Performance Benchmarks

### 9.1 Response Times
- [ ] Stage 1: < 2 seconds
- [ ] Stage 2: < 30 seconds (AI call)
- [ ] Stage 4: < 45 seconds (AI call)
- [ ] Stage 6: < 30 seconds (AI call)
- [ ] Total pipeline: < 3 minutes

### 9.2 Memory Usage
- [ ] No memory leaks between sessions
- [ ] Cache auto-cleanup working
- [ ] < 500 candidates in memory at any time

---

## Phase 10: Regression Tests

### 10.1 Before/After Comparison
**Required:** Run identical test cases from pre-fix state

**Test Cases:**
1. Standard birth (Delhi, 12:00, ±2h)
2. Cross-midnight (23:30, ±1h)
3. Wide window (±12h)
4. Many events (10+ life events)
5. Few events (1-2 life events)

**Compare:**
- [ ] Rectified time within ±5 seconds
- [ ] Confidence level similar
- [ ] Margin of error similar
- [ ] No crashes or hangs

### 10.2 Known Good Results
**Golden Test:** Use saved "correct" results
- [ ] Same inputs produce same outputs (±1 second)
- [ ] If different, document why (should be improvement)

---

## Verification Sign-Off

### My Assessment (Before Real Test)
- **Skyfield Integration:** ✅ Verified working
- **Session Cache:** ✅ Implemented, needs real test
- **Memory Limits:** ✅ Implemented, needs stress test
- **Stage Logic:** ✅ Fixed, needs real AI verification
- **Event Dates:** ✅ Validated, needs edge case test

### Required for 100% Confidence
1. Run all Phase 5 tests with REAL AI API
2. Run all Phase 10 regression tests
3. Document any failures or discrepancies
4. Fix any found issues
5. Re-test until clean

### Current Status: **NOT 100% CONFIDENT**
**Reason:** I have implemented the fixes based on code analysis, but I have NOT run the full end-to-end test with real AI. The unit tests pass, but integration could reveal issues.

### Recommendation
**DO NOT DEPLOY TO PRODUCTION** until:
1. This checklist is completed with real AI tests
2. All items checked ✅
3. No critical failures found

---

## Next Steps

**Option A: Full Verification (Recommended)**
1. I run real AI test with checklist
2. Document results honestly
3. Fix any issues found
4. Re-test
5. Only then claim confidence

**Option B: Partial Verification**
1. Test only critical paths
2. Accept some risk
3. Monitor production closely

**Your decision?**
