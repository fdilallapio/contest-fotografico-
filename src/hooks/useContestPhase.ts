"use client";

import { useEffect, useMemo, useState } from "react";
import { computeContestPhase, ContestPhase, ContestConfigLike } from "@/lib/contest-phase";

export function useContestPhase(config: ContestConfigLike): ContestPhase {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    // ricalcola ogni minuto: la fase cambia su base giornaliera, un countdown
    // a sé mostra i secondi senza bisogno di ricalcolare l'intera fase
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

  return useMemo<ContestPhase>(() => computeContestPhase(config, now), [config, now]);
}
