declare module '*/debug-logger.js' {
  function logAnalysisContainerAction(stage: string | number, context: string, payload: unknown): void;
  function clearDebugLog(): void;
  function readDebugLog(): string;
}

declare module '*/debug-analysis.js' {
  import { Router } from 'express';
  const router: Router;
  export default router;
}

declare module '*/scripts/load-env.js' {
  function initEnv(): void;
}
