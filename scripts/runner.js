import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const files = [
    'apps/api/src/lib/btr/prompts/deep-analysis-prompt.ts',
    'apps/api/src/lib/btr/prompts/batch-prompt.ts',
    'apps/api/src/lib/btr/prompts/final-precision-prompt.ts',
    'apps/api/src/lib/btr/data-package-builder.ts',
    'apps/api/src/lib/btr/transit-builder.ts',
    'apps/api/src/lib/jaimini-astrology.ts',
    'apps/api/src/lib/advanced-btr-methods.ts',
    'apps/api/src/lib/seconds-precision-btr.ts',
    'apps/api/src/lib/utils/ephemeris-helpers.ts',
    'apps/api/src/lib/utils/formatting.ts',
    'apps/web/components/rectify/ResultsDashboard.tsx',
    'apps/web/components/rectify/PlanetaryVitals.tsx',
    'apps/web/components/rectify/BirthPlacePicker.tsx'
];

function run() {
    for (const file of files) {
        const fullPath = join(process.cwd(), file);
        try {
            let content = readFileSync(fullPath, 'utf8');

            // Replace degree formatters matching pattern .toFixed(1/2/3)°
            content = content.replace(/\.toFixed\([123]\)\}\°/g, '.toFixed(4)}°');
            content = content.replace(/\.toFixed\([123]\)\}\)°/g, '.toFixed(4)})°');
            content = content.replace(/\.toFixed\([123]\) \+ '°'/g, ".toFixed(4) + '°'");

            // Raw properties getters
            content = content.replace(/\.degree\.toFixed\([123]\)/g, '.degree.toFixed(4)');
            content = content.replace(/\.longitude\.toFixed\([123]\)/g, '.longitude.toFixed(4)');
            content = content.replace(/\.toFixed\([123]\)°`/g, '.toFixed(4)°`');

            // Coordinates and math
            content = content.replace(/\(longitude \% 30\)\.toFixed\([123]\)/g, '(longitude % 30).toFixed(4)');
            content = content.replace(/\(\(data\.longitude \% 30\)\.toFixed\([123]\)/g, '((data.longitude % 30).toFixed(4)');
            content = content.replace(/distanceToGandanta\.toFixed\([123]\)/g, 'distanceToGandanta.toFixed(4)');

            writeFileSync(fullPath, content, 'utf8');
            console.log(`Successfully upgraded precision in ${file}`);
        } catch (e) {
            console.error(`Failed on ${file}:`, e.message);
        }
    }
}

run();
process.exit(0);
