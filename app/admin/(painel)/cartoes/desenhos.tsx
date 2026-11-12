import type { CSSProperties, PointerEvent as PE, ReactNode } from "react";
import type { DesenhoId } from "@/lib/cartoes-modelo";

// Line-art drawings for the cards (2026-11-12, "Desenhos": Natal, Ano Novo,
// praia). Drawn by hand in a 48 × 48 box, stroke = currentColor, so they
// print in the card's ink (black on kraft) as vectors — no pictures, no
// innerHTML. Every one is left-right symmetric enough to look right mirrored.

const r1 = (n: number) => Math.round(n * 100) / 100;
const polar = (cx: number, cy: number, r: number, graus: number) => {
  const a = (graus * Math.PI) / 180;
  return [r1(cx + r * Math.cos(a)), r1(cy + r * Math.sin(a))] as const;
};

function estrela(cx: number, cy: number, R: number, r: number) {
  const p = Array.from({ length: 10 }, (_, i) => polar(cx, cy, i % 2 ? r : R, -90 + i * 36).join(" "));
  return `M${p.join(" L")} Z`;
}

/** four-pointed sparkle */
const brilho = (x: number, y: number, r: number) => `M${x} ${y - r} Q${x} ${y} ${x + r} ${y} Q${x} ${y} ${x} ${y + r} Q${x} ${y} ${x - r} ${y} Q${x} ${y} ${x} ${y - r} Z`;

const floco = (() => {
  let d = "";
  for (let i = 0; i < 6; i++) {
    const g = -90 + i * 60;
    const [x, y] = polar(24, 24, 19, g);
    d += `M24 24 L${x} ${y} `;
    for (const [dist, perna] of [
      [9, 5],
      [14.5, 3.5],
    ]) {
      const [bx, by] = polar(24, 24, dist, g);
      const [ax, ay] = polar(bx, by, perna, g - 45);
      const [cx, cy] = polar(bx, by, perna, g + 45);
      d += `M${ax} ${ay} L${bx} ${by} L${cx} ${cy} `;
    }
  }
  return d.trim();
})();

const fogos = (() => {
  let d = "";
  for (let i = 0; i < 12; i++) {
    const g = i * 30;
    const [ax, ay] = polar(24, 19, 5, g);
    const [bx, by] = polar(24, 19, i % 2 ? 11 : 14, g);
    d += `M${ax} ${ay} L${bx} ${by} `;
  }
  for (let i = 0; i < 8; i++) {
    const g = i * 45 + 22.5;
    const [ax, ay] = polar(38, 36, 2.5, g);
    const [bx, by] = polar(38, 36, 6, g);
    d += `M${ax} ${ay} L${bx} ${by} `;
  }
  return d + "M24 46 Q22 38 24 30";
})();

const guirlanda = (() => {
  const folhas: ReactNode[] = [];
  for (let i = 0; i < 14; i++) {
    const g = i * (360 / 14);
    if (g > 70 && g < 110) continue; // the bow sits at the bottom
    const [x, y] = polar(24, 23, 15, g);
    folhas.push(<ellipse key={i} cx={x} cy={y} rx={4.6} ry={2} transform={`rotate(${r1(g + 60)} ${x} ${y})`} />);
  }
  const bagas = [200, 290, 340, 20].map((g, i) => {
    const [x, y] = polar(24, 23, 11, g);
    return <circle key={"b" + i} cx={x} cy={y} r={1.3} fill="currentColor" stroke="none" />;
  });
  return (
    <>
      {folhas}
      {bagas}
      <path d="M24 38 C20 33 14 34 15 38 C16 41 20 40 24 38 Z M24 38 C28 33 34 34 33 38 C32 41 28 40 24 38 Z M23 39 L19 46 M25 39 L29 46" />
    </>
  );
})();

/** one champagne flute, upright, base at (x, 40) */
const taca = (x: number) => (
  <>
    <path d={`M${x - 4} 9 H${x + 4} L${x + 3.4} 24 C${x + 3.2} 27 ${x + 1.5} 28.5 ${x} 28.5 C${x - 1.5} 28.5 ${x - 3.2} 27 ${x - 3.4} 24 Z`} />
    <path d={`M${x - 3.7} 15 H${x + 3.7} M${x} 28.5 V40 M${x - 4.5} 40 H${x + 4.5}`} />
    <circle cx={x - 1} cy={20} r={0.7} fill="currentColor" stroke="none" />
    <circle cx={x + 1.2} cy={23} r={0.6} fill="currentColor" stroke="none" />
  </>
);

const relogioMarcas = Array.from({ length: 12 }, (_, i) => {
  const [ax, ay] = polar(24, 27, i % 3 ? 13.5 : 12, i * 30);
  const [bx, by] = polar(24, 27, 15, i * 30);
  return `M${ax} ${ay} L${bx} ${by}`;
}).join(" ");

const conchaRaios = [222, 238, 254, 270, 286, 302, 318]
  .map((g) => {
    // each rib stops inside the shell outline
    const [x, y] = polar(24, 40, g === 222 || g === 318 ? 19 : 25, g);
    return `M24 40 L${x} ${y}`;
  })
  .join(" ");

const ARTE: Record<DesenhoId, ReactNode> = {
  arvore: (
    <>
      <path d="M24 9 L32.5 19 H28 L36.5 29.5 H31 L40.5 40 H7.5 L17 29.5 H11.5 L20 19 H15.5 Z" />
      <path d="M21.5 40 V45 H26.5 V40" />
      <path d={estrela(24, 5.2, 3.6, 1.6)} fill="currentColor" strokeWidth={0.8} />
      <circle cx={21} cy={25} r={1.2} fill="currentColor" stroke="none" />
      <circle cx={28} cy={33} r={1.2} fill="currentColor" stroke="none" />
      <circle cx={18} cy={35.5} r={1.2} fill="currentColor" stroke="none" />
      <circle cx={26.5} cy={17} r={1.1} fill="currentColor" stroke="none" />
    </>
  ),
  estrela: <path d={estrela(24, 25.5, 20, 8.5)} />,
  sino: (
    <>
      <path d="M9.5 36 C13.5 32.5 14.5 28 14.5 21.5 C14.5 14.5 18.5 10.5 24 10.5 C29.5 10.5 33.5 14.5 33.5 21.5 C33.5 28 34.5 32.5 38.5 36 Z" />
      <circle cx={24} cy={40} r={3} />
      <circle cx={24} cy={7.5} r={2.6} />
      <path d="M16 27 Q24 30 32 27" />
    </>
  ),
  bola: (
    <>
      <circle cx={24} cy={29} r={14} />
      <path d="M20 15.8 V11.5 H28 V15.8" />
      <circle cx={24} cy={8} r={2.6} />
      <path d="M10.6 25 Q24 29.5 37.4 25 M10.6 33 Q24 37.5 37.4 33" />
      <path d="M14 29.5 L17 31.5 L20 29.5 L23 31.5 L26 29.5 L29 31.5 L32 29.5 L34.5 31" strokeWidth={1.2} />
    </>
  ),
  laco: (
    <>
      <path d="M24 21 C18 12 7.5 12 8.5 20 C9.5 27 18 26 24 21 Z M24 21 C30 12 40.5 12 39.5 20 C38.5 27 30 26 24 21 Z" />
      <path d="M22 23 L15.5 37 L19 36 L20 39.5 L24.5 24 M26 23 L32.5 37 L29 36 L28 39.5 L23.5 24" />
      <circle cx={24} cy={21.5} r={2.8} fill="currentColor" strokeWidth={0.8} />
    </>
  ),
  floco: <path d={floco} />,
  presente: (
    <>
      <path d="M9.5 22 H38.5 V41 H9.5 Z M7 16 H41 V22 H7 Z M24 16 V41" />
      <path d="M24 16 C20 8.5 12.5 9.5 14.5 13.5 C15.5 15.5 19 16 24 16 C29 16 32.5 15.5 33.5 13.5 C35.5 9.5 28 8.5 24 16" />
    </>
  ),
  guirlanda,
  gorro: (
    <>
      <path d="M9 34 C10.5 22 17 11.5 29 11 C36 10.7 39.5 16 40 23" />
      <path d="M34.5 34 C33.5 27 33.5 21 35.5 16.5" />
      <circle cx={40} cy={26.5} r={3.4} />
      <rect x={6} y={34} width={33} height={7} rx={3.5} />
    </>
  ),
  tacas: (
    <>
      <g transform="rotate(12 13 40)">{taca(13)}</g>
      <g transform="rotate(-12 35 40)">{taca(35)}</g>
      <path d="M24 2.5 V6 M19 4 L20.6 6.6 M29 4 L27.4 6.6" />
    </>
  ),
  fogos: <path d={fogos} />,
  relogio: (
    <>
      <circle cx={24} cy={27} r={17} />
      <path d={relogioMarcas} strokeWidth={1.3} />
      <path d="M24 27 V14.5 M24 27 V18" strokeWidth={2.4} />
      <circle cx={24} cy={27} r={1.4} fill="currentColor" stroke="none" />
      <path d="M21 6.5 H27 M24 6.5 V10" />
    </>
  ),
  estrelinhas: (
    <>
      <path d={brilho(18, 22, 11)} />
      <path d={brilho(36, 11, 6)} />
      <path d={brilho(35, 36, 4.5)} />
      <circle cx={9} cy={39} r={1.2} fill="currentColor" stroke="none" />
      <circle cx={40} cy={24} r={1} fill="currentColor" stroke="none" />
    </>
  ),
  concha: (
    <>
      <path d="M24 40 C14 40 6 31 6.5 21 C7 13 15 7.5 24 7.5 C33 7.5 41 13 41.5 21 C42 31 34 40 24 40 Z" />
      <path d={conchaRaios} strokeWidth={1.3} />
      <path d="M19 40 L20.5 44.5 H27.5 L29 40" />
    </>
  ),
  "estrela-do-mar": (
    <>
      <path d={estrela(24, 25.5, 20, 9)} />
      {[0, 72, 144, 216, 288].flatMap((g) =>
        [6.5, 11.5].map((d) => {
          const [x, y] = polar(24, 25.5, d, g - 90);
          return <circle key={`${g}-${d}`} cx={x} cy={y} r={1} fill="currentColor" stroke="none" />;
        }),
      )}
    </>
  ),
  onda: (
    <path d="M4 31 C10 31 12 23 18 19 C24 15 32 16.5 33 22.5 C34 27 28.5 29 26.5 25.5 M4 37 C9 34.5 13 37.5 19 35.5 C25 33.5 29 36.5 35 34.5 C39 33.2 42 34.5 44 35.5 M8 43 C13 41 17 43.5 23 42 C29 40.5 33 43 40 41.5" />
  ),
  coracao: <path d="M24 41 C14 34 6 27 6 18.5 C6 12.5 10.5 8.5 15.5 8.5 C19.5 8.5 22.5 11 24 14.5 C25.5 11 28.5 8.5 32.5 8.5 C37.5 8.5 42 12.5 42 18.5 C42 27 34 34 24 41 Z" />,
  gaivota: (
    <path d="M5 27 C10 20 16 19.5 22 27 C28 19.5 34 20 39 27 M27 14 C29.5 10.5 32 10.5 34.5 14 C37 10.5 39.5 10.5 42 14 M9 39 C11 36.5 13 36.5 15 39 C17 36.5 19 36.5 21 39" />
  ),
};

export function DesenhoSvg({
  id,
  style,
  espelhar = false,
  onPointerDown,
}: {
  id: DesenhoId;
  style?: CSSProperties;
  espelhar?: boolean;
  onPointerDown?: (e: PE<SVGSVGElement>) => void;
}) {
  return (
    <svg
      onPointerDown={onPointerDown}
      viewBox="0 0 48 48"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ display: "block", overflow: "visible", ...style }}
      aria-hidden
    >
      <g transform={espelhar ? "translate(48 0) scale(-1 1)" : undefined}>{ARTE[id]}</g>
    </svg>
  );
}
