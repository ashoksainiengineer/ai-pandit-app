// lib/debounce.ts - Debounce utility function
export function debounce(func, delay) {
    let timeoutId;
    return (...args) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => func(...args), delay);
    };
}
//# sourceMappingURL=debounce.js.map