// Side illustrations for "A linha que sustenta cada peça" (user 2026-11-23: a
// spool of coloured cord on the left and crochet hooks on the right). The
// reference pictures the user sent were shop product photos (Mercado Livre
// listing, a branded hook set), so these are our own drawings in the same
// spirit — no third-party photo on the site. Transparent background, raw hex
// colours on purpose (product colours, like WeavePattern). `ids` must differ per
// copy on a page: a gradient defined inside a hidden (display:none) copy renders as nothing.

const LINHAS_FUNDO = [
  { x: 150, cor: "#2f5bb7", escuro: "#21437f" },
  { x: 188, cor: "#c23a48", escuro: "#8a2632" },
  { x: 226, cor: "#e58fb1", escuro: "#b8677f" },
];

function Carretel({ x, y, l, a, cor, escuro, id }: { x: number; y: number; l: number; a: number; cor: string; escuro: string; id: string }) {
  const rx = l / 2 + 6;
  const ry = l * 0.17;
  const cx = x + l / 2;
  const voltas = Math.floor(a / 6);
  return (
    <g>
      <defs>
        <linearGradient id={id} x1="0" x2="1">
          <stop offset="0" stopColor={escuro} />
          <stop offset="0.38" stopColor={cor} />
          <stop offset="0.55" stopColor={cor} />
          <stop offset="1" stopColor={escuro} />
        </linearGradient>
      </defs>
      {/* bottom flange */}
      <ellipse cx={cx} cy={y + a} rx={rx} ry={ry} fill="#2b2622" />
      {/* wound cord */}
      <rect x={x} y={y} width={l} height={a} fill={`url(#${id})`} />
      <ellipse cx={cx} cy={y + a} rx={l / 2} ry={ry * 0.8} fill={`url(#${id})`} />
      {Array.from({ length: voltas }, (_, i) => (
        <path
          key={i}
          d={`M ${x} ${y + 4 + i * 6} Q ${cx} ${y + 4 + i * 6 + ry * 0.55} ${x + l} ${y + 4 + i * 6}`}
          fill="none"
          stroke={escuro}
          strokeOpacity="0.45"
          strokeWidth="1.3"
        />
      ))}
      {/* top flange */}
      <ellipse cx={cx} cy={y} rx={rx} ry={ry} fill="#3a332d" />
      <ellipse cx={cx} cy={y} rx={rx - 3} ry={ry - 2.5} fill="#241f1b" />
      <ellipse cx={cx} cy={y} rx={l * 0.12} ry={ry * 0.32} fill="#0f0d0b" />
    </g>
  );
}

/** A big green spool of braided cord with three smaller colour spools behind it. */
export function IlustracaoLinha({ className = "", ids = "linha" }: { className?: string; ids?: string }) {
  return (
    <svg viewBox="0 0 280 300" className={className} role="img" aria-label="Carretéis de corda náutica colorida">
      {LINHAS_FUNDO.map((c, i) => (
        <Carretel key={c.cor} id={`${ids}-fundo-${i}`} x={c.x} y={86 + i * 10} l={40} a={150 - i * 10} cor={c.cor} escuro={c.escuro} />
      ))}
      <Carretel id={`${ids}-principal`} x={34} y={52} l={132} a={206} cor="#7dba3a" escuro="#4c7d1f" />
      {/* loose end of the cord */}
      <path d="M 166 236 C 196 238 206 262 188 274 C 172 284 160 276 168 266" fill="none" stroke="#5f9a2a" strokeWidth="5" strokeLinecap="round" />
      <path d="M 166 236 C 196 238 206 262 188 274 C 172 284 160 276 168 266" fill="none" stroke="#9fd25a" strokeWidth="1.6" strokeLinecap="round" strokeDasharray="3 4" />
    </svg>
  );
}

const CORES_AGULHAS = ["#9cc84b", "#f2c64a", "#f07b2c", "#e04848", "#ee8fb8", "#8e5cc4", "#36b1c9", "#3a7fd6", "#1fa774", "#7a4a2e"];

/** A fan of crochet hooks with soft coloured handles and aluminium shafts. */
export function IlustracaoAgulhas({ className = "", ids = "agulha" }: { className?: string; ids?: string }) {
  const n = CORES_AGULHAS.length;
  return (
    <svg viewBox="-75 -10 450 300" className={className} role="img" aria-label="Agulhas de crochê coloridas">
      <defs>
        <linearGradient id={`${ids}-metal`} x1="0" x2="1">
          <stop offset="0" stopColor="#8d959e" />
          <stop offset="0.45" stopColor="#e9edf1" />
          <stop offset="1" stopColor="#9aa2ab" />
        </linearGradient>
        <linearGradient id={`${ids}-brilho`} x1="0" x2="1">
          <stop offset="0" stopColor="#000" stopOpacity="0.18" />
          <stop offset="0.35" stopColor="#fff" stopOpacity="0.28" />
          <stop offset="0.6" stopColor="#fff" stopOpacity="0" />
          <stop offset="1" stopColor="#000" stopOpacity="0.15" />
        </linearGradient>
      </defs>
      {CORES_AGULHAS.map((cor, i) => {
        const angulo = -48 + (i * 96) / (n - 1);
        return (
          <g key={cor} transform={`rotate(${angulo} 150 300)`}>
            {/* handle: rounded, wider in the middle, flat thumb rest */}
            <path d="M 150 22 C 158 22 160 30 160 40 L 161 118 C 161 134 156 142 153 150 L 147 150 C 144 142 139 134 139 118 L 140 40 C 140 30 142 22 150 22 Z" fill={cor} />
            <path d="M 150 22 C 158 22 160 30 160 40 L 161 118 C 161 134 156 142 153 150 L 147 150 C 144 142 139 134 139 118 L 140 40 C 140 30 142 22 150 22 Z" fill={`url(#${ids}-brilho)`} />
            <circle cx="150" cy="36" r="1.4" fill="#000" opacity="0.35" />
            {/* aluminium shaft with the hook at the end */}
            <rect x="148" y="148" width="4" height="62" rx="1.5" fill={`url(#${ids}-metal)`} />
            <path d="M 148 208 L 148 216 Q 148 220 151.5 219.5 Q 154 219 153.5 215 L 151.6 215 L 152 211 L 152 208 Z" fill="#9aa2ab" />
          </g>
        );
      })}
    </svg>
  );
}
