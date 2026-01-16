import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from 'next/server';

const isPublicRoute = createRouteMatcher(['/', '/api/webhooks/clerk']);

export default clerkMiddleware((auth, req) => {
  if (!isPublicRoute(req)) {
    auth().protect();
  }

  const res = NextResponse.next();
    if (req.method === 'OPTIONS') {
      res.headers.set('Access-Control-Allow-Origin', '*');
      res.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      res.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      return res;
    } 

    if (auth().userId && !isPublicRoute(req)) {
      const rectifyUrl = new URL("/rectify", req.url);
      const res = NextResponse.redirect(rectifyUrl);
      res.headers.set('Access-Control-Allow-Origin', '*');
      return res;
    }
    res.headers.set('Access-Control-Allow-Origin', '*');
    return res;
});

export const config = {
  matcher: ["/((?!.+\.[\w]+$|_next).*)", "/", "/(api|trpc)(.*)"],
};
