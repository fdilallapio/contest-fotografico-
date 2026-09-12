import { NextRequest, NextResponse } from "next/server";
import type { ContestConfig } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { computeContestPhase } from "@/lib/contest-phase";
import { sendMail } from "@/lib/email";
import { resultsSummaryEmail } from "@/lib/email-templates";
import { getLogoAttachment } from "@/lib/email-logo";

async function requireClosedPhase(): Promise<{ config: ContestConfig | null }> {
  const config = await prisma.contestConfig.findFirst();
  if (!config || computeContestPhase(config, new Date()).phase !== "CLOSED") {
    return { config: null };
  }
  return { config };
}

export async function GET() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { config } = await requireClosedPhase();
  if (!config) {
    return NextResponse.json({ closed: false, pendingCount: 0, totalCandidates: 0 });
  }

  const [pendingCount, totalCandidates] = await Promise.all([
    prisma.candidate.count({ where: { resultsEmailSentAt: null } }),
    prisma.candidate.count(),
  ]);
  return NextResponse.json({ closed: true, pendingCount, totalCandidates });
}

export async function POST(req: NextRequest) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { config } = await requireClosedPhase();
  if (!config) {
    return NextResponse.json({ error: "Il contest non è ancora chiuso" }, { status: 403 });
  }

  const force = req.nextUrl.searchParams.get("force") === "true";

  const candidates = await prisma.candidate.findMany({
    where: force ? {} : { resultsEmailSentAt: null },
    include: { photos: { where: { status: "READY" }, include: { theme: true } } },
  });

  let sent = 0;
  let skipped = 0;
  let failed = 0;

  const logoAttachment = await getLogoAttachment();

  for (const candidate of candidates) {
    if (candidate.photos.length === 0) {
      skipped++;
      continue;
    }
    try {
      const { subject, html } = resultsSummaryEmail({
        firstName: candidate.firstName,
        photos: candidate.photos.map((p) => ({
          themeName: p.theme.name,
          description: p.description,
          voteCount: p.voteCount + p.piazzaVotes,
        })),
      });
      await sendMail({ to: candidate.email, subject, html, attachments: [logoAttachment] });
      await prisma.candidate.update({
        where: { id: candidate.id },
        data: { resultsEmailSentAt: new Date() },
      });
      sent++;
    } catch (err) {
      console.error(`[notify-results] invio fallito per candidate ${candidate.id}:`, err);
      failed++;
    }
  }

  return NextResponse.json({ sent, skipped, failed, total: candidates.length });
}
