/**
 * Build-Time Warmup Script
 * Pings critical endpoints after deployment to ensure they're warm
 */

import { executeWarmup } from '../lib/warmup';

const ENDPOINTS = [
  '/api/ping',
  '/api/health',
];

async function main(): Promise<void> {
  console.log('🔥 Starting post-build warmup...');

  try {
    await executeWarmup({
      endpoints: ENDPOINTS,
      timeoutMs: 10000,
    });
    console.log('✅ Warmup completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Warmup failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}
