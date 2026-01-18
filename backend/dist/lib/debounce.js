"use strict";
// lib/debounce.ts - Debounce utility function
Object.defineProperty(exports, "__esModule", { value: true });
exports.debounce = debounce;
function debounce(func, delay) {
    let timeoutId;
    return (...args) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => func(...args), delay);
    };
}
//# sourceMappingURL=debounce.js.map