// "Sua foto vira trama" (user 2026-10-21): a photo becomes the backrest
// pattern. It's turned into the backrest's 29x29 woven-cell grid in the
// browser (the photo itself never leaves the phone) and only that grid travels,
// packed as base64url bits in the chair link (param `fd`, forma "foto").
// The encoding is shared by the browser, lib/chair-link.ts and the renderer.

export const FOTO_COLS = 29;
export const FOTO_ROWS = 29;
const N = FOTO_COLS * FOTO_ROWS;
const BYTES = Math.ceil(N / 8);
const B64 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";

export function codificarGrade(bits: Uint8Array): string {
  const bytes = new Uint8Array(BYTES);
  for (let k = 0; k < N; k++) if (bits[k]) bytes[k >> 3] |= 1 << (7 - (k & 7));
  let s = "";
  for (let i = 0; i < bytes.length; i += 3) {
    const n = (bytes[i] << 16) | ((bytes[i + 1] ?? 0) << 8) | (bytes[i + 2] ?? 0);
    s += B64[(n >> 18) & 63] + B64[(n >> 12) & 63] + B64[(n >> 6) & 63] + B64[n & 63];
  }
  return s;
}

/** The 29x29 grid (1 = detail thread), or null for anything malformed. */
export function decodificarGrade(s: string | null | undefined): Uint8Array | null {
  if (!s || s.length !== Math.ceil(BYTES / 3) * 4 || !/^[A-Za-z0-9_-]+$/.test(s)) return null;
  const bytes = new Uint8Array(Math.ceil(BYTES / 3) * 3);
  for (let i = 0, o = 0; i < s.length; i += 4, o += 3) {
    const n = (B64.indexOf(s[i]) << 18) | (B64.indexOf(s[i + 1]) << 12) | (B64.indexOf(s[i + 2]) << 6) | B64.indexOf(s[i + 3]);
    bytes[o] = (n >> 16) & 255;
    bytes[o + 1] = (n >> 8) & 255;
    bytes[o + 2] = n & 255;
  }
  const bits = new Uint8Array(N);
  for (let k = 0; k < N; k++) bits[k] = (bytes[k >> 3] >> (7 - (k & 7))) & 1;
  return bits;
}

/**
 * Any-size design (admin Traçados, user 2026-11-16: "retira esse limite de
 * 29x29… quero que ele fique do jeito que eu adiciono"). A design up to 29x29
 * keeps the old 144-char format above; a bigger one is "." + cols (2 chars) +
 * rows (2 chars) + its bits, and the chair draws it with smaller cells so every
 * stitch stays (lib/chair-render.ts).
 */
export type Desenho = { bits: Uint8Array; cols: number; rows: number };
export const MAX_LADO_DESENHO = 200;

function bitsEmTexto(bits: Uint8Array, n: number) {
  const bytes = new Uint8Array(Math.ceil(n / 8));
  for (let k = 0; k < n; k++) if (bits[k]) bytes[k >> 3] |= 1 << (7 - (k & 7));
  let s = "";
  for (let i = 0; i < bytes.length; i += 3) {
    const v = (bytes[i] << 16) | ((bytes[i + 1] ?? 0) << 8) | (bytes[i + 2] ?? 0);
    s += B64[(v >> 18) & 63] + B64[(v >> 12) & 63] + B64[(v >> 6) & 63] + B64[v & 63];
  }
  return s;
}

export function codificarDesenho(d: Desenho): string {
  if (d.cols === FOTO_COLS && d.rows === FOTO_ROWS) return codificarGrade(d.bits);
  const dois = (v: number) => B64[(v >> 6) & 63] + B64[v & 63];
  return "." + dois(d.cols) + dois(d.rows) + bitsEmTexto(d.bits, d.cols * d.rows);
}

/** A design of any size (the old 29x29 format too), or null for anything malformed. */
export function decodificarDesenho(s: string | null | undefined): Desenho | null {
  if (!s) return null;
  if (s[0] !== ".") {
    const bits = decodificarGrade(s);
    return bits ? { bits, cols: FOTO_COLS, rows: FOTO_ROWS } : null;
  }
  if (!/^\.[A-Za-z0-9_-]+$/.test(s) || s.length < 9) return null;
  const v = (i: number) => (B64.indexOf(s[i]) << 6) | B64.indexOf(s[i + 1]);
  const cols = v(1);
  const rows = v(3);
  if (cols < 1 || rows < 1 || cols > MAX_LADO_DESENHO || rows > MAX_LADO_DESENHO) return null;
  const n = cols * rows;
  const corpo = s.slice(5);
  if (corpo.length !== Math.ceil(Math.ceil(n / 8) / 3) * 4) return null;
  const bytes = new Uint8Array(Math.ceil(Math.ceil(n / 8) / 3) * 3);
  for (let i = 0, o = 0; i < corpo.length; i += 4, o += 3) {
    const x = (B64.indexOf(corpo[i]) << 18) | (B64.indexOf(corpo[i + 1]) << 12) | (B64.indexOf(corpo[i + 2]) << 6) | B64.indexOf(corpo[i + 3]);
    bytes[o] = (x >> 16) & 255;
    bytes[o + 1] = (x >> 8) & 255;
    bytes[o + 2] = x & 255;
  }
  const bits = new Uint8Array(n);
  for (let k = 0; k < n; k++) bits[k] = (bytes[k >> 3] >> (7 - (k & 7))) & 1;
  return { bits, cols, rows };
}

/**
 * Whether the point (x, y) of an area w x h (any unit) falls on a stitch of a
 * design bigger than 29x29: the design is fitted whole and centered, square cells.
 */
export function pontoDoDesenho(d: Desenho, x: number, y: number, w: number, h: number) {
  const s = Math.min(w / d.cols, h / d.rows);
  const i = Math.floor((x - (w - d.cols * s) / 2) / s);
  const j = Math.floor((y - (h - d.rows * s) / 2) / s);
  return i >= 0 && j >= 0 && i < d.cols && j < d.rows && d.bits[j * d.cols + i] === 1;
}

/**
 * Brightness of each point of a picture read as a photo or logo (0-255). The
 * WHOLE picture, in its own proportions — no square crop (user 2026-11-16: in
 * "Foto ou logo" the crop zoomed in and the drawing became unrecognizable):
 * the longer side gets `lado` points. Browser only.
 */
export function brilhoDaImagem(img: HTMLImageElement | HTMLCanvasElement | ImageBitmap, lado: number) {
  const w = "naturalWidth" in img ? img.naturalWidth : img.width;
  const h = "naturalHeight" in img ? img.naturalHeight : img.height;
  const n = Math.max(4, Math.min(MAX_LADO_DESENHO, Math.round(lado)));
  const cols = Math.max(1, Math.round(w >= h ? n : (n * w) / h));
  const rows = Math.max(1, Math.round(h >= w ? n : (n * h) / w));
  // two steps (to 8x, then to the grid) average better than one big jump
  const meio = document.createElement("canvas");
  meio.width = cols * 8;
  meio.height = rows * 8;
  const gm = meio.getContext("2d")!;
  gm.fillStyle = "#fff"; // transparent PNGs: the empty part is white
  gm.fillRect(0, 0, meio.width, meio.height);
  gm.imageSmoothingQuality = "high";
  gm.drawImage(img, 0, 0, meio.width, meio.height);
  const c = document.createElement("canvas");
  c.width = cols;
  c.height = rows;
  const g = c.getContext("2d", { willReadFrequently: true })!;
  g.imageSmoothingQuality = "high";
  g.drawImage(meio, 0, 0, cols, rows);
  const d = g.getImageData(0, 0, cols, rows).data;
  const brilho = new Float32Array(cols * rows);
  for (let k = 0; k < brilho.length; k++) brilho[k] = 0.299 * d[k * 4] + 0.587 * d[k * 4 + 1] + 0.114 * d[k * 4 + 2];
  return { brilho, cols, rows };
}

/** Otsu's threshold: the cut that best separates the dark and light cells. */
export function limiarAutomatico(brilho: Float32Array) {
  const hist = new Array(256).fill(0);
  for (const v of brilho) hist[Math.max(0, Math.min(255, Math.round(v)))]++;
  let soma = 0;
  for (let i = 0; i < 256; i++) soma += i * hist[i];
  let sB = 0, wB = 0, melhor = 0, limiar = 128;
  for (let t = 0; t < 256; t++) {
    wB += hist[t];
    if (!wB) continue;
    const wF = brilho.length - wB;
    if (!wF) break;
    sB += t * hist[t];
    const mB = sB / wB, mF = (soma - sB) / wF;
    const v = wB * wF * (mB - mF) ** 2;
    if (v > melhor) {
      melhor = v;
      limiar = t;
    }
  }
  return limiar;
}

/**
 * The grid: dark cells (below `limiar`) become the detail thread, or the light
 * ones with `inverter`. Lone cells are dropped: a single stray stitch reads as
 * a mistake on a woven chair.
 */
export function gradeDaFoto(brilho: Float32Array, limiar: number, inverter: boolean, cols = FOTO_COLS, rows = FOTO_ROWS): Uint8Array {
  const bits = new Uint8Array(cols * rows);
  for (let k = 0; k < bits.length; k++) bits[k] = (brilho[k] < limiar) !== inverter ? 1 : 0;
  const limpo = bits.slice();
  for (let j = 0; j < rows; j++) {
    for (let i = 0; i < cols; i++) {
      let iguais = 0, vizinhos = 0;
      for (let dj = -1; dj <= 1; dj++) {
        for (let di = -1; di <= 1; di++) {
          if (!di && !dj) continue;
          const x = i + di, y = j + dj;
          if (x < 0 || y < 0 || x >= cols || y >= rows) continue;
          vizinhos++;
          if (bits[y * cols + x] === bits[j * cols + i]) iguais++;
        }
      }
      if (iguais === 0 && vizinhos > 0) limpo[j * cols + i] = bits[j * cols + i] ? 0 : 1;
    }
  }
  return limpo;
}
