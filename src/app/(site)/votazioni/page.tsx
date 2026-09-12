import { prisma } from "@/lib/prisma";
import VotazioniPageClient from "@/components/VotazioniPageClient";

export const dynamic = "force-dynamic";

export default async function VotazioniPage() {
  const config = await prisma.contestConfig.findFirst();

  if (!config) {
    return (
      <div className="flex min-h-screen items-center justify-center text-muted">
        Contest non ancora configurato.
      </div>
    );
  }

  return (
    <VotazioniPageClient
      config={{
        uploadStart: config.uploadStart.toISOString(),
        uploadEnd: config.uploadEnd.toISOString(),
        votingEnd: config.votingEnd.toISOString(),
        eventDate: config.eventDate ? config.eventDate.toISOString() : null,
        eventLocation: config.eventLocation,
      }}
    />
  );
}
