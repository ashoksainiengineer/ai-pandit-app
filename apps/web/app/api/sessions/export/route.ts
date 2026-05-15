import { NextRequest, NextResponse } from 'next/server';
import { getServerAuth } from '@/lib/server/auth';
import { db } from '@ai-pandit/db';
import { sessions, users } from '@ai-pandit/db/schema';
import { and, desc, eq, gte, inArray, lte } from 'drizzle-orm';
import { getWebEncryption } from '@/lib/crypto';
import { getBuildPhaseRouteResponse } from '@/lib/server/build-phase-route-guard';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const crypto = getWebEncryption();
type ExportFormat = 'pdf' | 'json' | 'csv';

interface ExportOptions {
  format?: ExportFormat;
  includeResults?: boolean;
  includeLogs?: boolean;
  dateRange?: {
    from?: string;
    to?: string;
  };
  sessions?: string[];
}

function escapeCsv(value: unknown): string {
  const stringValue = String(value ?? '');
  if (/[,"\n]/.test(stringValue)) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  return stringValue;
}

export async function POST(req: NextRequest) {
  const buildPhaseResponse = getBuildPhaseRouteResponse();
  if (buildPhaseResponse) return buildPhaseResponse;

  try {
    const sessionAuth = await getServerAuth();
    if (!sessionAuth) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    const externalId = sessionAuth.providerId;

    const body = (await req.json().catch(() => ({}))) as ExportOptions;
    const format = body.format ?? 'json';
    // BUG-FIX: Removed 'pdf' — server-side PDF not implemented, returns text misleadingly
    if (!['json', 'csv'].includes(format)) {
      return NextResponse.json({ success: false, error: 'Invalid export format. Use json or csv.' }, { status: 400 });
    }

    const user = await db.query.users.findFirst({
      where: eq(users.externalId, externalId),
      columns: { id: true },
    });
    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    const conditions = [eq(sessions.userId, user.id)];
    if (Array.isArray(body.sessions) && body.sessions.length > 0) {
      conditions.push(inArray(sessions.id, body.sessions));
    }
    if (body.dateRange?.from) {
      conditions.push(gte(sessions.createdAt, body.dateRange.from));
    }
    if (body.dateRange?.to) {
      conditions.push(lte(sessions.createdAt, body.dateRange.to));
    }

    const rows = await db.select().from(sessions)
      .where(and(...conditions))
      .orderBy(desc(sessions.createdAt));

    const includeResults = body.includeResults === true;
    const includeLogs = body.includeLogs === true;

    const exportUserId = user.id;
    const normalized = rows.map((row) => ({
      id: row.id,
      status: row.status,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      fullName: crypto.parseField(row.fullName, exportUserId),
      dateOfBirth: crypto.parseField(row.dateOfBirth, exportUserId),
      tentativeTime: crypto.parseField(row.tentativeTime, exportUserId),
      birthPlace: crypto.parseField(row.birthPlace, exportUserId),
      rectifiedTime: row.rectifiedTime ?? null,
      accuracy: row.accuracy ?? null,
      confidence: row.confidence ?? null,
      analysisResult: includeResults ? crypto.parseField(row.analysisResult as string | null | undefined, exportUserId, null) : undefined,
      reasoningLogs: includeLogs ? crypto.parseField(row.reasoningLogs as string | null | undefined, exportUserId, null) : undefined,
    }));

    if (format === 'json') {
      return NextResponse.json({ success: true, data: normalized }, {
        headers: {
          'Content-Disposition': `attachment; filename="sessions-export-${new Date().toISOString().split('T')[0]}.json"`,
          'Cache-Control': 'private, no-store',
        },
      });
    }

    if (format === 'csv') {
      const headers = ['id', 'status', 'createdAt', 'updatedAt', 'fullName', 'dateOfBirth', 'tentativeTime', 'birthPlace', 'rectifiedTime', 'accuracy', 'confidence'];
      if (includeResults) headers.push('analysisResult');
      if (includeLogs) headers.push('reasoningLogs');

      const lines = [headers.join(',')];
      for (const row of normalized) {
        const lineData: unknown[] = [
          row.id,
          row.status,
          row.createdAt,
          row.updatedAt,
          row.fullName,
          row.dateOfBirth,
          row.tentativeTime,
          row.birthPlace,
          row.rectifiedTime ?? '',
          row.accuracy ?? '',
          row.confidence ?? '',
        ];
        if (includeResults) lineData.push(JSON.stringify(row.analysisResult ?? null));
        if (includeLogs) lineData.push(JSON.stringify(row.reasoningLogs ?? null));
        lines.push(lineData.map(escapeCsv).join(','));
      }

      return new NextResponse(lines.join('\n'), {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="sessions-export-${new Date().toISOString().split('T')[0]}.csv"`,
          'Cache-Control': 'private, no-store',
        },
      });
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Export failed';
    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
  }
}
