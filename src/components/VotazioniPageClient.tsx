"use client";

import Link from "next/link";
import { useContestPhase } from "@/hooks/useContestPhase";
import { ContestConfigLike, formatDayDate } from "@/lib/contest-phase";
import Countdown from "@/components/Countdown";
import VotingPhaseView from "@/components/VotingPhaseView";
import ClosedPhaseView from "@/components/ClosedPhaseView";
import { SECONDARY_BUTTON } from "@/lib/ui";

export default function VotazioniPageClient({ config }: { config: ContestConfigLike }) {
  const phase = useContestPhase(config);

  if (phase.phase === "VOTING") {
    return (
      <VotingPhaseView
        votingEndsAt={phase.votingEndsAt}
        eventDate={config.eventDate}
        eventLocation={config.eventLocation}
      />
    );
  }

  if (phase.phase === "CLOSED") {
    return <ClosedPhaseView eventDate={phase.eventDate} eventLocation={phase.eventLocation} />;
  }

  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-4 text-center text-foreground">
      <p className="text-sm font-semibold uppercase tracking-widest text-muted">Votazioni non ancora aperte</p>
      <h1 className="mt-3 text-2xl font-extrabold text-primary sm:text-3xl">
        Si vota dal {formatDayDate(phase.endsAt)}
      </h1>
      <p className="mx-auto mt-3 max-w-md text-muted">
        Le candidature sono ancora aperte: le votazioni inizieranno subito dopo la loro chiusura.
      </p>
      <div className="mt-8 flex justify-center">
        <Countdown target={phase.endsAt} />
      </div>
      <Link href="/candidati" className={`mt-8 ${SECONDARY_BUTTON}`}>
        Candidati intanto con le tue foto
      </Link>
    </div>
  );
}
