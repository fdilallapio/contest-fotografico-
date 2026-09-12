"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface ConfigFormProps {
  initial: {
    uploadStart: string;
    uploadEnd: string;
    votingEnd: string;
    eventDate: string | null;
    eventLocation: string | null;
  };
}

function toLocalInputValue(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function toIso(localValue: string): string | null {
  if (!localValue) return null;
  return new Date(localValue).toISOString();
}

export default function ConfigForm({ initial }: ConfigFormProps) {
  const router = useRouter();
  const [uploadStart, setUploadStart] = useState(toLocalInputValue(initial.uploadStart));
  const [uploadEnd, setUploadEnd] = useState(toLocalInputValue(initial.uploadEnd));
  const [votingEnd, setVotingEnd] = useState(toLocalInputValue(initial.votingEnd));
  const [eventDate, setEventDate] = useState(toLocalInputValue(initial.eventDate));
  const [eventLocation, setEventLocation] = useState(initial.eventLocation ?? "");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/config", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          uploadStart: toIso(uploadStart),
          uploadEnd: toIso(uploadEnd),
          votingEnd: toIso(votingEnd),
          eventDate: toIso(eventDate),
          eventLocation: eventLocation.trim() || null,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setMessage({ type: "error", text: body.error?.toString?.() ?? "Errore nel salvataggio" });
        return;
      }
      setMessage({ type: "success", text: "Configurazione salvata." });
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  const field = "w-full rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm text-white outline-none focus:border-neutral-400";
  const label = "mb-1.5 block text-sm text-neutral-300";

  return (
    <form onSubmit={handleSubmit} className="space-y-6 rounded-2xl border border-neutral-800 bg-neutral-900 p-6">
      <div>
        <h2 className="text-base font-semibold text-white">Date del contest</h2>
        <p className="mt-1 text-sm text-neutral-500">
          Determinano la fase mostrata in home page (Upload → Voto → Chiusura).
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label className={label}>Inizio upload</label>
          <input
            type="datetime-local"
            required
            value={uploadStart}
            onChange={(e) => setUploadStart(e.target.value)}
            className={field}
          />
        </div>
        <div>
          <label className={label}>Fine upload / inizio voto</label>
          <input
            type="datetime-local"
            required
            value={uploadEnd}
            onChange={(e) => setUploadEnd(e.target.value)}
            className={field}
          />
        </div>
        <div>
          <label className={label}>Fine voto</label>
          <input
            type="datetime-local"
            required
            value={votingEnd}
            onChange={(e) => setVotingEnd(e.target.value)}
            className={field}
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={label}>Data presentazione vincitori (opzionale)</label>
          <input
            type="datetime-local"
            value={eventDate}
            onChange={(e) => setEventDate(e.target.value)}
            className={field}
          />
        </div>
        <div>
          <label className={label}>Luogo presentazione vincitori (opzionale)</label>
          <input
            type="text"
            value={eventLocation}
            onChange={(e) => setEventLocation(e.target.value)}
            placeholder="es. Sala Congressi, Via Roma 1, Milano"
            className={field}
          />
        </div>
      </div>

      {message && (
        <p className={`text-sm ${message.type === "success" ? "text-emerald-400" : "text-red-400"}`}>
          {message.text}
        </p>
      )}

      <button
        type="submit"
        disabled={saving}
        className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-neutral-950 transition hover:bg-neutral-200 disabled:opacity-50"
      >
        {saving ? "Salvataggio..." : "Salva configurazione"}
      </button>
    </form>
  );
}
