# Debugging Tools Setup Complete ✅

## Global Tools Installed:
- ✅ clinic (Performance profiling)
- ✅ 0x (Flamegraphs)
- ✅ ndb (Advanced debugger)
- ✅ pm2 (Process manager)

## VS Code Configuration:
- ✅ .vscode/launch.json (Debug configs for API + Web)
- ✅ .vscode/extensions.json (Recommended extensions)

## Frontend Debug Files Created:
- ✅ apps/web/lib/debug/analysis-debug.ts (Console utilities)
- ✅ apps/web/lib/debug/extensions.ts (Extension checker)

## Browser Extensions Required:
1. **React Developer Tools** - Component inspection
2. **Redux DevTools** - Zustand store debugging
3. **JSONVue** - API response formatting

## Quick Start Commands:

### Backend Debug:
```bash
# With inspector
cd apps/api && npm run dev:debug

# Or attach to running process
node --inspect apps/api/dist/server.js
```

### Frontend Debug:
```bash
# Chrome DevTools
cd apps/web && npm run dev
# Then F12 → Sources → Command+P → search files
```

### PM2 Monitoring:
```bash
pm2 start apps/api/dist/server.js --name btr-api
pm2 monit
```

### Performance Profiling:
```bash
# Backend flamegraph
clinic doctor -- node apps/api/dist/server.js

# Frontend performance
# Chrome DevTools → Performance tab → Record
```

## Console Debugging (Frontend):
```javascript
// In browser console on analysis page:
debugAnalysis.logStreamState()     // Current stream state
debugAnalysis.checkMemory()         // Memory usage
debugAnalysis.monitorSSE()          // SSE connection tracking
debugAnalysis.inspectCandidate('coarse', '06:30:00')  // Specific candidate
debugAnalysis.getErrors()           // All errors from store
```

Ready for environment variables! 🚀