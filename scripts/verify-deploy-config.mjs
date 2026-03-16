import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = '/home/ashoksainiengineer/ai-pandit-app';

const readJson = (relativePath) => JSON.parse(readFileSync(resolve(root, relativePath), 'utf8'));
const readText = (relativePath) => readFileSync(resolve(root, relativePath), 'utf8');

const rootPackage = readJson('package.json');
const webPackage = readJson('apps/web/package.json');
const webVercelConfig = readJson('apps/web/vercel.json');
const deployScript = readText('scripts/deploy-cloud-run.sh');
const deployWorkflow = readText('.github/workflows/deploy-cloudrun.yml');

const assertions = [
  {
    ok: webVercelConfig.buildCommand === 'npm run build:vercel:web',
    message: '`apps/web/vercel.json` must use `npm run build:vercel:web` for Vercel builds.',
  },
  {
    ok: typeof webPackage.scripts['build:vercel:web'] === 'string',
    message: '`apps/web/package.json` must define `build:vercel:web`.',
  },
  {
    ok: typeof webPackage.scripts['build:vercel'] === 'string',
    message: '`apps/web/package.json` must define `build:vercel`.',
  },
  {
    ok: typeof rootPackage.scripts['deploy:cloudrun:ephemeris'] === 'string',
    message: '`package.json` must expose `deploy:cloudrun:ephemeris`.',
  },
  {
    ok: deployScript.includes('Usage: scripts/deploy-cloud-run.sh <api|web|worker|ephemeris>'),
    message: '`scripts/deploy-cloud-run.sh` usage must include `ephemeris`.',
  },
  {
    ok: deployScript.includes('ephemeris)') && deployScript.includes('deploy/cloudrun/ephemeris.Dockerfile'),
    message: '`scripts/deploy-cloud-run.sh` must support the ephemeris Cloud Run target.',
  },
  {
    ok: deployWorkflow.includes("- 'services/ephemeris/**'"),
    message: '`deploy-cloudrun.yml` must trigger on ephemeris changes.',
  },
  {
    ok: deployWorkflow.includes('npm run deploy:cloudrun:ephemeris'),
    message: '`deploy-cloudrun.yml` must deploy ephemeris.',
  },
  {
    ok: deployWorkflow.includes('/ready'),
    message: '`deploy-cloudrun.yml` must wait for ephemeris readiness before downstream deploys.',
  },
];

const failures = assertions.filter((assertion) => !assertion.ok).map((assertion) => assertion.message);

if (failures.length > 0) {
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log('Deployment configuration contract verified.');
