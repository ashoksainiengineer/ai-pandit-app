# Function Warmup Setup Guide (Free Tier)

## Problem
Vercel free tier mein Cron Jobs nahi hain (Pro tier required). Isliye cold start problem solve karne ke liye external free services use karenge.

## Solution: Multiple Free Options

### Option 1: GitHub Actions (Recommended)
**Cost:** 100% Free (2000 minutes/month)

#### Setup Steps:

1. **Secret Add Karo:**
   - GitHub repo → Settings → Secrets → Actions
   - New repository secret: `VERCEL_URL`
   - Value: `https://your-app.vercel.app`

2. **Automatic Execution:**
   - Har 5 minute mein automatically run hoga
   - `.github/workflows/warmup.yml` already configured hai

3. **Manual Trigger:**
   - Actions tab → "Keep Functions Warm" → Run workflow

#### Limits:
- 2000 minutes/month (approx 4000 runs)
- 5-minute minimum interval
- Public repos mein unlimited

---

### Option 2: UptimeRobot (Simplest)
**Cost:** 100% Free (50 monitors)

#### Setup Steps:

1. **Account Banao:**
   - https://uptimerobot.com/sign-up

2. **Monitor Add Karo:**
   ```
   Monitor Type: HTTP(s)
   Friendly Name: AI Pandit Ping
   URL: https://your-app.vercel.app/api/ping
   Monitoring Interval: 5 minutes
   ```

3. **Second Monitor (Optional):**
   ```
   URL: https://your-app.vercel.app/api/health
   ```

#### Benefits:
- Setup in 2 minutes
- Email alerts agar down ho
- Dashboard mein uptime stats

---

### Option 3: Cron-job.org (Most Flexible)
**Cost:** 100% Free

#### Setup Steps:

1. **Account Banao:**
   - https://cron-job.org/en/

2. **Job Create Karo:**
   ```
   Title: AI Pandit Warmup
   URL: https://your-app.vercel.app/api/ping
   Schedule: Every 5 minutes
   Timeout: 30 seconds
   ```

3. **Notification Set Karo (Optional):**
   - Email alerts enable kar sakte ho

#### Benefits:
- 1-minute intervals possible
- Execution history
- Failed job notifications

---

### Option 4: Google Apps Script
**Cost:** 100% Free

#### Setup Steps:

1. **Script Banao:**
   - https://script.google.com
   - New project

2. **Code Paste Karo:**
   ```javascript
   function warmup() {
     const url = 'https://your-app.vercel.app/api/ping';
     UrlFetchApp.fetch(url, {
       method: 'GET',
       muteHttpExceptions: true
     });
   }
   ```

3. **Trigger Set Karo:**
   - Clock icon (Triggers)
   - Add Trigger
   - Choose function: warmup
   - Deployment: Head
   - Event source: Time-driven
   - Type: Minutes timer
   - Interval: Every 5 minutes

---

## Recommended Setup (Combining Options)

**Primary:** GitHub Actions (reliable, integrated)
**Backup:** UptimeRobot (monitoring + backup ping)

Isse redundancy milega - agar ek fail ho to dusra kaam karega.

## Verify Warmup is Working

1. **Vercel Logs Check Karo:**
   - Vercel Dashboard → Project → Functions
   - Regular `/api/ping` calls dikhne chahiye

2. **Response Time Check Karo:**
   ```bash
   curl -w "@curl-format.txt" -o /dev/null -s https://your-app.vercel.app/api/ping
   ```

3. **Cold Start Test:**
   - 10-15 minutes wait karo
   - Phir endpoint call karo
   - Response time < 200ms hona chahiye

## Cost Comparison

| Service | Cost | Interval | Best For |
|---------|------|----------|----------|
| GitHub Actions | Free | 5 min | Existing GitHub users |
| UptimeRobot | Free | 5 min | Simple setup |
| Cron-job.org | Free | 1 min | Most frequent pings |
| Google Apps Script | Free | 1 min | Google ecosystem |

---

## Troubleshooting

**Q: GitHub Actions mein "Resource not accessible" error?**
A: Settings → Actions → General → Workflow permissions → Read and write permissions

**Q: Vercel logs mein ping calls nahi dikh rahe?**
A: URL verify karo, secret correctly set hai ya nahi

**Q: Phir bhi cold start feel ho raha hai?**
A: 2-3 services combine karo, aur `/api/ping` ke saath `/api/health` bhi ping karo
