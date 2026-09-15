import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { deleteOriginal, deleteDerivedByPublicUrl } from "@/lib/storage";

const BodySchema = z
  .object({
    status: z.enum(["READY", "REJECTED", "PENDING"]).optional(),
    piazzaVotes: z.number().int().min(0).max(1_000_000).optional(),
  })
  .refine((b) => b.status !== undefined || b.piazzaVotes !== undefined, {
    message: "Nessun campo da aggiornare",
  });

/** Removes original + derived files from R2. Doesn't touch the DB row. */
async function deletePhotoFiles(photo: { originalKey: string; thumbKey: string | null; mediumKey: string | null; fullKey: string | null }) {
  await deleteOriginal(photo.originalKey);
  await Promise.all([
    deleteDerivedByPublicUrl(photo.thumbKey),
    deleteDerivedByPublicUrl(photo.mediumKey),
    deleteDerivedByPublicUrl(photo.fullKey),
  ]);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;

  const parsed = BodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Richiesta non valida" }, { status: 400 });
  }

  // Rigettare una foto elimina anche i file da R2 (non è reversibile: per
  // ripubblicarla il partecipante dovrebbe ricaricarla da capo).
  if (parsed.data.status === "REJECTED") {
    const existing = await prisma.photo.findUnique({ where: { id } });
    if (existing) await deletePhotoFiles(existing);
  }

  const photo = await prisma.photo.update({
    where: { id },
    data: {
      ...(parsed.data.status !== undefined ? { status: parsed.data.status } : {}),
      ...(parsed.data.status === "REJECTED" ? { thumbKey: null, mediumKey: null, fullKey: null } : {}),
      ...(parsed.data.piazzaVotes !== undefined ? { piazzaVotes: parsed.data.piazzaVotes } : {}),
    },
  });

  return NextResponse.json({ photo });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;

  const photo = await prisma.photo.findUnique({ where: { id } });
  if (!photo) {
    return NextResponse.json({ error: "Foto non trovata" }, { status: 404 });
  }

  await prisma.photo.delete({ where: { id } });
  await deletePhotoFiles(photo);

  return NextResponse.json({ success: true });
}
