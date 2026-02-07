import { db } from '@/database/drizzle';
import { auditLogs } from '@/database/schema';
import { NextRequest } from 'next/server';

/**
 * Represents the data for a single audit log entry.
 */
export interface AuditLogData {
  userId?: string;
  action: string;
  resourceType?: string;
  resourceId?: string;
  details?: object;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Logs a structured audit event to the database.
 * This is essential for security, compliance, and debugging.
 *
 * @param data - The structured data for the audit event.
 */
export async function logAuditEvent(data: AuditLogData): Promise<void> {
  try {
    const newAuditLogId = crypto.randomUUID();
    await db.insert(auditLogs).values({
      id: newAuditLogId,
      createdAt: new Date().toISOString(),
      userId: data.userId || 'system',  // Default to 'system' if no user
      userRole: 'user',  // Default role
      resource: data.resourceType || 'unknown',  // Map resourceType to resource
      resourceId: data.resourceId,
      ipAddress: data.ipAddress,
      userAgent: data.userAgent,
      action: data.action,
      newValues: data.details ? JSON.stringify(data.details) : null,
    });
  } catch (error) {
    console.error('FATAL: Failed to write to audit log!', {
      auditData: data,
      error,
    });
    // In a real-world scenario, you might want to send this to a separate, highly-available logging service.
  }
}

/**
 * Extracts client IP and User-Agent from a Next.js request for logging.
 * @param request - The NextRequest object.
 * @returns An object containing the IP address and user agent.
 */
export function getRequestMetadata(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
  const userAgent = request.headers.get('user-agent') || 'unknown';
  return { ipAddress: ip, userAgent };
}
