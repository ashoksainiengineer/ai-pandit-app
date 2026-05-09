import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { env } from '@/lib/config/env';

type ProxyOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  path: string;
  body?: unknown;
  searchParams?: URLSearchParams;
};

export async function proxyBackendJson(req: NextRequest, options: ProxyOptions): Promise<NextResponse> {
  const { getToken, userId } = await auth();
  if (!userId) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const token = await getToken();
  if (!token) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const backendUrl = new URL(`${env.api.backendUrl}${options.path}`);
  if (options.searchParams) {
    backendUrl.search = options.searchParams.toString();
  }

  let response: Response;
  try {
    response = await fetch(backendUrl.toString(), {
      method: options.method ?? 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
      cache: 'no-store',
    });
  } catch (fetchError) {
    return NextResponse.json(
      { success: false, error: `Backend unreachable: ${(fetchError as Error)?.message || fetchError}` },
      { status: 502 }
    );
  }
  const contentType = response.headers.get('content-type') || 'application/json';
  const text = await response.text();

  return new NextResponse(text, {
    status: response.status,
    headers: {
      'Content-Type': contentType,
      'Cache-Control': 'no-store',
    },
  });
}
