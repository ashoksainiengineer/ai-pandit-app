const express = require('express');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const app = express();
const PORT = 3456;

let latestLogs = [];
let analysisStatus = 'idle';
let startTime = null;

app.use(express.static('public'));

app.get('/', (req, res) => {
  res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>God Tier BTR - Narendra Modi Analysis</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
            color: #e0e0e0;
            min-height: 100vh;
            padding: 20px;
        }
        
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            padding: 30px;
            border-radius: 15px;
            margin-bottom: 30px;
            box-shadow: 0 10px 40px rgba(0,0,0,0.3);
        }
        
        .header h1 {
            font-size: 2.5em;
            margin-bottom: 10px;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
        }
        
        .header .subtitle {
            font-size: 1.1em;
            opacity: 0.9;
        }
        
        .status-bar {
            display: flex;
            gap: 20px;
            margin-bottom: 30px;
            flex-wrap: wrap;
        }
        
        .status-card {
            background: rgba(255,255,255,0.05);
            border: 1px solid rgba(255,255,255,0.1);
            border-radius: 10px;
            padding: 20px;
            min-width: 200px;
            flex: 1;
        }
        
        .status-card h3 {
            font-size: 0.9em;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-bottom: 10px;
            color: #a0a0a0;
        }
        
        .status-card .value {
            font-size: 1.8em;
            font-weight: bold;
        }
        
        .status-running { color: #4ade80; }
        .status-complete { color: #60a5fa; }
        .status-error { color: #f87171; }
        .status-idle { color: #9ca3af; }
        
        .progress-container {
            background: rgba(255,255,255,0.05);
            border-radius: 10px;
            padding: 20px;
            margin-bottom: 30px;
        }
        
        .progress-bar {
            width: 100%;
            height: 30px;
            background: rgba(255,255,255,0.1);
            border-radius: 15px;
            overflow: hidden;
            position: relative;
        }
        
        .progress-fill {
            height: 100%;
            background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
            border-radius: 15px;
            transition: width 0.5s ease;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
            text-shadow: 1px 1px 2px rgba(0,0,0,0.5);
        }
        
        .stages-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }
        
        .stage-card {
            background: rgba(255,255,255,0.05);
            border: 2px solid rgba(255,255,255,0.1);
            border-radius: 10px;
            padding: 20px;
            transition: all 0.3s ease;
        }
        
        .stage-card.active {
            border-color: #4ade80;
            background: rgba(74, 222, 128, 0.1);
            box-shadow: 0 0 20px rgba(74, 222, 128, 0.2);
        }
        
        .stage-card.complete {
            border-color: #60a5fa;
            background: rgba(96, 165, 250, 0.1);
        }
        
        .stage-card.pending {
            opacity: 0.5;
        }
        
        .stage-number {
            font-size: 0.8em;
            color: #a0a0a0;
            margin-bottom: 5px;
        }
        
        .stage-name {
            font-size: 1.2em;
            font-weight: bold;
            margin-bottom: 10px;
        }
        
        .stage-status {
            font-size: 0.9em;
            padding: 5px 10px;
            border-radius: 5px;
            display: inline-block;
        }
        
        .logs-container {
            background: rgba(0,0,0,0.3);
            border-radius: 10px;
            padding: 20px;
            max-height: 600px;
            overflow-y: auto;
            font-family: 'Courier New', monospace;
            font-size: 0.85em;
            line-height: 1.6;
        }
        
        .log-entry {
            padding: 5px 0;
            border-bottom: 1px solid rgba(255,255,255,0.05);
        }
        
        .log-timestamp {
            color: #60a5fa;
            margin-right: 10px;
        }
        
        .log-level-info { color: #4ade80; }
        .log-level-warn { color: #fbbf24; }
        .log-level-error { color: #f87171; }
        
        .controls {
            margin-bottom: 20px;
        }
        
        .btn {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border: none;
            padding: 15px 30px;
            border-radius: 8px;
            font-size: 1em;
            cursor: pointer;
            transition: transform 0.2s;
            margin-right: 10px;
        }
        
        .btn:hover {
            transform: translateY(-2px);
        }
        
        .btn:disabled {
            opacity: 0.5;
            cursor: not-allowed;
        }
        
        @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
        }
        
        .pulse {
            animation: pulse 2s infinite;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>🔱 God Tier BTR Analysis</h1>
        <div class="subtitle">Narendra Modi - 32 Events (All 12 Houses) | Sept 17, 1950, Vadnagar</div>
    </div>
    
    <div class="status-bar">
        <div class="status-card">
            <h3>Status</h3>
            <div class="value" id="status">${analysisStatus}</div>
        </div>
        <div class="status-card">
            <h3>Duration</h3>
            <div class="value" id="duration">00:00</div>
        </div>
        <div class="status-card">
            <h3>Current Stage</h3>
            <div class="value" id="current-stage">-</div>
        </div>
        <div class="status-card">
            <h3>Candidates</h3>
            <div class="value" id="candidates">0</div>
        </div>
    </div>
    
    <div class="progress-container">
        <h3 style="margin-bottom: 10px;">Overall Progress</h3>
        <div class="progress-bar">
            <div class="progress-fill" id="progress" style="width: 0%">0%</div>
        </div>
    </div>
    
    <div class="stages-grid">
        <div class="stage-card pending" id="stage-1">
            <div class="stage-number">STAGE 1</div>
            <div class="stage-name">Exhaustive Data</div>
            <span class="stage-status">Pending</span>
        </div>
        <div class="stage-card pending" id="stage-2">
            <div class="stage-number">STAGE 2</div>
            <div class="stage-name">Batch Tournament</div>
            <span class="stage-status">Pending</span>
        </div>
        <div class="stage-card pending" id="stage-3">
            <div class="stage-number">STAGE 3</div>
            <div class="stage-name">Refinement Grid</div>
            <span class="stage-status">Pending</span>
        </div>
        <div class="stage-card pending" id="stage-4">
            <div class="stage-number">STAGE 4</div>
            <div class="stage-name">Deep Analysis</div>
            <span class="stage-status">Pending</span>
        </div>
        <div class="stage-card pending" id="stage-5">
            <div class="stage-number">STAGE 5</div>
            <div class="stage-name">Micro Grid</div>
            <span class="stage-status">Pending</span>
        </div>
        <div class="stage-card pending" id="stage-6">
            <div class="stage-number">STAGE 6</div>
            <div class="stage-name">Final Precision</div>
            <span class="stage-status">Pending</span>
        </div>
    </div>
    
    <div class="controls">
        <button class="btn" onclick="startAnalysis()">🚀 Start Analysis</button>
        <button class="btn" onclick="clearLogs()">🗑️ Clear Logs</button>
    </div>
    
    <div class="logs-container" id="logs">
        <div class="log-entry">
            <span class="log-timestamp">--:--:--</span>
            <span class="log-level-info">[INFO]</span>
            <span>Ready to start analysis. Click 'Start Analysis' to begin.</span>
        </div>
    </div>

    <script>
        let updateInterval;
        let startTime;
        
        function updateStatus() {
            fetch('/api/status')
                .then(r => r.json())
                .then(data => {
                    document.getElementById('status').textContent = data.status;
                    document.getElementById('status').className = 'value status-' + data.status;
                    
                    if (data.startTime) {
                        const elapsed = Math.floor((Date.now() - data.startTime) / 1000);
                        const mins = Math.floor(elapsed / 60).toString().padStart(2, '0');
                        const secs = (elapsed % 60).toString().padStart(2, '0');
                        document.getElementById('duration').textContent = mins + ':' + secs;
                    }
                    
                    document.getElementById('current-stage').textContent = data.currentStage || '-';
                    document.getElementById('candidates').textContent = data.candidates || 0;
                    
                    // Update progress
                    const progress = data.progress || 0;
                    document.getElementById('progress').style.width = progress + '%';
                    document.getElementById('progress').textContent = progress + '%';
                    
                    // Update stages
                    for (let i = 1; i <= 6; i++) {
                        const stageCard = document.getElementById('stage-' + i);
                        const stageStatus = stageCard.querySelector('.stage-status');
                        
                        if (data.stageStatus && data.stageStatus[i]) {
                            const status = data.stageStatus[i];
                            stageCard.className = 'stage-card ' + status;
                            stageStatus.textContent = status.charAt(0).toUpperCase() + status.slice(1);
                        }
                    }
                });
        }
        
        function updateLogs() {
            fetch('/api/logs')
                .then(r => r.json())
                .then(data => {
                    const logsContainer = document.getElementById('logs');
                    logsContainer.innerHTML = data.logs.map(log => {
                        const levelClass = log.level === 'ERROR' ? 'log-level-error' : 
                                          log.level === 'WARN' ? 'log-level-warn' : 'log-level-info';
                        return '<div class="log-entry">' +
                            '<span class="log-timestamp">' + log.time + '</span>' +
                            '<span class="' + levelClass + '">[' + log.level + ']</span> ' +
                            '<span>' + log.message + '</span>' +
                        '</div>';
                    }).join('');
                    logsContainer.scrollTop = logsContainer.scrollHeight;
                });
        }
        
        function startAnalysis() {
            fetch('/api/start', { method: 'POST' })
                .then(() => {
                    startTime = Date.now();
                    updateInterval = setInterval(() => {
                        updateStatus();
                        updateLogs();
                    }, 1000);
                });
        }
        
        function clearLogs() {
            fetch('/api/clear', { method: 'POST' })
                .then(() => updateLogs());
        }
        
        // Auto-update
        setInterval(updateStatus, 1000);
        setInterval(updateLogs, 1000);
    </script>
</body>
</html>
  `);
});

app.get('/api/status', (req, res) => {
  res.json({
    status: analysisStatus,
    startTime: startTime,
    currentStage: latestLogs.find(l => l.message.includes('Stage'))?.stage || null,
    candidates: latestLogs.find(l => l.message.includes('candidates'))?.candidates || 0,
    progress: calculateProgress(),
    stageStatus: getStageStatus()
  });
});

app.get('/api/logs', (req, res) => {
  res.json({ logs: latestLogs.slice(-100) });
});

app.post('/api/start', (req, res) => {
  startAnalysis();
  res.json({ started: true });
});

app.post('/api/clear', (req, res) => {
  latestLogs = [];
  res.json({ cleared: true });
});

function calculateProgress() {
  if (analysisStatus === 'complete') return 100;
  if (analysisStatus === 'idle') return 0;
  
  const stageProgress = {
    'Stage 1': 15,
    'Stage 2': 35,
    'Stage 3': 50,
    'Stage 4': 70,
    'Stage 5': 85,
    'Stage 6': 95
  };
  
  for (const [stage, progress] of Object.entries(stageProgress)) {
    if (latestLogs.some(l => l.message.includes(stage))) {
      return progress;
    }
  }
  return 0;
}

function getStageStatus() {
  const status = {};
  for (let i = 1; i <= 6; i++) {
    const stageLog = latestLogs.find(l => l.message.includes('Stage ' + i));
    if (stageLog) {
      if (latestLogs.some(l => l.message.includes('Stage ' + (i + 1)))) {
        status[i] = 'complete';
      } else {
        status[i] = 'active';
      }
    } else {
      status[i] = 'pending';
    }
  }
  return status;
}

function startAnalysis() {
  analysisStatus = 'running';
  startTime = Date.now();
  latestLogs = [];

  const env = {
    ...process.env,
    AI_API_KEY: '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',
    AI_BASE_URL: 'https://api.groq.com/openai/v1',
    AI_MODEL: 'openai/gpt-oss-120b',
    AI_STAGE2_MAX_TOKENS: '32768',
    AI_STAGE4_MAX_TOKENS: '32768',
    AI_STAGE6_MAX_TOKENS: '32768',
    CLERK_SECRET_KEY: 'sk_test_5y6ECBKB4faegrYiRkK3yZOoSnIyxwXCZaUeKbS1yA',
    ENCRYPTION_SECRET: 'this-is-a-test-encryption-secret-key-with-32-chars',
    NEON_DATABASE_URL: 'postgresql://user:pass@localhost/test'
  };
  
  const child = spawn('node', ['--max-old-space-size=8192', 'modi_btr_godtier.mjs'], {
    cwd: '/home/ashoksainiengineer/ai-pandit-app/apps/api',
    env
  });
  
  child.stdout.on('data', (data) => {
    const lines = data.toString().split('\\n');
    lines.forEach(line => {
      if (line.trim()) {
        latestLogs.push({
          time: new Date().toLocaleTimeString(),
          level: line.includes('ERROR') ? 'ERROR' : line.includes('WARN') ? 'WARN' : 'INFO',
          message: line
        });
      }
    });
  });
  
  child.stderr.on('data', (data) => {
    latestLogs.push({
      time: new Date().toLocaleTimeString(),
      level: 'ERROR',
      message: data.toString()
    });
  });
  
  child.on('close', (code) => {
    analysisStatus = code === 0 ? 'complete' : 'error';
  });
}

app.listen(PORT, () => {
  console.log('══════════════════════════════════════════════════════════════════');
  console.log('BTR LIVE DASHBOARD STARTED');
  console.log('══════════════════════════════════════════════════════════════════');
  console.log('Open in browser: http://localhost:' + PORT);
  console.log('');
  console.log('Click "Start Analysis" to begin God Tier BTR with Modi data');
  console.log('');
});
