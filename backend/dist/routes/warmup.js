"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const router = (0, express_1.Router)();
router.get('/', async (req, res) => {
    const AI_BASE_URL = process.env.ANTHROPIC_BASE_URL;
    if (!AI_BASE_URL) {
        return res.status(500).json({ error: 'Sacred AI endpoint not configured' });
    }
    console.log(`[WARMUP] Initiating anticipatory ping to: ${AI_BASE_URL}`);
    try {
        // We use a short timeout (5s) because we don't want to block the user.
        // Even if this request times out, HF will receive it and start the container.
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 5000);
        const response = await fetch(AI_BASE_URL, {
            method: 'GET',
            signal: controller.signal,
            headers: {
                'User-Agent': 'AI-Pandit-Warmup-Service/1.0',
            }
        });
        clearTimeout(timeout);
        console.log(`[WARMUP] Space responded with status: ${response.status}`);
        res.json({
            status: 'pulsing',
            waking: true,
            hfStatus: response.status
        });
    }
    catch (error) {
        if (error.name === 'AbortError') {
            console.log('[WARMUP] Ping timed out but signal sent. HF should be waking.');
            return res.json({ status: 'pulsing', message: 'Signal sent, container waking...' });
        }
        console.error('[WARMUP] Failed to ping Sacred Engine:', error.message);
        res.status(202).json({
            status: 'uncertain',
            message: 'Warmup signal sent with errors, but HF should track the ingress.'
        });
    }
});
exports.default = router;
//# sourceMappingURL=warmup.js.map