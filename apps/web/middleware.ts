// middleware.ts
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

const isPublicRoute = createRouteMatcher([
  '/',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/dashboard(.*)',
  '/rectify(.*)',
  '/api/health',
  '/api/ping',
  '/api/sessions(.*)',
  '/manifest.json',
  '/favicon.ico',
  '/robots.txt',
  '/sitemap.xml'
]);

export default clerkMiddleware((auth, req) => {
  if (isPublicRoute(req)) {
    return NextResponse.next();
  }
});

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};
