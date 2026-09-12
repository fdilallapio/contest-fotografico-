import { NextRequest } from "next/server";

/**
 * Extracts the real client IP behind a single trusted reverse proxy (Render,
 * Vercel, Netlify all sit directly in front of the app this way). The proxy
 * appends the true connecting IP as the LAST entry of X-Forwarded-For; any
 * earlier entries are attacker-supplied and must not be trusted, since a
 * client can send its own X-Forwarded-For header with an arbitrary value.
 */
export function getClientIp(req: NextRequest): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) {
    const parts = xff.split(",").map((p) => p.trim()).filter(Boolean);
    if (parts.length > 0) return parts[parts.length - 1];
  }
  const real = req.headers.get("x-real-ip");
  if (real) return real.trim();
  return "unknown";
}
