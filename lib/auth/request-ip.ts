import "server-only";

/**
 * `X-Forwarded-For` is a comma-separated list, appended to by each proxy
 * hop a request passes through. The LEFTMOST value is whatever the
 * original client claimed — fully attacker-controlled on any request that
 * reaches us, since nothing stops a client from setting this header
 * itself. The RIGHTMOST value is whichever hop is closest to us, which is
 * trustworthy only insofar as our own reverse proxy actually appends
 * (rather than blindly forwards) it — see docs/deployment.md. Reading the
 * first value let an attacker rotate it per request and get a fresh
 * rate-limit bucket every time, defeating the login limiter entirely.
 *
 * Assumes exactly one reverse proxy hop in front of the app, matching the
 * documented deployment shape (nginx/Caddy directly in front of `next
 * start`). A multi-hop topology (CDN + load balancer + proxy) would need
 * a trusted-hop-count configuration instead of a fixed "last value" read.
 */
export function getClientIp(headerList: Headers): string {
  const forwardedFor = headerList.get("x-forwarded-for");
  if (forwardedFor) {
    const parts = forwardedFor.split(",").map((part) => part.trim());
    const last = parts[parts.length - 1];
    if (last) return last;
  }
  return "unknown";
}
