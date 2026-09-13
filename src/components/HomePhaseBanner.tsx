"use client";

import Link from "next/link";
import { useContestPhase } from "@/hooks/useContestPhase";
import { ContestConfigLike } from "@/lib/contest-phase";
import Countdown from "@/components/Countdown";
import { PRIMARY_BUTTON } from "@/lib/ui";

export default function HomePhaseBanner({ config }: { config: ContestConfigLike }) {
  const phase = useContestPhase(config);

  if (phase.phase === "UPLOAD") {
    return (
      <div className="mt-10 flex flex-col items-center gap-6">
        <p className="text-sm text-muted">La partecipazione chiude tra:</p>
        <Countdown target={phase.endsAt} />
        <p className="max-w-xs text-center text-xs text-muted">
          Partecipazione libera e aperta a tutte e tutti. Scegli una categoria e invia le tue foto subito.
        </p>
        <Link href="/candidati" className={PRIMARY_BUTTON}>
          Partecipa ora
        </Link>
      </div>
    );
  }

  if (phase.phase === "VOTING") {
    return (
      <div className="mt-10 flex flex-col items-center gap-6">
        <p className="text-sm text-muted">Votazione in corso su tutti i temi. Chiude tra:</p>
        <Countdown target={phase.votingEndsAt} />
        <Link href="/votazioni" className={PRIMARY_BUTTON}>
          Vota le foto
        </Link>
      </div>
    );
  }

  const formattedDate = phase.eventDate
    ? phase.eventDate.toLocaleDateString("it-IT", { weekday: "long", day: "numeric", month: "long", year: "numeric" })
    : null;

  return (
    <div className="mt-10 flex flex-col items-center gap-3 rounded-2xl bg-card px-8 py-6 shadow-md">
      <p className="text-xs font-bold uppercase tracking-widest text-primary">Votazione conclusa</p>
      {formattedDate && <p className="text-lg font-bold text-foreground">Premiazione il {formattedDate}</p>}
      {phase.eventLocation && <p className="text-muted">{phase.eventLocation}</p>}
      {!formattedDate && !phase.eventLocation && (
        <p className="text-muted">Data e luogo della premiazione saranno comunicati a breve.</p>
      )}
    </div>
  );
}
