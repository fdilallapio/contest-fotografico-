"use client";

import Link from "next/link";
import { useContestPhase } from "@/hooks/useContestPhase";
import { ContestConfigLike } from "@/lib/contest-phase";
import UploadPhaseView from "@/components/UploadPhaseView";
import { PRIMARY_BUTTON } from "@/lib/ui";

export default function CandidatiPageClient({ config }: { config: ContestConfigLike }) {
  const phase = useContestPhase(config);

  if (phase.phase === "UPLOAD") {
    return (
      <UploadPhaseView deadline={phase.endsAt} eventDate={config.eventDate} eventLocation={config.eventLocation} />
    );
  }

  const message =
    phase.phase === "VOTING"
      ? {
          title: "La partecipazione è chiusa",
          body: "La raccolta delle foto è terminata: è in corso la votazione pubblica.",
          cta: { href: "/votazioni", label: "Vai alle votazioni" },
        }
      : {
          title: "La partecipazione è chiusa",
          body: "Questa edizione del contest si è conclusa. Segui la pagina Info e contatti per le prossime edizioni.",
          cta: { href: "/", label: "Torna alla home" },
        };

  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-4 text-center text-foreground">
      <h1 className="text-2xl font-extrabold text-primary sm:text-3xl">{message.title}</h1>
      <p className="mx-auto mt-3 max-w-md text-muted">{message.body}</p>
      <Link href={message.cta.href} className={`mt-6 ${PRIMARY_BUTTON}`}>
        {message.cta.label}
      </Link>
    </div>
  );
}
