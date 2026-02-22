// lib/debounce.ts - Debounce utility function with cancel/flush support

interface DebouncedFunction<T extends (...args: any[]) => any> {
  (...args: Parameters<T>): void;
  cancel: () => void;
  flush: (...args: Parameters<T>) => void;
}

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): DebouncedFunction<T> {
  let timeoutId: NodeJS.Timeout | null = null;
  let lastArgs: Parameters<T> | null = null;

  const debounced = (...args: Parameters<T>) => {
    lastArgs = args;
    if (timeoutId) clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      func(...args);
      lastArgs = null;
    }, delay);
  };

  debounced.cancel = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
    lastArgs = null;
  };

  debounced.flush = (...args: Parameters<T>) => {
    debounced.cancel();
    func(...args);
  };

  return debounced;
}