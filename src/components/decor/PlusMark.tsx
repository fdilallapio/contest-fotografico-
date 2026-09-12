/**
 * Segno "+" decorativo costruito con due barre centrate — nessuna immagine,
 * si adatta a qualunque dimensione passata via className (classi w- e h-).
 */
export function PlusMark({ colorClassName, className = "" }: { colorClassName: string; className?: string }) {
  return (
    <div aria-hidden className={`pointer-events-none absolute ${className}`}>
      <div className={`absolute left-1/2 top-0 h-full w-[26%] -translate-x-1/2 rounded-full ${colorClassName}`} />
      <div className={`absolute left-0 top-1/2 h-[26%] w-full -translate-y-1/2 rounded-full ${colorClassName}`} />
    </div>
  );
}

const SIZE = "h-16 w-16 sm:h-24 sm:w-24 lg:h-32 lg:w-32";

/**
 * Le 4 croci d'angolo con la disposizione di brand: arancione in alto a
 * sinistra, azzurro in alto a destra, rosso in basso a sinistra, verde in
 * basso a destra. Va usato dentro un contenitore `relative overflow-hidden`,
 * con il contenuto della sezione in `relative z-10` sopra di esso.
 */
export function CornerCrosses() {
  return (
    <>
      <PlusMark
        colorClassName="bg-accent-orange/80"
        className={`-top-8 -left-8 sm:-top-12 sm:-left-12 lg:-top-16 lg:-left-16 ${SIZE}`}
      />
      <PlusMark
        colorClassName="bg-accent-blue/80"
        className={`-top-8 -right-8 sm:-top-12 sm:-right-12 lg:-top-16 lg:-right-16 ${SIZE}`}
      />
      <PlusMark
        colorClassName="bg-primary/80"
        className={`-bottom-8 -left-8 sm:-bottom-12 sm:-left-12 lg:-bottom-16 lg:-left-16 ${SIZE}`}
      />
      <PlusMark
        colorClassName="bg-accent-green/80"
        className={`-bottom-8 -right-8 sm:-bottom-12 sm:-right-12 lg:-bottom-16 lg:-right-16 ${SIZE}`}
      />
    </>
  );
}
