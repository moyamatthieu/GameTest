export type RateLimitState = {
  windowStartMs: number;
  count: number;
};

export type RateLimiter = {
  check: (key: string, nowMs?: number) => { allowed: boolean; retryAfterMs: number };
};

export function createRateLimiter(windowMs: number, maxRequests: number): RateLimiter {
  const states = new Map<string, RateLimitState>();

  function check(key: string, nowMs: number = Date.now()): { allowed: boolean; retryAfterMs: number } {
    const existing = states.get(key);
    if (!existing || nowMs - existing.windowStartMs >= windowMs) {
      states.set(key, { windowStartMs: nowMs, count: 1 });
      return { allowed: true, retryAfterMs: 0 };
    }

    existing.count += 1;
    if (existing.count <= maxRequests) {
      return { allowed: true, retryAfterMs: 0 };
    }

    const retryAfterMs = Math.max(0, windowMs - (nowMs - existing.windowStartMs));
    return { allowed: false, retryAfterMs };
  }

  return { check };
}
