import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { computeContestPhase } from "@/lib/contest-phase";
import { rateLimit } from "@/lib/rate-limit";
import { verifyCsrfToken } from "@/lib/csrf";
import { getClientIp } from "@/lib/request-ip";

const BodySchema = z.object({ email: z.string().trim().email() });

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const config = await prisma.contestConfig.findFirst();
  if (!config) {
    return NextResponse.json({ error: "Contest non configurato" }, { status: 404 });
  }

  const phase = computeContestPhase(config, new Date());
  if (phase.phase !== "VOTING") {
    return NextResponse.json({ error: "Votazione non attiva" }, { status: 403 });
  }

  if (!(await verifyCsrfToken(req))) {
    return NextResponse.json({ error: "Token di sicurezza non valido, ricarica la pagina" }, { status: 403 });
  }

  const parsed = BodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Inserisci un'email valida per votare" }, { status: 400 });
  }
  const email = parsed.data.email.toLowerCase();

  const photo = await prisma.photo.findUnique({ where: { id }, include: { theme: true } });
  if (!photo || photo.status !== "READY") {
    return NextResponse.json({ error: "Foto non trovata" }, { status: 404 });
  }
  if (!phase.unlockedThemeSlugs.includes(photo.theme.slug)) {
    return NextResponse.json({ error: "Tema non ancora sbloccato" }, { status: 403 });
  }

  const ip = getClientIp(req);
  const ua = req.headers.get("user-agent") ?? "";
  const salt = process.env.VOTE_SALT ?? "";
  const voterHash = crypto.createHash("sha256").update(`${ip}:${ua}:${salt}`).digest("hex");

  // un voto per email per foto (vincolo a livello DB); qui solo un tetto
  // complessivo per IP contro script che provano molte email di fila
  const globalPerIp = rateLimit(`vote-global:${ip}`, { windowMs: 60_000, max: 30 });
  if (!globalPerIp.success) {
    return NextResponse.json({ error: "Troppi voti, riprova più tardi" }, { status: 429 });
  }

  try {
    const [, updated] = await prisma.$transaction([
      prisma.vote.create({ data: { photoId: photo.id, email, voterHash } }),
      prisma.photo.update({ where: { id: photo.id }, data: { voteCount: { increment: 1 } } }),
    ]);
    return NextResponse.json({ success: true, voteCount: updated.voteCount });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return NextResponse.json({ error: "Hai già votato questa foto con questa email." }, { status: 409 });
    }
    throw err;
  }
}
