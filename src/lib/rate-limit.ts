import { getCache } from "@vercel/functions";

export interface RateLimitConfig {
  /** Max requests allowed per window */
  limit: number;
  /** Window size in seconds */
  windowSeconds: number;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfter: number;
}

const localCounters = new Map<string, { count: number; expiresAt: number }>();

function getWindowBucket(nowSeconds: number, windowSeconds: number): number {
  return Math.floor(nowSeconds / windowSeconds);
}

/** Extract client IP from Vercel-forwarded headers */
export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0]?.trim() || "unknown";
  }
  return request.headers.get("x-real-ip") ?? "unknown";
}

async function incrementLocalCounter(
  key: string,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  const now = Date.now();
  const entry = localCounters.get(key);

  if (!entry || entry.expiresAt <= now) {
    localCounters.set(key, {
      count: 1,
      expiresAt: now + config.windowSeconds * 1000,
    });
    return {
      allowed: true,
      remaining: config.limit - 1,
      retryAfter: 0,
    };
  }

  if (entry.count >= config.limit) {
    return {
      allowed: false,
      remaining: 0,
      retryAfter: Math.ceil((entry.expiresAt - now) / 1000),
    };
  }

  entry.count += 1;
  return {
    allowed: true,
    remaining: config.limit - entry.count,
    retryAfter: 0,
  };
}

async function incrementCacheCounter(
  key: string,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  const cache = getCache();
  const nowSeconds = Math.floor(Date.now() / 1000);
  const bucket = getWindowBucket(nowSeconds, config.windowSeconds);
  const cacheKey = `ratelimit:${key}:${bucket}`;

  const current = Number((await cache.get(cacheKey)) ?? 0);

  if (current >= config.limit) {
    const retryAfter = config.windowSeconds - (nowSeconds % config.windowSeconds);
    return { allowed: false, remaining: 0, retryAfter };
  }

  await cache.set(cacheKey, current + 1, {
    ttl: config.windowSeconds,
    name: "api-rate-limit",
  });

  return {
    allowed: true,
    remaining: config.limit - current - 1,
    retryAfter: 0,
  };
}

/** Fixed-window rate limiter backed by Vercel Runtime Cache (per-region) */
export async function checkRateLimit(
  identifier: string,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  try {
    return await incrementCacheCounter(identifier, config);
  } catch (error) {
    console.warn("Rate limit cache unavailable, using local fallback:", error);
    return incrementLocalCounter(identifier, config);
  }
}

export const RATE_LIMITS = {
  register: { limit: 5, windowSeconds: 15 * 60 },
  upload: { limit: 10, windowSeconds: 10 * 60 },
} as const;

export function rateLimitKey(namespace: string, ip: string, userId?: string) {
  return userId ? `${namespace}:${userId}` : `${namespace}:${ip}`;
}