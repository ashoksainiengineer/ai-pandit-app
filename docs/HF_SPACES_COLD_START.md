# Hugging Face Spaces Cold Start Handling

## Problem

Hugging Face Spaces **sleep after 48 hours of inactivity**:
- Space shuts down to save resources
- Wake-up takes **30-60 seconds**
- First request after sleep is very slow
- Users see timeouts or errors

## Solutions (Choose One or Combine)

### Option 1: GitHub Actions Keep-Alive (Recommended + Free)

Already configured in `.github/workflows/hf-keepalive.yml`:
- Runs every 6 hours
- Prevents 48-hour sleep
- **Cost:** Free (GitHub Actions)

**Setup:**
1. Go to GitHub repo → Settings → Secrets → Actions
2. Add secret: `HF_SPACE_URL`
3. Value: `https://your-username-ai-pandit.hf.space`

### Option 2: External Uptime Monitor (More Reliable)

Use free tier of:
- **UptimeRobot** (upptime.com)
- **Cron-job.org**
- **Better Uptime**

**Setup:**
```
URL: https://your-username-ai-pandit.hf.space/health
Interval: Every 30 minutes
```

### Option 3: Frontend Cold Start Handling

Use the enhanced API client in `lib/api-client-hf.ts`:

```typescript
import { fetchWithColdStartHandling, checkHFHealth } from '@/lib/api-client-hf';

// Automatic retry on cold start
const result = await fetchWithColdStartHandling('/api/calculate', {
  method: 'POST',
  body: JSON.stringify(data),
});

if (result.isColdStart) {
  showToast('Server is waking up, please wait...');
}
```

### Option 4: Accept Cold Starts (Lazy Loading)

Show loading UI during wake-up:

```typescript
// components/HFSpaceStatus.tsx
export function HFSpaceStatus() {
  const [status, setStatus] = useState<'checking' | 'awake' | 'waking'>('checking');
  
  useEffect(() => {
    checkHFHealth().then(result => {
      setStatus(result.healthy ? 'awake' : result.isColdStart ? 'waking' : 'error');
    });
  }, []);
  
  if (status === 'waking') {
    return <Loading message="Server is waking up (30-60s)..." />;
  }
  
  return null;
}
```

## Combined Strategy (Best)

1. **GitHub Actions** - Primary keep-alive (every 6 hours)
2. **Frontend handling** - Graceful UX for edge cases
3. **Health check** - Monitor status

## Monitoring

### Check if HF Space is awake:
```bash
curl https://your-username-ai-pandit.hf.space/health
```

### Expected responses:
- **200 OK**: Space is awake
- **Timeout/Error**: Space is sleeping or waking up

## Cost Comparison

| Solution | Cost | Reliability | Setup |
|----------|------|-------------|-------|
| GitHub Actions | Free | Good | Easy |
| UptimeRobot | Free | Excellent | Easy |
| Better Uptime | Free tier | Excellent | Medium |
| No keep-alive | Free | Poor | None |

## Troubleshooting

### Space still sleeping?
- Check GitHub Actions logs
- Verify `HF_SPACE_URL` secret
- Increase ping frequency (every 4 hours)

### Slow wake-up?
- Normal: 30-60 seconds
- Check HF Space logs for errors
- Verify container startup time

### Ping returns 503?
- Space is waking up
- Wait 30-60 seconds
- Retry the request

## Frontend Integration

Add to your app initialization:

```typescript
// app/layout.tsx or _app.tsx
useEffect(() => {
  // Prewarm HF Space on user interaction
  const handleInteraction = () => {
    prewarmHFSpace();
  };
  
  window.addEventListener('click', handleInteraction, { once: true });
  
  return () => {
    window.removeEventListener('click', handleInteraction);
  };
}, []);
```

This triggers wake-up when user first interacts with the page.
