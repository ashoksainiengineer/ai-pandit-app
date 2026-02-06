# Analysis Page Migration Guide

This guide provides step-by-step instructions for migrating from the original analysis page components to the new production-grade, industry-standard versions.

## Summary of Changes

All audited components have been fixed and new versions created with `-fixed` suffix. The fixes address:

| Category | Original Status | Fixed Status |
|----------|----------------|--------------|
| Error Boundaries | ❌ Missing | ✅ Implemented |
| Race Conditions | ❌ Multiple issues | ✅ Resolved with refs |
| Memory Leaks | ❌ Timer/interval leaks | ✅ Proper cleanup |
| Performance | ⚠️ Unoptimized | ✅ Memoized components |
| Accessibility | ❌ WCAG failures | ✅ ARIA compliant |
| Responsive | ⚠️ Partial | ✅ Mobile-first |
| Type Safety | ⚠️ `any` types | ✅ Strict types |
| Security | ❌ XSS vulnerabilities | ✅ Sanitized output |

---

## New Files Created

### 1. Utility Libraries

```
lib/secure-logger.ts           # Production-grade logging with PII redaction
lib/xss-sanitizer.ts           # XSS protection for AI-generated content
lib/use-stream-progress-fixed.ts  # Race-condition-free SSE hook
```

### 2. Components

```
components/rectify/AnalysisErrorBoundary.tsx          # Error boundary components
components/rectify/AnalysisPipelineTracker-fixed.tsx  # Pipeline tracker
components/rectify/LiveScoreTable-fixed.tsx           # Score table
components/rectify/CandidateComparisonView-fixed.tsx  # Comparison view
components/rectify/UnifiedAIPanel-fixed.tsx           # AI panel
app/rectify/[id]/page-fixed.tsx                       # Main page
```

---

## Migration Steps

### Step 1: Backup Current Files

```bash
# Create backup directory
mkdir -p backups/analysis-page-$(date +%Y%m%d)

# Backup current files
cp app/rectify/\[id\]/page.tsx backups/analysis-page-$(date +%Y%m%d)/
cp lib/use-stream-progress.ts backups/analysis-page-$(date +%Y%m%d)/
cp components/rectify/UnifiedAIPanel.tsx backups/analysis-page-$(date +%Y%m%d)/
cp components/rectify/AnalysisPipelineTracker.tsx backups/analysis-page-$(date +%Y%m%d)/
cp components/rectify/LiveScoreTable.tsx backups/analysis-page-$(date +%Y%m%d)/
cp components/rectify/CandidateComparisonView.tsx backups/analysis-page-$(date +%Y%m%d)/
```

### Step 2: Move New Files into Place

```bash
# Move fixed files to replace originals
mv lib/secure-logger.ts lib/secure-logger.ts
cp lib/xss-sanitizer.ts lib/xss-sanitizer.ts
cp lib/use-stream-progress-fixed.ts lib/use-stream-progress.ts

cp components/rectify/AnalysisErrorBoundary.tsx components/rectify/AnalysisErrorBoundary.tsx
cp components/rectify/AnalysisPipelineTracker-fixed.tsx components/rectify/AnalysisPipelineTracker.tsx
cp components/rectify/LiveScoreTable-fixed.tsx components/rectify/LiveScoreTable.tsx
cp components/rectify/CandidateComparisonView-fixed.tsx components/rectify/CandidateComparisonView.tsx
cp components/rectify/UnifiedAIPanel-fixed.tsx components/rectify/UnifiedAIPanel.tsx

cp app/rectify/\[id\]/page-fixed.tsx app/rectify/\[id\]/page.tsx
```

### Step 3: Update Imports

Ensure all imports are correct in your main application files. The new files use these import patterns:

```typescript
// From use-stream-progress.ts (now fixed)
import { useStreamProgress, type StreamState } from '@/lib/use-stream-progress';

// New secure logger
import { logger } from '@/lib/secure-logger';

// XSS sanitizer for AI content
import { sanitizeAIContent } from '@/lib/xss-sanitizer';

// Error boundaries
import { AnalysisErrorBoundary, SectionErrorBoundary } from '@/components/rectify/AnalysisErrorBoundary';
```

### Step 4: Environment Variables (Optional)

For the secure logger to work in production, add these environment variables:

```bash
# .env.local (development)
NEXT_PUBLIC_LOG_LEVEL=debug
NEXT_PUBLIC_ENABLE_CONSOLE_LOGS=true

# .env.production
NEXT_PUBLIC_LOG_LEVEL=warn
NEXT_PUBLIC_ENABLE_CONSOLE_LOGS=false
```

### Step 5: TypeScript Configuration

Ensure your `tsconfig.json` has strict mode enabled for full type safety:

```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true
  }
}
```

---

## Key Changes by File

### 1. `lib/use-stream-progress.ts`

**Before:**
- Race conditions from stale closures
- Memory leaks from uncleared timers
- Console.log statements in production

**After:**
- Uses `useRef` for mutable state that doesn't trigger re-renders
- Proper cleanup in all effect paths
- Secure logger integration
- AbortController for cancellable fetches

**Migration notes:**
- The hook signature remains the same
- Return type now includes `connectionState` for diagnostics
- All `any` types replaced with proper interfaces

### 2. `components/rectify/UnifiedAIPanel.tsx`

**Before:**
- XSS vulnerabilities in AI content rendering
- No keyboard navigation
- Memory leaks from RAF and MutationObserver

**After:**
- All AI content sanitized via `sanitizeAIContent()`
- Full ARIA support (tabs, live regions, roles)
- Proper cleanup of all effects
- Responsive breakpoints for mobile

**Migration notes:**
- Props interface unchanged
- New `aria-label` prop for customization
- `formatStructuredSections` now returns React nodes instead of raw HTML

### 3. `components/rectify/AnalysisPipelineTracker.tsx`

**Before:**
- Memory leak: setInterval not cleared properly
- No ARIA labels
- Not responsive on mobile

**After:**
- Proper interval cleanup with ref pattern
- Full accessibility attributes
- Mobile-first responsive design

### 4. `components/rectify/LiveScoreTable.tsx`

**Before:**
- Creates new array on every render
- No table captions/headers
- Fixed max-height problematic on mobile

**After:**
- Memoized sorting with `useMemo`
- Proper `<caption>`, `<th scope="col">` attributes
- Responsive table with horizontal scroll on mobile

### 5. `components/rectify/CandidateComparisonView.tsx`

**Before:**
- Custom select not keyboard accessible
- No focus indicators
- Grid breaks on mobile

**After:**
- Native `<select>` for accessibility
- Clear focus rings on all interactive elements
- Responsive grid (1 col mobile, 2 col desktop)

### 6. `app/rectify/[id]/page.tsx`

**Before:**
- No error boundaries
- Inline component definitions causing re-renders
- No ARIA landmarks

**After:**
- Wrapped in `AnalysisErrorBoundary`
- Section-level `SectionErrorBoundary` for granular isolation
- All components extracted and memoized
- Full ARIA landmark structure

---

## Testing Checklist

After migration, verify these behaviors:

### Functionality
- [ ] Analysis page loads and connects to SSE
- [ ] Progress updates correctly during analysis
- [ ] Candidate scores display and sort properly
- [ ] Cancel button works
- [ ] Error states display correctly

### Accessibility (Test with Screen Reader)
- [ ] Page has proper landmark regions (header, main, navigation)
- [ ] Progress bar announces percentage changes
- [ ] Pipeline steps are navigable and announced
- [ ] AI panel content updates are announced
- [ ] All interactive elements have focus indicators
- [ ] Color is not the only means of conveying information

### Responsive Design
- [ ] Page works on 320px width (mobile)
- [ ] Tables scroll horizontally on small screens
- [ ] Touch targets are minimum 44x44px
- [ ] Text is readable at all breakpoints

### Performance
- [ ] No console warnings about re-renders
- [ ] Memory usage stable during long analysis
- [ ] No memory leaks when navigating away and back

### Security
- [ ] No PII in browser console
- [ ] AI content is sanitized (test with `<script>alert('xss')</script>`)
- [ ] Session IDs not logged

---

## Rollback Plan

If issues arise, restore from backup:

```bash
# Restore from backup
cp backups/analysis-page-YYYYMMDD/page.tsx app/rectify/\[id\]/page.tsx
cp backups/analysis-page-YYYYMMDD/use-stream-progress.ts lib/use-stream-progress.ts
cp backups/analysis-page-YYYYMMDD/UnifiedAIPanel.tsx components/rectify/UnifiedAIPanel.tsx
cp backups/analysis-page-YYYYMMDD/AnalysisPipelineTracker.tsx components/rectify/AnalysisPipelineTracker.tsx
cp backups/analysis-page-YYYYMMDD/LiveScoreTable.tsx components/rectify/LiveScoreTable.tsx
cp backups/analysis-page-YYYYMMDD/CandidateComparisonView.tsx components/rectify/CandidateComparisonView.tsx

# Remove new files
rm -f lib/secure-logger.ts lib/xss-sanitizer.ts
rm -f components/rectify/AnalysisErrorBoundary.tsx
rm -f components/rectify/*-fixed.tsx
rm -f app/rectify/\[id\]/page-fixed.tsx
```

---

## Additional Recommendations

### 1. Add Error Tracking

Integrate with Sentry or similar for production error monitoring:

```typescript
// In AnalysisErrorBoundary.tsx
componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    Sentry.captureException(error, {
        extra: { componentStack: errorInfo.componentStack }
    });
}
```

### 2. Add Analytics

Track user interactions:

```typescript
// In page.tsx
useEffect(() => {
    analytics.track('Analysis Started', { sessionId });
}, [sessionId]);
```

### 3. Service Worker for Offline

Consider adding offline support for the analysis page:

```typescript
// Register service worker
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw-analysis.js');
}
```

### 4. CSP Headers

Add Content Security Policy headers:

```http
Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-eval'; style-src 'self' 'unsafe-inline';
```

---

## Support

For issues during migration:

1. Check the audit report: `AUDIT_REPORT_ANALYSIS_PAGE.md`
2. Review component documentation in source comments
3. Enable debug logging: `logger.debug()` calls in browser console
4. Check browser DevTools Performance tab for re-render issues

---

## Version Info

- **Migration Date:** 2026-02-05
- **Audit Report:** AUDIT_REPORT_ANALYSIS_PAGE.md
- **Fixed Files:** 9 new/modified files
- **Lines of Code:** ~3000+ production-ready lines
- **Test Coverage Recommended:** 80%+ for critical paths
