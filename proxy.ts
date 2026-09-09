import { NextResponse } from "next/server";

/**
 * Baseline security headers only for now. This is a defense-in-depth UX
 * layer, not the source of truth for auth — every protected route/action
 * re-validates the session itself once Phase 3 lands (see spec §73).
 */
export function proxy() {
  const response = NextResponse.next();

  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(), interest-cohort=()",
  );

  return response;
}

export const config = {
  matcher: [
    // Skip static assets and Next internals; apply headers to everything else.
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
