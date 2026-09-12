/**
 * In-memory rate limiter for local/mock development. Correct only for a
 * single Node process — production must swap this for a shared store
 * (Upstash Redis is a drop-in for serverless/multi-instance deploys) so
 * limits hold across instances.
 */

interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();

// periodic sweep so the map doesn't grow unbounded
setInterval(() => {
  const now = Date.now();
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
}, 60_000).unref?.();

export function rateLimit(key: string, { windowMs, max }: { windowMs: number; max: number }): { success: boolean; remaining: number } {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { success: true, remaining: max - 1 };
  }

  if (bucket.count >= max) {
    return { success: false, remaining: 0 };
  }

  bucket.count += 1;
  return { success: true, remaining: max - bucket.count };
}
