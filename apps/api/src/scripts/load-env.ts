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

for (const envFile of envFiles) {
  if (fs.existsSync(envFile)) {
    dotenv.config({ path: envFile, override: false });
  }
}

const localSecretFiles = [
  path.resolve(__dirname, '../../../../local/dev-runtime.env'),
  path.resolve(__dirname, '../../../../local/cloudrun.env'),
];

for (const envFile of localSecretFiles) {
  if (fs.existsSync(envFile)) {
    dotenv.config({ path: envFile, override: true });
  }
}
