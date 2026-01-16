import { authMiddleware } from "@clerk/nextjs/server";
import { NextResponse } from 'next/server';

export default authMiddleware({
  publicRoutes: ["/", "/api/webhooks/clerk"],

  afterAuth(auth, req, evt) {
    // Handle CORS preflight requests
    if (req.method === 'OPTIONS') {
      const res = new NextResponse();
      res.headers.set('Access-Control-Allow-Origin', '*');
      res.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      res.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      return res;
    } 

    if (auth.userId && !auth.isPublicRoute) {
      const rectifyUrl = new URL("/rectify", req.url);
      const res = NextResponse.redirect(rectifyUrl);
      res.headers.set('Access-Control-Allow-Origin', '*');
      return res;
    }

    const res = NextResponse.next();
    res.headers.set('Access-Control-Allow-Origin', '*');
    return res;
  },
});

export const config = {
  matcher: ["/((?!.+\.[\w]+$|_next).*)/", "/", "/(api|trpc)(.*)"],
};