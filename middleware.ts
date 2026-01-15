import { withClerkMiddleware } from "@clerk/nextjs";
import { createRouteMatcher } from "@clerk/nextjs/shared";
import { NextRequest } from "next/server";

const isPublicRoute = createRouteMatcher([
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/api/webhooks/clerk(.*)", // Allow webhook to be accessed publicly
]);

export default withClerkMiddleware((auth, request: NextRequest) => {
  if (!isPublicRoute(request)) {
    auth().protect(); // Protect all routes that are not public
  }
});

export const config = {
  matcher: [
    // Skip Next.js built-in paths (e.g., /_next/)
    "/((?!_next/static|_next/image|favicon.ico).*)",
    // Match all routes except the ones that start with /api (unless it's a webhook)
    "/",
    "/(api|trpc)(.*)",
    "/api/webhooks/clerk"
  ],
};
