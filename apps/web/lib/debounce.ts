// lib/debounce.ts - Debounce utility function with cancel/flush support

interface DebouncedFunction<T extends (...args: unknown[]) => unknown> {
  (...args: Parameters<T>): void;
  cancel: () => void;
  flush: (...args: Parameters<T>) => void;
}

export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  delay: number
): DebouncedFunction<T> {
  let timeoutId: NodeJS.Timeout | null = null;
  let _lastArgs: Parameters<T> | null = null;

  const debounced = (...args: Parameters<T>) => {
    _lastArgs = args;
    if (timeoutId) clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      func(...args);
      _lastArgs = null;
    }, delay);
  };

  debounced.cancel = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
    _lastArgs = null;
  };

  debounced.flush = (...args: Parameters<T>) => {
    debounced.cancel();
    func(...args);
  };

  return debounced;
}