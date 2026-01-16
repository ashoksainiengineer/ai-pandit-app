import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// This function can be marked 'async' if using 'await' inside
export function middleware(request: NextRequest) {
  // Allowed origins: The Vercel frontend
  const allowedOrigins = process.env.VERCEL_FRONTEND_URL ? [process.env.VERCEL_FRONTEND_URL] : [];
  const origin = request.headers.get('origin');

  // Create a new response object so we can modify headers
  const response = NextResponse.next();

  // If the origin is in our allowed list, add the CORS headers
  if (origin && allowedOrigins.includes(origin)) {
    response.headers.set('Access-Control-Allow-Origin', origin);
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    response.headers.set('Access-Control-Allow-Credentials', 'true');
  }

  // Handle preflight OPTIONS requests
  if (request.method === 'OPTIONS') {
    // If the origin is allowed, return a 204 with the headers
    if (origin && allowedOrigins.includes(origin)) {
      return new NextResponse(null, { status: 204, headers: response.headers });
    }
    // Otherwise, it's a forbidden origin
    return new NextResponse(null, { status: 403, statusText: "Forbidden" });
  }

  return response;
}

// See "Matching Paths" below to learn more
export const config = {
  matcher: '/api/:path*',
};
