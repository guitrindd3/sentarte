// Recolors the real woven-chair photo (public/monte/cadeira-trancada.jpg, a
// frame of the user's weaving clip) for the Monte a sua trama builder.
//
// The photo's webbing is black (main thread) and white (detail thread).
// Instead of painting a flat illustration, every webbing pixel keeps the
// photo's own light/shadow and strand texture: we read its brightness,
// decide whether it's main (A) or detail (B) thread, and repaint it in the
// chosen color scaled by that brightness. The backrest panel additionally
// gets the chosen weave shape and the woven name.
//
// Coordinates below are in the 480x848 source frame, measured by hand from
// the frame (see CLAUDE.md "Monte a sua trama builder") — if the base photo
// is ever replaced, these regions must be re-measured.

import { FORMAS_EXTRAS } from "./formas-extras";
import { GLYPH_H, GLYPH_W, glyphPixel, normalizarTexto } from "./pixel-font";

export type Forma =
  | "lisa"
  | "diamante"
  | "ziguezague"
  | "espiral"
  | "sol"
  | "xadrez"
  | "listras"
  | "faixas"
  | "losangos"
  | "setas"
  | "ondas"
  | "coracao"
  | "estrela"
  | "bolinhas"
  | "meio-a-meio"
  | "faixa-diagonal"
  | "faixa-central"
  | "listras-largas"
  | "escudo"
  | "triangulos"
  | "totem"
  | "mandala"
  | "moldura"
  | "diagonais"
  | "quadriculado"
  | "duas-faixas"
  | "faixa-vertical"
  | "cruz"
  | "coroa"
  | "escamas"
  | "flechas"
  | "bandeirinhas"
  | "ancora"
  | "flor"
  | "lua"
  | "sorriso"
  | "pontilhado"
  | "faixas-duplas"
  | "estrelas"
  | "peixe"
  | "oculos"
  | "borboleta"
  | "coqueiro"
  | "triangulo-grande"
  | "listras-finas"
  | "faixas-largas"
  | "xadrez-grande"
  | "xadrez-miudo"
  | "bolinhas-grandes"
  | "moldura-dupla"
  | "grade-diagonal"
  | "degraus"
  | "cantos"
  | "duas-colunas"
  | "tricolor-vertical"
  | "tricolor-horizontal"
  | "aros"
  | "faixa-v"
  | "diagonal-invertida"
  | "quadrantes"
  | "numero-10"
  | "bola"
  | "trofeu"
  | "escudo-estrela"
  | "arco-iris"
  | "kilim"
  | "ziguezague-duplo"
  | "espinha-de-peixe"
  | "sol-nascente"
  | "penas"
  | "abacaxi"
  | "sorvete"
  | "pata"
  | "nota"
  | "raio"
  | "guarda-sol"
  | "concha"
  | "melancia"
  | "gatinho"
  | "cacto"
  // + every key of FORMAS_EXTRAS (lib/formas-extras.ts)
  | (string & {});
/** Where the name block's center sits, 0-1 across/down the name area
 * (the backrest between its plain margins). Set by dragging in the builder. */
export type NomePosicao = { x: number; y: number };

// Base photo since 2026-10-02: a frame of the user's second clip, shot from
// higher up so the seat is clearly visible (464x832). Re-measure every
// region below if it ever changes.
export const IMG_W = 464;
export const IMG_H = 832;

/** Backrest panel — bounding box of the black backrest in the photo. */
const ENCOSTO = { x0: 108, x1: 337, y0: 158, y1: 470 };
/** The backrest narrows a little toward the bottom (perspective). */
const ENCOSTO_QUAD: [number, number][] = [
  [108, 158],
  [337, 158],
  [321, 470],
  [124, 470],
];
/** White side straps left/right of the backrest panel. */
const LATERAIS = [
  { x0: 66, x1: 124, y0: 236, y1: 452 },
  { x0: 322, x1: 386, y0: 236, y1: 452 },
];
/** Seat webbing, including where it wraps over the side tubes. */
const ASSENTO: [number, number][] = [
  [120, 476],
  [328, 476],
  [372, 500],
  [404, 528],
  [406, 618],
  [364, 674],
  [84, 674],
  [40, 618],
  [42, 528],
  [74, 500],
];
const ASSENTO_Y0 = 476;
const ASSENTO_Y1 = 674;
/** Seat area where a pattern may go: between the band of exposed vertical
 * strands under the backrest bar and the one along the front edge — those
 * two bands only ever show the main color (user 2026-10-02). */
const ASSENTO_DESENHO_Y0 = 512;
const ASSENTO_DESENHO_Y1 = 612;
/** The flat part of the seat between the side tubes — the only place a seat
 * pattern or name goes (the webbing wrapped over the tubes stays plain). */
// Kept well inside the side curves (user 2026-10-02 marked the curved
// edges as a margin) and slanted like the seat itself, so figures follow
// the seat's perspective.
// Centered on the chair's middle (x≈223, same as the backrest).
const ASSENTO_MEIO_X = 223;
const ASSENTO_PAINEL: [number, number][] = [
  [ASSENTO_MEIO_X - 107, ASSENTO_DESENHO_Y0],
  [ASSENTO_MEIO_X + 107, ASSENTO_DESENHO_Y0],
  [ASSENTO_MEIO_X + 128, ASSENTO_DESENHO_Y1],
  [ASSENTO_MEIO_X - 128, ASSENTO_DESENHO_Y1],
];
/** Seat pattern grid. Same row count as the backrest's pattern area, so the
 * figures (heart, anchor…) fit whole and centered; cells come out roughly
 * square on screen. */
// odd, so the grid has a true center column (centered shapes need it)
export const ASSENTO_COLS = 61;
export const ASSENTO_ROWS = 27;
/** Backrest pattern grid, for flat thumbnails. */
export const ENCOSTO_COLS = 29;
export const ENCOSTO_ROWS = 29;

/** Plain bands at the top and bottom of the backrest (where the rope wraps
 * the frame tubes on the real chairs): the weave shape never enters them,
 * only the main thread — user 2026-09-29. In source pixels. */
// Pattern area of the backrest, as the user marked it (2026-10-02): below
// the top lip, a little above the bottom, and in from both sides.
const MARGEM_TOPO = 80;
const MARGEM_BASE = 30;
const MARGEM_LADO = 14;

/** Size of one "woven cell" of the backrest pattern, in source pixels. */
const CELULA = 7;

export type Opcoes = {
  forma: Forma;
  corA: string; // main thread
  corB: string; // detail thread
  nome: string; // may contain \n
  posicao: NomePosicao;
  /** Name size, 0.3 (small) to 1 (as big as fits). */
  tamanhoNome?: number;
  /** Three-color chairs: the main (vertical) thread is split down the
   * middle — left half corA, right half corC (user 2026-09-30). */
  corC?: string;
  /** Weave shape size, 0.35-1 of the name area, and where its center sits
   * (0-1, like the name) — so a smaller shape and a name both fit. */
  escalaForma?: number;
  posForma?: NomePosicao;
  /** Pattern woven into the seat, in the detail color (corB). Default: plain. */
  formaAssento?: Forma;
  /** Name woven in the middle of the seat (detail color), instead of / as
   * well as the backrest one. */
  nomeAssento?: string;
  /** Seat name size, 0.4-2 (1 = as big as fits the seat panel). */
  tamanhoNomeAssento?: number;
  /** Seat figure size, 0.4-2 of the seat panel (1 = fits it), centered;
   * never drawn outside the panel. */
  escalaAssento?: number;
};

function hexRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.replace("#", ""), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

// Brightness-to-shade curves. Dark thread in the photo sits around 5-70,
// white thread around 150-255; both map to roughly 0.7-1.15 so the chosen
// color keeps the strands' highlights and gaps.
const sombraEscuro = (l: number) => 0.72 + (Math.min(l, 75) / 75) * 0.45;
const sombraClaro = (l: number) => 0.68 + (Math.max(0, Math.min(l, 250) - 140) / 110) * 0.4;

// Small pixel drawings for the figurative shapes ("X" = detail thread).
const DESENHOS = {
  ancora: [
    ".......X.......",
    "......XXX......",
    "......X.X......",
    "......XXX......",
    ".......X.......",
    "...XXXXXXXXX...",
    ".......X.......",
    ".......X.......",
    ".......X.......",
    ".......X.......",
    ".......X.......",
    "X......X......X",
    "XX.....X.....XX",
    ".XX....X....XX.",
    "..XXX..X..XXX..",
    "....XXXXXXX....",
    "......XXX......",
  ],
  peixe: [
    "......XXXX.....",
    "....XXXXXXXX..X",
    "..XXXXXXXXXXXXX",
    ".XX.XXXXXXXXXX.",
    "XXXXXXXXXXXXX..",
    ".XXXXXXXXXXXXX.",
    "..XXXXXXXXXXXXX",
    "....XXXXXXXX..X",
    "......XXXX.....",
  ],
  oculos: [
    "XXXXXXXXXXXXXXXXX",
    "XXXXXXX...XXXXXXX",
    "XXXXXXX...XXXXXXX",
    "XXXXXXX...XXXXXXX",
    ".XXXXX.....XXXXX.",
    "..XXX.......XXX..",
  ],
  borboleta: [
    "......X...X......",
    ".......X.X.......",
    "XXX.....X.....XXX",
    "XXXXX...X...XXXXX",
    "XXXXXX..X..XXXXXX",
    "XXXXXXX.X.XXXXXXX",
    ".XXXXXX.X.XXXXXX.",
    "..XXXXX.X.XXXXX..",
    "...XXX..X..XXX...",
    "..XXXXX.X.XXXXX..",
    ".XXXXXX.X.XXXXXX.",
    ".XXXXX..X..XXXXX.",
    "..XXX...X...XXX..",
  ],
  coqueiro: [
    "...XXXX...XXXX...",
    ".XXXXXXX.XXXXXXX.",
    "XX....XXXXX....XX",
    "X...XXX.X.XXX...X",
    "...XX...X...XX...",
    "..XX....X....XX..",
    "..X.....X.....X..",
    "........X........",
    "........XX.......",
    ".........X.......",
    ".........X.......",
    ".........X.......",
    "........XX.......",
    "........X........",
    ".......XXX.......",
    "....XXXXXXXXX....",
  ],
  numero10: [
    "..XX....XXXXX..",
    ".XXX...XX...XX.",
    "XXXX...XX...XX.",
    "..XX...XX...XX.",
    "..XX...XX...XX.",
    "..XX...XX...XX.",
    "..XX...XX...XX.",
    "..XX...XX...XX.",
    "..XX...XX...XX.",
    "XXXXXX..XXXXX..",
  ],
  trofeu: [
    "XXXXXXXXXXXXX",
    "X.XXXXXXXXX.X",
    "X.XXXXXXXXX.X",
    ".X.XXXXXXX.X.",
    "..XXXXXXXXX..",
    "...XXXXXXX...",
    "....XXXXX....",
    ".....XXX.....",
    "......X......",
    "......X......",
    ".....XXX.....",
    "...XXXXXXX...",
    "...XXXXXXX...",
  ],
  abacaxi: [
    "...X.X.X...",
    "....XXX....",
    "...X.X.X...",
    "....XXX....",
    "..XXXXXXX..",
    ".XX.X.X.XX.",
    "XX.X.X.X.XX",
    "X.X.X.X.X.X",
    "XX.X.X.X.XX",
    "X.X.X.X.X.X",
    "XX.X.X.X.XX",
    "X.X.X.X.X.X",
    ".XX.X.X.XX.",
    "..XXXXXXX..",
  ],
  sorvete: [
    "...XXXXX...",
    "..XXXXXXX..",
    ".XXXXXXXXX.",
    ".XXXXXXXXX.",
    "XXXXXXXXXXX",
    "XXXXXXXXXXX",
    ".X.X.X.X.X.",
    ".XXXXXXXXX.",
    "..X.X.X.X..",
    "..XXXXXXX..",
    "...X.X.X...",
    "...XXXXX...",
    "....X.X....",
    "....XXX....",
    ".....X.....",
  ],
  pata: [
    "...XX...XX...",
    "..XXXX.XXXX..",
    "..XXXX.XXXX..",
    "X..XX...XX..X",
    "XX.........XX",
    "XXX..XXX..XXX",
    ".X..XXXXX..X.",
    "...XXXXXXX...",
    "..XXXXXXXXX..",
    "..XXXXXXXXX..",
    "...XXX.XXX...",
  ],
  nota: [
    "....XXXXXXX",
    "....XXXXXXX",
    "....X.....X",
    "....X.....X",
    "....X.....X",
    "....X.....X",
    "....X.....X",
    "....X.....X",
    ".XXXX...XXX",
    "XXXXX..XXXX",
    "XXXXX..XXXX",
    ".XXX....XX.",
  ],
  raio: [
    "......XXXXX",
    ".....XXXXX.",
    "....XXXXX..",
    "...XXXXX...",
    "..XXXXX....",
    ".XXXXXXXXXX",
    "XXXXXXXXXX.",
    "......XXX..",
    ".....XXX...",
    "....XXX....",
    "...XXX.....",
    "..XX.......",
    ".XX........",
    "X..........",
  ],
  guardasol: [
    "......XXX......",
    "....XXXXXXX....",
    "..XXXXXXXXXXX..",
    ".XXXXXXXXXXXXX.",
    "XXXXXXXXXXXXXXX",
    "X..X..X.X..X..X",
    ".......X.......",
    ".......X.......",
    ".......X.......",
    ".......X.......",
    ".......X.......",
    "......XX.......",
    "...XXXXXXXXX...",
  ],
  concha: [
    ".......X.......",
    "....X..X..X....",
    "..X..X.X.X..X..",
    ".X.X..XXX..X.X.",
    "X..X.X.X.X.X..X",
    "X.X..X.X.X..X.X",
    "X.X.X..X..X.X.X",
    "XX.X...X...X.XX",
    ".XX.X..X..X.XX.",
    "..XXXX.X.XXXX..",
    "....XXXXXXX....",
    ".....XXXXX.....",
  ],
  melancia: [
    "XXXXXXXXXXXXXXXXX",
    ".X...X.....X...X.",
    ".X.............X.",
    "..X..X..X..X..X..",
    "..X...........X..",
    "...X.........X...",
    "....XX.....XX....",
    "......XXXXX......",
  ],
  gatinho: [
    "X.............X",
    "XX...........XX",
    "XXX.........XXX",
    "XXXXXXXXXXXXXXX",
    "XXXXXXXXXXXXXXX",
    "XX..XXXXXXX..XX",
    "XX..XXXXXXX..XX",
    "XXXXXXXXXXXXXXX",
    "XXXXXX...XXXXXX",
    ".XXXXXX.XXXXXX.",
    "..XXXXXXXXXXX..",
    "....XXXXXXX....",
  ],
  cacto: [
    "......XX.....",
    ".....XXXX....",
    ".....XXXX....",
    ".X...XXXX....",
    "XXX..XXXX..X.",
    "XXX..XXXX.XXX",
    "XXX..XXXX.XXX",
    "XXXXXXXXX.XXX",
    ".XXXXXXXX.XXX",
    ".....XXXXXXXX",
    ".....XXXXXXX.",
    ".....XXXX....",
    ".....XXXX....",
    ".....XXXX....",
    "...XXXXXXXX..",
    "...XXXXXXXX..",
  ],
  penas: [
    "....X..........X..........X....",
    "...XXX........XXX........XXX...",
    "..X.X.X......X.X.X......X.X.X..",
    ".X..X..X....X..X..X....X..X..X.",
    "X.X.X.X.X..X.X.X.X.X..X.X.X.X.X",
    ".X..X..X....X..X..X....X..X..X.",
    "X.X.X.X.X..X.X.X.X.X..X.X.X.X.X",
    ".X..X..X....X..X..X....X..X..X.",
    "X.X.X.X.X..X.X.X.X.X..X.X.X.X.X",
    ".X..X..X....X..X..X....X..X..X.",
    "..X.X.X......X.X.X......X.X.X..",
    "...XXX........XXX........XXX...",
    "....X..........X..........X....",
    "....X..........X..........X....",
    "....X..........X..........X....",
  ],
  estrelinha: ["...X...", "...X...", "..XXX..", "XXXXXXX", ".XXXXX.", "..XXX..", ".XX.XX.", ".X...X."],
  coroa: [
    "X.....X.....X",
    "XX...XXX...XX",
    "XXX.XXXXX.XXX",
    "XXXXXXXXXXXXX",
    "XXXXXXXXXXXXX",
    ".............",
    "XXXXXXXXXXXXX",
    "XXXXXXXXXXXXX",
  ],
};

/** Whether cell (i,j) is set in a pixel drawing scaled and centered on the backrest. */
function noDesenho(desenho: string[], escala: number, i: number, j: number, cols: number, rows: number) {
  const h = desenho.length;
  const w = desenho[0].length;
  const x0 = Math.floor((cols - w * escala) / 2);
  const y0 = Math.floor((rows - h * escala) / 2);
  const sx = Math.floor((i - x0) / escala);
  const sy = Math.floor((j - y0) / escala);
  return sy >= 0 && sy < h && sx >= 0 && sx < w && desenho[sy][sx] === "X";
}

/** Whether backrest cell (i,j) shows the detail thread for this shape. */
function celulaDaForma(forma: Forma, i: number, j: number, cols: number, rows: number): boolean {
  const cx = (cols - 1) / 2;
  switch (forma) {
    case "lisa":
      return false;
    case "diamante": {
      const d = Math.abs(i - cx) + Math.abs(j - rows / 2);
      return Math.floor(d) % 7 < 2;
    }
    case "ziguezague": {
      // Only whole zigzag lines (a line k spans rows P*k-5..P*k+1), so the
      // top/bottom margins never cut one into loose tips.
      // Then center the whole lines vertically in the available rows.
      const P = 7; // rows between lines
      const K = Math.floor((rows - 2 + 5 - P) / P) ; // lines that fit whole
      const alturaUsada = P * K - (P - 6); // rows from first tip to last base
      const jj = j - Math.floor((rows - alturaUsada) / 2) + (P - 5);
      const tri = Math.abs((i % 10) - 5);
      const k = Math.floor((jj + tri) / P);
      return (jj + tri) % P < 2 && k >= 1 && k <= K;
    }
    case "espiral":
      // Square spiral ("triângulo caracol"), one continuous line.
      return espiral(cols, rows).has(j * cols + i);
    case "xadrez":
      return (Math.floor(i / 4) + Math.floor(j / 4)) % 2 === 0;
    case "listras": {
      // Vertical stripes, centered so both sides end the same.
      const off = Math.floor(((cols % 6) + 6) / 2);
      return (i + off) % 6 < 2;
    }
    case "faixas":
      return (j + 2) % 6 < 2 && j > 0 && j < rows - 1;
    case "losangos": {
      // A column of diamond outlines with a dot inside (like the "Losango
      // terracota" boho chair), stacked tip to tip.
      const raio = 4;
      const passo = 2 * raio + 1;
      const n = Math.floor((rows + 1) / passo);
      const topo = Math.floor((rows - (n * passo - 1)) / 2);
      const k = Math.floor((j - topo) / passo);
      if (j < topo || k >= n) return false;
      const cyk = topo + raio + k * passo;
      const d = Math.abs(i - cx) + Math.abs(j - cyk);
      return d === raio || d === raio - 1 || d === 0;
    }
    case "setas": {
      // Stacked V chevrons pointing down — only whole ones, centered.
      // slope limited so wide grids (the seat) still fit a couple of chevrons
      const incl = Math.min(0.6, (rows * 0.35) / cx);
      const abertura = incl * cx; // how much lower a chevron's arms end than its tip
      const n = Math.floor((rows - 3 - abertura) / 6) + 1;
      const topo = Math.floor((rows - 1 - abertura - (6 * (n - 1) + 2)) / 2);
      const v = j - topo - Math.abs(i - cx) * incl;
      const k = Math.floor(v / 6);
      return v >= 0 && v % 6 < 2 && k < n;
    }
    case "ondas": {
      // Whole waves only (amplitude 2 rows), centered.
      const n = Math.floor((rows - 6) / 7) + 1;
      const topo = Math.floor((rows - (7 * (n - 1) + 6)) / 2) + 2;
      const onda = j - topo - 2 * Math.sin((i * Math.PI) / 6);
      const k = Math.floor((onda + 0.5) / 7);
      return onda > -0.5 && (((Math.round(onda) % 7) + 7) % 7) < 2 && k < n;
    }
    case "coracao": {
      const cy = (rows - 1) / 2;
      const x = (i - cx) / 10;
      const y = -(j - cy) / 10 + 0.15;
      return Math.pow(x * x + y * y - 1, 3) - x * x * y * y * y <= 0;
    }
    case "estrela": {
      const cy = (rows - 1) / 2;
      const dx = i - cx;
      const dy = j - cy;
      const r = Math.hypot(dx, dy);
      // Radius of a 5-point star at this angle (outer 11, inner 4.5).
      const a = Math.atan2(dy, dx) + Math.PI / 2;
      const setor = ((a % ((2 * Math.PI) / 5)) + (2 * Math.PI) / 5) % ((2 * Math.PI) / 5);
      const t = Math.abs(setor / ((2 * Math.PI) / 5) - 0.5) * 2; // 1 at a tip, 0 between
      return r <= 4.5 + (11 - 4.5) * t;
    }
    case "bolinhas": {
      // Staggered polka dots.
      const linha = Math.floor(j / 5);
      const desloc = linha % 2 === 0 ? 0 : 3;
      const di = ((i + desloc) % 6) - 2.5;
      const dj = (j % 5) - 2;
      return j < rows - 1 && di * di + dj * dj <= 2.2;
    }
    case "meio-a-meio":
      // Half and half, like a two-color team chair split down the middle.
      return i >= cols / 2;
    case "faixa-diagonal": {
      // One wide diagonal sash, top-left to bottom-right (Vasco style).
      const t = i / (cols - 1) - j / (rows - 1);
      return Math.abs(t) < 0.18;
    }
    case "faixa-central": {
      const cy = (rows - 1) / 2;
      return Math.abs(j - cy) <= 3;
    }
    case "listras-largas": {
      // Wide vertical stripes (alvinegro style), symmetric around the center.
      return Math.floor((Math.abs(i - cx) + 2) / 4) % 2 === 1;
    }
    case "escudo": {
      // A filled shield with a thin inset outline — a generic crest.
      const cy = (rows - 1) / 2;
      const escudo = (x: number, y: number) => {
        if (y < 0 || y > 1) return false;
        const meia = y < 0.5 ? 1 : 1 - (y - 0.5) / 0.5;
        return x <= meia;
      };
      const x = Math.abs(i - cx) / 10;
      const y = (j - (cy - 10)) / 21; // 0 at the top edge, 1 at the point
      if (!escudo(x, y)) return false;
      // inset outline: inside the shield but outside a slightly smaller one
      const xi = Math.abs(i - cx) / 8;
      const yi = (j - (cy - 8)) / 17;
      const naBorda = escudo(xi * 1.0, yi) && !escudo(Math.abs(i - cx) / 7, (j - (cy - 7)) / 15);
      return !naBorda;
    }
    case "triangulos": {
      // Rows of pointed peaks, whole rows only.
      const alt = 6;
      const n = Math.floor((rows - 1) / (alt + 2));
      const topo = Math.floor((rows - n * (alt + 2) + 2) / 2);
      const k = Math.floor((j - topo) / (alt + 2));
      const jj = (j - topo) % (alt + 2);
      if (j < topo || k >= n || jj >= alt) return false;
      // one peak centered on the backrest, the rest repeating every 9 cells
      const meio = Math.abs(((((i - Math.round(cx) + 4) % 9) + 9) % 9) - 4);
      const inteiro = Math.abs(i - cx) <= Math.floor((cx - 4) / 9) * 9 + 4;
      return inteiro && meio <= jj * 0.7;
    }
    case "totem": {
      // A central column mixing chevrons and diamonds, flanked by two thin
      // lines — like the "Totem espiral" boho chair.
      const dx = Math.abs(i - cx);
      if (dx === 9) return j % 2 === 0;
      if (dx > 6) return false;
      const bloco = Math.floor(j / 9) % 2;
      const jj = j % 9;
      if (bloco === 0) return Math.abs(jj - 4) + dx === 4 || (dx === 0 && jj === 4);
      return jj - dx * 0.8 >= 1 && jj - dx * 0.8 < 3;
    }
    case "mandala": {
      const cy = (rows - 1) / 2;
      const r = Math.hypot(i - cx, (j - cy) * 1.05);
      const ang = Math.atan2(j - cy, i - cx);
      if (r < 2) return true;
      if (r >= 4 && r < 5) return true;
      if (r >= 8 && r < 9) return true;
      if (r >= 12 && r < 13) return true;
      // petals between the rings
      if (r >= 5.5 && r < 7.5) return Math.floor(((ang + Math.PI) / (2 * Math.PI)) * 12) % 2 === 0;
      if (r >= 9.5 && r < 11.5) return Math.floor(((ang + Math.PI) / (2 * Math.PI)) * 20) % 2 === 1;
      return false;
    }
    case "moldura": {
      const borda = Math.min(i, cols - 1 - i, j, rows - 1 - j);
      return borda === 2 || borda === 3;
    }
    case "diagonais":
      return (i + j) % 7 < 2;
    case "quadriculado": {
      const cy = Math.round((rows - 1) / 2);
      return Math.abs(i - Math.round(cx)) % 6 === 0 || Math.abs(j - cy) % 6 === 0;
    }
    case "duas-faixas": {
      const cy = (rows - 1) / 2;
      return Math.abs(Math.abs(j - cy) - 6) <= 1.5;
    }
    case "faixa-vertical":
      return Math.abs(i - cx) <= 4;
    case "cruz": {
      // A cross whose arms widen outward (cruz pátea, like on the Vasco crest).
      const cy = (rows - 1) / 2;
      const dx = Math.abs(i - cx);
      const dy = Math.abs(j - cy);
      const lim = Math.min(11, cy - 1);
      return (dy <= lim && dx <= 1.5 + dy * 0.4) || (dx <= lim && dy <= 1.5 + dx * 0.4);
    }
    case "coroa":
      return noDesenho(DESENHOS.coroa, 1.8, i, j, cols, rows);
    case "escamas": {
      // Rows of scallops (fish scales), alternate rows shifted half a scale.
      const linha = Math.floor(j / 4);
      const x = (i + (linha % 2 === 0 ? 0 : 4)) % 8;
      const y = j % 4;
      const r = Math.hypot(x - 3.5, y);
      return j < rows - 1 && r >= 3 && r < 4.2;
    }
    case "flechas": {
      // Three columns of arrows pointing up.
      const colunas = [Math.round(cx) - 9, Math.round(cx), Math.round(cx) + 9];
      const jj = j % 9;
      return colunas.some((c) => {
        const dx = Math.abs(i - c);
        if (dx > 3) return false;
        if (jj < 4) return jj === dx || jj === dx + 1;
        return dx === 0 && jj < 8;
      });
    }
    case "bandeirinhas": {
      // Bunting: a line with little hanging flags, whole rows only.
      const alt = 7;
      const n = Math.floor(rows / alt);
      const topo = Math.floor((rows - n * alt) / 2);
      const k = Math.floor((j - topo) / alt);
      const y = (j - topo) % alt;
      if (j < topo || k >= n) return false;
      if (y === 0) return true;
      if (y > 5) return false;
      const x = (i + (k % 2 === 0 ? 0 : 3)) % 6;
      return Math.abs(x - 2.5) <= (5 - y) * 0.55;
    }
    case "ancora":
      return noDesenho(DESENHOS.ancora, 1.4, i, j, cols, rows);
    case "flor": {
      // Eight rounded petals around an open center with a dot.
      const cy = (rows - 1) / 2;
      const r = Math.hypot(i - cx, j - cy);
      const ang = Math.atan2(j - cy, i - cx);
      const petala = 3.5 + 7.5 * Math.pow(Math.abs(Math.cos(4 * ang)), 0.7);
      return (r > 3 && r <= petala) || r < 1.5;
    }
    case "lua": {
      const cy = (rows - 1) / 2;
      const r1 = Math.hypot(i - cx, j - cy);
      const r2 = Math.hypot(i - (cx + 5), j - (cy - 3));
      return r1 < 11 && r2 >= 9;
    }
    case "sorriso": {
      const cy = (rows - 1) / 2;
      const r = Math.hypot(i - cx, j - cy);
      if (r >= 10 && r < 11.4) return true; // face outline
      if (Math.hypot(i - (cx - 4), j - (cy - 3)) < 1.7) return true; // eyes
      if (Math.hypot(i - (cx + 4), j - (cy - 3)) < 1.7) return true;
      return r >= 5.2 && r < 6.6 && j > cy + 1; // smile
    }
    case "pontilhado":
      return Math.abs(i - Math.round(cx)) % 4 === 0 && j % 4 === 2;
    case "faixas-duplas": {
      const y = (j + 1) % 9;
      return (y === 1 || y === 3) && j < rows - 1;
    }
    case "estrelas": {
      // Three "champion" stars across the upper part.
      const esc = 1.15;
      const lado = Math.round(7 * esc);
      const y0 = Math.max(0, Math.floor(rows * 0.18) - 1);
      const sy = Math.floor((j - y0) / esc);
      if (j < y0 || sy >= 8) return false;
      return [-10, 0, 10].some((d) => {
        const x0 = Math.round(cx) + d - Math.floor(lado / 2);
        const sx = Math.floor((i - x0) / esc);
        return i >= x0 && sx < 7 && DESENHOS.estrelinha[sy][sx] === "X";
      });
    }
    case "peixe":
      return noDesenho(DESENHOS.peixe, 1.7, i, j, cols, rows);
    case "oculos":
      return noDesenho(DESENHOS.oculos, 1.6, i, j, cols, rows);
    case "borboleta":
      return noDesenho(DESENHOS.borboleta, 1.5, i, j, cols, rows);
    case "coqueiro":
      return noDesenho(DESENHOS.coqueiro, 1.45, i, j, cols, rows);
    case "triangulo-grande": {
      // The detail color fills the top and comes down to a point in the
      // middle — the three-color chair the user showed (green over a
      // cream/mustard split).
      const alto = rows * 0.62;
      return j <= alto - (Math.abs(i - cx) / cx) * alto;
    }
    // ---- 2026-10-02 additions (20 per tab) ----
    case "listras-finas":
      return i % 3 === 1;
    case "faixas-largas":
      return Math.floor(j / 4) % 2 === 1 && j < rows - 1;
    case "xadrez-grande":
      return (Math.floor(i / 7) + Math.floor(j / 7)) % 2 === 0;
    case "xadrez-miudo":
      return (Math.floor(i / 2) + Math.floor(j / 2)) % 2 === 0;
    case "bolinhas-grandes": {
      const di = (i % 9) - 4;
      const dj = (j % 9) - 4;
      return di * di + dj * dj <= 7;
    }
    case "moldura-dupla": {
      const borda = Math.min(i, cols - 1 - i, j, rows - 1 - j);
      return borda === 1 || borda === 4;
    }
    case "grade-diagonal":
      return (i + j) % 6 === 0 || (i - j + 600) % 6 === 0;
    case "degraus":
      return (Math.floor(i / 3) - Math.floor(j / 3) + 400) % 4 === 0;
    case "cantos":
      return Math.min(i, cols - 1 - i) + Math.min(j, rows - 1 - j) < 7;
    case "duas-colunas": {
      const d = Math.abs(i - cx);
      return d >= 5 && d <= 7;
    }
    case "tricolor-vertical":
      return i < cols / 3 || i >= (2 * cols) / 3;
    case "tricolor-horizontal":
      return j < rows / 3 || j >= (2 * rows) / 3;
    case "aros":
      return Math.floor(j / 5) % 2 === 0;
    case "faixa-v": {
      const linha = (1 - Math.abs(i - cx) / cx) * (rows - 1);
      return Math.abs(j - linha) <= 2.2;
    }
    case "diagonal-invertida": {
      const t = (cols - 1 - i) / (cols - 1) - j / (rows - 1);
      return Math.abs(t) < 0.18;
    }
    case "quadrantes":
      return i < cols / 2 !== j < rows / 2;
    case "numero-10":
      return noDesenho(DESENHOS.numero10, 1.6, i, j, cols, rows);
    case "bola": {
      const cy = (rows - 1) / 2;
      const r = Math.hypot(i - cx, j - cy);
      if (r >= 9.5 && r < 11) return true;
      if (r < 2.6) return true;
      const ang = Math.atan2(j - cy, i - cx);
      const setor = ((ang + Math.PI) / (2 * Math.PI)) * 5;
      return r >= 6 && r < 8.2 && Math.abs(setor - Math.round(setor)) < 0.18;
    }
    case "trofeu":
      return noDesenho(DESENHOS.trofeu, 1.6, i, j, cols, rows);
    case "escudo-estrela": {
      const cy = (rows - 1) / 2;
      const x = Math.abs(i - cx) / 10;
      const y = (j - (cy - 10)) / 21;
      if (y < 0 || y > 1) return false;
      const meia = y < 0.5 ? 1 : 1 - (y - 0.5) / 0.5;
      if (x > meia) return false;
      const dx = i - cx;
      const dy = j - (cy - 2);
      const r = Math.hypot(dx, dy);
      const a = Math.atan2(dy, dx) + Math.PI / 2;
      const setor = ((a % ((2 * Math.PI) / 5)) + (2 * Math.PI) / 5) % ((2 * Math.PI) / 5);
      const t = Math.abs(setor / ((2 * Math.PI) / 5) - 0.5) * 2;
      return !(r <= 2.5 + 3.5 * t);
    }
    case "arco-iris": {
      const r = Math.hypot(i - cx, j - (rows - 1));
      return r < rows - 1 && Math.floor(r / 2.5) % 2 === 0;
    }
    case "kilim": {
      const cy = (rows - 1) / 2;
      return [-11, 0, 11].some((d) => {
        const dd = Math.abs(i - (Math.round(cx) + d)) + Math.abs(j - cy);
        return dd <= 5 && dd % 3 !== 1;
      });
    }
    case "ziguezague-duplo": {
      const tri = Math.abs((i % 10) - 5);
      const m = (j + tri) % 10;
      return (m === 0 || m === 1 || m === 3 || m === 4) && j > 0 && j < rows - 1;
    }
    case "espinha-de-peixe": {
      const k = Math.floor(i / 4);
      const off = k % 2 === 0 ? i % 4 : 3 - (i % 4);
      return (j + off) % 4 === 0;
    }
    case "sol-nascente": {
      const by = rows - 1;
      const r = Math.hypot(i - cx, j - by);
      if (r < 6) return true;
      const ang = Math.atan2(by - j, i - cx);
      return r > 8 && r < rows - 2 && Math.floor((ang / Math.PI) * 12) % 2 === 0;
    }
    case "penas":
      return noDesenho(DESENHOS.penas, 1, i, j, cols, rows);
    case "abacaxi":
      return noDesenho(DESENHOS.abacaxi, 1.6, i, j, cols, rows);
    case "sorvete":
      return noDesenho(DESENHOS.sorvete, 1.5, i, j, cols, rows);
    case "pata":
      return noDesenho(DESENHOS.pata, 1.7, i, j, cols, rows);
    case "nota":
      return noDesenho(DESENHOS.nota, 1.8, i, j, cols, rows);
    case "raio":
      return noDesenho(DESENHOS.raio, 1.7, i, j, cols, rows);
    case "guarda-sol":
      return noDesenho(DESENHOS.guardasol, 1.6, i, j, cols, rows);
    case "concha":
      return noDesenho(DESENHOS.concha, 1.6, i, j, cols, rows);
    case "melancia":
      return noDesenho(DESENHOS.melancia, 1.6, i, j, cols, rows);
    case "gatinho":
      return noDesenho(DESENHOS.gatinho, 1.6, i, j, cols, rows);
    case "cacto":
      return noDesenho(DESENHOS.cacto, 1.5, i, j, cols, rows);
    case "sol": {
      const cy = rows * 0.42;
      const dx = i - cx;
      const dy = j - cy;
      const r = Math.hypot(dx, dy);
      if (r < 5) return true;
      const raio = Math.floor(((Math.atan2(dy, dx) + Math.PI) / (2 * Math.PI)) * 16) % 2 === 0;
      return r > 7 && r < 12 && raio;
    }
  }
  return FORMAS_EXTRAS[forma]?.(i, j, cols, rows) ?? false;
}

const espirais = new Map<string, Set<number>>();
function espiral(cols: number, rows: number) {
  const chave = `${cols}x${rows}`;
  const pronta = espirais.get(chave);
  if (pronta) return pronta;
  const celulas = new Set<number>();
  let x = Math.floor(cols / 2);
  let y = Math.floor(rows / 2);
  const dirs = [
    [1, 0],
    [0, 1],
    [-1, 0],
    [0, -1],
  ];
  const espaco = 3; // cells between turns of the line
  for (let k = 0, passo = espaco; k < 200 && passo < Math.max(cols, rows) * 2; k++) {
    const [dx, dy] = dirs[k % 4];
    for (let n = 0; n < passo; n++) {
      if (x >= 0 && y >= 0 && x < cols && y < rows) celulas.add(y * cols + x);
      x += dx;
      y += dy;
    }
    if (k % 2 === 1) passo += espaco;
  }
  espirais.set(chave, celulas);
  return celulas;
}

type Nome = { mascara: Uint8Array; contorno: Uint8Array; faixaY0: number; faixaY1: number } | null;

/** Rasterizes the name into two backrest-sized masks: letters and a
 * one-pixel outline in the main color, so letters stay legible on any
 * weave shape. */
function rasterizarNome(nome: string, posicao: NomePosicao, tamanho = 1): Nome {
  const linhas = nome
    .split("\n")
    .map((l) => normalizarTexto(l).trim())
    .filter(Boolean)
    .slice(0, 3);
  if (linhas.length === 0) return null;

  const w = ENCOSTO.x1 - ENCOSTO.x0;
  const hTotal = ENCOSTO.y1 - ENCOSTO.y0;
  const h = hTotal - MARGEM_TOPO - MARGEM_BASE;
  // Each line gets its own font pixel size — as big as fits the panel width
  // (with margin), capped so a short word doesn't take over the backrest —
  // so "JU" over "TRINDADE" reads big-over-small like the real chairs. Then
  // everything shrinks together if the block is too tall.
  const wIn = w - 2 * MARGEM_LADO;
  const tamanhos = linhas.map((l) => Math.min(9, (wIn * 0.94) / (l.length * (GLYPH_W + 1) - 1)) * tamanho);
  const gap = 12;
  const alturaNatural = tamanhos.reduce((s, px) => s + GLYPH_H * px, 0) + gap * (linhas.length - 1);
  const escala = Math.min(1, (h * 0.8) / alturaNatural);
  const pxs = tamanhos.map((px) => Math.max(1.4, px * escala));
  const gapLinha = gap * escala;
  const alturaBloco = pxs.reduce((s, px) => s + GLYPH_H * px, 0) + gapLinha * (linhas.length - 1);
  const px = Math.min(...pxs);
  const centroY = posicao.y * h;
  const topo = MARGEM_TOPO + Math.max(px, Math.min(h - alturaBloco - px, centroY - alturaBloco / 2));
  const larguraBloco = Math.max(...linhas.map((l, li) => (l.length * (GLYPH_W + 1) - 1) * pxs[li]));
  const centroX = Math.max(
    MARGEM_LADO + larguraBloco / 2,
    Math.min(w - MARGEM_LADO - larguraBloco / 2, MARGEM_LADO + posicao.x * wIn)
  );

  const mascara = new Uint8Array(w * hTotal);
  let y0 = topo;
  linhas.forEach((linha, li) => {
    const px = pxs[li];
    const larguraLinha = (linha.length * (GLYPH_W + 1) - 1) * px;
    const x0 = centroX - larguraLinha / 2;
    for (let y = Math.floor(y0); y < Math.ceil(y0 + GLYPH_H * px); y++) {
      for (let x = Math.floor(x0); x < Math.ceil(x0 + larguraLinha); x++) {
        if (x < 0 || y < 0 || x >= w || y >= hTotal) continue;
        const gx = Math.floor((x - x0) / px);
        const gy = Math.floor((y - y0) / px);
        const ci = Math.floor(gx / (GLYPH_W + 1));
        const col = gx % (GLYPH_W + 1);
        if (glyphPixel(linha[ci], col, gy)) mascara[y * w + x] = 1;
      }
    }
    y0 += GLYPH_H * px + gapLinha;
  });

  const r = Math.max(2, Math.round(px * 0.8));
  const contorno = new Uint8Array(w * hTotal);
  for (let y = 0; y < hTotal; y++) {
    for (let x = 0; x < w; x++) {
      if (mascara[y * w + x]) continue;
      search: for (let dy = -r; dy <= r; dy++) {
        for (let dx = -r; dx <= r; dx++) {
          const xx = x + dx;
          const yy = y + dy;
          if (xx >= 0 && yy >= 0 && xx < w && yy < hTotal && mascara[yy * w + xx]) {
            contorno[y * w + x] = 1;
            break search;
          }
        }
      }
    }
  }
  // The weave shape is kept off a band behind the name (like the plain
  // strip the real chairs weave the name on), so letters never fight it.
  return { mascara, contorno, faixaY0: topo - 10, faixaY1: topo + alturaBloco + 10 };
}

/** Converts a point on the source photo into a name position (0-1 within
 * the name area), clamped to it. */
export function posicaoNoEncosto(sx: number, sy: number): NomePosicao {
  const w = ENCOSTO.x1 - ENCOSTO.x0;
  const h = ENCOSTO.y1 - ENCOSTO.y0 - MARGEM_TOPO - MARGEM_BASE;
  const clamp = (v: number) => Math.max(0, Math.min(1, v));
  return {
    x: clamp((sx - ENCOSTO.x0 - MARGEM_LADO) / (w - 2 * MARGEM_LADO)),
    y: clamp((sy - ENCOSTO.y0 - MARGEM_TOPO) / h),
  };
}

/** Name laid out on the seat grid (cells), centered, as big as fits. */
function mascaraNomeAssento(texto: string, tamanho = 1) {
  const linha = normalizarTexto(texto.replace(/\n/g, " ")).trim();
  if (!linha) return null;
  const larguraCel = linha.length * (GLYPH_W + 1) - 1;
  // fractional cell size: 1 = largest that fits, then the user's factor
  const caber = Math.min(3.4, (ASSENTO_COLS - 4) / larguraCel, (ASSENTO_ROWS - 6) / GLYPH_H);
  // grows past 100% only while the whole name still fits the panel
  const maximo = Math.min((ASSENTO_COLS - 2) / larguraCel, (ASSENTO_ROWS - 2) / GLYPH_H);
  const esc = Math.max(0.6, Math.min(maximo, caber * Math.max(0.4, Math.min(2, tamanho))));
  const w = Math.round(larguraCel * esc);
  const h = Math.round(GLYPH_H * esc);
  const x0 = Math.floor((ASSENTO_COLS - w) / 2);
  const y0 = Math.floor((ASSENTO_ROWS - h) / 2);
  const letra = new Uint8Array(ASSENTO_COLS * ASSENTO_ROWS);
  for (let j = 0; j < h; j++) {
    for (let i = 0; i < w; i++) {
      const gx = Math.floor(i / esc);
      const ci = Math.floor(gx / (GLYPH_W + 1));
      const xx = x0 + i;
      const yy = y0 + j;
      if (xx < 0 || yy < 0 || xx >= ASSENTO_COLS || yy >= ASSENTO_ROWS) continue;
      if (glyphPixel(linha[ci], gx % (GLYPH_W + 1), Math.floor(j / esc))) letra[yy * ASSENTO_COLS + xx] = 1;
    }
  }
  const contorno = new Uint8Array(ASSENTO_COLS * ASSENTO_ROWS);
  for (let j = 0; j < ASSENTO_ROWS; j++) {
    for (let i = 0; i < ASSENTO_COLS; i++) {
      if (letra[j * ASSENTO_COLS + i]) continue;
      for (let dj = -1; dj <= 1; dj++) {
        for (let di = -1; di <= 1; di++) {
          const a = i + di;
          const b = j + dj;
          if (a >= 0 && b >= 0 && a < ASSENTO_COLS && b < ASSENTO_ROWS && letra[b * ASSENTO_COLS + a]) contorno[j * ASSENTO_COLS + i] = 1;
        }
      }
    }
  }
  return { letra, contorno };
}

/** Flat, straight thumbnail of a shape (no photo): the pattern grid in the
 * two thread colors, with thin gaps so it still reads as woven. */
export function desenharMiniatura(
  ctx: CanvasRenderingContext2D,
  largura: number,
  altura: number,
  forma: Forma,
  corA: string,
  corB: string,
  parte: "encosto" | "assento"
) {
  const cols = parte === "encosto" ? ENCOSTO_COLS : ASSENTO_COLS;
  const rows = parte === "encosto" ? ENCOSTO_ROWS : ASSENTO_ROWS;
  const cw = largura / cols;
  const ch = altura / rows;
  ctx.fillStyle = corA;
  ctx.fillRect(0, 0, largura, altura);
  ctx.fillStyle = corB;
  for (let j = 0; j < rows; j++) {
    for (let i = 0; i < cols; i++) {
      const on = forma === "meio-a-meio" ? i >= cols / 2 : forma !== "lisa" && celulaDaForma(forma, i, j, cols, rows);
      if (on) ctx.fillRect(i * cw, j * ch, Math.ceil(cw), Math.ceil(ch));
    }
  }
  // vertical strand lines
  ctx.fillStyle = "rgba(0,0,0,0.14)";
  for (let x = 0; x < largura; x += Math.max(2, cw / 2)) ctx.fillRect(Math.floor(x), 0, 1, altura);
}

/** Left/right x of a polygon on row y (where a horizontal line crosses it). */
function bordasDaLinha(poly: [number, number][], y: number): [number, number] {
  let esq = Infinity;
  let dir = -Infinity;
  for (let k = 0, j = poly.length - 1; k < poly.length; j = k++) {
    const [x1, y1] = poly[j];
    const [x2, y2] = poly[k];
    if ((y1 <= y && y2 > y) || (y2 <= y && y1 > y)) {
      const x = x1 + ((y - y1) * (x2 - x1)) / (y2 - y1);
      esq = Math.min(esq, x);
      dir = Math.max(dir, x);
    }
  }
  return [esq, dir];
}

/** Writes the recolored chair into `saida` (same size as `foto`). */
export function pintarCadeira(foto: ImageData, saida: ImageData, op: Opcoes) {
  const src = foto.data;
  const out = saida.data;
  out.set(src);

  const A = hexRgb(op.corA);
  const B = hexRgb(op.corB);
  // Right half of the main thread (three-color chairs); same as A otherwise.
  const C = op.corC ? hexRgb(op.corC) : A;
  const pinta = (i: number, cor: [number, number, number], s: number) => {
    out[i] = Math.min(255, cor[0] * s);
    out[i + 1] = Math.min(255, cor[1] * s);
    out[i + 2] = Math.min(255, cor[2] * s);
  };
  const brilho = (i: number) => (src[i] + src[i + 1] + src[i + 2]) / 3;
  const saturacao = (i: number) =>
    Math.max(src[i], src[i + 1], src[i + 2]) - Math.min(src[i], src[i + 1], src[i + 2]);

  // Backrest panel: shape + name, shaded by the photo's strands.
  const w = ENCOSTO.x1 - ENCOSTO.x0;
  const h = ENCOSTO.y1 - ENCOSTO.y0;
  const wIn = w - 2 * MARGEM_LADO; // pattern width inside the side margins
  const cols = Math.ceil(wIn / CELULA);
  const rows = Math.ceil((h - MARGEM_TOPO - MARGEM_BASE) / CELULA);
  const nome = rasterizarNome(op.nome, op.posicao, op.tamanhoNome ?? 1);
  // The shape is drawn as a scaled-down copy inside a box of the name area.
  const escala = Math.max(0.35, Math.min(1, op.escalaForma ?? 1));
  const areaH = h - MARGEM_TOPO - MARGEM_BASE;
  const caixaW = wIn * escala;
  const caixaH = areaH * escala;
  const pf = op.posForma ?? { x: 0.5, y: 0.5 };
  const caixaX0 = Math.max(0, Math.min(wIn - caixaW, pf.x * wIn - caixaW / 2));
  const caixaY0 = MARGEM_TOPO + Math.max(0, Math.min(areaH - caixaH, pf.y * areaH - caixaH / 2));
  for (let y = ENCOSTO.y0; y < ENCOSTO.y1; y++) {
    for (let x = ENCOSTO.x0; x < ENCOSTO.x1; x++) {
      const i = (y * IMG_W + x) * 4;
      const [bEsq, bDir] = bordasDaLinha(ENCOSTO_QUAD, y + 0.5);
      if (!(x + 0.5 >= bEsq && x + 0.5 < bDir)) continue;
      // position across the panel along the strands (0..w), not raw x
      const lx = Math.min(w - 1, Math.floor(((x + 0.5 - bEsq) / (bDir - bEsq)) * w));
      const ly = y - ENCOSTO.y0;
      const naMargem =
        ly < MARGEM_TOPO || ly >= h - MARGEM_BASE || lx < MARGEM_LADO || lx >= w - MARGEM_LADO;
      const u = (lx - MARGEM_LADO - caixaX0) / escala;
      const v = (ly - caixaY0) / escala;
      const naCaixa = u >= 0 && v >= 0 && u < wIn && v < areaH;
      let detalhe =
        op.forma === "meio-a-meio"
          ? lx >= w / 2
          : !naMargem &&
            naCaixa &&
            celulaDaForma(op.forma, Math.floor(u / CELULA), Math.floor(v / CELULA), cols, rows);
      if (nome) {
        const k = ly * w + lx;
        // Full-size shapes get a plain band behind the name; a reduced shape
        // was placed apart from the name on purpose, so leave it alone.
        if (escala >= 0.97 && ly >= nome.faixaY0 && ly <= nome.faixaY1) detalhe = false;
        if (nome.mascara[k]) detalhe = true;
        else if (nome.contorno[k]) detalhe = false;
      }
      pinta(i, detalhe ? B : lx >= w / 2 ? C : A, sombraEscuro(brilho(i)));
    }
  }

  // Side straps: only the white strap pixels (not the pool showing through).
  for (const r of LATERAIS) {
    for (let y = r.y0; y < r.y1; y++) {
      for (let x = r.x0; x < r.x1; x++) {
        const i = (y * IMG_W + x) * 4;
        const l = brilho(i);
        if (l > 120 && saturacao(i) < 45) pinta(i, B, sombraClaro(l));
      }
    }
  }

  // Seat: main (vertical) color, with an optional pattern in the detail
  // color. Pattern cells follow the seat's perspective: u runs across the
  // seat between its left/right edges on that row, v from back to front.
  const formaAssento = op.formaAssento ?? "lisa";
  const nomeSeat = mascaraNomeAssento(op.nomeAssento ?? "", op.tamanhoNomeAssento ?? 1);
  // above 1 the figure grows and is cut at the panel edge — never past it
  const escA = Math.max(0.4, Math.min(2, op.escalaAssento ?? 1));
  for (let y = ASSENTO_Y0; y < ASSENTO_Y1; y++) {
    const [esq, dir] = bordasDaLinha(ASSENTO, y + 0.5);
    if (!Number.isFinite(esq)) continue;
    const [pEsq, pDir] = bordasDaLinha(ASSENTO_PAINEL, y + 0.5);
    const v = (y - ASSENTO_DESENHO_Y0) / (ASSENTO_DESENHO_Y1 - ASSENTO_DESENHO_Y0);
    for (let x = Math.ceil(esq); x < dir; x++) {
      const i = (y * IMG_W + x) * 4;
      const l = brilho(i);
      if (saturacao(i) > 60 || l > 140) continue; // floor/pool through the gaps
      const P = x >= ASSENTO_MEIO_X ? C : A;
      let detalhe = false;
      if (Number.isFinite(pEsq) && x + 0.5 >= pEsq && x + 0.5 < pDir) {
        const u = (x + 0.5 - pEsq) / (pDir - pEsq);
        const ci = Math.min(ASSENTO_COLS - 1, Math.floor(u * ASSENTO_COLS));
        const cj = Math.min(ASSENTO_ROWS - 1, Math.floor(v * ASSENTO_ROWS));
        // figure scaled into a centered box of the panel
        const us = (u - 0.5) / escA + 0.5;
        const vs = (v - 0.5) / escA + 0.5;
        const dentroCaixa = us >= 0 && us < 1 && vs >= 0 && vs < 1;
        const fi = Math.min(ASSENTO_COLS - 1, Math.floor(us * ASSENTO_COLS));
        const fj = Math.min(ASSENTO_ROWS - 1, Math.floor(vs * ASSENTO_ROWS));
        // a name on the seat takes the seat figure's place
        detalhe =
          !nomeSeat &&
          dentroCaixa &&
          formaAssento !== "lisa" &&
          (formaAssento === "meio-a-meio" ? us >= 0.5 : celulaDaForma(formaAssento, fi, fj, ASSENTO_COLS, ASSENTO_ROWS));
        if (nomeSeat) {
          const k = cj * ASSENTO_COLS + ci;
          if (nomeSeat.letra[k]) detalhe = true;
          else if (nomeSeat.contorno[k]) detalhe = false;
        }
      }
      pinta(i, detalhe ? B : P, sombraEscuro(l));
    }
  }
}
