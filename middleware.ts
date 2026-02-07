// middleware.ts
// Industry-standard Clerk authentication middleware.
// For more information, see: https://clerk.com/docs/references/nextjs/clerk-middleware

import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

const isPublicRoute = createRouteMatcher([
    '/', // The landing page is accessible to everyone.
    '/sign-in(.*)', // All sign-in related pages.
    '/sign-up(.*)', // All sign-up related pages.
    '/api/health', // A public endpoint for health checks.
    '/api/ping' // A public endpoint for ping checks.
]);

const isIgnoredRoute = createRouteMatcher([
    '/api/webhooks/clerk' // Clerk webhook for user management.
]);

export default clerkMiddleware((auth, req) => {
  if (isPublicRoute(req)) {
    return; // Allow public routes
  }
  if (isIgnoredRoute(req)) {
    return; // Allow ignored routes
  }
  auth().protect();
});

export const config = {
    // The following matcher runs middleware on all routes
    // except for static files and Next.js-specific assets (_next).
    matcher: [
        '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
        '/(api|trpc)(.*)',
    ],
};
