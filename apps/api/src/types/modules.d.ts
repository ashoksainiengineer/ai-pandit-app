/**
 * Module declarations for files that may be excluded from tsc compilation
 * (e.g., scripts/ excluded by tsconfig, or debug modules).
 * This tells TypeScript these modules exist so imports don't fail at build time.
 */

declare module '*/debug-logger.js' {
  export function clearDebugLog(): void;
  export function readDebugLog(): string;
}

declare module '*/debug-analysis.js' {
  const router: Router;
  export default router;
}

declare module '*/scripts/load-env.js' {
}
