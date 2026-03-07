import { Router } from 'express';
import { readDebugLog, clearDebugLog } from '../utils/debug-logger.js';

const router = Router();

router.get('/', (req, res) => {
    const logs = readDebugLog();

    // Simple Glassmorphism Dark Theme HTML
    const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>AI Pandit - Analysis Debugger</title>
        <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600&family=Fira+Code:wght@400&display=swap');
            
            :root {
                --bg: #09090b;
                --surface: rgba(24, 24, 27, 0.6);
                --border: rgba(255, 255, 255, 0.1);
                --text: #ededed;
                --accent: #3b82f6;
                --success: #10b981;
            }
            
            body { 
                background-color: var(--bg); 
                color: var(--text); 
                font-family: 'Inter', sans-serif; 
                margin: 0; 
                padding: 2rem; 
                line-height: 1.5;
            }
            
            h1 { font-weight: 300; letter-spacing: -1px; margin-bottom: 2rem; text-align: center; }
            .header-bar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; }
            .btn { background: var(--surface); color: var(--text); border: 1px solid var(--border); padding: 0.5rem 1rem; border-radius: 6px; cursor: pointer; transition: all 0.2s; }
            .btn:hover { background: var(--border); }
            .btn-clear { color: #ef4444; border-color: rgba(239, 68, 68, 0.3); }
            
            .grid { display: flex; flex-direction: column; gap: 1rem; }
            
            .card {
                background: var(--surface);
                backdrop-filter: blur(12px);
                border: 1px solid var(--border);
                border-radius: 12px;
                padding: 1.5rem;
                box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
            }
            
            .card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; border-bottom: 1px solid var(--border); padding-bottom: 0.5rem; }
            .badge { background: rgba(59, 130, 246, 0.2); color: var(--accent); padding: 0.25rem 0.75rem; border-radius: 999px; font-size: 0.85rem; font-weight: 600; text-transform: uppercase;}
            .timestamp { color: #a1a1aa; font-size: 0.85rem; font-family: 'Fira Code', monospace; }
            
            pre {
                background: rgba(0, 0, 0, 0.4);
                padding: 1rem;
                border-radius: 8px;
                overflow-x: auto;
                font-family: 'Fira Code', monospace;
                font-size: 0.85rem;
                color: #d4d4d8;
                border: 1px solid var(--border);
                max-height: 400px;
                overflow-y: auto;
            }
            
            /* Custom Scrollbar for Pre */
            pre::-webkit-scrollbar { width: 8px; height: 8px; }
            pre::-webkit-scrollbar-track { background: transparent; }
            pre::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.2); border-radius: 4px; }
            
        </style>
    </head>
    <body>
        <div class="header-bar">
            <h1>🔭 Analysis Containers Debug View</h1>
            <div>
                <button class="btn" onclick="window.location.reload()">Refresh Stream</button>
                <form method="POST" action="/api/debug-analysis/clear" style="display:inline;">
                    <button type="submit" class="btn btn-clear">Clear Logs</button>
                </form>
            </div>
        </div>
        
        <div class="grid">
            ${logs.length === 0 ? '<div class="card" style="text-align:center;color:#a1a1aa;">No analysis data currently available. Start a BTR session.</div>' : ''}
            ${logs.reverse().map(log => `
                <div class="card">
                    <div class="card-header">
                        <span class="badge">Stage ${log.stage} | ${log.context}</span>
                        <span class="timestamp">${new Date(log.timestamp).toLocaleTimeString()}</span>
                    </div>
                    ${log.payload && typeof log.payload === 'object' ? `<pre>${JSON.stringify(log.payload, null, 2).replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre>` : `<pre>${String(log.payload).replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre>`}
                </div>
            `).join('')}
        </div>
        
        <script>
            // Auto-refresh every 5 seconds if near top
            setInterval(() => {
                if (window.scrollY < 100) {
                    window.location.reload();
                }
            }, 5000);
        </script>
    </body>
    </html>
    `;

    res.setHeader('Content-Type', 'text/html');
    res.send(html);
});

router.post('/clear', (req, res) => {
    clearDebugLog();
    res.redirect('/api/debug-analysis');
});

export default router;
