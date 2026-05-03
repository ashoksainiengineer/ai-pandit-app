import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const envFiles = [
  path.resolve(__dirname, '../../.env.local'),
  path.resolve(__dirname, '../../.env'),
  path.resolve(__dirname, '../../../../.env.local'),
  path.resolve(__dirname, '../../../../.env'),
];

const localSecretFiles = [
  path.resolve(__dirname, '../../../../local/dev-runtime.env'),
  path.resolve(__dirname, '../../../../local/cloudrun.env'),
];

// Kept as explicit function for test/CJS contexts requiring manual env bootstrapping.
// Module-level execution is preserved for server.ts side-effect import compatibility.
export function initEnv(): void {
  for (const envFile of envFiles) {
    if (fs.existsSync(envFile)) {
      dotenv.config({ path: envFile, override: false });
    }
  }

  for (const envFile of localSecretFiles) {
    if (fs.existsSync(envFile)) {
      dotenv.config({ path: envFile, override: true });
    }
  }
}

// Backward-compatible module-level initialization for server.ts side-effect import
initEnv();
