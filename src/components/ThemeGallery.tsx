"use client";

import { useEffect, useState } from "react";
import { INPUT_CLASS, PRIMARY_BUTTON } from "@/lib/ui";

interface Photo {
  id: string;
  description: string;
  thumbKey: string | null;
  mediumKey: string | null;
  voteCount: number;
  piazzaVotes: number;
}

const VOTER_EMAIL_KEY = "voterEmail";

export default function ThemeGallery({
  themeSlug,
  themeName,
  csrfToken,
}: {
  themeSlug: string;
  themeName: string;
  csrfToken: string | null;
}) {
  const [photos, setPhotos] = useState<Photo[]>([]);
  // themeSlug is stable for the lifetime of a mounted ThemeGallery (VotingPhaseView
  // remounts a fresh instance per theme), so the initial `true` covers the only fetch.
  const [loading, setLoading] = useState(true);
  const [votedIds, setVotedIds] = useState<Set<string>>(new Set());
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [lightbox, setLightbox] = useState<Photo | null>(null);

  const [voterEmail, setVoterEmail] = useState<string | null>(null);
  const [emailPromptPhoto, setEmailPromptPhoto] = useState<Photo | null>(null);
  const [emailInput, setEmailInput] = useState("");
  const [emailError, setEmailError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/themes/${themeSlug}/photos`)
      .then((r) => r.json())
      .then((b) => setPhotos(b.photos ?? []))
      .finally(() => setLoading(false));
  }, [themeSlug]);

  useEffect(() => {
    // letto in un microtask, non in cima all'effect, per il lint react-hooks/set-state-in-effect
    Promise.resolve().then(() => {
      try {
        const stored = window.localStorage.getItem(VOTER_EMAIL_KEY);
        if (stored) setVoterEmail(stored);
      } catch {
        // localStorage non disponibile (es. modalità privata): si richiede l'email a ogni voto
      }
    });
  }, []);

  async function vote(photo: Photo, email: string) {
    if (!csrfToken || pendingId) return;
    setPendingId(photo.id);
    setToast(null);
    try {
      const res = await fetch(`/api/photos/${photo.id}/vote`, {
        method: "POST",
        headers: { "x-csrf-token": csrfToken, "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        // "già votato" non è un errore per chi guarda: la foto è comunque sua
        if (res.status === 409) setVotedIds((prev) => new Set(prev).add(photo.id));
        setToast(typeof body.error === "string" ? body.error : "Voto non riuscito");
        return;
      }
      setPhotos((prev) => prev.map((p) => (p.id === photo.id ? { ...p, voteCount: body.voteCount } : p)));
      setVotedIds((prev) => new Set(prev).add(photo.id));
      setToast("Voto registrato, grazie!");
    } finally {
      setPendingId(null);
    }
  }

  function handleVoteClick(photo: Photo) {
    if (voterEmail) {
      vote(photo, voterEmail);
      return;
    }
    setEmailInput("");
    setEmailError(null);
    setEmailPromptPhoto(photo);
  }

  function confirmEmail(e: React.FormEvent) {
    e.preventDefault();
    const email = emailInput.trim().toLowerCase();
    if (!email || !email.includes("@")) {
      setEmailError("Inserisci un'email valida.");
      return;
    }
    try {
      window.localStorage.setItem(VOTER_EMAIL_KEY, email);
    } catch {
      // ignorato: si richiederà di nuovo l'email al prossimo voto in questa sessione
    }
    setVoterEmail(email);
    const photo = emailPromptPhoto;
    setEmailPromptPhoto(null);
    if (photo) vote(photo, email);
  }

  function changeEmail() {
    try {
      window.localStorage.removeItem(VOTER_EMAIL_KEY);
    } catch {
      // ignorato
    }
    setVoterEmail(null);
  }

  if (loading) {
    return <p className="text-sm text-muted">Caricamento foto — {themeName}...</p>;
  }

  if (photos.length === 0) {
    return <p className="text-sm text-muted">Nessuna foto pubblicata per {themeName}.</p>;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        {toast && <p className="text-sm font-medium text-primary">{toast}</p>}
        {voterEmail && (
          <p className="ml-auto text-xs text-muted">
            Voti come <span className="font-medium text-foreground">{voterEmail}</span> ·{" "}
            <button type="button" onClick={changeEmail} className="underline underline-offset-2 hover:text-foreground">
              cambia
            </button>
          </p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {photos.map((photo) => (
          <div key={photo.id} className="group overflow-hidden rounded-2xl bg-card shadow-md">
            <button
              type="button"
              onClick={() => setLightbox(photo)}
              className="relative block aspect-[4/5] w-full overflow-hidden bg-input-bg"
            >
              {photo.thumbKey && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={photo.thumbKey}
                  alt={photo.description}
                  className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                />
              )}
            </button>
            <div className="space-y-2 p-3">
              <p className="line-clamp-2 text-xs text-foreground/80">{photo.description}</p>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted">{photo.voteCount + photo.piazzaVotes} voti</span>
                <button
                  onClick={() => handleVoteClick(photo)}
                  disabled={pendingId === photo.id}
                  className={`rounded-full px-3 py-1 text-xs font-bold transition disabled:opacity-50 ${
                    votedIds.has(photo.id)
                      ? "bg-accent-green/15 text-accent-green"
                      : "bg-primary text-white hover:bg-primary-dark"
                  }`}
                >
                  {votedIds.has(photo.id) ? "Votato ✓" : "Vota"}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {lightbox && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/90 p-4"
          onClick={() => setLightbox(null)}
        >
          <div className="max-h-full max-w-3xl" onClick={(e) => e.stopPropagation()}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={lightbox.mediumKey ?? lightbox.thumbKey ?? ""}
              alt={lightbox.description}
              className="max-h-[80vh] w-full rounded-xl object-contain"
            />
            <p className="mt-3 text-sm text-white/90">{lightbox.description}</p>
            <button onClick={() => setLightbox(null)} className="mt-4 text-sm text-white/60 hover:text-white">
              Chiudi
            </button>
          </div>
        </div>
      )}

      {emailPromptPhoto && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/60 p-4"
          onClick={() => setEmailPromptPhoto(null)}
        >
          <form
            onSubmit={confirmEmail}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm space-y-4 rounded-2xl bg-card p-6 shadow-lg"
          >
            <div>
              <h3 className="text-lg font-bold text-foreground">Vota con la tua email</h3>
              <p className="mt-1 text-sm text-muted">
                Serve solo per evitare più voti sulla stessa foto. Non viene verificata né usata per altro.
              </p>
            </div>
            <input
              type="email"
              autoFocus
              required
              placeholder="La tua email"
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
              className={INPUT_CLASS}
            />
            {emailError && <p className="text-sm text-primary">{emailError}</p>}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setEmailPromptPhoto(null)}
                className="flex-1 rounded-full border border-input-border px-4 py-2 text-sm font-semibold text-foreground transition hover:bg-input-bg"
              >
                Annulla
              </button>
              <button type="submit" className={`flex-1 ${PRIMARY_BUTTON}`}>
                Vota
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
