import { FacebookIcon, InstagramIcon } from "@/components/icons/SocialIcons";
import { SOCIAL_LINKS } from "@/lib/social";

const HISTORY_PHOTOS = [
  { id: 1, src: "/festa-unita-1.jpg", caption: "Le edizioni degli anni '70-'80" },
  { id: 2, src: "/festa-unita-2.jpg", caption: "ComUnità a Melfi, oggi" },
  { id: 3, src: "/festa-unita-3.jpg", caption: "ComUnità a Melfi, oggi" },
];

export default function InfoEContattiPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 text-foreground sm:px-6 sm:py-20">
      <p className="text-sm font-semibold uppercase tracking-widest text-muted">Info e contatti</p>

      <section className="mt-8 space-y-4">
        <h2 className="text-lg font-bold text-primary">La Festa dell&apos;Unità</h2>
        <p className="text-sm leading-relaxed text-foreground/80">
          La Festa dell&apos;Unità nasce nel 1945 a Mantova, per iniziativa del Partito Comunista Italiano,
          come momento di incontro popolare e di sostegno al quotidiano <em>l&apos;Unità</em>, fondato da
          Antonio Gramsci nel 1924. Nei decenni successivi diventa uno degli appuntamenti collettivi più
          partecipati d&apos;Italia: musica, dibattiti, stand gastronomici e attività per famiglie animano
          piazze e parchi in tutto il Paese ogni estate. Dopo le trasformazioni politiche degli anni &apos;90,
          la tradizione è proseguita nelle diverse edizioni locali organizzate in tante città e paesi
          italiani, mantenendo lo spirito originario di festa popolare, confronto e comunità. ComUnità
          raccoglie questa eredità a Melfi, unendo cultura, partecipazione civica e — quest&apos;anno — un
          contest fotografico dedicato al territorio.
        </p>

        <div className="grid gap-3 sm:grid-cols-3">
          {HISTORY_PHOTOS.map((photo) => (
            <div key={photo.id} className="space-y-1.5">
              <div className="aspect-[4/3] overflow-hidden rounded-xl bg-input-bg">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={photo.src} alt={photo.caption} className="h-full w-full object-cover" />
              </div>
              <p className="text-xs text-muted">{photo.caption}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-14 space-y-4">
        <h2 className="text-lg font-bold text-foreground">Il regolamento in breve</h2>
        <ul className="space-y-2 text-sm leading-relaxed text-foreground/80">
          <li>· 6 temi in gara: Sanità, Urbanistica, Agricoltura, Sport, Lavoro, Rigenerazione Urbana.</li>
          <li>· Fino a 2 foto per tema, con una breve descrizione per ciascuna (luogo, data, significato, altro).</li>
          <li>· Formati accettati: JPEG, PNG, WEBP, HEIC.</li>
          <li>· La votazione online è pubblica e libera su tutti i temi: non è richiesta registrazione.</li>
          <li>· Si vota anche in piazza, oltre che online.</li>
          <li>
            · Vincono tutti: ogni foto candidata viene stampata ed esposta in Piazza Duomo (Melfi) come
            installazione permanente.
          </li>
        </ul>
      </section>

      <section className="mt-14 space-y-4">
        <h2 className="text-lg font-bold text-foreground">Come partecipare</h2>
        <p className="text-sm leading-relaxed text-foreground/80">
          Vai alla pagina{" "}
          <a href="/candidati" className="font-semibold text-primary underline underline-offset-2">
            Candidati
          </a>
          , compila i tuoi dati e carica le tue foto sui temi che preferisci prima della chiusura delle
          candidature. Riceverai un&apos;email di conferma con il riepilogo di quanto inviato.
        </p>
      </section>

      <section className="mt-14 space-y-4">
        <h2 className="text-lg font-bold text-foreground">Privacy e trattamento dati</h2>
        <p className="text-sm leading-relaxed text-foreground/80">
          I dati anagrafici raccolti in fase di candidatura sono trattati esclusivamente per la gestione del
          contest, nel rispetto del GDPR. Il voto pubblico non richiede alcun dato personale.
        </p>
      </section>

      <section className="mt-14 space-y-4 border-t border-border pt-8">
        <h2 className="text-lg font-bold text-primary">Contatti e social</h2>
        <p className="text-sm text-foreground/80">Per domande sul contest contattaci sui nostri social.</p>
        <div className="flex gap-5">
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
