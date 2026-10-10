import type { Categoria } from "./formas-categorias";
import { figura, meio, mod, type Teste } from "./formas-extras-2";

// Egyptian, baroque and indigenous-inspired shapes for the boho tab
// (2026-10-10, user: "formas meio egípcias, meio barroco, meio indígena... 10 de
// cada"). Figures are drawn cell by cell; all-over patterns tile from the panel
// center. Reviewed on thumbnail sheets before shipping.

const lista: { valor: string; rotulo: string; teste: Teste }[] = [];
const add = (valor: string, rotulo: string, teste: Teste) => lista.push({ valor, rotulo, teste });
const cx = (i: number, cols: number) => i - meio(cols);
const cy = (j: number, rows: number) => j - meio(rows);
/** Tiles a sprite in px×py cells over the whole panel (odd rows shifted by half), edges may cut it. */
const ladrilho = (d: string[], px: number, py: number): Teste => (i, j, cols, rows) => {
  const h = d.length;
  const w = d[0].length;
  const y = cy(j, rows) + Math.floor(h / 2);
  const linha = Math.floor(y / py);
  const x = cx(i, cols) + Math.floor(w / 2) + (mod(linha, 2) ? Math.floor(px / 2) : 0);
  const sx = mod(x, px);
  const sy = mod(y, py);
  return sy < h && sx < w && d[sy][sx] === "X";
};
const cel = (v: number, p: number) => {
  const h = Math.floor(p / 2);
  return { d: mod(v + h, p) - h, n: Math.floor((v + h) / p) };
};

// ===================== Egípcios =====================
add("egito-olho-de-horus", "Olho de Hórus", figura([
  "..XXXXXXXXXXX..",
  "...............",
  "...XXXXXXXXX...",
  "..XX..XXX..XX..",
  "XXX..XXXXX..XXX",
  "..XX..XXX..XX..",
  "...XXXXXXXXX...",
  "......X..X.....",
  ".....X....X....",
  "....X......XX..",
  "...X.........X.",
  "....XX.....XX..",
]));
add("egito-ankh", "Ankh", figura([
  "...XXXXX...",
  "..XX...XX..",
  "..X.....X..",
  "..XX...XX..",
  "...XX.XX...",
  "XXXXXXXXXXX",
  "XXXXXXXXXXX",
  "....XXX....",
  "....XXX....",
  "....XXX....",
  "....XXX....",
  "....XXX....",
]));
add("egito-escaravelho", "Escaravelho", figura([
  "X.....XXX.....X",
  ".X...XXXXX...X.",
  "..X..XXXXX..X..",
  "XX.XXXXXXXXX.XX",
  "XXXXXXXXXXXXXXX",
  ".XXXXXX.XXXXXX.",
  "..XXXXX.XXXXX..",
  ".XXXXXX.XXXXXX.",
  "X..XXXX.XXXX..X",
  "..X..XXXXX..X..",
  ".X....XXX....X.",
]));
add("egito-piramides", "Pirâmides do Egito", figura([
  "........X.............",
  ".......XXX............",
  "......XX.XX...........",
  ".....XX.X.XX....X.....",
  "....XX.X.X.XX..XXX....",
  "...XX.X.X.X.XXXX.XX...",
  "..XX.X.X.X.X.XX.X.XX..",
  ".XX.X.X.X.X.XXX.X.X.X.",
  "XXXXXXXXXXXXXXXXXXXXXX",
]));
add("egito-lotus", "Lótus egípcio", figura([
  "......X......",
  ".....XXX.....",
  "..X..XXX..X..",
  ".XX..XXX..XX.",
  "XXX.XXXXX.XXX",
  "XXXXXXXXXXXXX",
  ".XXXXXXXXXXX.",
  "..XXXXXXXXX..",
  "......X......",
  "......X......",
  "....XXXXX....",
]));
add("egito-papiro", "Papiro", figura([
  ".X..X..X..X.",
  "..X.X..X.X..",
  "...XXXXXX...",
  "....XXXX....",
  ".....XX.....",
  ".....XX.....",
  ".....XX.....",
  ".....XX.....",
  ".....XX.....",
  "....XXXX....",
]));
add("egito-gato-bastet", "Gato egípcio", figura([
  "..X..X......",
  "..XXXX......",
  "..X.XX......",
  "..XXXX......",
  "...XX.......",
  "...XXX......",
  "..XXXXX.....",
  "..XXXXXX....",
  ".XXXXXXX....",
  ".XXXXXXX..X.",
  ".XXXXXXX...X",
  "XXXXXXXXXXX.",
]));
add("egito-sol-alado", "Sol alado", figura([
  "......XXXXX......",
  "XXX..XXXXXXX..XXX",
  ".XXXXXXXXXXXXXXX.",
  "..XXXXXXXXXXXXX..",
  "XXXXX.XXXXX.XXXXX",
  ".XXX...XXX...XXX.",
  "..X.....X.....X..",
]));
add("egito-farao", "Faraó", figura([
  "....XXXXX....",
  "...XXXXXXX...",
  "..XXXXXXXXX..",
  ".XX.XXXXX.XX.",
  ".XX.X.X.X.XX.",
  "XXX.XXXXX.XXX",
  "X.X.X...X.X.X",
  "XXX..XXX..XXX",
  "X.X...X...X.X",
  "XXX...X...XXX",
  "......X......",
]));
add("egito-friso", "Friso egípcio", (i, j, cols, rows) => {
  // bands of lotus buds between double lines, repeated over the panel
  const y = mod(cy(j, rows) + 4, 9);
  if (y === 0 || y === 2) return true;
  const { d: x } = cel(cx(i, cols), 6);
  const ax = Math.abs(x);
  if (y === 3) return ax === 0;
  if (y === 4) return ax <= 1;
  if (y === 5) return ax <= 2 && ax !== 1;
  if (y === 6) return ax <= 2;
  if (y === 7) return ax <= 1;
  return false;
});

// ===================== Barrocos =====================
add("barroco-flor-de-lis", "Flor-de-lis", figura([
  "......X......",
  ".....XXX.....",
  "....XXXXX....",
  "....XXXXX....",
  ".XX..XXX..XX.",
  "XXXX.XXX.XXXX",
  "X..X.XXX.X..X",
  "...X.XXX.X...",
  "XXXXXXXXXXXXX",
  "XXXXXXXXXXXXX",
  "....X.X.X....",
  "...XX.X.XX...",
  "..XX..X..XX..",
]));
add("barroco-voluta", "Voluta", figura([
  "..XXXXX......",
  ".XX...XX.....",
  "XX.XXX.XX....",
  "X.XX.X..X....",
  "X.X.XX..X....",
  "X..XX..XX....",
  "XX....XX.....",
  ".XXXXXX......",
  "......XX.....",
  ".......XX..XX",
  "........XXXX.",
]));
add("barroco-concha", "Concha rococó", figura([
  ".....XXXXX.....",
  "...XX.X.X.XX...",
  "..X.X.X.X.X.X..",
  ".X..X.X.X.X..X.",
  "X.X..X.X.X..X.X",
  "X..X.X.X.X.X..X",
  ".X..XXXXXXX..X.",
  "..X...XXX...X..",
  "XX..XX.X.XX..XX",
  ".XXX...X...XXX.",
]));
add("barroco-acanto", "Folha de acanto", figura([
  "........XX...",
  "......XX.XX..",
  ".....XXX..X..",
  "...XXXX......",
  "..XXXXX..XX..",
  ".XXXXXXXXX.X.",
  "XXX.XXXXX....",
  "XX..XXXX.XX..",
  "X..XXXXXXX.X.",
  "..XXXXXX.....",
  ".XXXX........",
  "XXX..........",
]));
add("barroco-medalhao", "Medalhão barroco", (i, j, cols, rows) => {
  const x = cx(i, cols);
  const y = cy(j, rows);
  const R = Math.min(meio(cols), meio(rows)) - 1;
  const r = Math.hypot(x, y * 1.15);
  const a = Math.atan2(y, x);
  const borda = R * (0.86 + 0.08 * Math.cos(8 * a));
  if (Math.abs(r - borda) < 0.8) return true;
  if (Math.abs(r - R * 0.62) < 0.6) return true;
  if (r < R * 0.5) return Math.cos(4 * a) * r > R * 0.18 || r < 1.5;
  return r < borda - 1 && r > R * 0.66 && mod(Math.round((a / Math.PI) * 16), 2) === 0 && Math.abs(r - R * 0.75) < 0.7;
});
add("barroco-moldura", "Moldura barroca", (i, j, cols, rows) => {
  const x = Math.abs(cx(i, cols));
  const y = Math.abs(cy(j, rows));
  const bx = meio(cols);
  const by = meio(rows);
  if (x === bx - 1 || y === by - 1) return true;
  if ((x === bx - 3 && y <= by - 3) || (y === by - 3 && x <= bx - 3)) return true;
  // corner scrolls
  const r = Math.hypot(x - (bx - 6), y - (by - 6));
  if (r > 1.5 && r <= 2.6) return true;
  // little bead at the middle of each side
  return (x <= 1 && y >= by - 3 && y <= by - 2) || (y <= 1 && x >= bx - 3 && x <= bx - 2);
});
add("barroco-damasco", "Damasco", ladrilho([
  "....X....",
  "...XXX...",
  ".X.XXX.X.",
  "XX..X..XX",
  "XXX.X.XXX",
  ".XXXXXXX.",
  "...XXX...",
  "..X.X.X..",
  ".X..X..X.",
], 12, 11));
add("barroco-arabesco", "Arabesco", (i, j, cols, rows) => {
  // ogee: two mirrored waves crossing, like baroque wallpaper
  const x = cx(i, cols);
  const y = cy(j, rows);
  const w = 2.6 * Math.sin((x * Math.PI) / 6);
  const perto = (t: number) => Math.min(mod(t, 8), 8 - mod(t, 8)) < 0.75;
  const centro = Math.abs(cel(x, 12).d) <= 1 && Math.abs(cel(y - 4, 8).d) <= 0 ;
  return perto(y + w) || perto(y - w) || centro;
});
add("barroco-filigrana", "Filigrana", (i, j, cols, rows) => {
  const { d: a, n: na } = cel(cx(i, cols), 10);
  const { d: b, n: nb } = cel(cy(j, rows), 10);
  const r = Math.hypot(a, b);
  const ang = Math.atan2(b, a);
  if (mod(na + nb, 2) === 0) return Math.abs(r - (3 + Math.cos(4 * ang))) < 0.6 || r < 1;
  return Math.abs(a) + Math.abs(b) === 4 || (Math.abs(a) === Math.abs(b) && Math.abs(a) <= 1);
});
add("barroco-candelabro", "Candelabro", figura([
  "X.....X.....X",
  "X.....X.....X",
  "XX...XXX...XX",
  ".X....X....X.",
  ".XX...X...XX.",
  "..XXXXXXXXX..",
  "......X......",
  ".....XXX.....",
  "......X......",
  "....XXXXX....",
  "...XXXXXXX...",
]));

// ===================== Indígenas =====================
add("indigena-cocar", "Cocar", figura([
  "......XXX......",
  "...X..X.X..X...",
  "..XX..X.X..XX..",
  ".X.X..X.X..X.X.",
  "X..XX.X.X.XX..X",
  "X...X.X.X.X...X",
  ".X..XXXXXXX..X.",
  "..XXXXXXXXXXX..",
  "XXXXXXXXXXXXXXX",
  "X.X.X.X.X.X.X.X",
  "XXXXXXXXXXXXXXX",
]));
add("indigena-muiraquita", "Muiraquitã", figura([
  "..XXX...XXX..",
  ".XX.XX.XX.XX.",
  ".XXXXXXXXXXX.",
  "..XXXXXXXXX..",
  "XXXXXXXXXXXXX",
  "X..XXXXXXX..X",
  "...XXX.XXX...",
  "..XXX...XXX..",
  ".XX.......XX.",
]));
add("indigena-maraca", "Maracá", figura([
  ".X.X.X.X.",
  "..XXXXX..",
  ".XXXXXXX.",
  "XX.X.X.XX",
  "XXXXXXXXX",
  "X.X.X.X.X",
  ".XXXXXXX.",
  "..XXXXX..",
  "....X....",
  "....X....",
  "....X....",
  "...XXX...",
]));
add("indigena-marajoara", "Marajoara", (i, j, cols, rows) => {
  const { d: a, n: na } = cel(cx(i, cols), 12);
  const { d: b, n: nb } = cel(cy(j, rows), 12);
  const d = Math.abs(a) + Math.abs(b);
  if (d === 5 || d === 6) return true;
  const s = mod(na + nb, 2) ? -1 : 1;
  const x = a * s;
  // a stepped hook inside each diamond
  return (x === -1 && b >= -3 && b <= 1) || (b === 1 && x >= -1 && x <= 1) || (x === 1 && b >= -1 && b <= 1) || (b === -3 && x >= -1 && x <= 0);
});
add("indigena-kayapo", "Grafismo kayapó", (i, j, cols, rows) => {
  // stepped diagonal bands with a dotted line between them
  const x = cx(i, cols);
  const y = cy(j, rows);
  const t = mod(y + Math.floor(x / 2), 7);
  return t < 2 || (t === 4 && mod(x, 2) === 0);
});
add("indigena-jabuti", "Casco de jabuti", (i, j, cols, rows) => {
  const { d: b, n } = cel(cy(j, rows), 8);
  const a = cel(cx(i, cols) + (mod(n, 2) ? 5 : 0), 10).d;
  const A = Math.abs(a);
  const B = Math.abs(b);
  const hexa = (r: number) => B <= r && A + B * 0.6 <= r * 1.2;
  return (hexa(4) && !hexa(3)) || (hexa(1.6) && !(A === 0 && B === 0));
});
add("indigena-pintas-onca", "Pintas de onça", (i, j, cols, rows) => {
  const { d: b, n } = cel(cy(j, rows), 7);
  const a = cel(cx(i, cols) + (mod(n, 2) ? 4 : 0), 8).d;
  const r = Math.hypot(a, b * 1.15);
  return (r > 1.4 && r <= 2.7 && !(a > 1 && b < 0)) || r < 0.8;
});
add("indigena-cobra-grande", "Cobra grande", (i, j, cols, rows) => {
  const y = mod(cy(j, rows) + 4, 9);
  const t = mod(i, 8);
  const z = t < 4 ? t : 8 - t;
  if (y === z + 1 || y === z + 3) return true;
  return y === z + 2 && mod(i, 2) === 0;
});
add("indigena-pacu", "Peixes pacu", ladrilho([
  "...XXX....",
  ".XX.X.XX.X",
  "XX.X.X.XXX",
  "X.XXXXX.XX",
  "XX.X.X.XXX",
  ".XX.X.XX.X",
  "...XXX....",
], 12, 9));
add("indigena-xingu", "Losangos do Xingu", (i, j, cols, rows) => {
  const { d: a } = cel(cx(i, cols), 12);
  const { d: b } = cel(cy(j, rows), 12);
  const d = Math.abs(a) + Math.abs(b);
  if (d === 6) return true;
  return d < 6 && mod(b + (a >= 0 ? 0 : 1), 2) === 0 && d > 1;
});

export const FORMAS_BOHO_CULTURAS: Record<string, Teste> = Object.fromEntries(lista.map((f) => [f.valor, f.teste]));
export const ROTULOS_BOHO_CULTURAS = lista.map(({ valor, rotulo }) => ({ valor, rotulo, grupo: "boho" as Categoria }));
