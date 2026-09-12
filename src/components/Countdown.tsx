"use client";

import { useEffect, useState } from "react";

function splitRemaining(ms: number) {
  const clamped = Math.max(0, ms);
  return {
    days: Math.floor(clamped / 86_400_000),
    hours: Math.floor((clamped % 86_400_000) / 3_600_000),
    minutes: Math.floor((clamped % 3_600_000) / 60_000),
    seconds: Math.floor((clamped % 60_000) / 1000),
  };
}

export default function Countdown({ target, onExpire }: { target: Date; onExpire?: () => void }) {
  // null until mounted: the exact second-level value depends on Date.now(),
  // which differs between server render and client hydration and would
  // otherwise trigger a hydration mismatch on every tick.
  const [remaining, setRemaining] = useState<number | null>(null);

  useEffect(() => {
    const tick = () => {
      const ms = target.getTime() - Date.now();
      setRemaining(ms);
      if (ms <= 0) onExpire?.();
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [target, onExpire]);

  // remaining === null only before the client has mounted: render the same
  // static placeholder on server and on the client's first paint so the
  // hydrated markup matches, then swap in real numbers once mounted.
  const units =
    remaining === null
      ? [
          { value: "--", label: "giorni" },
          { value: "--", label: "ore" },
          { value: "--", label: "min" },
          { value: "--", label: "sec" },
        ]
      : (() => {
          const { days, hours, minutes, seconds } = splitRemaining(remaining);
          return [
            { value: String(days).padStart(2, "0"), label: "giorni" },
            { value: String(hours).padStart(2, "0"), label: "ore" },
            { value: String(minutes).padStart(2, "0"), label: "min" },
            { value: String(seconds).padStart(2, "0"), label: "sec" },
          ];
        })();

  return (
    <div className="flex gap-2 sm:gap-4">
      {units.map((u) => (
        <div
          key={u.label}
          className="flex flex-col items-center rounded-2xl bg-card px-3 py-2.5 shadow-sm sm:px-5 sm:py-4"
        >
          <span className="tabular-nums text-3xl font-extrabold text-primary sm:text-5xl">{u.value}</span>
          <span className="mt-1 text-[11px] uppercase tracking-wide text-muted sm:text-xs">{u.label}</span>
        </div>
      ))}
    </div>
  );
}
