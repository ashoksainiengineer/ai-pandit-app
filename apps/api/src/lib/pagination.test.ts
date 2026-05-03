import { describe, it, expect } from 'vitest';
import {
    sanitizePagination,
    calculateOffset,
    buildPaginatedResult,
    encodeCursor,
    decodeCursor,
    validatePagination,
    type PaginationParams,
} from './pagination.js';

describe('pagination', () => {
    describe('sanitizePagination', () => {
        it('returns defaults when no params provided', () => {
            const result = sanitizePagination({});
            expect(result.page).toBe(1);
            expect(result.limit).toBe(20);
        });

        it('respects provided page and limit', () => {
            const result = sanitizePagination({ page: 3, limit: 50 });
            expect(result.page).toBe(3);
            expect(result.limit).toBe(50);
        });

        it('enforces minimum page of 1', () => {
            const result = sanitizePagination({ page: 0 });
            expect(result.page).toBe(1);
        });

        it('enforces minimum limit of 1', () => {
            const result = sanitizePagination({ limit: 0 });
            expect(result.limit).toBe(1);
        });

        it('caps limit at MAX_LIMIT (100)', () => {
            const result = sanitizePagination({ limit: 200 });
            expect(result.limit).toBe(100);
        });
    });

    describe('calculateOffset', () => {
        it('calculates correct offset', () => {
            expect(calculateOffset(1, 20)).toBe(0);
            expect(calculateOffset(2, 20)).toBe(20);
            expect(calculateOffset(3, 15)).toBe(30);
        });
    });

    describe('buildPaginatedResult', () => {
        it('builds result with correct pagination metadata', () => {
            const data = [1, 2, 3];
            const result = buildPaginatedResult(data, 100, 1, 20);
            expect(result.data).toEqual([1, 2, 3]);
            expect(result.pagination.page).toBe(1);
            expect(result.pagination.limit).toBe(20);
            expect(result.pagination.total).toBe(100);
            expect(result.pagination.totalPages).toBe(5);
            expect(result.pagination.hasNext).toBe(true);
            expect(result.pagination.hasPrev).toBe(false);
        });

        it('has no next page on last page', () => {
            const result = buildPaginatedResult([], 40, 2, 20);
            expect(result.pagination.hasNext).toBe(false);
            expect(result.pagination.hasPrev).toBe(true);
        });

        it('handles zero total correctly', () => {
            const result = buildPaginatedResult([], 0, 1, 20);
            expect(result.pagination.totalPages).toBe(0);
            expect(result.pagination.hasNext).toBe(false);
        });
    });

    describe('encodeCursor / decodeCursor', () => {
        it('encodes and decodes string cursor', () => {
            const encoded = encodeCursor('hello-world');
            expect(typeof encoded).toBe('string');
            expect(decodeCursor(encoded)).toBe('hello-world');
        });

        it('encodes and decodes numeric cursor', () => {
            const encoded = encodeCursor(12345);
            expect(decodeCursor(encoded)).toBe('12345');
        });

        it('handles invalid cursor gracefully', () => {
            // Buffer.from does not throw on invalid base64, it silently ignores invalid chars
            const result = decodeCursor('not-valid-base64!!!');
            expect(typeof result).toBe('string');
        });
    });

    describe('validatePagination', () => {
        it('converts string numbers to actual numbers', () => {
            const result = validatePagination({ page: '3', limit: '50' } as unknown as PaginationParams);
            expect(result.page).toBe(3);
            expect(result.limit).toBe(50);
        });

        it('uses defaults for undefined values', () => {
            const result = validatePagination({});
            expect(result.page).toBe(1);
            expect(result.limit).toBe(20);
        });
    });
});
