# 🛠️ AI-Pandit Debugging Setup Complete

## ✅ Installed Tools

### Global CLI Tools
- **clinic** - Performance profiling and flamegraphs
- **0x** - Zero-config flamegraph generation
- **ndb** - Google's advanced Node.js debugger
- **pm2** - Process manager with monitoring

### VS Code Configuration
- Debug configs for API (attach + launch)
- Debug configs for Web (Chrome + Edge)
- Full-stack debugging compound
- Recommended extensions

### Frontend Debug Infrastructure
- Debug utilities in `apps/web/lib/debug/`
- DebugProvider component (dev-only)
- Browser console helpers
- Extension compatibility checks

---

## 🚀 Quick Start

### 1. Start Development Servers

```bash
# Terminal 1 - Backend with debugger
cd apps/api
npm run dev:debug  # or: node --inspect dist/server.js

# Terminal 2 - Frontend
cd apps/web
npm run dev

# Terminal 3 - Monitor (optional)
pm2 start apps/api/dist/server.js --name btr-api
pm2 monit
```

### 2. Open Debug Tools

**VS Code:**
- Press F5
- Select "Debug Full Stack" for both frontend and backend

**Chrome:**
- Navigate to `http://localhost:3000`
- Press F12 for DevTools
- Install React DevTools extension

**Backend Inspector:**
- Open `chrome://inspect` in Chrome
- Click "Open dedicated DevTools for Node"

---

## 🔍 Frontend Debugging (Analysis Page)

### Console Commands (Browser DevTools)

```javascript
// Stream State Inspection
debugAnalysis.logStreamState()
// Shows: Connection status, current stage, progress %, candidate counts

debugAnalysis.checkMemory()
// Shows: JS Heap usage, limit, percentage

debugAnalysis.getErrors()
// Shows: Connection errors, stream errors, last error

debugAnalysis.inspectCandidate('coarse', '06:30:00')
// Inspect specific candidate by stage and time

debugAnalysis.monitorSSE()
// Monitor SSE connection attempts and events
```

### React DevTools Usage

1. **Component Tree**
   - Open Components tab
   - Search: "AnalysisPage", "UnifiedAIPanel", "StageLeaderboard"
   - Inspect props and state

2. **Profiler**
   - Click "Record" button
   - Interact with analysis page
   - Check for slow renders (>16ms)
   - Look for unnecessary re-renders

3. **Highlight Updates**
   - Settings (gear icon) → "Highlight updates when components render"
   - Flashing components = frequent re-renders

### Network Tab (SSE Debugging)

1. Filter: `eventsource` or `stream`
2. Click on the SSE connection
3. Watch "EventStream" tab for real-time events
4. Check "Timing" tab for connection metrics

### Performance Tab

1. Click "Record" (circle button)
2. Perform action (e.g., start analysis)
3. Stop recording
4. Analyze:
   - **Frames**: Check for dropped frames
   - **Main**: Long JavaScript execution
   - **Timings**: Component lifecycle events

---

## 🔍 Backend Debugging

### VS Code Debug Configurations

**"Debug API (Attach)"**
- Attach to running Node.js process on port 9229
- Use when API already running with `--inspect`

**"Debug API (Launch)"**
- Launches API with tsx watch mode
- Auto-attaches debugger
- Best for development

**"Debug Full Stack"**
- Launches both API and Chrome
- Single F5 to debug everything

### Breakpoint Strategy

**Key Files to Debug:**
```
apps/api/src/lib/seconds-precision-btr.ts    # 6-stage pipeline
apps/api/src/lib/queue-manager.ts             # Queue processing
apps/api/src/lib/progress-tracker.ts          # Progress tracking
apps/api/src/lib/ai-client.ts                 # AI calls
apps/api/src/routes/stream.ts                 # SSE endpoint
```

**Common Breakpoints:**
- `processSecondsPrecisionBTR` - Stage entry points
- `emitProgress` - Progress updates
- `callAI` - AI API calls
- Stream route handlers

### PM2 Monitoring

```bash
# Start with PM2
pm2 start apps/api/dist/server.js --name btr-api --watch

# Monitor
pm2 monit                    # Real-time dashboard
pm2 logs btr-api             # Logs
pm2 status                  # Process status

# Advanced monitoring
pm2 install pm2-server-monit
```

### Clinic.js Profiling

```bash
# Doctor - Check for common issues
cd apps/api && clinic doctor -- node dist/server.js

# Flame - Generate flamegraph
cd apps/api && clinic flame -- node dist/server.js

# Bubbleprof - Async flow
cd apps/api && clinic bubbleprof -- node dist/server.js
```

---

## 🐛 Common Issues & Debugging

### Issue: SSE Disconnections

**Debug Steps:**
1. Browser Console: `debugAnalysis.monitorSSE()`
2. Network Tab: Check SSE eventsource connection
3. Backend Logs: Check for errors in queue-manager
4. VS Code: Breakpoint in `stream.ts` route handler

### Issue: UI Freezing

**Debug Steps:**
1. Performance Tab: Record and check for long tasks
2. React DevTools Profiler: Check render times
3. Console: `debugAnalysis.checkMemory()`
4. Check for memory leaks in stream-store.ts

### Issue: AI Responses Not Showing

**Debug Steps:**
1. Network Tab: Check if AI calls succeeding (200 OK)
2. Backend: Breakpoint in `ai-client.ts` parse response
3. Store: Check `candidatesByStage` in Redux DevTools
4. Console: Check `debugAnalysis.getErrors()`

### Issue: Progress Not Updating

**Debug Steps:**
1. SSE Events: Monitor in Network tab
2. Backend: Check `progress-tracker.ts` emitProgress
3. Store: Check Zustand store updates
4. Component: Breakpoint in AnalysisPage render

---

## 📊 Performance Monitoring

### Frontend Metrics

```javascript
// In browser console
// Core Web Vitals
new PerformanceObserver((list) => {
  for (const entry of list.getEntries()) {
    console.log('CLS:', entry.value);
  }
}).observe({ entryTypes: ['layout-shift'] });

// Memory usage
setInterval(() => {
  debugAnalysis.checkMemory();
}, 5000);
```

### Backend Metrics

```bash
# Heap snapshots
node --heap-prof apps/api/dist/server.js

# GC tracing
node --trace-gc apps/api/dist/server.js

# Performance hooks
NODE_ENV=development node apps/api/dist/server.js
```

---

## 🔧 Advanced Debugging

### ndb (Advanced Node Debugger)

```bash
ndb node apps/api/dist/server.js
```
Features:
- Source maps support
- Call stack visualization
- Variable inspection

### 0x (Flamegraphs)

```bash
0x --kernel-tracing -- node apps/api/dist/server.js
```
Generates interactive flamegraph HTML.

### Redux DevTools for Zustand

Install browser extension, then:
- Open Redux DevTools tab
- See all Zustand store actions
- Time-travel debugging
- State inspection

---

## 📱 Mobile Debugging

### Chrome Remote Debugging

1. Connect Android device via USB
2. Chrome: `chrome://inspect#devices`
3. Click "Inspect" on your device
4. Use all desktop debugging tools

### iOS Safari Debugging

1. iPhone: Settings → Safari → Advanced → Web Inspector
2. Mac: Safari → Preferences → Advanced → Show Develop menu
3. Connect iPhone to Mac
4. Safari Develop menu → Select device

---

## 🎯 Debug Checklist

Before Reporting Issues:

- [ ] Browser extensions installed (React DevTools, Redux DevTools)
- [ ] Console errors checked (`debugAnalysis.getErrors()`)
- [ ] Memory usage checked (`debugAnalysis.checkMemory()`)
- [ ] Network tab checked for failed requests
- [ ] React Profiler checked for slow renders
- [ ] Backend logs checked for errors
- [ ] VS Code breakpoints tested
- [ ] SSE connection monitored

---

## 🆘 Emergency Debugging

If everything fails:

```bash
# Kill all node processes
killall node

# Clear all caches
rm -rf apps/web/.next
rm -rf apps/api/dist
rm -rf node_modules/.cache

# Fresh start
npm install
npm run build
npm run dev
```

---

## 📞 Getting Help

When asking for help, provide:
1. Browser console errors (screenshot)
2. Backend logs (last 50 lines)
3. `debugAnalysis.logStreamState()` output
4. `debugAnalysis.checkMemory()` output
5. Network tab screenshot (filtered to "stream")
6. React DevTools Profiler recording

---

**Ready to debug! 🚀**

Set your environment variables and start the servers.