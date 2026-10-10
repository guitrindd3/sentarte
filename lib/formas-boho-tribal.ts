import type { Categoria } from "./formas-categorias";
import { meio, mod, repetido, type Teste } from "./formas-extras-2";

// Boho tribal all-over patterns (2026-10-09, user: "no estilo boho acrescente
// mais estilo tribal... que preenchem a cadeira inteira... mais 20"). Each one
// tiles the whole panel (backrest 29×29, seat 61×27), centered so the middle
// of the chair lands on the middle of a motif. Reviewed on the real chair
// render (/api/cadeira) before shipping.

const lista: { valor: string; rotulo: string; teste: Teste }[] = [];
const add = (valor: string, rotulo: string, teste: Teste) => lista.push({ valor, rotulo, teste });

/** Centered coordinates. */
const cx = (i: number, cols: number) => i - meio(cols);
const cy = (j: number, rows: number) => j - meio(rows);
/** Position inside a repeating cell of size p (−p/2..p/2) and the cell index. */
const cel = (v: number, p: number) => {
  const h = Math.floor(p / 2);
  return { d: mod(v + h, p) - h, n: Math.floor((v + h) / p) };
};
const losango = (x: number, y: number) => Math.abs(x) + Math.abs(y);

// 1 — stepped diamonds with a dot, kilim lattice
add("tribal-kilim-escalonado", "Kilim escalonado", (i, j, cols, rows) => {
  const a = cel(cx(i, cols), 12).d;
  const b = cel(cy(j, rows), 12).d;
  const r = Math.max(Math.abs(a), 0) + Math.floor(Math.abs(b) / 2) * 2;
  const d = losango(a, b);
  return (d >= 4 && d <= 5) || d === 0 || (r >= 10 && d >= 9);
});

// 2 — navajo bands: stepped triangles between stripes
add("tribal-navajo", "Navajo", (i, j, cols, rows) => {
  const y = mod(cy(j, rows) + 3, 12);
  if (y === 0 || y === 11) return true;
  if (y === 2 || y === 9) return mod(i, 2) === 0;
  if (y >= 3 && y <= 8) {
    const h = y - 3;
    const x = mod(cx(i, cols) + 4, 8);
    const meioX = Math.abs(x - 3.5);
    return Math.floor(meioX) <= Math.floor(h / 2) + 0 && h < 6 && meioX <= h;
  }
  return false;
});

// 3 — aztec stepped pyramids, rows alternating up/down
add("tribal-asteca", "Asteca", (i, j, cols, rows) => {
  const { d: y, n } = cel(cy(j, rows), 8);
  const x = cel(cx(i, cols) + (n % 2 ? 6 : 0), 12).d;
  const yy = n % 2 ? -y : y;
  const degrau = Math.floor((yy + 4) / 2);
  return Math.abs(x) <= degrau * 1.5 && yy > -4 && Math.abs(x) % 3 !== 2;
});

// 4 — diamonds with concentric diamonds inside
add("tribal-losangos-olho", "Losangos com olho", (i, j, cols, rows) => {
  const a = cel(cx(i, cols), 10).d;
  const b = cel(cy(j, rows), 10).d;
  const d = losango(a, b);
  return d === 5 || d === 2 || d === 0;
});

// 5 — mud cloth (bogolan): crosses, dots and dashes in a grid
add("tribal-mud-cloth", "Mud cloth", (i, j, cols, rows) => {
  const { d: a, n: ca } = cel(cx(i, cols), 8);
  const { d: b, n: cb } = cel(cy(j, rows), 8);
  if (Math.abs(a) === 4 || Math.abs(b) === 4) return mod(i + j, 2) === 0;
  switch (mod(ca + cb * 2, 3)) {
    case 0:
      return (a === 0 && Math.abs(b) <= 2) || (b === 0 && Math.abs(a) <= 2);
    case 1:
      return Math.abs(a) <= 1 && Math.abs(b) <= 1 && (a + b) % 2 === 0;
    default:
      return Math.abs(b) <= 2 && mod(a, 2) === 0 && Math.abs(a) <= 2;
  }
});

// 6 — rows of arrows, alternating direction
add("tribal-flechas", "Flechas tribais", (i, j, cols, rows) => {
  const { d: y, n } = cel(cy(j, rows), 7);
  const x = mod(cx(i, cols) * (n % 2 ? -1 : 1), 10);
  if (y === 0) return x < 8;
  if (Math.abs(y) <= 2) return x === 8 - Math.abs(y) || x === 9 - Math.abs(y) || (x <= 1 && Math.abs(y) <= 2 && x === Math.abs(y) - 1);
  return false;
});

// 7 — zigzag rows with dots in the gaps
add("tribal-ziguezague-pontos", "Ziguezague com pontos", (i, j, cols, rows) => {
  const y = mod(cy(j, rows), 8);
  const t = mod(i, 8);
  const z = t < 4 ? t : 8 - t;
  if (y === z || y === z + 1) return true;
  return y === 6 && mod(i, 8) === 0;
});

// 8 — andean loom columns of stepped hooks
add("tribal-tear-andino", "Tear andino", (i, j, cols, rows) => {
  const { d: x, n } = cel(cx(i, cols), 9);
  const y = mod(cy(j, rows) + (n % 2 ? 4 : 0), 8);
  if (Math.abs(x) === 4) return true;
  const passo = y < 4 ? y : 7 - y;
  return x === passo - 2 || x === passo - 1;
});

// 9 — chakana (stepped andean cross) lattice
add("tribal-chakana", "Cruzes andinas", (i, j, cols, rows) => {
  const a = Math.abs(cel(cx(i, cols), 12).d);
  const b = Math.abs(cel(cy(j, rows), 12).d);
  const m = Math.max(a, b);
  const n = Math.min(a, b);
  const dentro = (m <= 1) || (m <= 3 && n <= 3) || (m <= 5 && n <= 1);
  const borda = (m <= 2) || (m <= 4 && n <= 2) || (m <= 6 && n <= 0);
  return dentro && !(borda && !(m <= 1 && n <= 1) && !(m >= 3 || n >= 3) && m !== 1);
});

// 10 — navajo triangles, rows alternating filled / outlined
add("tribal-triangulos-navajo", "Triângulos navajo", (i, j, cols, rows) => {
  const { d: yy, n } = cel(cy(j, rows), 7);
  const y = yy + 3;
  const x = Math.abs(cel(cx(i, cols) + (n % 2 ? 4 : 0), 8).d);
  const dentro = x <= y * 0.6 + 0.4 && y <= 5;
  if (n % 2 === 0) return dentro;
  return dentro && !(x <= y * 0.6 - 0.8 && y <= 4);
});

// 11 — hooked diamonds (kilim "ram's horn")
add("tribal-kilim-ganchos", "Kilim de ganchos", (i, j, cols, rows) => {
  const a = cel(cx(i, cols), 14).d;
  const b = cel(cy(j, rows), 14).d;
  const d = losango(a, b);
  if (d === 6) return true;
  if (d <= 2) return true;
  if (d === 7 && (Math.abs(a) <= 1 || Math.abs(b) <= 1)) return false;
  return d >= 7 && d <= 8 && Math.abs(Math.abs(a) - Math.abs(b)) <= 1;
});

// 12 — shipibo-style lines: offset concentric squares
add("tribal-shipibo", "Shipibo", (i, j, cols, rows) => {
  const { d: b, n } = cel(cy(j, rows), 10);
  const a = cel(cx(i, cols) + (n % 2 ? 5 : 0), 10).d;
  const m = Math.max(Math.abs(a), Math.abs(b));
  return m === 4 || m === 2 || (m === 0);
});

// 13 — stacked ethnic bands: dots, zigzag, diamonds, stripes
add("tribal-faixas-etnicas", "Faixas étnicas", (i, j, cols, rows) => {
  const y = mod(cy(j, rows) + 7, 15);
  const x = cx(i, cols);
  if (y === 0 || y === 14) return true;
  if (y === 2) return mod(x, 3) === 0;
  if (y >= 4 && y <= 6) {
    const t = mod(x, 6);
    return y - 4 === (t < 3 ? t : 6 - t) % 3;
  }
  if (y >= 8 && y <= 12) return losango(cel(x, 8).d, y - 10) === 2 || (cel(x, 8).d === 0 && y === 10);
  return false;
});

// 14 — tribal eyes lattice
add("tribal-olhos", "Olhos tribais", (i, j, cols, rows) => {
  const { d: b, n } = cel(cy(j, rows), 8);
  const a = cel(cx(i, cols) + (n % 2 ? 6 : 0), 12).d;
  const borda = Math.abs(a) <= 5 && Math.abs(b) <= 3 - Math.floor((Math.abs(a) * Math.abs(a)) / 10);
  const dentro = Math.abs(a) <= 4 && Math.abs(b) <= 2 - Math.floor((Math.abs(a) * Math.abs(a)) / 10);
  return (borda && !dentro) || (Math.abs(a) <= 1 && Math.abs(b) <= 1);
});

// 15 — double diamond net
add("tribal-rede-dupla", "Rede de losangos dupla", (i, j, cols, rows) => {
  const x = cx(i, cols);
  const y = cy(j, rows);
  const u = mod(x + y, 10);
  const v = mod(x - y, 10);
  return u === 0 || u === 2 || v === 0 || v === 2;
});

// 16 — arrow herringbone columns
add("tribal-espinha-flechas", "Espinha de flechas", (i, j, cols, rows) => {
  const { d: x } = cel(cx(i, cols), 8);
  const y = cy(j, rows);
  if (x === 0) return true;
  return mod(y + Math.abs(x), 4) === 0 && Math.abs(x) <= 3;
});

// 17 — small tribal suns, staggered
add("tribal-sois", "Sóis tribais", (i, j, cols, rows) => {
  const { d: b, n } = cel(cy(j, rows), 9);
  const a = cel(cx(i, cols) + (n % 2 ? 5 : 0), 10).d;
  const r = Math.hypot(a, b);
  if (r <= 1.5) return true;
  if (r > 2.5 && r <= 4.2) return (a === 0 || b === 0 || Math.abs(a) === Math.abs(b));
  return false;
});

// 18 — macramé net with knots
add("tribal-macrame", "Rede de macramê", (i, j, cols, rows) => {
  const x = cx(i, cols);
  const y = cy(j, rows);
  const u = mod(x + y, 6);
  const v = mod(x - y, 6);
  const no = mod(x, 6) === 3 && mod(y, 6) === 0;
  const no2 = mod(x, 6) === 0 && mod(y, 6) === 3;
  return u === 0 || v === 0 || no || no2 || (mod(x + 1, 6) === 4 && mod(y, 6) === 0) || (mod(x - 1, 6) === 2 && mod(y, 6) === 0);
});

// 19 — alternating outlined / solid diamonds
add("tribal-diamantes", "Diamantes alternados", (i, j, cols, rows) => {
  const { d: a, n: na } = cel(cx(i, cols), 8);
  const { d: b, n: nb } = cel(cy(j, rows), 8);
  const d = losango(a, b);
  return mod(na + nb, 2) === 0 ? d <= 3 : d === 3;
});

// 20 — tribal checkerboard: solid squares and squares with an X
add("tribal-xadrez", "Xadrez tribal", (i, j, cols, rows) => {
  const { d: a, n: na } = cel(cx(i, cols), 8);
  const { d: b, n: nb } = cel(cy(j, rows), 8);
  if (Math.abs(a) === 4 || Math.abs(b) === 4) return false;
  if (mod(na + nb, 2) === 0) return Math.abs(a) <= 2 && Math.abs(b) <= 2;
  return Math.abs(a) === Math.abs(b) || Math.max(Math.abs(a), Math.abs(b)) === 3;
});

// ===================== second round (2026-10-10, "pode colocar mais") =====================

/** Tiles a small sprite over the whole panel, staggered, only whole copies. */
const sprites = (d: string[], gap = 2) => repetido(d, gap);

// 21 — berber net: thick diamond lattice with a small cross in each cell
add("tribal-berbere", "Berbere", (i, j, cols, rows) => {
  const x = cx(i, cols);
  const y = cy(j, rows);
  const u = mod(x + y, 14);
  const v = mod(x - y, 14);
  if (u <= 1 || v <= 1) return true;
  const a = cel(x, 14).d;
  const b = cel(y, 14).d;
  const a2 = cel(x + 7, 14).d;
  const b2 = cel(y + 7, 14).d;
  const cruz = (p: number, q: number) => (p === 0 && Math.abs(q) <= 1) || (q === 0 && Math.abs(p) <= 1);
  return cruz(a, b) || cruz(a2, b2);
});

// 22 — x crosses alternating with dots
add("tribal-xis-e-pontos", "Xis e pontos", (i, j, cols, rows) => {
  const { d: a, n: na } = cel(cx(i, cols), 6);
  const { d: b, n: nb } = cel(cy(j, rows), 6);
  if (mod(na + nb, 2) === 0) return Math.abs(a) === Math.abs(b) && Math.abs(a) <= 2;
  return Math.abs(a) + Math.abs(b) <= 1;
});

// 23 — square spirals lattice
add("tribal-espirais", "Espirais tribais", sprites([
  "XXXXXXX",
  "X......",
  "X.XXXX.",
  "X.X..X.",
  "X.X.XX.",
  "X.X....",
  "X.XXXXX",
], 2));

// 24 — honeycomb outlines with a dot
add("tribal-hexagonos", "Hexágonos tribais", (i, j, cols, rows) => {
  const x = cx(i, cols);
  const { d: b, n } = cel(cy(j, rows), 8);
  const a = cel(x + (mod(n, 2) ? 5 : 0), 10).d;
  const A = Math.abs(a);
  const B = Math.abs(b);
  const hexa = (r: number) => B <= r && A + B * 0.5 <= r * 1.15;
  return (hexa(3.6) && !hexa(2.6)) || (A === 0 && B === 0);
});

// 25 — kilim eight-point stars
add("tribal-estrelas-oito", "Estrelas de kilim", (i, j, cols, rows) => {
  const a = Math.abs(cel(cx(i, cols), 12).d);
  const b = Math.abs(cel(cy(j, rows), 12).d);
  const quadrado = a <= 3 && b <= 3;
  const losangoS = a + b <= 5;
  const estrela = quadrado || losangoS;
  return estrela && !(a + b <= 1);
});

// 26 — ciranda: rows of little people holding hands
add("tribal-ciranda", "Ciranda", sprites([
  "..X..",
  ".XXX.",
  "XXXXX",
  "..X..",
  ".X.X.",
  "X...X",
], 0));

// 27 — llamas in rows
add("tribal-lhamas", "Lhamas em fileira", sprites([
  "X.X......",
  "XXX......",
  "XX.......",
  ".X.......",
  ".X.......",
  ".XXXXXXX.",
  ".XXXXXXXX",
  ".X.X..X.X",
], 1));

// 28 — tribal birds in rows
add("tribal-passaros", "Pássaros tribais", sprites([
  ".XX.....",
  "XXXX..XX",
  ".XXXXXX.",
  "..XXXX..",
  "...X.X..",
], 2));

// 29 — leaf chevrons in columns
add("tribal-folhas", "Folhas tribais", (i, j, cols, rows) => {
  const { d: x } = cel(cx(i, cols), 7);
  const y = cy(j, rows);
  if (x === 0) return true;
  const ax = Math.abs(x);
  return ax <= 3 && mod(y - ax, 4) === 0;
});

// 30 — little cacti in rows
add("tribal-cactos", "Cactos tribais", sprites([
  "..X..",
  "X.X..",
  "X.X.X",
  "XXX.X",
  "..XXX",
  "..X..",
  "..X..",
], 2));

// 31 — stepped mountain outlines in rows, with a base line
add("tribal-serras", "Serras tribais", (i, j, cols, rows) => {
  const { d: x, n } = cel(cx(i, cols), 12);
  const y = mod(cy(j, rows) + 4, 9);
  const ax = Math.abs(x);
  if (y === 8) return true;
  const topo = 1 + ax;
  return y === topo || y === topo + 1 || (mod(n, 2) === 0 && ax === 0 && y >= topo);
});

// 32 — kente cloth: blocks of horizontal / vertical stripes
add("tribal-kente", "Kente", (i, j, cols, rows) => {
  const { d: a, n: na } = cel(cx(i, cols), 8);
  const { d: b, n: nb } = cel(cy(j, rows), 8);
  if (Math.abs(a) === 4 || Math.abs(b) === 4) return true;
  return mod(na + nb, 2) === 0 ? mod(b, 2) === 0 : mod(a, 2) === 0;
});

// 33 — aztec chain of stepped S hooks
add("tribal-corrente-asteca", "Corrente asteca", sprites([
  "XXXXX...",
  "X...X...",
  "X.X.X...",
  "X.XXXXXX",
  "X...X..X",
  "XXXXX..X",
  "....X..X",
  "....XXXX",
], 1));

// 34 — suns and moons alternating
add("tribal-sol-e-lua", "Sóis e luas", (i, j, cols, rows) => {
  const { d: a, n: na } = cel(cx(i, cols), 10);
  const { d: b, n: nb } = cel(cy(j, rows), 10);
  const r = Math.hypot(a, b);
  if (mod(na + nb, 2) === 0) return r <= 1.8 || (r > 2.8 && r <= 4 && (a === 0 || b === 0 || Math.abs(a) === Math.abs(b)));
  return r <= 3.6 && Math.hypot(a + 1.6, b) > 2.8;
});

// 35 — rows of arrowheads
add("tribal-pontas-de-flecha", "Pontas de flecha", sprites([
  "...X...",
  "..XXX..",
  ".XXXXX.",
  "XXXXXXX",
  "..X.X..",
], 2));

// 36 — persian rug: border, corner motifs and a central medallion
add("tribal-tapete-persa", "Tapete persa", (i, j, cols, rows) => {
  const x = cx(i, cols);
  const y = cy(j, rows);
  const bx = meio(cols);
  const by = meio(rows);
  const borda = Math.abs(x) >= bx - 1 || Math.abs(y) >= by - 1;
  const bordaInterna = Math.abs(x) === bx - 4 || Math.abs(y) === by - 4;
  const dentro = Math.abs(x) <= bx - 4 && Math.abs(y) <= by - 4;
  const faixa = Math.abs(x) >= bx - 3 || Math.abs(y) >= by - 3;
  if (borda) return true;
  if (faixa && !dentro) return mod(x + y, 4) === 0;
  if (bordaInterna) return true;
  const d = losango(x, Math.round(y * 1.2));
  if (d <= 2 || d === 5 || d === 6) return true;
  const ca = losango(Math.abs(x) - (bx - 7), Math.abs(y) - (by - 7));
  return ca <= 1;
});

// 37 — heavy tribal borders top and bottom, plain stripes in between
add("tribal-barrado", "Barrado tribal", (i, j, cols, rows) => {
  const y = j;
  const x = cx(i, cols);
  const perto = Math.min(y, rows - 1 - y);
  if (perto === 0 || perto === 6) return true;
  if (perto >= 1 && perto <= 5) {
    const t = mod(x, 6);
    return losango(t - 3, perto - 3) <= 2 && losango(t - 3, perto - 3) !== 1;
  }
  return mod(perto, 3) === 0 && perto < rows / 2 - 1;
});

// 38 — rows of teardrops, alternating up and down
add("tribal-gotas", "Gotas tribais", (i, j, cols, rows) => {
  const { d: b, n } = cel(cy(j, rows), 8);
  const a = cel(cx(i, cols) + (mod(n, 2) ? 4 : 0), 8).d;
  const yy = mod(n, 2) ? -b : b;
  const r = Math.hypot(a, yy - 1);
  return (r <= 2.3 && r > 1.1) || (yy < -0 && Math.abs(a) <= Math.max(0, (yy + 4) * 0.6) && yy >= -3 && Math.abs(a) > (yy + 4) * 0.6 - 1.2);
});

// 39 — thorny vertical vines
add("tribal-espinhos", "Espinhos", (i, j, cols, rows) => {
  const { d: x, n } = cel(cx(i, cols), 7);
  const y = cy(j, rows) + (mod(n, 2) ? 2 : 0);
  if (x === 0) return true;
  return (x === 1 && mod(y, 4) === 0) || (x === -1 && mod(y, 4) === 2) || (x === 2 && mod(y, 4) === 3) || (x === -2 && mod(y, 4) === 1);
});

// 40 — tribal snakes: wavy bands with diamonds on the body
add("tribal-cobras", "Cobras tribais", (i, j, cols, rows) => {
  const { d: y0, n } = cel(cy(j, rows), 10);
  const centro = 2.2 * Math.sin(((i + n * 5) * 2 * Math.PI) / 14);
  const dy = y0 - centro;
  if (Math.abs(dy) > 2.2) return false;
  if (Math.abs(dy) >= 1.5) return true;
  return mod(i, 4) === 0 || (mod(i, 4) === 2 && Math.abs(dy) < 0.6);
});

// 41 — navajo checker of stepped diamonds
add("tribal-xadrez-navajo", "Xadrez navajo", (i, j, cols, rows) => {
  const { d: a, n: na } = cel(cx(i, cols), 10);
  const { d: b, n: nb } = cel(cy(j, rows), 10);
  const degrau = Math.abs(a) + 2 * Math.floor(Math.abs(b) / 2);
  const dentro = degrau <= 4;
  return mod(na + nb, 2) === 0 ? dentro : !dentro && Math.abs(a) <= 4 && Math.abs(b) <= 4;
});

// 42 — tribal fish in rows
add("tribal-peixes", "Peixes tribais", sprites([
  "..XXXX..X",
  ".XX.X.XXX",
  "XX.X.X.XX",
  ".XX.X.XXX",
  "..XXXX..X",
], 1));

// 43 — tribal sun rays radiating from the center of the chair
add("tribal-raios", "Raios tribais", (i, j, cols, rows) => {
  const x = cx(i, cols);
  const y = cy(j, rows);
  const r = Math.hypot(x, y);
  if (r <= 3) return true;
  if (r <= 4.2) return false;
  const a = Math.atan2(y, x);
  const setor = mod(Math.floor(((a + Math.PI) / (2 * Math.PI)) * 24), 2);
  return setor === 0 && mod(Math.floor(r), 3) !== 0;
});

// 44 — woven basket squares (offset squares with an inner dot)
add("tribal-cestaria", "Cestaria", (i, j, cols, rows) => {
  const { d: b, n } = cel(cy(j, rows), 6);
  const a = cel(cx(i, cols) + (mod(n, 2) ? 3 : 0), 6).d;
  const m = Math.max(Math.abs(a), Math.abs(b));
  return m === 2 || (a === 0 && b === 0);
});

export const FORMAS_BOHO_TRIBAL: Record<string, Teste> = Object.fromEntries(lista.map((f) => [f.valor, f.teste]));
export const ROTULOS_BOHO_TRIBAL = lista.map(({ valor, rotulo }) => ({ valor, rotulo, grupo: "boho" as Categoria }));
