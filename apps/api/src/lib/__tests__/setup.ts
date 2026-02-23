import { initSwissEph } from '../ephemeris.js';
import { beforeAll } from 'vitest';

beforeAll(async () => {
    console.log('🧪 [TEST SETUP] Initializing Swiss Ephemeris...');
    const success = await initSwissEph();
    if (!success) {
        throw new Error('Failed to initialize Swiss Ephemeris for tests');
    }
    console.log('✅ [TEST SETUP] Swiss Ephemeris ready');
});
