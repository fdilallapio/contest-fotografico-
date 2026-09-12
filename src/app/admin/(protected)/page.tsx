import { prisma } from "@/lib/prisma";
import { computeContestPhase } from "@/lib/contest-phase";
import ConfigForm from "@/components/admin/ConfigForm";
import NotifyResultsPanel from "@/components/admin/NotifyResultsPanel";

const PHASE_LABEL: Record<string, string> = {
  UPLOAD: "Fase di Upload",
  VOTING: "Fase di Voto",
  CLOSED: "Contest chiuso",
};

export default async function AdminDashboardPage() {
  const [config, candidateCount, photosByStatus, voteCount, piazzaVotesAgg] = await Promise.all([
    prisma.contestConfig.findFirst(),
    prisma.candidate.count(),
    prisma.photo.groupBy({ by: ["status"], _count: { _all: true } }),
    prisma.vote.count(),
    prisma.photo.aggregate({ _sum: { piazzaVotes: true } }),
  ]);

  const phase = config ? computeContestPhase(config, new Date()) : null;
  const statusCounts = Object.fromEntries(photosByStatus.map((p) => [p.status, p._count._all]));
  const piazzaVotes = piazzaVotesAgg._sum.piazzaVotes ?? 0;

  const stats = [
    { label: "Candidati", value: candidateCount },
    { label: "Foto in coda", value: statusCounts.PENDING ?? 0 },
    { label: "Foto pronte", value: statusCounts.READY ?? 0 },
    { label: "Foto rigettate", value: statusCounts.REJECTED ?? 0 },
    { label: "Voti online", value: voteCount },
    { label: "Voti piazza", value: piazzaVotes },
  ];

  return (
    <div className="space-y-8">
      <div>
        <p className="text-sm text-neutral-500">Stato attuale</p>
        <h1 className="text-2xl font-semibold text-white">
          {phase ? PHASE_LABEL[phase.phase] : "Nessuna configurazione"}
          {phase?.phase === "VOTING" && (
            <span className="ml-2 text-base font-normal text-neutral-400">— Giorno {phase.day}/3</span>
          )}
        </h1>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        {stats.map((s) => (
          <div key={s.label} className="rounded-xl border border-neutral-800 bg-neutral-900 p-4">
            <p className="text-2xl font-semibold text-white">{s.value}</p>
            <p className="mt-1 text-xs text-neutral-500">{s.label}</p>
          </div>
        ))}
      </div>

      {phase?.phase === "CLOSED" && <NotifyResultsPanel />}

      {config && (
        <ConfigForm
          initial={{
            uploadStart: config.uploadStart.toISOString(),
            uploadEnd: config.uploadEnd.toISOString(),
            votingEnd: config.votingEnd.toISOString(),
            eventDate: config.eventDate ? config.eventDate.toISOString() : null,
            eventLocation: config.eventLocation,
          }}
        />
      )}
    </div>
  );
}
