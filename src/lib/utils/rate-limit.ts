/** Best-effort in-memory rate limiter — resets on cold start / doesn't
 * share state across serverless instances, but still meaningfully
 * throttles a single abusive client in typical low-traffic deployment.
 * Ported from landing-chat's inline limiter so /api/ai-chat (an
 * authenticated, real-cost endpoint that previously had NO throttling at
 * all) can share the same logic instead of a second copy. */
export function createRateLimiter(max: number, windowMs: number) {
  const requestLog = new Map<string, { count: number; resetAt: number }>();

  return function isRateLimited(key: string): boolean {
    const now = Date.now();
    const entry = requestLog.get(key);
    if (!entry || now > entry.resetAt) {
      requestLog.set(key, { count: 1, resetAt: now + windowMs });
      return false;
    }
    entry.count += 1;
    return entry.count > max;
  };
}
