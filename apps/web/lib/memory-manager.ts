// Frontend-compatible memory manager

export interface MemoryStats {
  heapUsed: number;
  heapTotal: number;
  rss: number;
  percentUsed: number;
}

export function getMemoryStats(): MemoryStats {
  // In browser/frontend, we don't have process.memoryUsage()
  return {
    heapUsed: 0,
    heapTotal: 0,
    rss: 0,
    percentUsed: 0
  };
}

export function getActiveCalculations(): number {
  return 0;
}
