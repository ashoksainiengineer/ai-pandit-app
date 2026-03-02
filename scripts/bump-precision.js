const fs = require('fs');
const path = require('path');

function replaceInFile(filePath) {
    if (!fs.existsSync(filePath)) {
        console.log("Not found:", filePath);
        return;
    }
    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;

    // Pattern to catch .toFixed(1)°, .toFixed(2)°, .toFixed(3)° 
    content = content.replace(/\.toFixed\([123]\)\}\°/g, '.toFixed(4)}°');
    content = content.replace(/\.toFixed\([123]\)\}\)°/g, '.toFixed(4)})°'); // if wrapped in parens
    // Pattern for .toFixed(X) + '°'
    content = content.replace(/\.toFixed\([123]\) \+ '°'/g, ".toFixed(4) + '°'");

    // Precise coordinate replacement inside the Builders
    content = content.replace(/\.degree\.toFixed\([123]\)/g, '.degree.toFixed(4)');
    content = content.replace(/\.longitude\.toFixed\([123]\)/g, '.longitude.toFixed(4)');
    content = content.replace(/\(longitude \% 30\)\.toFixed\([123]\)/g, '(longitude % 30).toFixed(4)');
    content = content.replace(/\(\(data.longitude \% 30\)\.toFixed\([123]\)/g, '((data.longitude % 30).toFixed(4)');

    // Pattern for distanceToGandanta
    content = content.replace(/distanceToGandanta\.toFixed\([123]\)°/g, 'distanceToGandanta.toFixed(4)°');
    content = content.replace(/distanceToGandanta\.toFixed\([123]\)/g, 'distanceToGandanta.toFixed(4)');

    if (content !== original) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`Updated ${filePath}`);
    } else {
        console.log(`No changes in ${filePath}`);
    }
}

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
    'apps/web/components/rectify/ResultsDashboard.tsx',
    'apps/web/components/rectify/PlanetaryVitals.tsx'
];

files.forEach(f => replaceInFile(path.join(__dirname, '..', f)));
