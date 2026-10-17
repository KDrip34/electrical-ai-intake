import type { IncomingMessage, ServerResponse } from "node:http";

const DEFAULT_ORIGINS = "http://localhost:3001,http://127.0.0.1:3001";

const allowedOrigins = new Set(
  (process.env.ALLOWED_ORIGINS ?? DEFAULT_ORIGINS)
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean),
);

/**
 * Applies CORS headers for allow-listed origins (never "*") and answers
 * preflight requests. Returns true if the request was fully handled (OPTIONS),
 * so the caller must stop before routing and rate limiting.
 */
export function handleCors(req: IncomingMessage, res: ServerResponse): boolean {
  const origin = req.headers.origin;
  res.setHeader("Vary", "Origin");
  if (origin && allowedOrigins.has(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Access-Control-Allow-Methods", "POST, GET, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    res.setHeader("Access-Control-Max-Age", "600");
  }
  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return true;
  }
  return false;
}
