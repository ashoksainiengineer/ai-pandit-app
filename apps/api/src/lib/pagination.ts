/**
 * Database Pagination Utilities
 * Type-safe pagination helpers with cursor and offset-based strategies
 */

import { ValidationError } from '../errors/index.js';
export interface PaginationParams {
  page?: number;
  limit?: number;
  cursor?: string;
}

export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
    nextCursor?: string;
  };
}

export interface CursorPaginationResult<T> {
  data: T[];
  pagination: {
    limit: number;
    hasNext: boolean;
    hasPrev: boolean;
    nextCursor?: string;
    prevCursor?: string;
  };
}

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

/**
 * Sanitize pagination parameters
 */
export function sanitizePagination(params: PaginationParams): { page: number; limit: number } {
  const page = Math.max(1, params.page ?? DEFAULT_PAGE);
  const limit = Math.min(MAX_LIMIT, Math.max(1, params.limit ?? DEFAULT_LIMIT));
  return { page, limit };
}

/**
 * Calculate offset for SQL queries
 */
export function calculateOffset(page: number, limit: number): number {
  return (page - 1) * limit;
}

/**
 * Build paginated result with metadata
 */
export function buildPaginatedResult<T>(
  data: T[],
  total: number,
  page: number,
  limit: number
): PaginatedResult<T> {
  const totalPages = Math.ceil(total / limit);
  
  return {
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    },
  };
}

/**
 * Encode cursor for cursor-based pagination
 */
export function encodeCursor(value: string | number): string {
  return Buffer.from(String(value)).toString('base64');
}

/**
 * Decode cursor for cursor-based pagination
 */
export function decodeCursor(cursor: string): string {
  try {
    return Buffer.from(cursor, 'base64').toString('ascii');
  } catch {
    throw new ValidationError('Invalid cursor format');
  }
}

/**
 * Validation schema for pagination params
 */
export const validatePagination = (params: unknown): { page: number; limit: number } => {
  const p = params as PaginationParams;
  return sanitizePagination({
    page: p?.page ? Number(p.page) : undefined,
    limit: p?.limit ? Number(p.limit) : undefined,
  });
};
