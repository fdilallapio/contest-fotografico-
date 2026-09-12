import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { computeContestPhase } from "@/lib/contest-phase";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const config = await prisma.contestConfig.findFirst();
  if (!config) {
    return NextResponse.json({ error: "Contest non configurato" }, { status: 404 });
  }

  const phase = computeContestPhase(config, new Date());
  // in fase Upload nessun tema è pubblico; in fase Closed restano visibili tutti (risultati finali)
  const unlockedSlugs =
    phase.phase === "VOTING" ? phase.unlockedThemeSlugs : phase.phase === "CLOSED" ? null : [];

  if (unlockedSlugs !== null && !unlockedSlugs.includes(slug)) {
    return NextResponse.json({ error: "Tema non ancora sbloccato" }, { status: 403 });
  }

  const theme = await prisma.theme.findUnique({ where: { slug } });
  if (!theme) {
    return NextResponse.json({ error: "Tema non trovato" }, { status: 404 });
  }

  const photos = await prisma.photo.findMany({
    where: { themeId: theme.id, status: "READY" },
    select: {
      id: true,
      description: true,
      thumbKey: true,
      mediumKey: true,
      voteCount: true,
      piazzaVotes: true,
    },
  });

  // il totale (online + piazza) determina l'ordine mostrato al pubblico;
  // SQLite non ordina per somma calcolata lato query, quindi si ordina qui.
  photos.sort((a, b) => b.voteCount + b.piazzaVotes - (a.voteCount + a.piazzaVotes));

  return NextResponse.json({ theme: { slug: theme.slug, name: theme.name }, photos });
}
