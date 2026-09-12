"use client";

import { useEffect, useState } from "react";
import Countdown from "@/components/Countdown";
import ThemeGallery from "@/components/ThemeGallery";
import { formatWinnersAnnouncement } from "@/lib/contest-phase";

interface Theme {
  slug: string;
  name: string;
}

export default function VotingPhaseView({
  votingEndsAt,
  eventDate,
  eventLocation,
}: {
  votingEndsAt: Date;
  eventDate: Date | string | null;
  eventLocation: string | null;
}) {
  const [themes, setThemes] = useState<Theme[]>([]);
  const [csrfToken, setCsrfToken] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/themes").then((r) => r.json()).then((b) => setThemes(b.themes ?? []));
    fetch("/api/csrf-token").then((r) => r.json()).then((b) => setCsrfToken(b.token ?? null));
  }, []);

  const winnersAnnouncement = formatWinnersAnnouncement(eventDate, eventLocation);

  return (
    <div className="min-h-screen pb-24 text-foreground">
      <section className="border-b border-border px-4 py-12 text-center sm:py-16">
        <p className="text-sm font-semibold uppercase tracking-widest text-muted">Votazione in corso</p>
        <h1 className="mt-3 text-3xl font-extrabold text-primary sm:text-5xl">Scegli le foto che ti emozionano</h1>
        <p className="mt-2 text-sm text-muted">Le votazioni chiudono tra:</p>
        <div className="mt-6 flex justify-center">
          <Countdown target={votingEndsAt} />
        </div>
        {winnersAnnouncement && (
          <p className="mt-4 text-sm text-muted">
            I vincitori di tutti i temi sono annunciati{" "}
            <span className="font-medium text-foreground">{winnersAnnouncement}</span>.
          </p>
        )}
      </section>

      <div className="mx-auto mt-12 max-w-5xl space-y-16 px-4">
        {themes.map((theme) => (
          <section key={theme.slug}>
            <h2 className="mb-4 text-xl font-bold text-foreground">{theme.name}</h2>
            <ThemeGallery themeSlug={theme.slug} themeName={theme.name} csrfToken={csrfToken} />
          </section>
        ))}
      </div>
    </div>
  );
}
