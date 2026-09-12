export default function ClosedPhaseView({
  eventDate,
  eventLocation,
}: {
  eventDate: Date | null;
  eventLocation: string | null;
}) {
  const formattedDate = eventDate
    ? eventDate.toLocaleDateString("it-IT", { weekday: "long", day: "numeric", month: "long", year: "numeric" })
    : null;
  const formattedTime = eventDate
    ? eventDate.toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" })
    : null;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 text-center text-foreground">
      <p className="text-sm font-semibold uppercase tracking-widest text-muted">Votazione conclusa</p>
      <h1 className="mt-4 text-3xl font-extrabold text-primary sm:text-5xl">Grazie a tutti i partecipanti</h1>
      <p className="mx-auto mt-4 max-w-xl text-foreground/80">
        La raccolta dei voti è terminata. I vincitori saranno annunciati durante l&apos;evento di premiazione.
      </p>

      {(formattedDate || eventLocation) && (
        <div className="mt-10 rounded-2xl bg-card px-8 py-6 shadow-md">
          <p className="text-xs font-bold uppercase tracking-widest text-primary">Presentazione dei vincitori</p>
          {formattedDate && (
            <p className="mt-2 text-lg font-bold text-foreground">
              {formattedDate} {formattedTime && `· ore ${formattedTime}`}
            </p>
          )}
          {eventLocation && <p className="mt-1 text-muted">{eventLocation}</p>}
        </div>
      )}

      {!formattedDate && !eventLocation && (
        <p className="mt-10 text-sm text-muted">Data e luogo della premiazione saranno comunicati a breve.</p>
      )}
    </div>
  );
}
