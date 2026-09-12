import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";

/**
 * Signed double-submit-cookie CSRF protection: no server-side session
 * storage needed. The cookie carries `value.signature`; the client echoes
 * `value` back in a request header. A forged request can't know a valid
 * signature without SESSION_SECRET, and a same-site read of the cookie
 * (the actual CSRF vector) can't happen because it's SameSite=Strict.
 */

const COOKIE_NAME = "csrf_token";
const HEADER_NAME = "x-csrf-token";

function secret(): string {
  const s = process.env.SESSION_SECRET;
  if (!s) throw new Error("SESSION_SECRET is not set");
  return s;
}

function sign(value: string): string {
  return crypto.createHmac("sha256", secret()).update(value).digest("hex");
}

export function issueCsrfToken(): { value: string; cookieValue: string } {
  const value = crypto.randomBytes(24).toString("hex");
  return { value, cookieValue: `${value}.${sign(value)}` };
}

export function setCsrfCookie(res: NextResponse, cookieValue: string) {
  res.cookies.set(COOKIE_NAME, cookieValue, {
    httpOnly: false, // must be readable by client JS to echo it back in the header
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60,
  });
}

export async function verifyCsrfToken(req: NextRequest): Promise<boolean> {
  const cookieValue = req.cookies.get(COOKIE_NAME)?.value;
  const headerValue = req.headers.get(HEADER_NAME);
  if (!cookieValue || !headerValue) return false;

  const [value, signature] = cookieValue.split(".");
  if (!value || !signature) return false;
  if (value !== headerValue) return false;

  const expected = sign(value);
  const signatureBuf = Buffer.from(signature, "hex");
  const expectedBuf = Buffer.from(expected, "hex");
  // timingSafeEqual throws on mismatched lengths instead of returning false —
  // a malformed/forged cookie must not crash the request, just fail closed
  if (signatureBuf.length !== expectedBuf.length) return false;
  return crypto.timingSafeEqual(signatureBuf, expectedBuf);
}
