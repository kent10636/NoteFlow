import { NextResponse } from "next/server";
import type { RateLimitResult } from "@/lib/rate-limit";

export function rateLimitedResponse(
  result: RateLimitResult,
  message = "请求过于频繁，请稍后再试"
) {
  return NextResponse.json(
    { error: message },
    {
      status: 429,
      headers: {
        "Retry-After": String(result.retryAfter || 60),
        "X-RateLimit-Remaining": String(Math.max(0, result.remaining)),
      },
    }
  );
}