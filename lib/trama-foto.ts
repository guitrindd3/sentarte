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

/** Brightness of each cell (0-255), center-cropped to a square and averaged down. Browser only. */
export function brilhoDasCelulas(img: HTMLImageElement | HTMLCanvasElement | ImageBitmap): Float32Array {
  const w = "naturalWidth" in img ? img.naturalWidth : img.width;
  const h = "naturalHeight" in img ? img.naturalHeight : img.height;
  const lado = Math.min(w, h);
  // two steps (to 8x, then to the grid) average better than one big jump
  const meio = document.createElement("canvas");
  meio.width = FOTO_COLS * 8;
  meio.height = FOTO_ROWS * 8;
  const gm = meio.getContext("2d")!;
  gm.imageSmoothingQuality = "high";
  gm.drawImage(img, (w - lado) / 2, (h - lado) / 2, lado, lado, 0, 0, meio.width, meio.height);
  const c = document.createElement("canvas");
  c.width = FOTO_COLS;
  c.height = FOTO_ROWS;
  const g = c.getContext("2d", { willReadFrequently: true })!;
  g.imageSmoothingQuality = "high";
  g.drawImage(meio, 0, 0, FOTO_COLS, FOTO_ROWS);
  const d = g.getImageData(0, 0, FOTO_COLS, FOTO_ROWS).data;
  const out = new Float32Array(N);
  for (let k = 0; k < N; k++) {
    const a = d[k * 4 + 3] / 255; // transparent PNGs: treat the empty part as white
    out[k] = (0.299 * d[k * 4] + 0.587 * d[k * 4 + 1] + 0.114 * d[k * 4 + 2]) * a + 255 * (1 - a);
  }
  return out;
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
    const wF = N - wB;
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
export function gradeDaFoto(brilho: Float32Array, limiar: number, inverter: boolean): Uint8Array {
  const bits = new Uint8Array(N);
  for (let k = 0; k < N; k++) bits[k] = (brilho[k] < limiar) !== inverter ? 1 : 0;
  const limpo = bits.slice();
  for (let j = 0; j < FOTO_ROWS; j++) {
    for (let i = 0; i < FOTO_COLS; i++) {
      let iguais = 0, vizinhos = 0;
      for (let dj = -1; dj <= 1; dj++) {
        for (let di = -1; di <= 1; di++) {
          if (!di && !dj) continue;
          const x = i + di, y = j + dj;
          if (x < 0 || y < 0 || x >= FOTO_COLS || y >= FOTO_ROWS) continue;
          vizinhos++;
          if (bits[y * FOTO_COLS + x] === bits[j * FOTO_COLS + i]) iguais++;
        }
      }
      if (iguais === 0 && vizinhos > 0) limpo[j * FOTO_COLS + i] = bits[j * FOTO_COLS + i] ? 0 : 1;
    }
  }
  return limpo;
}
