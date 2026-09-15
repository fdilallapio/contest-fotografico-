"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

interface Theme {
  slug: string;
  name: string;
}

interface Photo {
  id: string;
  description: string;
  status: string;
  voteCount: number;
  piazzaVotes: number;
  thumbKey: string | null;
  createdAt: string;
  theme: { slug: string; name: string };
  candidate: { firstName: string; lastName: string; email: string };
}

const STATUS_LABEL: Record<string, string> = {
  PENDING: "In coda",
  PROCESSING: "In elaborazione",
  READY: "Approvata",
  REJECTED: "Rigettata",
};

const STATUS_COLOR: Record<string, string> = {
  PENDING: "bg-amber-500/15 text-amber-400",
  PROCESSING: "bg-blue-500/15 text-blue-400",
  READY: "bg-emerald-500/15 text-emerald-400",
  REJECTED: "bg-red-500/15 text-red-400",
};

export default function PhotoModerationGrid({ themes }: { themes: Theme[] }) {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [statusFilter, setStatusFilter] = useState("");
  const [themeFilter, setThemeFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [piazzaDraft, setPiazzaDraft] = useState<Record<string, string>>({});

  useEffect(() => {
    const params = new URLSearchParams();
    if (statusFilter) params.set("status", statusFilter);
    if (themeFilter) params.set("theme", themeFilter);
    fetch(`/api/admin/photos?${params.toString()}`)
      .then((res) => res.json())
      .then((body) => setPhotos(body.photos ?? []))
      .finally(() => setLoading(false));
  }, [statusFilter, themeFilter]);

  async function updateStatus(id: string, status: "READY" | "REJECTED") {
    setBusyId(id);
    try {
      await fetch(`/api/admin/photos/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      setPhotos((prev) => prev.map((p) => (p.id === id ? { ...p, status } : p)));
    } finally {
      setBusyId(null);
    }
  }

  async function savePiazzaVotes(id: string) {
    const raw = piazzaDraft[id];
    if (raw === undefined) return;
    const piazzaVotes = Math.max(0, Math.trunc(Number(raw)) || 0);

    setBusyId(id);
    try {
      await fetch(`/api/admin/photos/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ piazzaVotes }),
      });
      setPhotos((prev) => prev.map((p) => (p.id === id ? { ...p, piazzaVotes } : p)));
      setPiazzaDraft((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
    } finally {
      setBusyId(null);
    }
  }

  async function remove(id: string) {
    if (!confirm("Eliminare definitivamente questa foto?")) return;
    setBusyId(id);
    try {
      await fetch(`/api/admin/photos/${id}`, { method: "DELETE" });
      setPhotos((prev) => prev.filter((p) => p.id !== id));
    } finally {
      setBusyId(null);
    }
  }

  const selectClass = "rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-1.5 text-sm text-white outline-none focus:border-neutral-400";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-3">
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className={selectClass}>
          <option value="">Tutti gli stati</option>
          {Object.entries(STATUS_LABEL).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
        <select value={themeFilter} onChange={(e) => setThemeFilter(e.target.value)} className={selectClass}>
          <option value="">Tutti i temi</option>
          {themes.map((t) => (
            <option key={t.slug} value={t.slug}>{t.name}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <p className="text-sm text-neutral-500">Caricamento...</p>
      ) : photos.length === 0 ? (
        <p className="text-sm text-neutral-500">Nessuna foto trovata per questo filtro.</p>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {photos.map((photo) => {
            const draftValue = piazzaDraft[photo.id];
            const isDirty = draftValue !== undefined && Number(draftValue) !== photo.piazzaVotes;
            const total = photo.voteCount + photo.piazzaVotes;
            return (
              <div key={photo.id} className="overflow-hidden rounded-xl border border-neutral-800 bg-neutral-900">
                <div className="relative aspect-[4/3] bg-neutral-800">
                  {photo.thumbKey ? (
                    <Image src={photo.thumbKey} alt={photo.description} fill className="object-cover" unoptimized />
                  ) : (
                    <div className="flex h-full items-center justify-center text-xs text-neutral-500">
                      Elaborazione in corso
                    </div>
                  )}
                  <span className={`absolute left-2 top-2 rounded-full px-2 py-0.5 text-[11px] font-medium ${STATUS_COLOR[photo.status]}`}>
                    {STATUS_LABEL[photo.status]}
                  </span>
                </div>
                <div className="space-y-2 p-3">
                  <p className="text-xs font-medium text-neutral-300">{photo.theme.name}</p>
                  <p className="whitespace-pre-line text-xs text-neutral-500">{photo.description}</p>
                  <p className="truncate text-xs text-neutral-600">
                    {photo.candidate.firstName} {photo.candidate.lastName}
                  </p>

                  <div className="rounded-lg bg-neutral-950 p-2">
                    <p className="text-xs font-semibold text-white">{total} voti totali</p>
                    <div className="mt-1.5 flex items-center gap-1.5 text-xs text-neutral-500">
                      <span>{photo.voteCount} online +</span>
                      <input
                        type="number"
                        min={0}
                        value={draftValue ?? photo.piazzaVotes}
                        onChange={(e) =>
                          setPiazzaDraft((prev) => ({ ...prev, [photo.id]: e.target.value }))
                        }
                        className="w-14 rounded border border-neutral-700 bg-neutral-900 px-1.5 py-0.5 text-center text-xs text-white outline-none focus:border-neutral-400"
                      />
                      <span>piazza</span>
                    </div>
                    {isDirty && (
                      <button
                        disabled={busyId === photo.id}
                        onClick={() => savePiazzaVotes(photo.id)}
                        className="mt-1.5 w-full rounded-md bg-blue-500/15 px-2 py-1 text-xs font-medium text-blue-400 transition hover:bg-blue-500/25 disabled:opacity-40"
                      >
                        Salva voti piazza
                      </button>
                    )}
                  </div>

                  <div className="flex gap-2 pt-1">
                    <button
                      disabled={busyId === photo.id || photo.status === "READY"}
                      onClick={() => updateStatus(photo.id, "READY")}
                      className="flex-1 rounded-md bg-emerald-500/15 px-2 py-1 text-xs font-medium text-emerald-400 transition hover:bg-emerald-500/25 disabled:opacity-40"
                    >
                      Approva
                    </button>
                    <button
                      disabled={busyId === photo.id || photo.status === "REJECTED"}
                      onClick={() => updateStatus(photo.id, "REJECTED")}
                      className="flex-1 rounded-md bg-red-500/15 px-2 py-1 text-xs font-medium text-red-400 transition hover:bg-red-500/25 disabled:opacity-40"
                    >
                      Rigetta
                    </button>
                    <button
                      disabled={busyId === photo.id}
                      onClick={() => remove(photo.id)}
                      className="rounded-md px-2 py-1 text-xs text-neutral-500 transition hover:text-white disabled:opacity-40"
                    >
                      Elimina
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
