import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAdminSession } from "@/lib/admin-auth";
import { rateLimit } from "@/lib/rate-limit";
import { getClientIp } from "@/lib/request-ip";

function timingSafeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

const BodySchema = z.object({ password: z.string().min(1) });

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const { success } = rateLimit(`admin-login:${ip}`, { windowMs: 60_000, max: 10 });
  if (!success) {
    return NextResponse.json({ error: "Troppi tentativi, riprova tra un minuto" }, { status: 429 });
  }

  const parsed = BodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Richiesta non valida" }, { status: 400 });
  }

  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) {
    return NextResponse.json({ error: "ADMIN_PASSWORD non configurata" }, { status: 500 });
  }

  if (!timingSafeEqual(parsed.data.password, expected)) {
    return NextResponse.json({ error: "Password non valida" }, { status: 401 });
  }

  const session = await getAdminSession();
  session.isAdmin = true;
  await session.save();

  return NextResponse.json({ success: true });
}
