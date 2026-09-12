export type ContestPhase =
  | { phase: "UPLOAD"; endsAt: Date }
  | { phase: "VOTING"; day: 1 | 2 | 3; dayEndsAt: Date; votingEndsAt: Date; unlockedThemeSlugs: string[] }
  | { phase: "CLOSED"; eventDate: Date | null; eventLocation: string | null };

export interface ContestConfigLike {
  uploadStart: Date | string;
  uploadEnd: Date | string;
  votingEnd: Date | string;
  eventDate: Date | string | null;
  eventLocation: string | null;
}

/**
 * I 6 temi, elencati in coppie. Non pilotano più né lo sblocco del voto (tutti
 * i temi sono votabili fin da subito) né una presentazione a tappe: servono
 * solo come lista completa degli slug validi.
 */
export const THEME_UNLOCK_SCHEDULE: Record<1 | 2 | 3, string[]> = {
  1: ["sanita", "urbanistica"],
  2: ["agricoltura", "rigenerazione-urbana"],
  3: ["sport", "lavoro"],
};

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/** Formatta una data in italiano, es. "Domenica 13 settembre". */
export function formatDayDate(d: Date): string {
  const formatted = d.toLocaleDateString("it-IT", { weekday: "long", day: "numeric", month: "long" });
  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
}

/** Formatta una data in italiano senza giorno della settimana, es. "20 settembre". */
export function formatFullDate(d: Date): string {
  return d.toLocaleDateString("it-IT", { day: "numeric", month: "long" });
}

/** Frase unica "i vincitori sono annunciati il [data] presso [luogo]", usata ovunque serva. */
export function formatWinnersAnnouncement(
  eventDate: Date | string | null,
  eventLocation: string | null
): string | null {
  if (!eventDate && !eventLocation) return null;
  const datePart = eventDate ? `il ${formatFullDate(new Date(eventDate))}` : null;
  const locationPart = eventLocation ? `presso ${eventLocation}` : null;
  return [datePart, locationPart].filter(Boolean).join(" ");
}

export function computeContestPhase(config: ContestConfigLike, now: Date): ContestPhase {
  const uploadEnd = new Date(config.uploadEnd);
  const votingEnd = new Date(config.votingEnd);

  if (now < uploadEnd) {
    return { phase: "UPLOAD", endsAt: uploadEnd };
  }

  if (now < votingEnd) {
    const elapsedDays = Math.floor((now.getTime() - uploadEnd.getTime()) / MS_PER_DAY);
    const day = Math.min(elapsedDays + 1, 3) as 1 | 2 | 3;

    // tutti i temi sono votabili fin dal primo giorno della fase di voto
    const unlockedThemeSlugs = ([1, 2, 3] as const).flatMap((d) => THEME_UNLOCK_SCHEDULE[d]);

    const rawDayEnd = new Date(uploadEnd.getTime() + day * MS_PER_DAY);
    const dayEndsAt = rawDayEnd < votingEnd ? rawDayEnd : votingEnd;

    return { phase: "VOTING", day, dayEndsAt, votingEndsAt: votingEnd, unlockedThemeSlugs };
  }

  return {
    phase: "CLOSED",
    eventDate: config.eventDate ? new Date(config.eventDate) : null,
    eventLocation: config.eventLocation,
  };
}
