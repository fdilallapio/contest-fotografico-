import { NextResponse } from "next/server";
import { issueCsrfToken, setCsrfCookie } from "@/lib/csrf";

export async function GET() {
  const { value, cookieValue } = issueCsrfToken();
  const res = NextResponse.json({ token: value });
  setCsrfCookie(res, cookieValue);
  return res;
}
