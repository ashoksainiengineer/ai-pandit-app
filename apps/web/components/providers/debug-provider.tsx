'use client';

import { useEffect } from 'react';
import { debugAnalysis } from '@/lib/debug/analysis-debug';
import { logger } from '@/lib/secure-logger';

/**
 * Debug Provider - Development only
 * Attaches debug utilities to window for console debugging
 */
export function DebugProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
      if (process.env.NODE_ENV === 'development') {
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
