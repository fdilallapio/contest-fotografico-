import { prisma } from "@/lib/prisma";
import { formatWinnersAnnouncement } from "@/lib/contest-phase";
import HomePhaseBanner from "@/components/HomePhaseBanner";
import { CornerCrosses } from "@/components/decor/PlusMark";
import { FacebookIcon, InstagramIcon } from "@/components/icons/SocialIcons";
import { SOCIAL_LINKS } from "@/lib/social";

export const dynamic = "force-dynamic";

const STEPS = [
  {
    n: "1",
    title: "Partecipa",
    body: "Carica fino a 2 foto per ciascuno dei 6 temi, con una breve descrizione (luogo, data, significato, altro).",
  },
  {
    n: "2",
    title: "Vota",
    body: "Per 4 giorni (17-20 settembre) si vota online tramite sito. Per 3 giorni (18-20 settembre) si vota anche in Piazza Duomo (Melfi), dove saranno stampate ed esposte tutte le foto dei partecipanti durante i tre giorni di ComUnità. Vengono poi sommati sia i voti online che quelli di piazza.",
  },
  {
    n: "3",
    title: "Premiazione",
    body: "I vincitori di ogni tema verranno annunciati in Piazza Duomo (Melfi) durante l'ultimo giorno di ComUnità (20 settembre). Il vincitore assoluto sarà premiato sul palco.",
  },
];

const THEME_CARD_ACCENT = ["border-t-accent-orange", "border-t-accent-blue", "border-t-accent-green"];

export default async function HomePage() {
  const [config, themes] = await Promise.all([
    prisma.contestConfig.findFirst(),
    prisma.theme.findMany({ select: { slug: true, name: true }, orderBy: { order: "asc" } }),
  ]);

  if (!config) {
    return (
      <div className="flex min-h-screen items-center justify-center text-muted">
        Contest non ancora configurato.
      </div>
    );
  }

  const configLike = {
    uploadStart: config.uploadStart.toISOString(),
    uploadEnd: config.uploadEnd.toISOString(),
    votingEnd: config.votingEnd.toISOString(),
    eventDate: config.eventDate ? config.eventDate.toISOString() : null,
    eventLocation: config.eventLocation,
  };

  const winnersAnnouncement = formatWinnersAnnouncement(config.eventDate, config.eventLocation);

  return (
    <div className="pb-24 text-foreground">
      <section className="relative overflow-hidden px-4 py-20 text-center sm:py-28">
        <CornerCrosses />
        <div className="relative z-10">
          <p className="text-sm font-semibold uppercase tracking-widest text-muted">Contest Fotografico</p>
          <h1 className="mx-auto mt-4 max-w-2xl text-4xl font-extrabold text-primary sm:text-6xl">
            Ma&apos; ndo vajë? Fermati e scatta.
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-base text-foreground/80 sm:text-lg">
            Andare via, restare o tornare? Durante ComUnità parleremo con voi di Sanità, Urbanistica,
            Agricoltura, Sport, Lavoro e Rigenerazione Urbana. Partecipa al contest con i tuoi scatti
            inerenti questi temi.
          </p>

          <HomePhaseBanner config={configLike} />
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-20 sm:px-6">
        <h2 className="text-center text-2xl font-extrabold text-primary sm:text-3xl">Come funziona</h2>
        <div className="mt-12 grid gap-10 sm:grid-cols-3">
          {STEPS.map((step) => (
            <div key={step.n} className="text-center">
              <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary text-lg font-extrabold text-white">
                {step.n}
              </span>
              <h3 className="mt-4 text-lg font-bold text-foreground">{step.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">{step.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="relative overflow-hidden px-4 py-20 sm:px-6">
        <div className="relative z-10 mx-auto max-w-4xl">
          <h2 className="text-center text-2xl font-extrabold text-primary sm:text-3xl">I temi del contest</h2>
          <p className="mx-auto mt-3 max-w-xl text-center text-sm text-muted">
            Sei temi per raccontare il territorio.
            {winnersAnnouncement && <> I vincitori vengono annunciati insieme {winnersAnnouncement}.</>}
          </p>

          <div className="mt-12 grid gap-4 sm:grid-cols-3">
            {themes.map((theme, i) => (
              <div
                key={theme.slug}
                className={`rounded-2xl border-t-4 bg-card p-6 text-center shadow-md ${THEME_CARD_ACCENT[i % 3]}`}
              >
                <p className="font-bold text-foreground">{theme.name}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-border px-4 py-10 text-center sm:px-6">
        <p className="text-sm font-semibold uppercase tracking-widest text-muted">Seguici</p>
        <div className="mt-4 flex justify-center gap-6">
          <a
            href={SOCIAL_LINKS.facebook}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 font-semibold text-primary underline underline-offset-2"
          >
            <FacebookIcon />
            Facebook
          </a>
          <a
            href={SOCIAL_LINKS.instagram}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 font-semibold text-primary underline underline-offset-2"
          >
            <InstagramIcon />
            Instagram
          </a>
        </div>
      </section>
    </div>
  );
}
