"use client";

import { useEffect, useState } from "react";

export default function NotifyResultsPanel() {
  const [pendingCount, setPendingCount] = useState<number | null>(null);
  const [totalCandidates, setTotalCandidates] = useState(0);
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{ sent: number; skipped: number; failed: number } | null>(null);

  function applyStatus(body: { pendingCount?: number; totalCandidates?: number }) {
    setPendingCount(body.pendingCount ?? 0);
    setTotalCandidates(body.totalCandidates ?? 0);
  }

  useEffect(() => {
    fetch("/api/admin/notify-results")
      .then((res) => res.json())
      .then(applyStatus);
  }, []);

  async function handleSend() {
    if (!confirm(`Inviare l'email con i risultati finali a ${pendingCount} candidat${pendingCount === 1 ? "o" : "i"}?`)) {
      return;
    }
    setSending(true);
    setResult(null);
    try {
      const res = await fetch("/api/admin/notify-results", { method: "POST" });
      const body = await res.json();
      if (res.ok) {
        setResult(body);
        const statusRes = await fetch("/api/admin/notify-results");
        applyStatus(await statusRes.json());
      }
    } finally {
      setSending(false);
    }
  }

  if (pendingCount === null) return null;

  return (
    <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-6">
      <h2 className="text-base font-semibold text-white">Email risultati finali</h2>
      <p className="mt-1 text-sm text-neutral-500">
        Invia a ogni candidato un riepilogo dei voti ottenuti dalle sue foto. {totalCandidates - pendingCount}/
        {totalCandidates} già notificati.
      </p>

      {result && (
        <p className="mt-3 text-sm text-emerald-400">
          Inviate {result.sent} email ({result.skipped} senza foto pubblicate, {result.failed} fallite).
        </p>
      )}

      <button
        onClick={handleSend}
        disabled={sending || pendingCount === 0}
        className="mt-4 rounded-lg bg-white px-4 py-2 text-sm font-medium text-neutral-950 transition hover:bg-neutral-200 disabled:opacity-50"
      >
        {sending
          ? "Invio in corso..."
          : pendingCount === 0
            ? "Tutti i candidati sono stati notificati"
            : `Invia a ${pendingCount} candidat${pendingCount === 1 ? "o" : "i"}`}
      </button>
    </div>
  );
}
