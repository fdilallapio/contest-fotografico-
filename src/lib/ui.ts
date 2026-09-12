/** Stile condiviso per i bottoni primari (CTA): pillola rossa, testo bianco in grassetto. */
export const PRIMARY_BUTTON =
  "inline-flex items-center justify-center rounded-full bg-primary px-6 py-3 font-bold text-white shadow-sm transition hover:bg-primary-dark hover:shadow disabled:opacity-50 disabled:hover:bg-primary";

/** Variante secondaria: contorno, per azioni meno prioritarie. */
export const SECONDARY_BUTTON =
  "inline-flex items-center justify-center rounded-full border-2 border-primary px-6 py-3 font-bold text-primary transition hover:bg-primary-soft disabled:opacity-50";

/** Stile condiviso per gli input di testo dei form. */
export const INPUT_CLASS =
  "w-full rounded-xl border border-input-border bg-input-bg px-3 py-2 text-foreground placeholder:text-muted outline-none transition focus:border-primary focus:bg-white";
