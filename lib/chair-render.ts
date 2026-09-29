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

import { GLYPH_H, GLYPH_W, glyphPixel, normalizarTexto } from "./pixel-font";

export type Forma = "lisa" | "diamante" | "ziguezague" | "espiral" | "sol";
export type NomePosicao = "topo" | "meio" | "base";

export const IMG_W = 480;
export const IMG_H = 848;

/** Backrest panel — the solid black rectangle in the photo. */
const ENCOSTO = { x0: 143, x1: 324, y0: 245, y1: 512 };
/** White side straps left/right of the backrest panel. */
const LATERAIS = [
  { x0: 101, x1: 143, y0: 300, y1: 486 },
  { x0: 324, x1: 370, y0: 300, y1: 486 },
];
/** Seat polygon (inside the aluminum rails). */
const ASSENTO: [number, number][] = [
  [140, 519],
  [330, 519],
  [375, 544],
  [398, 566],
  [374, 600],
  [106, 600],
  [82, 566],
  [100, 544],
];

/** Size of one "woven cell" of the backrest pattern, in source pixels. */
const CELULA = 6;

export type Opcoes = {
  forma: Forma;
  corA: string; // main thread
  corB: string; // detail thread
  nome: string; // may contain \n
  posicao: NomePosicao;
};

function hexRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.replace("#", ""), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function dentroPoligono(x: number, y: number, poly: [number, number][]) {
  let dentro = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i];
    const [xj, yj] = poly[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) dentro = !dentro;
  }
  return dentro;
}

// Brightness-to-shade curves. Dark thread in the photo sits around 5-70,
// white thread around 150-255; both map to roughly 0.7-1.15 so the chosen
// color keeps the strands' highlights and gaps.
const sombraEscuro = (l: number) => 0.72 + (Math.min(l, 75) / 75) * 0.45;
const sombraClaro = (l: number) => 0.68 + (Math.max(0, Math.min(l, 250) - 140) / 110) * 0.4;

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
      const tri = Math.abs((i % 10) - 5);
      return (j + tri) % 9 < 2;
    }
    case "espiral":
      // Square spiral ("triângulo caracol"), one continuous line.
      return espiral(cols, rows).has(j * cols + i);
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
function rasterizarNome(nome: string, posicao: NomePosicao): Nome {
  const linhas = nome
    .split("\n")
    .map((l) => normalizarTexto(l).trim())
    .filter(Boolean)
    .slice(0, 3);
  if (linhas.length === 0) return null;

  const w = ENCOSTO.x1 - ENCOSTO.x0;
  const h = ENCOSTO.y1 - ENCOSTO.y0;
  // Each line gets its own font pixel size — as big as fits the panel width
  // (with margin), capped so a short word doesn't take over the backrest —
  // so "JU" over "TRINDADE" reads big-over-small like the real chairs. Then
  // everything shrinks together if the block is too tall.
  const tamanhos = linhas.map((l) => Math.min(9, (w * 0.86) / (l.length * (GLYPH_W + 1) - 1)));
  const gap = 12;
  const alturaNatural = tamanhos.reduce((s, px) => s + GLYPH_H * px, 0) + gap * (linhas.length - 1);
  const escala = Math.min(1, (h * 0.8) / alturaNatural);
  const pxs = tamanhos.map((px) => Math.max(1.4, px * escala));
  const gapLinha = gap * escala;
  const alturaBloco = pxs.reduce((s, px) => s + GLYPH_H * px, 0) + gapLinha * (linhas.length - 1);
  const px = Math.min(...pxs);
  const centroY = { topo: 0.24, meio: 0.5, base: 0.76 }[posicao] * h;
  const topo = Math.max(px, Math.min(h - alturaBloco - px, centroY - alturaBloco / 2));

  const mascara = new Uint8Array(w * h);
  let y0 = topo;
  linhas.forEach((linha, li) => {
    const px = pxs[li];
    const larguraLinha = (linha.length * (GLYPH_W + 1) - 1) * px;
    const x0 = (w - larguraLinha) / 2;
    for (let y = Math.floor(y0); y < Math.ceil(y0 + GLYPH_H * px); y++) {
      for (let x = Math.floor(x0); x < Math.ceil(x0 + larguraLinha); x++) {
        if (x < 0 || y < 0 || x >= w || y >= h) continue;
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
  const contorno = new Uint8Array(w * h);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (mascara[y * w + x]) continue;
      search: for (let dy = -r; dy <= r; dy++) {
        for (let dx = -r; dx <= r; dx++) {
          const xx = x + dx;
          const yy = y + dy;
          if (xx >= 0 && yy >= 0 && xx < w && yy < h && mascara[yy * w + xx]) {
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

/** Writes the recolored chair into `saida` (same size as `foto`). */
export function pintarCadeira(foto: ImageData, saida: ImageData, op: Opcoes) {
  const src = foto.data;
  const out = saida.data;
  out.set(src);

  const A = hexRgb(op.corA);
  const B = hexRgb(op.corB);
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
  const cols = Math.ceil(w / CELULA);
  const rows = Math.ceil(h / CELULA);
  const nome = rasterizarNome(op.nome, op.posicao);
  for (let y = ENCOSTO.y0; y < ENCOSTO.y1; y++) {
    for (let x = ENCOSTO.x0; x < ENCOSTO.x1; x++) {
      const i = (y * IMG_W + x) * 4;
      const lx = x - ENCOSTO.x0;
      const ly = y - ENCOSTO.y0;
      let detalhe = celulaDaForma(op.forma, Math.floor(lx / CELULA), Math.floor(ly / CELULA), cols, rows);
      if (nome) {
        const k = ly * w + lx;
        if (ly >= nome.faixaY0 && ly <= nome.faixaY1) detalhe = false;
        if (nome.mascara[k]) detalhe = true;
        else if (nome.contorno[k]) detalhe = false;
      }
      pinta(i, detalhe ? B : A, sombraEscuro(brilho(i)));
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

  // Seat: dark thread -> A, white thread -> B, blend in between.
  for (let y = 519; y < 600; y++) {
    for (let x = 82; x < 398; x++) {
      if (!dentroPoligono(x, y, ASSENTO)) continue;
      const i = (y * IMG_W + x) * 4;
      const l = brilho(i);
      if (saturacao(i) > 60) continue; // pool/tiles peeking through
      if (l < 110) pinta(i, A, sombraEscuro(l));
      else if (l > 170) pinta(i, B, sombraClaro(l));
      else {
        const t = (l - 110) / 60;
        const s = sombraEscuro(l) * (1 - t) + sombraClaro(l) * t;
        pinta(i, [A[0] * (1 - t) + B[0] * t, A[1] * (1 - t) + B[1] * t, A[2] * (1 - t) + B[2] * t], s);
      }
    }
  }
}
