import * as configExports from './apps/api/src/config/index.js';

console.log('--- Configuration Export Audit ---');
console.log('Available Exports:', Object.keys(configExports));

if ('aiConfig' in configExports) {
    console.log('✅ aiConfig is exported');
} else {
    console.log('❌ aiConfig is MISSING');
}

if ('encryptionConfig' in configExports) {
    console.log('✅ encryptionConfig is exported');
} else {
    console.log('❌ encryptionConfig is MISSING');
}

if ('default' in configExports) {
    console.log('✅ Default export is present');
} else {
    console.log('❌ Default export is MISSING');
}
