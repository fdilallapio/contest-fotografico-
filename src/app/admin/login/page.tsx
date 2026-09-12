"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body.error ?? "Password non valida");
        return;
      }
      router.push("/admin");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-950 px-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm space-y-5 rounded-2xl border border-neutral-800 bg-neutral-900 p-8"
      >
        <div>
          <h1 className="text-xl font-semibold text-white">Pannello Admin</h1>
          <p className="mt-1 text-sm text-neutral-400">Contest fotografico</p>
        </div>

        <div>
          <label htmlFor="password" className="mb-1.5 block text-sm text-neutral-300">
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoFocus
            required
            className="w-full rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-white outline-none focus:border-neutral-400"
          />
        </div>

        {error && <p className="text-sm text-red-400">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-white px-4 py-2 font-medium text-neutral-950 transition hover:bg-neutral-200 disabled:opacity-50"
        >
          {loading ? "Accesso..." : "Accedi"}
        </button>
      </form>
    </div>
  );
}
