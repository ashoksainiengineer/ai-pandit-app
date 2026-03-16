'use client';

import { useEffect } from 'react';
import { logger } from '@/lib/secure-logger';

/**
 * Debug Provider - Development only
 * Attaches debug utilities to window for console debugging
 */
export function DebugProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
      if (process.env.NODE_ENV === 'development') {
      // Dynamically import debug utilities to avoid build issues
      let debugAnalysis: any = {};
      try {
        const debugModule = require('@/lib/debug/analysis-debug');
        debugAnalysis = debugModule.debugAnalysis || {};
      } catch (e) {
        // Debug module not available in production build
        debugAnalysis = {
          logStreamState: () => console.log('Debug not available'),
          checkMemory: () => console.log('Debug not available'),
          monitorSSE: () => console.log('Debug not available'),
          checkRenders: () => console.log('Debug not available'),
          inspectCandidate: () => console.log('Debug not available'),
          getErrors: () => console.log('Debug not available'),
        };
      }
      
      // Attach to window
      (window as any).debugAnalysis = debugAnalysis;
      
      // Expose Zustand store if available
      const checkStore = setInterval(() => {
        const store = (window as any).__STREAM_STORE__ || 
                     (window as any).useStreamStore;
        if (store) {
          (window as any).__STREAM_STORE__ = store;
          clearInterval(checkStore);
        }
      }, 1000);
      
      logger.info('🔧 Debug utilities loaded! Try:');
      logger.info('  debugAnalysis.logStreamState()');
      logger.info('  debugAnalysis.checkMemory()');
      logger.info('  debugAnalysis.getErrors()');
      
      return () => clearInterval(checkStore);
    }
  }, []);

  return <>{children}</>;
}
