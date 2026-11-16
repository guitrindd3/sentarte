import { FOTO_COLS, FOTO_ROWS, MAX_LADO_DESENHO, type Desenho } from "./trama-foto";

// Pixel art and cross-stitch charts (admin Traçados, user 2026-11-16: "anexar
// uma imagem… em pixel ou em ponto cruz… e você coloca na cadeira").
// Instead of shrinking the picture (which blurs the stitches), find its own
// grid — the size of one pixel block, or the chart's square including its
// grid lines — and read one color per square, from the middle of the square so
// grid lines and the X of a stitch don't count. Every square that isn't the
// background color becomes a detail-thread point; the design keeps its exact
// stitches; a design bigger than 29x29 keeps its own size (no shrinking).
// lerPixelArte needs a browser (canvas); the rest is plain math.

const N = FOTO_COLS * FOTO_ROWS;

export type PixelArte = {
  /** RGB of each square, row by row. */
  cores: Uint8ClampedArray;
  cols: number;
  rows: number;
  fundo: [number, number, number];
};

const MAX_LADO_IMAGEM = 1600;

/** Share of rows (eixo x) or columns (eixo y) where the color changes at each position. */
export function perfilDeBordas(d: Uint8ClampedArray, w: number, h: number, eixo: "x" | "y") {
  const n = eixo === "x" ? w : h;
  const m = eixo === "x" ? h : w;
  const p = new Float32Array(n);
  for (let a = 1; a < n; a++) {
    let c = 0;
    for (let b = 0; b < m; b++) {
      const k1 = eixo === "x" ? (b * w + a) * 4 : (a * w + b) * 4;
      const k0 = eixo === "x" ? (b * w + a - 1) * 4 : ((a - 1) * w + b) * 4;
      if (Math.abs(d[k1] - d[k0]) + Math.abs(d[k1 + 1] - d[k0 + 1]) + Math.abs(d[k1 + 2] - d[k0 + 2]) > 60) c++;
    }
    p[a] = c / m;
  }
  return p;
}

/** The repeating square size (may be fractional) and where its first line is, or null when there's no grid. */
export function acharPeriodo(perfil: Float32Array): { p: number; o: number } | null {
  const n = perfil.length;
  const maximo = Math.max(...perfil);
  if (maximo < 0.01) return null;
  // the strong edges (grid lines, block borders); edges 1-3 px apart are one
  // line (both sides of a thin grid line, a JPEG smear)
  const picos: number[] = [];
  for (let x = 1; x < n; x++) {
    if (perfil[x] < maximo * 0.3) continue;
    const ultimo = picos[picos.length - 1];
    if (ultimo !== undefined && x - ultimo <= 3) continue;
    picos.push(x);
  }
  if (picos.length < 5) return null;
  const vaos = picos.slice(1).map((x, i) => x - picos[i]);
  // the biggest square size that every gap (or almost every) is a multiple of
  const explica = (p: number) => {
    const tol = Math.max(0.65, p * 0.06);
    let ok = 0;
    let somaG = 0;
    let somaM = 0;
    for (const g of vaos) {
      const m = Math.round(g / p);
      if (m >= 1 && Math.abs(g - m * p) <= tol) {
        ok++;
        somaG += g;
        somaM += m;
      }
    }
    return { fracao: ok / vaos.length, pAjustado: somaM ? somaG / somaM : p };
  };
  let melhor: { p: number; fracao: number } | null = null;
  const maiorVao = Math.max(...vaos);
  for (let p = 4; p <= maiorVao + 0.5; p += 0.05) {
    const e = explica(p);
    if (e.fracao >= 0.88 && (!melhor || p > melhor.p)) melhor = { p: e.pAjustado, fracao: e.fracao };
  }
  if (!melhor) return null;
  const p = melhor.p;
  // where the lines fall: average leftover of each edge against the size
  const ref = picos[0];
  let soma = 0;
  let k = 0;
  for (const x of picos) {
    const r = x - ref - Math.round((x - ref) / p) * p;
    if (Math.abs(r) <= Math.max(0.65, p * 0.06)) {
      soma += r;
      k++;
    }
  }
  let o = (ref + (k ? soma / k : 0)) % p;
  if (o < 0) o += p;
  return { p, o };
}

/** Squares from raw RGBA pixels (white under transparency already applied), or null when it isn't pixel art / a chart. */
export function lerPixelArteDosPixels(d: Uint8ClampedArray, w: number, h: number): PixelArte | null {
  let px: { p: number; o: number };
  let py: { p: number; o: number };
  const ax = acharPeriodo(perfilDeBordas(d, w, h, "x"));
  const ay = acharPeriodo(perfilDeBordas(d, w, h, "y"));
  if (!ax && !ay) {
    // a small picture without blocks: already one pixel per stitch
    if (w > 96 || h > 96) return null;
    px = { p: 1, o: 0 };
    py = { p: 1, o: 0 };
  } else {
    // squares are square: a side without enough edges borrows the other's size
    px = ax ?? { p: ay!.p, o: 0 };
    py = ay ?? { p: ax!.p, o: 0 };
    if (Math.abs(px.p - py.p) / Math.max(px.p, py.p) > 0.2) return null;
  }

  // start one square earlier only when there's most of a square before the
  // first line (a chart's outer line sits right at the edge)
  const inicioX = px.o >= px.p * 0.6 ? px.o - px.p : px.o;
  const inicioY = py.o >= py.p * 0.6 ? py.o - py.p : py.o;
  const cols = Math.floor((w - inicioX) / px.p + 1e-6);
  const rows = Math.floor((h - inicioY) / py.p + 1e-6);
  if (cols < 3 || rows < 3 || cols > MAX_LADO_DESENHO || rows > MAX_LADO_DESENHO) return null;

  const cores = new Uint8ClampedArray(cols * rows * 3);
  for (let j = 0; j < rows; j++) {
    for (let i = 0; i < cols; i++) {
      // middle half of the square: skips grid lines and stitch outlines
      const sx = inicioX + i * px.p;
      const sy = inicioY + j * py.p;
      const x0 = Math.max(0, Math.round(sx + px.p * 0.25));
      const x1 = Math.min(w, Math.max(x0 + 1, Math.round(sx + px.p * 0.75)));
      const y0 = Math.max(0, Math.round(sy + py.p * 0.25));
      const y1 = Math.min(h, Math.max(y0 + 1, Math.round(sy + py.p * 0.75)));
      let r = 0;
      let g = 0;
      let b = 0;
      let n = 0;
      for (let y = y0; y < y1; y++) {
        for (let x = x0; x < x1; x++) {
          const k = (y * w + x) * 4;
          r += d[k];
          g += d[k + 1];
          b += d[k + 2];
          n++;
        }
      }
      const o = (j * cols + i) * 3;
      cores[o] = n ? r / n : 255;
      cores[o + 1] = n ? g / n : 255;
      cores[o + 2] = n ? b / n : 255;
    }
  }

  // background = the most common color around the edge of the design
  const conta = new Map<number, { n: number; r: number; g: number; b: number }>();
  for (let j = 0; j < rows; j++) {
    for (let i = 0; i < cols; i++) {
      if (i && j && i < cols - 1 && j < rows - 1) continue;
      const o = (j * cols + i) * 3;
      const chave = ((cores[o] >> 5) << 6) | ((cores[o + 1] >> 5) << 3) | (cores[o + 2] >> 5);
      const v = conta.get(chave) ?? { n: 0, r: 0, g: 0, b: 0 };
      v.n++;
      v.r += cores[o];
      v.g += cores[o + 1];
      v.b += cores[o + 2];
      conta.set(chave, v);
    }
  }
  const f = [...conta.values()].sort((a, b) => b.n - a.n)[0];
  return { cores, cols, rows, fundo: [f.r / f.n, f.g / f.n, f.b / f.n] };
}

/** Browser: reads a picture into squares, or null when it doesn't look like pixel art or a chart (use the photo mode then). */
export function lerPixelArte(img: HTMLImageElement | HTMLCanvasElement | ImageBitmap): PixelArte | null {
  const w0 = "naturalWidth" in img ? img.naturalWidth : img.width;
  const h0 = "naturalHeight" in img ? img.naturalHeight : img.height;
  const esc = Math.min(1, MAX_LADO_IMAGEM / Math.max(w0, h0));
  const w = Math.max(1, Math.round(w0 * esc));
  const h = Math.max(1, Math.round(h0 * esc));
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const g = c.getContext("2d", { willReadFrequently: true })!;
  g.fillStyle = "#fff"; // transparent = background
  g.fillRect(0, 0, w, h);
  g.imageSmoothingEnabled = false;
  g.drawImage(img, 0, 0, w, h);
  return lerPixelArteDosPixels(g.getImageData(0, 0, w, h).data, w, h);
}

/**
 * The design from the squares: squares farther than `tolerancia` from the
 * background become points (the opposite with `inverter`), trimmed to the
 * design. Up to 29x29 it's centered on the classic grid; bigger, it keeps its
 * own size, point by point — never shrunk (user 2026-11-16: "não quero que o
 * desenho seja diminuído… deixa sem limite").
 */
export function gradeDaPixelArte(a: PixelArte, tolerancia: number, inverter: boolean): Desenho & { largura: number; altura: number } {
  const { cores, cols, rows, fundo } = a;
  const on = new Uint8Array(cols * rows);
  let x0 = cols;
  let y0 = rows;
  let x1 = -1;
  let y1 = -1;
  for (let j = 0; j < rows; j++) {
    for (let i = 0; i < cols; i++) {
      const o = (j * cols + i) * 3;
      if (Math.hypot(cores[o] - fundo[0], cores[o + 1] - fundo[1], cores[o + 2] - fundo[2]) > tolerancia) {
        on[j * cols + i] = 1;
        x0 = Math.min(x0, i);
        y0 = Math.min(y0, j);
        x1 = Math.max(x1, i);
        y1 = Math.max(y1, j);
      }
    }
  }
  if (x1 < 0) {
    const bits = new Uint8Array(N);
    return { bits: inverter ? bits.fill(1) : bits, cols: FOTO_COLS, rows: FOTO_ROWS, largura: 0, altura: 0 };
  }
  const bw = x1 - x0 + 1;
  const bh = y1 - y0 + 1;
  const grande = bw > FOTO_COLS || bh > FOTO_ROWS;
  const gc = grande ? bw : FOTO_COLS;
  const gr = grande ? bh : FOTO_ROWS;
  const ox = grande ? 0 : Math.floor((FOTO_COLS - bw) / 2);
  const oy = grande ? 0 : Math.floor((FOTO_ROWS - bh) / 2);
  const bits = new Uint8Array(gc * gr);
  for (let j = 0; j < bh; j++) for (let i = 0; i < bw; i++) bits[(oy + j) * gc + ox + i] = on[(y0 + j) * cols + x0 + i];
  if (inverter) for (let k = 0; k < bits.length; k++) bits[k] = bits[k] ? 0 : 1;
  return { bits, cols: gc, rows: gr, largura: bw, altura: bh };
}
