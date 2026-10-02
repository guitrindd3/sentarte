import { GLYPH_H, GLYPH_W, glyphPixel } from "./pixel-font";

// Shapes added 2026-10-02 to reach 50 per tab (user: "50 tramas para cada").
// Each test answers "is cell (i,j) the detail color?" on a cols×rows grid —
// the backrest pattern area (33×27) or the seat panel (61×27). Figures are
// fitted to the grid automatically, so they come out whole and centered on
// both. Kept out of chair-render.ts so that file stays readable.

type Teste = (i: number, j: number, cols: number, rows: number) => boolean;

const centro = (cols: number, rows: number) => [Math.floor(cols / 2), Math.floor(rows / 2)] as const;

/** Pixel drawing fitted (≈75% of the height, ≤85% of the width) and centered. */
function figura(desenho: string[]): Teste {
  const h = desenho.length;
  const w = desenho[0].length;
  return (i, j, cols, rows) => {
    const esc = Math.min((cols * 0.85) / w, (rows * 0.78) / h);
    const x0 = (cols - w * esc) / 2;
    const y0 = (rows - h * esc) / 2;
    const sx = Math.floor((i + 0.5 - x0) / esc);
    const sy = Math.floor((j + 0.5 - y0) / esc);
    return sy >= 0 && sy < h && sx >= 0 && sx < w && desenho[sy][sx] === "X";
  };
}

/** Text (digits/letters of the pixel font) fitted and centered. */
function texto(t: string): Teste {
  const w = t.length * (GLYPH_W + 1) - 1;
  return (i, j, cols, rows) => {
    const esc = Math.max(1, Math.floor(Math.min((cols * 0.8) / w, (rows * 0.75) / GLYPH_H)));
    const x0 = Math.floor((cols - w * esc) / 2);
    const y0 = Math.floor((rows - GLYPH_H * esc) / 2);
    const gx = Math.floor((i - x0) / esc);
    const gy = Math.floor((j - y0) / esc);
    if (gx < 0 || gy < 0 || gx >= w || gy >= GLYPH_H) return false;
    return glyphPixel(t[Math.floor(gx / (GLYPH_W + 1))], gx % (GLYPH_W + 1), gy);
  };
}

function estrela(i: number, j: number, x: number, y: number, R: number) {
  const dx = i - x;
  const dy = j - y;
  const r = Math.hypot(dx, dy);
  const a = Math.atan2(dy, dx) + Math.PI / 2;
  const s = ((a % ((2 * Math.PI) / 5)) + (2 * Math.PI) / 5) % ((2 * Math.PI) / 5);
  const t = Math.abs(s / ((2 * Math.PI) / 5) - 0.5) * 2;
  return r <= R * 0.42 + R * 0.58 * t;
}

function escudo(i: number, j: number, cols: number, rows: number) {
  const [cx, cy] = centro(cols, rows);
  const hw = Math.min(10, cols * 0.35);
  const x = Math.abs(i - cx) / hw;
  const y = (j - (cy - 10)) / 21;
  if (y < 0 || y > 1) return false;
  return x <= (y < 0.5 ? 1 : 1 - (y - 0.5) / 0.5);
}

/** Vertical stripes of width w with gap g, symmetric around the center. */
const listrasV = (w: number, g: number): Teste => (i, _j, cols) => {
  const p = w + g;
  const d = Math.abs(i - Math.floor(cols / 2)) + Math.floor(w / 2);
  return d % p < w;
};
const faixasH = (w: number, g: number): Teste => (_i, j, _c, rows) => {
  const p = w + g;
  const d = Math.abs(j - Math.floor(rows / 2)) + Math.floor(w / 2);
  return d % p < w;
};
const xadrez = (n: number): Teste => (i, j, cols, rows) => {
  const [cx, cy] = centro(cols, rows);
  return (Math.floor((i - cx + 1000 * n) / n) + Math.floor((j - cy + 1000 * n) / n)) % 2 === 0;
};
const listrado = (n: number): Teste => (i, _j, cols) => Math.floor((i * n) / cols) % 2 === 1;
const aros = (n: number): Teste => (_i, j, _c, rows) => Math.floor((j * n) / rows) % 2 === 1;
const zigue = (amp: number, per: number, larg: number): Teste => (i, j, cols, rows) => {
  const tri = Math.abs((((i - Math.floor(cols / 2)) % (2 * amp)) + 2 * amp) % (2 * amp) - amp);
  return ((j + tri) % per) < larg && j > 0 && j < rows - 1;
};

export const FORMAS_EXTRAS: Record<string, Teste> = {
  // ---------------- Básicos (30) ----------------
  "listras-1x4": listrasV(1, 4),
  "listras-2x2": listrasV(2, 2),
  "listras-3x3": listrasV(3, 3),
  "listras-4x6": listrasV(4, 6),
  "faixas-2x2": faixasH(2, 2),
  "faixas-1x3": faixasH(1, 3),
  "faixas-3x5": faixasH(3, 5),
  "faixas-5x3": faixasH(5, 3),
  "xadrez-3": xadrez(3),
  "xadrez-5": xadrez(5),
  "xadrez-6": xadrez(6),
  "bolinhas-miudas": (i, j) => i % 4 === 1 && j % 4 === 1,
  "bolinhas-medias": (i, j) => {
    const di = (i % 7) - 3;
    const dj = (j % 7) - 3;
    return di * di + dj * dj <= 3;
  },
  "bolinhas-alternadas": (i, j) => {
    const lin = Math.floor(j / 6);
    const di = ((i + (lin % 2) * 3) % 6) - 2.5;
    const dj = (j % 6) - 2.5;
    return di * di + dj * dj <= 2.5;
  },
  "diagonais-largas": (i, j) => (i + j) % 10 < 4,
  "diagonais-finas": (i, j) => (i + j) % 5 === 0,
  "diagonais-invertidas": (i, j) => (((i - j) % 7) + 7) % 7 < 2,
  tijolos: (i, j) => j % 4 === 3 || (Math.floor(j / 4) % 2 === 0 ? i % 8 === 0 : (i + 4) % 8 === 0),
  "xadrez-escoces": (i, j) => i % 8 < 2 || j % 8 < 2 || i % 8 === 4 || j % 8 === 4,
  "grade-fina": (i, j) => i % 4 === 0 || j % 4 === 0,
  "grade-larga": (i, j) => i % 8 < 2 || j % 8 < 2,
  "pied-de-poule": (i, j) => ["XX..", "XXX.", "..XX", ".X.."][j % 4][i % 4] === "X",
  tracejado: (i, j) => j % 4 === 1 && (i + Math.floor(j / 4) * 3) % 6 < 3,
  "pontilhado-fino": (i, j) => i % 3 === 0 && j % 3 === 0,
  "moldura-tripla": (i, j, cols, rows) => [1, 3, 5].includes(Math.min(i, cols - 1 - i, j, rows - 1 - j)),
  "quadrado-central": (i, j, cols, rows) => {
    const [cx, cy] = centro(cols, rows);
    return Math.abs(i - cx) <= 6 && Math.abs(j - cy) <= 6;
  },
  "borda-larga": (i, j, cols, rows) => Math.min(i, cols - 1 - i, j, rows - 1 - j) < 3,
  "cruz-simples": (i, j, cols, rows) => {
    const [cx, cy] = centro(cols, rows);
    return Math.abs(i - cx) <= 1 || Math.abs(j - cy) <= 1;
  },
  "x-grande": (i, j, cols, rows) => {
    const u = i / (cols - 1);
    const v = j / (rows - 1);
    return Math.abs(u - v) < 0.07 || Math.abs(u + v - 1) < 0.07;
  },
  "circulo-grande": (i, j, cols, rows) => {
    const [cx, cy] = centro(cols, rows);
    const r = Math.hypot(i - cx, j - cy);
    const R = Math.min(cx, cy) - 1;
    return r <= R && r > R - 2;
  },

  // ---------------- Estilo time (30) ----------------
  "listrado-3": listrado(3),
  "listrado-5": listrado(5),
  "listrado-7": listrado(7),
  "aros-3": aros(3),
  "aros-5": aros(5),
  "aros-7": aros(7),
  "meio-a-meio-deitado": (_i, j, _c, rows) => j >= rows / 2,
  "faixa-diagonal-larga": (i, j, cols, rows) => Math.abs(i / (cols - 1) - j / (rows - 1)) < 0.28,
  "faixa-diagonal-fina": (i, j, cols, rows) => Math.abs(i / (cols - 1) - j / (rows - 1)) < 0.09,
  "faixa-x": (i, j, cols, rows) => {
    const u = i / (cols - 1);
    const v = j / (rows - 1);
    return Math.abs(u - v) < 0.14 || Math.abs(u + v - 1) < 0.14;
  },
  "faixa-lateral": (i, _j, cols) => i < cols * 0.3,
  "cruz-nordica": (i, j, cols, rows) => Math.abs(j - Math.floor(rows / 2)) <= 2 || Math.abs(i - Math.floor(cols * 0.35)) <= 2,
  "cruz-larga": (i, j, cols, rows) => {
    const [cx, cy] = centro(cols, rows);
    return Math.abs(i - cx) <= 3 || Math.abs(j - cy) <= 3;
  },
  "estrela-grande": (i, j, cols, rows) => {
    const [cx, cy] = centro(cols, rows);
    return estrela(i, j, cx, cy, Math.min(cy, cx) - 1);
  },
  "cinco-estrelas": (i, j, cols, rows) => {
    // 3 on top, 2 below
    const [cx, cy] = centro(cols, rows);
    const p = Math.floor(Math.min((cols - 2) / 3, rows / 2.4));
    const R = p * 0.48;
    const pts = [[-p, -p / 2], [0, -p / 2], [p, -p / 2], [-p / 2, p / 2], [p / 2, p / 2]];
    return pts.some(([dx, dy]) => estrela(i, j, cx + dx, cy + dy, R));
  },
  "numero-1": texto("1"),
  "numero-7": texto("7"),
  "numero-9": texto("9"),
  "numero-11": texto("11"),
  "escudo-listrado": (i, j, cols, rows) => escudo(i, j, cols, rows) && Math.floor((i - Math.floor(cols / 2) + 100) / 2) % 2 === 0,
  "escudo-faixa": (i, j, cols, rows) => {
    if (!escudo(i, j, cols, rows)) return false;
    return Math.abs(j - (Math.floor(rows / 2) - 3)) > 2;
  },
  medalha: figura([
    "XX.......XX",
    ".XX.....XX.",
    "..XX...XX..",
    "...XX.XX...",
    "....XXX....",
    "...XXXXX...",
    "..XXXXXXX..",
    ".XXX...XXX.",
    ".XX..X..XX.",
    ".XX.XXX.XX.",
    ".XX..X..XX.",
    ".XXX...XXX.",
    "..XXXXXXX..",
    "...XXXXX...",
  ]),
  chuteira: figura([
    "XXXXX..........",
    "X.X.X..........",
    "XXXXXX.........",
    "XX.XXXX........",
    "XXX.XXXXX......",
    "XXXX.XXXXXXX...",
    "XXXXXXXXXXXXXX.",
    "XXXXXXXXXXXXXXX",
    ".X..X..X..X..X.",
  ]),
  camisa: figura([
    "..XXX...XXX..",
    ".XXXXX.XXXXX.",
    "XXXXXXXXXXXXX",
    "XXXXXXXXXXXXX",
    "XX.XXXXXXX.XX",
    "...XXXXXXX...",
    "...XXXXXXX...",
    "...XXXXXXX...",
    "...XXXXXXX...",
    "...XXXXXXX...",
    "...XXXXXXX...",
  ]),
  "estrela-e-faixa": (i, j, cols, rows) => {
    const [cx, cy] = centro(cols, rows);
    const naFaixa = Math.abs(j - cy) <= 5;
    const est = estrela(i, j, cx, cy, 5);
    return naFaixa !== est;
  },
  "triangulos-laterais": (i, j, cols, rows) => {
    const [, cy] = centro(cols, rows);
    const d = Math.abs(j - cy) / cy;
    const lim = (1 - d) * cols * 0.3;
    return i < lim || i > cols - 1 - lim;
  },
  "gola-v": (i, j, cols) => {
    const cx = Math.floor(cols / 2);
    const linha = Math.max(0, 8 - Math.abs(i - cx) * 0.8);
    return Math.abs(j - linha) <= 1.2 && j <= 9;
  },
  "duas-diagonais": (i, j, cols, rows) => {
    const t = i / (cols - 1) - j / (rows - 1);
    return Math.abs(t - 0.18) < 0.07 || Math.abs(t + 0.18) < 0.07;
  },
  "listra-central-fina": (i, _j, cols) => Math.abs(i - Math.floor(cols / 2)) <= 1,
  "bandeira-quadriculada": (i, j, cols, rows) => {
    const [cx, cy] = centro(cols, rows);
    if (Math.abs(i - cx) > 10 || Math.abs(j - cy) > 7) return false;
    return (Math.floor((i - cx + 100) / 3) + Math.floor((j - cy + 100) / 3)) % 2 === 0;
  },

  // ---------------- Estilo boho (30) ----------------
  "diamante-simples": (i, j, cols, rows) => {
    const [cx, cy] = centro(cols, rows);
    const d = Math.abs(i - cx) / (cx - 1) + Math.abs(j - cy) / (cy - 1);
    return d <= 1 && d > 0.86;
  },
  "diamante-duplo": (i, j, cols, rows) => {
    const [cx, cy] = centro(cols, rows);
    const d = Math.abs(i - cx) / (cx - 1) + Math.abs(j - cy) / (cy - 1);
    return (d <= 1 && d > 0.88) || (d <= 0.6 && d > 0.48);
  },
  "diamantes-cheios": (i, j) => Math.abs((i % 8) - 4) + Math.abs((j % 8) - 4) <= 2,
  "rede-de-losangos": (i, j) => (i + j) % 8 === 0 || (((i - j) % 8) + 8) % 8 === 0,
  "ziguezague-fino": zigue(3, 6, 1),
  "ziguezague-largo": zigue(7, 14, 3),
  "ziguezague-em-pe": (i, j, cols) => {
    const tri = Math.abs((j % 8) - 4);
    return ((i - Math.floor(cols / 2) + 100 + tri) % 8) < 2;
  },
  "setas-para-cima": (i, j, cols, rows) => {
    const cx = Math.floor(cols / 2);
    const incl = Math.min(0.6, (rows * 0.35) / cx);
    const v = j + Math.abs(i - cx) * incl;
    return v >= 2 && v % 6 < 2 && v < rows + cx * incl - 4;
  },
  "setas-finas": (i, j, cols, rows) => {
    const cx = Math.floor(cols / 2);
    const incl = Math.min(0.6, (rows * 0.35) / cx);
    const v = j - Math.abs(i - cx) * incl;
    return v >= 1 && v % 4 < 1 && j < rows - 1;
  },
  "triangulos-invertidos": (i, j, cols, rows) => {
    const alt = 6;
    const k = Math.floor(j / (alt + 2));
    const jj = j % (alt + 2);
    if (jj >= alt || (k + 1) * (alt + 2) > rows + 1) return false;
    const meio = Math.abs((((i - Math.floor(cols / 2) + 4) % 9) + 9) % 9 - 4);
    return meio <= (alt - 1 - jj) * 0.7;
  },
  "triangulos-alternados": (i, j, cols) => {
    const k = Math.floor(j / 7);
    const jj = j % 7;
    const meio = Math.abs((((i - Math.floor(cols / 2) + 4 + (k % 2) * 4) % 8) + 8) % 8 - 4);
    return jj < 6 && meio <= jj * 0.7;
  },
  ampulheta: (i, j, cols, rows) => {
    const [cx, cy] = centro(cols, rows);
    const dy = Math.abs(j - cy);
    return Math.abs(i - cx) <= dy * 0.8 && dy <= cy - 1 && dy > 1;
  },
  "x-escalonado": (i, j, cols, rows) => {
    const [cx, cy] = centro(cols, rows);
    const a = Math.floor(Math.abs(i - cx) / 2);
    const b = Math.floor(Math.abs(j - cy) / 2);
    return Math.abs(a - b) === 0;
  },
  grega: (i, j, cols, rows) => {
    const [, cy] = centro(cols, rows);
    const t = ["XXXXXXXX", "X.......", "X.XXXXX.", "X.X...X.", "X.X.XXX.", "X.X.....", "X.XXXXXX", "........"];
    const jj = j - (cy - 3);
    if (jj < 0 || jj >= 8) return false;
    return t[jj][((i % 8) + 8) % 8] === "X";
  },
  escada: (i, j, cols, rows) => {
    const [cx] = centro(cols, rows);
    return Math.abs(i - cx) <= Math.floor(j / 3) * 2 && j % 3 === 0 && j > 0;
  },
  piramide: (i, j, cols, rows) => {
    const [cx] = centro(cols, rows);
    const degrau = Math.floor(j / 3);
    return Math.abs(i - cx) <= degrau * 2 && j < rows - 2 && Math.abs(i - cx) > degrau * 2 - 3;
  },
  "quadrados-concentricos": (i, j, cols, rows) => {
    const [cx, cy] = centro(cols, rows);
    return Math.max(Math.abs(i - cx), Math.abs(j - cy)) % 4 === 0;
  },
  "faixas-tribais": (i, j, cols, rows) => {
    const [, cy] = centro(cols, rows);
    const dj = j - cy;
    if (Math.abs(dj) === 7 || Math.abs(dj) === 9) return true;
    if (Math.abs(dj) <= 4) {
      const tri = Math.abs((i % 8) - 4);
      return Math.abs(dj) === tri - 0 || (i % 4 === 0 && dj === 0);
    }
    return false;
  },
  "losangos-em-linha": (i, j, cols, rows) => {
    const [cx, cy] = centro(cols, rows);
    const passo = Math.max(9, Math.floor(cols / 4));
    const k = Math.round((i - cx) / passo);
    const d = Math.abs(i - (cx + k * passo)) + Math.abs(j - cy);
    return Math.abs(k * passo) <= cx - 4 && (d === 4 || d === 0);
  },
  cruzes: (i, j) => {
    const a = i % 8;
    const b = j % 8;
    return (a === 4 && b >= 2 && b <= 6) || (b === 4 && a >= 2 && a <= 6);
  },
  "flechas-deitadas": (i, j, cols, rows) => {
    const [, cy] = centro(cols, rows);
    const jj = ((j - cy) % 9 + 9 + 4) % 9 - 4;
    const ii = i % 10;
    if (Math.abs(jj) === 0 && ii <= 7) return true;
    return ii >= 4 && ii <= 7 && Math.abs(jj) === 7 - ii;
  },
  "espiral-redonda": (i, j, cols, rows) => {
    const [cx, cy] = centro(cols, rows);
    const r = Math.hypot(i - cx, j - cy);
    const a = Math.atan2(j - cy, i - cx) + Math.PI;
    const voltas = r / 3.2 - a / (2 * Math.PI);
    return r < Math.min(cx, cy) && Math.abs(voltas - Math.round(voltas)) < 0.18;
  },
  "mandala-simples": (i, j, cols, rows) => {
    const [cx, cy] = centro(cols, rows);
    const r = Math.hypot(i - cx, j - cy);
    if (Math.abs(r - 5) < 0.7 || Math.abs(r - 11) < 0.7) return true;
    const a = Math.atan2(j - cy, i - cx);
    return r > 7 && r < 9.5 && Math.floor(((a + Math.PI) / (2 * Math.PI)) * 16) % 2 === 0;
  },
  "pena-grande": figura([
    "....X....",
    "...XXX...",
    "..X.X.X..",
    ".X..X..X.",
    "X.X.X.X.X",
    ".X..X..X.",
    "X.X.X.X.X",
    ".X..X..X.",
    "X.X.X.X.X",
    ".X..X..X.",
    "..X.X.X..",
    "...XXX...",
    "....X....",
    "....X....",
    "....X....",
  ]),
  "sol-asteca": (i, j, cols, rows) => {
    const [cx, cy] = centro(cols, rows);
    const r = Math.hypot(i - cx, j - cy);
    if (r < 4.5) return true;
    if (r < 6) return false;
    const a = Math.atan2(j - cy, i - cx);
    const s = (((a + Math.PI) / (2 * Math.PI)) * 12) % 1;
    return r < 6 + (1 - Math.abs(s - 0.5) * 2) * 6;
  },
  montanhas: (i, j, cols, rows) => {
    const per = 16;
    const tri = Math.abs((((i - Math.floor(cols / 2) + per / 2) % per) + per) % per - per / 2);
    const topo = rows * 0.25 + tri * 1.2;
    return Math.abs(j - topo) <= 1 && j < rows - 2;
  },
  "ondas-grandes": (i, j, cols, rows) => {
    const w = j - rows / 2 - 4 * Math.sin((i * Math.PI) / 8);
    return Math.abs(w) <= 1 || Math.abs(w - 8) <= 1 || Math.abs(w + 8) <= 1;
  },
  pontas: (i, j, cols, rows) => {
    const tri = Math.abs((((i - Math.floor(cols / 2)) % 6) + 6) % 6 - 3);
    return j < 4 - tri || j > rows - 5 + tri;
  },
  favo: (i, j) => {
    const lin = Math.floor(j / 4);
    const x = (i + (lin % 2) * 3) % 6;
    const y = j % 4;
    return y === 0 ? x < 3 : x === 0 || x === 3;
  },
  "trama-cruzada": (i, j) => {
    const bloco = (Math.floor(i / 4) + Math.floor(j / 4)) % 2;
    return bloco === 0 ? i % 2 === 0 : j % 2 === 0;
  },

  // ---------------- Divertidos (30) ----------------
  barco: figura([
    ".......X.......",
    "......XX.......",
    ".....XXX.......",
    "....XXXX.......",
    "...XXXXX.......",
    "..XXXXXX.......",
    ".XXXXXXX.......",
    ".......X.......",
    "XXXXXXXXXXXXXXX",
    ".XXXXXXXXXXXXX.",
    "..XXXXXXXXXXX..",
    "...XXXXXXXXX...",
  ]),
  "estrela-do-mar": figura([
    ".......X.......",
    "......XXX......",
    "......XXX......",
    ".....XXXXX.....",
    "XXXXXXXXXXXXXXX",
    ".XXXXXXXXXXXXX.",
    "...XXXXXXXXX...",
    "....XXXXXXX....",
    "....XXX.XXX....",
    "...XXX...XXX...",
    "..XXX.....XXX..",
    ".XX.........XX.",
  ]),
  polvo: figura([
    "....XXXXXXX....",
    "...XXXXXXXXX...",
    "..XXXXXXXXXXX..",
    "..XX..XXX..XX..",
    "..XX..XXX..XX..",
    "..XXXXXXXXXXX..",
    "..XXXXXXXXXXX..",
    ".X.X.X.X.X.X.X.",
    "X..X.X.X.X.X..X",
    "X.X..X.X.X..X.X",
    ".X..X..X..X..X.",
  ]),
  baleia: figura([
    "..........X.X..",
    "...........X...",
    "....XXXXXX.X...",
    "..XXXXXXXXXX..X",
    ".XXXXXXXXXXXXXX",
    "XX.XXXXXXXXXXX.",
    "XXXXXXXXXXXXX..",
    ".XXXXXXXXXXX...",
    "..XXXXXXXXX....",
  ]),
  tartaruga: figura([
    "......XXX......",
    ".....XXXXX.....",
    "XX.XXXXXXXXX.XX",
    ".XXX.X.X.X.XXX.",
    "..XXXXXXXXXXX..",
    "..X.X.X.X.X.X..",
    "..XXXXXXXXXXX..",
    ".XXX.X.X.X.XXX.",
    "XX.XXXXXXXXX.XX",
    ".......X.......",
  ]),
  caranguejo: figura([
    ".X...........X.",
    "XXX.........XXX",
    "X.X.........X.X",
    ".XX..X...X..XX.",
    "...XXXXXXXXX...",
    "..XXXXXXXXXXX..",
    "XXXXXXXXXXXXXXX",
    "..XXXXXXXXXXX..",
    ".X.X.......X.X.",
    "X..X.......X..X",
  ]),
  flamingo: figura([
    "....XXX....",
    "...XX.XX...",
    "...XXXXX...",
    "......XX...",
    "......XX...",
    ".....XX....",
    "....XX.....",
    ".XXXXXX....",
    "XXXXXXXXX..",
    "XXXXXXXXXXX",
    ".XXXXXXX...",
    "....X......",
    "....X......",
    "....X......",
    "...XXX.....",
  ]),
  chinelos: figura([
    ".XXX.....XXX.",
    "XX.XX...XX.XX",
    "X.X.X...X.X.X",
    "XXXXX...XXXXX",
    "XXXXX...XXXXX",
    "XXXXX...XXXXX",
    "XXXXX...XXXXX",
    "XXXXX...XXXXX",
    ".XXX.....XXX.",
  ]),
  nuvem: figura([
    "....XXXX.......",
    "...XXXXXX.XX...",
    "..XXXXXXXXXXXX.",
    ".XXXXXXXXXXXXXX",
    "XXXXXXXXXXXXXXX",
    "XXXXXXXXXXXXXXX",
    ".XXXXXXXXXXXXX.",
  ]),
  gota: figura([
    ".....X.....",
    "....XXX....",
    "...XXXXX...",
    "..XXXXXXX..",
    ".XXXXXXXXX.",
    "XXXXXXXXXXX",
    "XXXXXXXXXXX",
    "XXXXXXXXXXX",
    ".XXXXXXXXX.",
    "..XXXXXXX..",
  ]),
  margarida: figura([
    "....XX.XX....",
    "...XXX.XXX...",
    "XX..XX.XX..XX",
    "XXX.......XXX",
    ".XX..XXX..XX.",
    ".....XXX.....",
    ".XX..XXX..XX.",
    "XXX.......XXX",
    "XX..XX.XX..XX",
    "...XXX.XXX...",
    "....XX.XX....",
  ]),
  folha: figura([
    "........XXX",
    ".....XXXXXX",
    "...XXXX.XXX",
    "..XXX..XXXX",
    ".XXX.XXXXXX",
    ".XX.XXXXXX.",
    "XX.XXXXXX..",
    "X.XXXXXX...",
    "X.XXXX.....",
    "X..........",
  ]),
  cogumelo: figura([
    "....XXXXX....",
    "..XXXXXXXXX..",
    ".XX..XXX..XX.",
    "XXX..XXX..XXX",
    "XXXXXXXXXXXXX",
    "XXXXXXXXXXXXX",
    "....XXXXX....",
    "....XXXXX....",
    "....XXXXX....",
    "...XXXXXXX...",
  ]),
  maca: figura([
    ".....X.....",
    "....X..XX..",
    "..XXXXXXX..",
    ".XXXXXXXXX.",
    "XXXXXXXXXXX",
    "XXXXXXXXXXX",
    "XXXXXXXXXXX",
    "XXXXXXXXXXX",
    ".XXXXXXXXX.",
    "..XXX.XXX..",
  ]),
  cereja: figura([
    ".......XXX..",
    "......X.....",
    ".....X.X....",
    "....X...X...",
    "...X.....X..",
    ".XXX....XXX.",
    "XXXXX..XXXXX",
    "XXXXX..XXXXX",
    "XXXXX..XXXXX",
    ".XXX....XXX.",
  ]),
  pizza: figura([
    "XXXXXXXXXXXXX",
    "XX.XXXXXX.XXX",
    ".XXXXX.XXXXX.",
    ".XX.XXXXXXXX.",
    "..XXXXXX.XX..",
    "..XXX.XXXXX..",
    "...XXXXXXX...",
    "...XXXX.XX...",
    "....XXXXX....",
    ".....XXX.....",
    "......X......",
  ]),
  cupcake: figura([
    "......X......",
    ".....XXX.....",
    "...XXXXXXX...",
    "..XXXXXXXXX..",
    ".XXXXXXXXXXX.",
    "XXXXXXXXXXXXX",
    ".X.X.X.X.X.X.",
    ".XXXXXXXXXXX.",
    "..X.X.X.X.X..",
    "..XXXXXXXXX..",
    "...X.X.X.X...",
    "...XXXXXXX...",
  ]),
  "bola-de-praia": figura([
    "....XXXXX....",
    "..XX.XXX.XX..",
    ".X...XXX...X.",
    "X....XXX....X",
    "X....XXX....X",
    "XXXXXXXXXXXXX",
    "X....XXX....X",
    "X....XXX....X",
    ".X...XXX...X.",
    "..XX.XXX.XX..",
    "....XXXXX....",
  ]),
  prancha: figura([
    "..XXX..",
    ".XXXXX.",
    ".XXXXX.",
    "XXXXXXX",
    "XXX.XXX",
    "XXX.XXX",
    "XXX.XXX",
    "XXX.XXX",
    "XXX.XXX",
    "XXX.XXX",
    "XXX.XXX",
    "XXXXXXX",
    ".XXXXX.",
    ".XXXXX.",
    "..XXX..",
    "...X...",
  ]),
  "onda-grande": figura([
    ".....XXXXX.....",
    "...XXX...XXX...",
    "..XX.......XX..",
    ".XX...XXX...X..",
    ".X...XX.XX..X..",
    "XX...X...X.XX..",
    "X....XX..XXX...",
    "X.....XXXX.....",
    "XX.............",
    ".XXX.........XX",
    "...XXXXXXXXXXX.",
  ]),
  farol: figura([
    ".....XXX.....",
    "....XXXXX....",
    "XX..X...X..XX",
    "....XXXXX....",
    ".....XXX.....",
    ".....X.X.....",
    "....XXXXX....",
    "....X.X.X....",
    "....XXXXX....",
    "...XX.X.XX...",
    "...XXXXXXX...",
    "..XX.X.X.XX..",
    ".XXXXXXXXXXX.",
  ]),
  "bandeira-chegada": figura([
    "XXXXXXXXXXX",
    "XX.X.X.X.XX",
    "X.X.X.X.X.X",
    "XX.X.X.X.XX",
    "XXXXXXXXXXX",
    "X..........",
    "X..........",
    "X..........",
    "X..........",
  ]),
  aviao: figura([
    "......X......",
    ".....XXX.....",
    ".....XXX.....",
    "...XXXXXXX...",
    "XXXXXXXXXXXXX",
    "XXXXXXXXXXXXX",
    ".....XXX.....",
    ".....XXX.....",
    "...XXXXXXX...",
    "....XX.XX....",
  ]),
  foguete: figura([
    "....X....",
    "...XXX...",
    "..XXXXX..",
    "..XX.XX..",
    "..XX.XX..",
    "..XXXXX..",
    "..XXXXX..",
    ".XXXXXXX.",
    "XX.XXX.XX",
    "X..XXX..X",
    "...X.X...",
    "..X...X..",
  ]),
  planeta: figura([
    ".....XXXXX.....",
    "....XXXXXXX....",
    "...XXXXXXXXX...",
    "XXXXXXXXXXXXXXX",
    "X..XXXXXXXXX..X",
    "XXXXXXXXXXXXXXX",
    "...XXXXXXXXX...",
    "....XXXXXXX....",
    ".....XXXXX.....",
  ]),
  alien: figura([
    "..X.......X..",
    "...X.....X...",
    "..XXXXXXXXX..",
    ".XX.XXXXX.XX.",
    "XXXXXXXXXXXXX",
    "X.XXXXXXXXX.X",
    "X.X.......X.X",
    "...XX...XX...",
  ]),
  fantasma: figura([
    "....XXXXX....",
    "..XXXXXXXXX..",
    ".XXXXXXXXXXX.",
    ".XX..XXX..XX.",
    ".XX..XXX..XX.",
    ".XXXXXXXXXXX.",
    ".XXXXXXXXXXX.",
    ".XXXXXXXXXXX.",
    ".XXXXXXXXXXX.",
    ".X.XX.X.XX.X.",
  ]),
  dado: figura([
    "XXXXXXXXXXX",
    "X.........X",
    "X.XX...XX.X",
    "X.XX...XX.X",
    "X.........X",
    "X....X....X",
    "X.........X",
    "X.XX...XX.X",
    "X.XX...XX.X",
    "X.........X",
    "XXXXXXXXXXX",
  ]),
  coracoes: figura([
    ".XX.XX...XX.XX.",
    "XXXXXXX.XXXXXXX",
    "XXXXXXX.XXXXXXX",
    ".XXXXX...XXXXX.",
    "..XXX.....XXX..",
    "...X.......X...",
  ]),
  picole: figura([
    "..XXXXX..",
    ".XXXXXXX.",
    ".XXXXXXX.",
    ".XX.XXXX.",
    ".XXXXXXX.",
    ".XXXX.XX.",
    ".XXXXXXX.",
    ".XXXXXXX.",
    "..XXXXX..",
    "....X....",
    "....X....",
    "....X....",
  ]),
};

/** Labels and tabs for the builder (order = display order). */
type Grupo = "basicos" | "time" | "boho" | "divertidos";

export const ROTULOS_EXTRAS: { valor: string; rotulo: string; grupo: Grupo }[] = [
  ["listras-1x4", "Listras espaçadas"], ["listras-2x2", "Listras juntas"], ["listras-3x3", "Listras médias"],
  ["listras-4x6", "Listras grossas"], ["faixas-2x2", "Faixas juntas"], ["faixas-1x3", "Faixas finas"],
  ["faixas-3x5", "Faixas médias"], ["faixas-5x3", "Faixas grossas"], ["xadrez-3", "Xadrez 3"],
  ["xadrez-5", "Xadrez 5"], ["xadrez-6", "Xadrez 6"], ["bolinhas-miudas", "Bolinhas miúdas"],
  ["bolinhas-medias", "Bolinhas médias"], ["bolinhas-alternadas", "Bolinhas alternadas"],
  ["diagonais-largas", "Diagonais largas"], ["diagonais-finas", "Diagonais finas"],
  ["diagonais-invertidas", "Diagonais invertidas"], ["tijolos", "Tijolos"], ["xadrez-escoces", "Xadrez escocês"],
  ["grade-fina", "Grade fina"], ["grade-larga", "Grade larga"], ["pied-de-poule", "Pied-de-poule"],
  ["tracejado", "Tracejado"], ["pontilhado-fino", "Pontilhado fino"], ["moldura-tripla", "Moldura tripla"],
  ["quadrado-central", "Quadrado no meio"], ["borda-larga", "Borda larga"], ["cruz-simples", "Cruz simples"],
  ["x-grande", "X grande"], ["circulo-grande", "Círculo"],
].map(([valor, rotulo]) => ({ valor, rotulo, grupo: "basicos" as Grupo }))
  .concat(
    [
      ["listrado-3", "Listrado 3"], ["listrado-5", "Listrado 5"], ["listrado-7", "Listrado 7"],
      ["aros-3", "Aros 3"], ["aros-5", "Aros 5"], ["aros-7", "Aros 7"], ["meio-a-meio-deitado", "Meio a meio deitado"],
      ["faixa-diagonal-larga", "Diagonal larga"], ["faixa-diagonal-fina", "Diagonal fina"], ["faixa-x", "Faixa em X"],
      ["faixa-lateral", "Faixa lateral"], ["cruz-nordica", "Cruz nórdica"], ["cruz-larga", "Cruz larga"],
      ["estrela-grande", "Estrela grande"], ["cinco-estrelas", "Cinco estrelas"], ["numero-1", "Número 1"],
      ["numero-7", "Número 7"], ["numero-9", "Número 9"], ["numero-11", "Número 11"],
      ["escudo-listrado", "Escudo listrado"], ["escudo-faixa", "Escudo com faixa"], ["medalha", "Medalha"],
      ["chuteira", "Chuteira"], ["camisa", "Camisa"], ["estrela-e-faixa", "Estrela na faixa"],
      ["triangulos-laterais", "Triângulos laterais"], ["gola-v", "Gola V"], ["duas-diagonais", "Duas diagonais"],
      ["listra-central-fina", "Listra central"], ["bandeira-quadriculada", "Quadriculado de chegada"],
    ].map(([valor, rotulo]) => ({ valor, rotulo, grupo: "time" as Grupo })),
    [
      ["diamante-simples", "Diamante simples"], ["diamante-duplo", "Diamante duplo"],
      ["diamantes-cheios", "Diamantes cheios"], ["rede-de-losangos", "Rede de losangos"],
      ["ziguezague-fino", "Ziguezague fino"], ["ziguezague-largo", "Ziguezague largo"],
      ["ziguezague-em-pe", "Ziguezague em pé"], ["setas-para-cima", "Setas para cima"], ["setas-finas", "Setas finas"],
      ["triangulos-invertidos", "Triângulos invertidos"], ["triangulos-alternados", "Triângulos alternados"],
      ["ampulheta", "Ampulheta"], ["x-escalonado", "X escalonado"], ["grega", "Grega"], ["escada", "Escada"],
      ["piramide", "Pirâmide"], ["quadrados-concentricos", "Quadrados"], ["faixas-tribais", "Faixas tribais"],
      ["losangos-em-linha", "Losangos em linha"], ["cruzes", "Cruzinhas"], ["flechas-deitadas", "Flechas deitadas"],
      ["espiral-redonda", "Espiral"], ["mandala-simples", "Mandala simples"], ["pena-grande", "Pena"],
      ["sol-asteca", "Sol asteca"], ["montanhas", "Montanhas"], ["ondas-grandes", "Ondas grandes"],
      ["pontas", "Pontas"], ["favo", "Favo"], ["trama-cruzada", "Trama cruzada"],
    ].map(([valor, rotulo]) => ({ valor, rotulo, grupo: "boho" as Grupo })),
    [
      ["barco", "Barco"], ["estrela-do-mar", "Estrela-do-mar"], ["polvo", "Polvo"], ["baleia", "Baleia"],
      ["tartaruga", "Tartaruga"], ["caranguejo", "Caranguejo"], ["flamingo", "Flamingo"], ["chinelos", "Chinelos"],
      ["nuvem", "Nuvem"], ["gota", "Gota"], ["margarida", "Margarida"], ["folha", "Folha"], ["cogumelo", "Cogumelo"],
      ["maca", "Maçã"], ["cereja", "Cereja"], ["pizza", "Pizza"], ["cupcake", "Cupcake"], ["bola-de-praia", "Bola de praia"],
      ["prancha", "Prancha"], ["onda-grande", "Onda"], ["farol", "Farol"], ["bandeira-chegada", "Bandeira"],
      ["aviao", "Avião"], ["foguete", "Foguete"], ["planeta", "Planeta"], ["alien", "Alien"], ["fantasma", "Fantasma"],
      ["dado", "Dado"], ["coracoes", "Corações"], ["picole", "Picolé"],
    ].map(([valor, rotulo]) => ({ valor, rotulo, grupo: "divertidos" as Grupo }))
  );
