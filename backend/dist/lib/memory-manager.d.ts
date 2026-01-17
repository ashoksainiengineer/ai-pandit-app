interface MemoryStats {
    heapUsed: number;
    heapTotal: number;
    external: number;
    rss: number;
    percentUsed: number;
}
export declare function getMemoryStats(): MemoryStats;
export declare function logMemory(label: string): void;
export declare function checkMemory(): boolean;
export declare function triggerGC(): void;
export declare function withMemoryCheck<T>(label: string, fn: () => Promise<T>): Promise<T>;
export declare function withConcurrencyLimit<T>(fn: () => Promise<T>): Promise<T>;
export declare function getActiveCalculations(): number;
export {};
//# sourceMappingURL=memory-manager.d.ts.map