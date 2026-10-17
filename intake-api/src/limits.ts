import type { IncomingMessage } from "node:http";

/** In-memory sliding-window limiter: at most `max` hits per `windowMs` per key. */
export function createRateLimiter(max: number, windowMs: number) {
  const hits = new Map<string, number[]>();

  const timer = setInterval(() => {
    const cutoff = Date.now() - windowMs;
    for (const [key, times] of hits) {
      const recent = times.filter((t) => t > cutoff);
      if (recent.length === 0) hits.delete(key);
      else hits.set(key, recent);
    }
  }, windowMs);
  timer.unref();

  return {
    /** Returns true if the request is allowed, and records it. */
    allow(key: string): boolean {
      const now = Date.now();
      const recent = (hits.get(key) ?? []).filter((t) => t > now - windowMs);
      if (recent.length >= max) {
        hits.set(key, recent);
        return false;
      }
      recent.push(now);
      hits.set(key, recent);
      return true;
    },
  };
}

/** Caps how many paid AI calls can happen per UTC day, across all visitors. */
export function createDailyCap(maxPerDay: number) {
  let day = new Date().toISOString().slice(0, 10);
  let used = 0;
  return {
    take(): boolean {
      const today = new Date().toISOString().slice(0, 10);
      if (today !== day) {
        day = today;
        used = 0;
      }
      if (used >= maxPerDay) return false;
      used += 1;
      return true;
    },
  };
}

/** How many trusted proxies append to X-Forwarded-For (1 = only the nearest one). */
const TRUSTED_PROXY_HOPS = Math.max(1, Number.parseInt(process.env.TRUSTED_PROXY_HOPS ?? "1", 10) || 1);

/**
 * Best-effort client address. A client can put anything at the left of
 * X-Forwarded-For, so we read from the RIGHT: each trusted proxy appends the
 * address it saw. This assumes exactly TRUSTED_PROXY_HOPS (default 1) trusted
 * proxies append to the header; with fewer entries than that we use the
 * left-most. Without the header we use the socket address.
 */
export function clientIp(req: IncomingMessage): string {
  const forwarded = req.headers["x-forwarded-for"];
  const entries = (Array.isArray(forwarded) ? forwarded.join(",") : forwarded ?? "")
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
  const fromProxy = entries[Math.max(entries.length - TRUSTED_PROXY_HOPS, 0)];
  return fromProxy || req.socket.remoteAddress || "unknown";
}
