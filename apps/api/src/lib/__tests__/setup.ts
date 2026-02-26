import { beforeAll } from 'vitest';

beforeAll(async () => {
    if (process.env.SKIP_SWISSEPH_INIT === 'true') {
        console.log('⏭️ [TEST SETUP] Skipping Swiss Ephemeris initialization as requested');
        return;
    }

    console.log('🧪 [TEST SETUP] Initializing Swiss Ephemeris...');
    try {
        // Use dynamic import to avoid static import deadlocks/hangs
        const { initSwissEph } = await import('../ephemeris.js');
        const success = await initSwissEph();
        if (!success) {
            console.warn('⚠️ [TEST SETUP] Swiss Ephemeris failed to initialize, using algorithmic fallback');
        } else {
            console.log('✅ [TEST SETUP] Swiss Ephemeris ready');
        }
    } catch (error) {
        console.error('❌ [TEST SETUP] Critical error during initialization:', error);
        throw error;
    }
});
