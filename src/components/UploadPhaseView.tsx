"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Countdown from "@/components/Countdown";
import { formatWinnersAnnouncement } from "@/lib/contest-phase";
import { PRIMARY_BUTTON, INPUT_CLASS } from "@/lib/ui";

interface Theme {
  slug: string;
  name: string;
}

interface Entry {
  file: File;
  previewUrl: string;
  description: string;
}

const MAX_PER_THEME = 2;

const THEME_CARD_ACCENT = ["border-t-accent-orange", "border-t-accent-blue", "border-t-accent-green"];

export default function UploadPhaseView({
  deadline,
  eventDate,
  eventLocation,
}: {
  deadline: Date;
  eventDate: Date | string | null;
  eventLocation: string | null;
}) {
  const [themes, setThemes] = useState<Theme[]>([]);
  const [csrfToken, setCsrfToken] = useState<string | null>(null);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [location, setLocation] = useState("");
  const [gdprConsent, setGdprConsent] = useState(false);
  const [rulesConsent, setRulesConsent] = useState(false);

  const [entriesByTheme, setEntriesByTheme] = useState<Record<string, Entry[]>>({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    fetch("/api/themes").then((r) => r.json()).then((b) => setThemes(b.themes ?? []));
    fetch("/api/csrf-token").then((r) => r.json()).then((b) => setCsrfToken(b.token ?? null));
  }, []);

  const totalPhotos = useMemo(
    () => Object.values(entriesByTheme).reduce((sum, arr) => sum + arr.length, 0),
    [entriesByTheme]
  );

  const winnersAnnouncement = useMemo(
    () => formatWinnersAnnouncement(eventDate, eventLocation),
    [eventDate, eventLocation]
  );

  function addFiles(themeSlug: string, files: FileList | null) {
    if (!files) return;
    setEntriesByTheme((prev) => {
      const current = prev[themeSlug] ?? [];
      const room = MAX_PER_THEME - current.length;
      const added = Array.from(files)
        .slice(0, room)
        .map((file) => ({ file, previewUrl: URL.createObjectURL(file), description: "" }));
      return { ...prev, [themeSlug]: [...current, ...added] };
    });
  }

  function removeEntry(themeSlug: string, index: number) {
    setEntriesByTheme((prev) => {
      const current = [...(prev[themeSlug] ?? [])];
      URL.revokeObjectURL(current[index].previewUrl);
      current.splice(index, 1);
      return { ...prev, [themeSlug]: current };
    });
  }

  function updateDescription(themeSlug: string, index: number, description: string) {
    setEntriesByTheme((prev) => {
      const current = [...(prev[themeSlug] ?? [])];
      current[index] = { ...current[index], description };
      return { ...prev, [themeSlug]: current };
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (totalPhotos === 0) {
      setError("Carica almeno una foto in un tema.");
      return;
    }
    if (!csrfToken) {
      setError("Sessione non pronta, ricarica la pagina.");
      return;
    }

    const entries: { themeSlug: string; description: string }[] = [];
    const files: File[] = [];
    for (const [themeSlug, list] of Object.entries(entriesByTheme)) {
      for (const entry of list) {
        entries.push({ themeSlug, description: entry.description });
        files.push(entry.file);
      }
    }

    const formData = new FormData();
    formData.append(
      "payload",
      JSON.stringify({ firstName, lastName, email, phone, location, gdprConsent, rulesConsent, entries })
    );
    files.forEach((f) => formData.append("files", f));

    setSubmitting(true);
    try {
      const res = await fetch("/api/submissions", {
        method: "POST",
        headers: { "x-csrf-token": csrfToken },
        body: formData,
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(typeof body.error === "string" ? body.error : "Errore nell'invio delle tue foto");
        return;
      }
      setSuccess(true);
    } finally {
      setSubmitting(false);
    }
  }

  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm rounded-3xl border-t-4 border-t-accent-green bg-card p-8 text-center shadow-xl">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-accent-green/15">
            <svg
              viewBox="0 0 24 24"
              className="h-8 w-8 text-accent-green"
              fill="none"
              stroke="currentColor"
              strokeWidth={3}
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="mt-5 text-xl font-extrabold uppercase tracking-wide text-foreground">
            Partecipazione confermata
          </h1>
          <p className="mt-3 text-sm text-muted">
            Grazie per aver partecipato. Le tue foto sono in fase di revisione e saranno visibili durante la
            votazione pubblica.
          </p>
          <Link href="/" className={`mt-6 inline-flex ${PRIMARY_BUTTON}`}>
            Torna alla home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24 text-foreground">
      <section className="border-b border-border px-4 py-14 text-center sm:py-20">
        <p className="text-sm font-semibold uppercase tracking-widest text-muted">Partecipazione aperta</p>
        <h1 className="mt-3 text-3xl font-extrabold text-primary sm:text-5xl">Invia le tue foto</h1>
        <p className="mx-auto mt-4 max-w-xl text-foreground/80">
          Compila i tuoi dati e carica le foto sui temi che preferisci prima della chiusura della partecipazione.
        </p>
        <div className="mt-8 flex justify-center">
          <Countdown target={deadline} />
        </div>
      </section>

      <form onSubmit={handleSubmit} className="mx-auto mt-12 max-w-3xl space-y-12 px-4">
        <section className="space-y-4">
          <h2 className="text-lg font-bold text-foreground">I tuoi dati</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <input required placeholder="Nome" value={firstName} onChange={(e) => setFirstName(e.target.value)} className={INPUT_CLASS} />
            <input required placeholder="Cognome" value={lastName} onChange={(e) => setLastName(e.target.value)} className={INPUT_CLASS} />
            <input required type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} className={INPUT_CLASS} />
            <input required placeholder="Cellulare" value={phone} onChange={(e) => setPhone(e.target.value)} className={INPUT_CLASS} />
            <input required placeholder="Luogo (città)" value={location} onChange={(e) => setLocation(e.target.value)} className={`${INPUT_CLASS} sm:col-span-2`} />
          </div>
        </section>

        <section className="space-y-5">
          <div>
            <h2 className="text-lg font-bold text-foreground">Le tue foto</h2>
            <p className="mt-1 text-sm text-muted">Fino a 2 foto per tema. Formati: JPEG, PNG, WEBP, HEIC.</p>
            {winnersAnnouncement && (
              <p className="mt-1 text-sm text-muted">
                I vincitori di tutti i temi sono annunciati{" "}
                <span className="font-medium text-foreground">{winnersAnnouncement}</span>.
              </p>
            )}
          </div>

          {themes.map((theme, i) => {
            const entries = entriesByTheme[theme.slug] ?? [];
            return (
              <div
                key={theme.slug}
                className={`rounded-2xl border-t-4 bg-card p-5 shadow-md ${THEME_CARD_ACCENT[i % 3]}`}
              >
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-foreground">{theme.name}</h3>
                  <span className="text-xs text-muted">{entries.length}/{MAX_PER_THEME}</span>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {entries.map((entry, j) => (
                    <div key={entry.previewUrl} className="space-y-2">
                      <div className="relative aspect-square overflow-hidden rounded-xl bg-input-bg">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={entry.previewUrl} alt="" className="h-full w-full object-cover" />
                        <button
                          type="button"
                          onClick={() => removeEntry(theme.slug, j)}
                          className="absolute right-1.5 top-1.5 rounded-full bg-foreground/70 px-2 py-0.5 text-xs text-white"
                        >
                          ✕
                        </button>
                      </div>
                      <textarea
                        placeholder="Descrizione (luogo, data, significato, altro)"
                        maxLength={500}
                        value={entry.description}
                        onChange={(e) => updateDescription(theme.slug, j, e.target.value)}
                        rows={2}
                        className="w-full resize-none rounded-lg border border-input-border bg-input-bg px-2 py-1.5 text-xs text-foreground outline-none focus:border-primary"
                      />
                    </div>
                  ))}

                  {entries.length < MAX_PER_THEME && (
                    <label className="flex aspect-square cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-input-border text-muted transition hover:border-primary hover:text-primary">
                      <span className="text-2xl">+</span>
                      <span className="text-xs">Aggiungi</span>
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
                        multiple
                        className="hidden"
                        onChange={(e) => addFiles(theme.slug, e.target.files)}
                      />
                    </label>
                  )}
                </div>
              </div>
            );
          })}
        </section>

        <section className="space-y-3">
          <label className="flex items-start gap-3 text-sm text-foreground/80">
            <input type="checkbox" required checked={gdprConsent} onChange={(e) => setGdprConsent(e.target.checked)} className="mt-1 accent-primary" />
            Acconsento al trattamento dei miei dati personali secondo il GDPR e l&apos;informativa privacy del contest.
          </label>
          <label className="flex items-start gap-3 text-sm text-foreground/80">
            <input type="checkbox" required checked={rulesConsent} onChange={(e) => setRulesConsent(e.target.checked)} className="mt-1 accent-primary" />
            <span>
              Dichiaro di aver letto e accettato{" "}
              <a
                href="/regolamento-contest-fotografico.pdf"
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="font-semibold text-primary underline underline-offset-2"
              >
                il regolamento del contest
              </a>
              .
            </span>
          </label>
        </section>

        {error && <p className="text-sm font-medium text-primary">{error}</p>}

        <button type="submit" disabled={submitting} className={`w-full ${PRIMARY_BUTTON}`}>
          {submitting ? "Invio in corso..." : "Invia le tue foto"}
        </button>
      </form>
    </div>
  );
}
