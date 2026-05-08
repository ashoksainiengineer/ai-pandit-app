/**
 * Module declarations for files that may be excluded from tsc compilation
 * (e.g., scripts/ excluded by tsconfig, or debug modules).
 * This tells TypeScript these modules exist so imports don't fail at build time.
 */

declare module '../utils/debug-logger.js' {
  export function logAnalysisContainerAction(stage: string, message: string, payload?: unknown): void;
  export function clearDebugLog(): void;
  export function readDebugLog(): string;
}

declare module './debug-analysis.js' {
  import { Router } from 'express';
  const router: Router;
  export default router;
}

declare module './scripts/load-env.js' {
  export function initEnv(): void;
}
