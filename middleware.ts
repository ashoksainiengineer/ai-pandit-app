// middleware.ts (Production Fix)
// Industry-standard Clerk authentication middleware with added security headers.

import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

const isPublicRoute = createRouteMatcher([
  '/', // The landing page is accessible to everyone.
  '/sign-in(.*)', // Matches /sign-in, /sign-in/any, etc.
  '/sign-up(.*)', // Matches /sign-up, /sign-up/any, etc.
  '/api/health', // A public endpoint for health checks.
  '/api/ping', // A public endpoint for ping checks.
  '/manifest.json',
  '/favicon.ico',
  '/robots.txt',
  '/sitemap.xml'
]);

const isIgnoredRoute = createRouteMatcher([
  '/api/webhooks/clerk' // Clerk webhook for user management.
]);

export default clerkMiddleware(async (auth, req) => {
  if (isPublicRoute(req) || isIgnoredRoute(req)) {
    return NextResponse.next();
  }

  const authData = await auth();
  if (!authData.userId) {
    return authData.redirectToSignIn();
  }

  const headers = new Headers(req.headers);

  // Add Content Security Policy - Development + Production Compatible
  const csp = `
    default-src 'self';
    script-src 'self' 'unsafe-inline' 'unsafe-eval' blob: https://*.clerk.accounts.dev https://vercel.live https://*.vercel.app;
    style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
    img-src 'self' data: blob: https://*.clerk.com https://*.vercel.app;
    font-src 'self' https://fonts.gstatic.com;
    connect-src 'self' blob: http://localhost:* https://*.clerk.com https://*.clerk.accounts.dev https://openrouter.ai https://*.huggingface.co https://*.hf.space https://vercel.live https://*.vercel.app wss://*.clerk.accounts.dev;
    frame-src 'self' https://*.clerk.com;
    worker-src 'self' blob:;
    object-src 'none';
    frame-ancestors 'none';
    form-action 'self';
    base-uri 'self';
  `.trim().replace(/\s{2,}/g, ' ');


  headers.set('Content-Security-Policy', csp);
  headers.set('X-Content-Type-Options', 'nosniff');
  headers.set('X-Frame-Options', 'DENY');
  headers.set('Referrer-Policy', 'origin-when-cross-origin');
  headers.set('Permissions-Policy', "camera=(), microphone=(), geolocation=()");

  return NextResponse.next({
    headers: headers,
  });
});

export const config = {
  // The following matcher runs middleware on all routes
  // except for static files and Next.js-specific assets (_next).
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};
