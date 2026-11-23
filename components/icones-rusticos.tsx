// Hand-drawn style line icons for the material highlights (user 2026-11-23:
// "logos em cada frase… algo rústico"). Stroke = currentColor, 48x48 box.
// Shown inside `SeloRustico`, a stitched leather-patch ring.

type P = { className?: string };

const base = {
  viewBox: "0 0 48 48",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
};

/** Anchor with rope wrapped around the shank — nautical rope, sea air. */
export function AncoraCorda({ className }: P) {
  return (
    <svg {...base} className={className}>
      <circle cx="24" cy="8.5" r="3.4" />
      <path d="M24 12 V40.5" />
      <path d="M15.5 17.5 Q24 16.6 32.5 17.6" />
      <path d="M9.5 29.5 Q11.5 40.8 24 40.6 Q36.4 40.8 38.6 29.4" />
      <path d="M9.5 29.5 l-1.6 4.1 M9.5 29.5 l4 1.9" />
      <path d="M38.6 29.4 l1.7 4.1 M38.6 29.4 l-4 1.9" />
      {/* rope twisted around the shank */}
      <path d="M19.6 21.2 C28.6 21.6 28.4 24.6 19.8 25.4 C28.6 25.8 28.4 28.8 19.8 29.6 C26.5 30 27.6 32 23.2 33.6" strokeWidth="1.5" />
      <path d="M23.2 33.6 C20.2 35 18.6 37.2 19.4 39.4" strokeWidth="1.3" />
    </svg>
  );
}

/** Folding beach chair, side view, on the sand — light aluminum frame. */
export function CadeiraDobravel({ className }: P) {
  return (
    <svg {...base} className={className}>
      <path d="M12.6 7.4 L19 31" />
      <path d="M19 31 L37 28.6" />
      <path d="M15.8 19 Q25 18.6 33.4 19.8 L35.4 28.8" />
      <path d="M19 31 L13.6 41.6 M33.2 29.1 L38.6 41.6" />
      <path d="M22.6 30.5 L35.4 41.4" strokeWidth="1.4" />
      {/* webbing on backrest and seat */}
      <path d="M13.6 11.2 l3.2 -0.7 M14.6 15 l3.1 -0.6 M16.6 22.6 l3.1 -0.6 M17.6 26.4 l3.1 -0.6" strokeWidth="1.3" />
      <path d="M24.2 30.3 l-0.5 -2.6 M29 29.6 l-0.5 -2.5 M33.6 29 l-0.5 -2.4" strokeWidth="1.3" />
      {/* sand */}
      <path d="M5.5 42.8 Q14 41.2 23 42.6 T42.5 42.4" strokeWidth="1.4" />
    </svg>
  );
}

// Over-under weave: 3 rows x 4 columns; at each crossing the strand that goes
// under is broken around it, alternating like a real basket weave.
const LIN = [14, 22, 30];
const COL = [10, 17, 24, 31];
const FOLGA = 2.6;
function trecho(de: number, ate: number, cortes: number[]) {
  const partes: [number, number][] = [];
  let a = de;
  for (const c of cortes) {
    if (c - FOLGA > a) partes.push([a, c - FOLGA]);
    a = c + FOLGA;
  }
  if (ate > a) partes.push([a, ate]);
  return partes;
}
const TRAMA = [
  ...LIN.flatMap((y, r) =>
    trecho(6, 35, COL.filter((_, c) => (r + c) % 2 === 1)).map(([a, b]) => `M${a} ${y} H${b}`)
  ),
  ...COL.flatMap((x, c) =>
    trecho(8, 36, LIN.filter((_, r) => (r + c) % 2 === 0)).map(([a, b]) => `M${x} ${a} V${b}`)
  ),
].join(" ");

/** A patch of over-under weave with a needle and a loose thread — woven by hand. */
export function TramaAgulha({ className }: P) {
  return (
    <svg {...base} className={className}>
      <path d={TRAMA} />
      {/* needle + thread */}
      <path d="M28 41 L42.5 26.5" strokeWidth="2.1" />
      <ellipse cx="41.2" cy="27.8" rx="1.1" ry="2.1" transform="rotate(45 41.2 27.8)" strokeWidth="1.2" />
      <path d="M41.2 27.8 C46 33 43 42 35.5 41.5 C31 41.2 30.6 37.4 33.4 36.2" strokeWidth="1.4" />
    </svg>
  );
}

export const ICONES_MATERIAL = [AncoraCorda, CadeiraDobravel, TramaAgulha];

/** Stitched round patch the rustic icons sit in. */
export function SeloRustico({ children, grande = false }: { children: React.ReactNode; grande?: boolean }) {
  return (
    <span
      className={`relative flex shrink-0 items-center justify-center rounded-full border border-line bg-paper text-wood ${
        grande ? "h-20 w-20" : "h-12 w-12"
      }`}
    >
      <span className={`absolute rounded-full border border-dashed border-wood/45 ${grande ? "inset-1.5" : "inset-1"}`} />
      {children}
    </span>
  );
}
