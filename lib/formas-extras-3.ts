import { ICONES, ROTULOS_ICONES } from "./formas-icones";
import { centrada, celulaInteira, estrela, figura, meio, mod, repetido, type Centrada, type Teste } from "./formas-extras-2";

// Third batch (2026-10-03, user: "quero 150 para cada", "confere tudo que está
// parecido e muda", "mais variações de escudo de time"):
// - FORMAS_OCULTAS: near-duplicates (numbered variants of the same stripes,
//   checks, dots, zigzags...) taken out of the shape grid. Their tests still
//   exist, so old shared links (/c?f=...) keep rendering.
// - Phosphor icons (lib/formas-icones.ts) for every tab.
// - Generated team crests (outline × interior), geometric figures, boho
//   kilims/medallions/figures.

type Grupo = "basicos" | "time" | "boho" | "divertidos";

export const FORMAS_OCULTAS = new Set<string>([
  "listras-1x4", "listras-2x2", "listras-3x3", "lv-1-6", "lv-5-3", "faixas-2x2", "faixas-1x3", "faixas-3x5", "faixas-5x3",
  "fh-1-5", "fh-4-4", "xadrez-3", "xadrez-5", "xadrez-6", "xadrez-10", "pied-de-poule-grande", "bolinhas-miudas",
  "bolinhas-medias", "pontilhado-fino", "bolas-8", "diagonais-finas", "diagonais-invertidas", "diag-12-5-d", "grade-fina",
  "grade-5", "grade-diagonal-larga", "moldura-tripla", "moldura-2-6", "moldura-cheia", "tijolos-grandes", "anel",
  "cruz-diagonal-fina", "listrado-3", "listrado-7", "faixa-grossa-em-pe", "listra-central-fina", "faixas-nas-laterais",
  "aros-3", "aros-7", "faixa-grossa-deitada", "barra-embaixo", "faixa-diagonal-larga", "faixa-diagonal-fina", "cruz-larga",
  "cruz-fina", "cruz-nordica-larga", "numero-1", "numero-2", "numero-8", "numero-13", "numero-22", "estrelas-3",
  "estrela-entre-faixas", "ziguezague-fino", "ziguezague-largo", "zz-4-8-2", "rede-10", "cruzes-x", "diamante-simples",
  "losangos-aninhados-4", "losangos-cheios-grandes", "mini-losangos", "losangos-em-linha", "setas-para-cima", "setas-finas",
  "chevron-8-4", "chevron-para-cima", "flechas-deitadas", "triangulos-invertidos", "tri-8-10", "pontas", "ondas-grandes",
  "onda-3-14", "quadrados-3", "espiral-quadrada-dupla", "mandala-simples", "mandala-pontos", "kilim-largo",
  "coracaozinhos", "florzinhas", "ancoras", "notinhas", "cerejinhas", "fantasminhas", "gatinhos", "borboletinhas",
  "fig-oculos2",
  // 2026-10-10, user: "vi que tinha muitos repetidos" (Estilo boho) — look-alikes of other boho patterns
  "zz-8-16-2", "ondas-duplas", "losangos-pontilhados", "losangos-tres", "losangos-em-coluna", "contas-e-cruzes",
  "kilim-de-cruzes", "kilim-xadrez", "grega-boho", "diamantes-cheios", "triangulos-contorno", "grinalda",
  "roda-de-contas", "chevron-lateral", "flechas-para-baixo", "sol-de-pontas-duplas",
]);

const lista: { valor: string; rotulo: string; grupo: Grupo; teste: Teste }[] = [];
const add = (grupo: Grupo, valor: string, rotulo: string, teste: Teste) => lista.push({ valor, rotulo, grupo, teste });

/** Deterministic per-cell hash (for maze-like tiles). */
const hash = (a: number, b: number) => {
  let h = (Math.imul(a, 374761393) + Math.imul(b, 668265263)) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return (h ^ (h >>> 16)) >>> 0;
};
/** Angular distance from `a` to the nearest of n evenly spaced directions (phase `f`). */
const angDist = (a: number, n: number, f = 0) => {
  const p = (2 * Math.PI) / n;
  const d = mod(a - f, p);
  return Math.min(d, p - d);
};

// ===================== Icons =====================
for (const r of ROTULOS_ICONES) add(r.grupo, r.valor, r.rotulo, figura(ICONES[r.valor]));

// ===================== Time: crests (45) =====================
type Contorno = (u: number, v: number) => boolean;
const CONTORNOS: Record<string, [string, Contorno]> = {
  classico: ["", (u, v) => v >= -1 && v <= 1 && Math.abs(u) <= (v < 0.15 ? 1 : 1 - ((v - 0.15) / 0.85) ** 2)],
  arredondado: ["arredondado", (u, v) => v >= -1 && Math.abs(u) <= 1 && (v < 0.25 || u * u + ((v - 0.25) / 0.75) ** 2 <= 1)],
  bico: ["de bico", (u, v) => v >= -1 + 0.22 * Math.abs(u) && v <= 1 && Math.abs(u) <= (v < 0.15 ? 1 : 1 - ((v - 0.15) / 0.85) ** 2)],
  oval: ["oval", (u, v) => u * u + v * v <= 1],
  hexagonal: ["hexagonal", (u, v) => Math.abs(u) <= 1 && Math.abs(v) <= 1 - 0.5 * Math.abs(u)],
  chanfrado: ["chanfrado", (u, v) => v >= -1 && v <= 1 && Math.abs(u) - v <= 1.65 && Math.abs(u) <= (v < 0.15 ? 1 : 1 - ((v - 0.15) / 0.85) ** 2)],
  moderno: ["moderno", (u, v) => Math.abs(u) <= 1 && Math.abs(v) <= 1 && !(v > 0.45 && Math.abs(u) > 0.45 && (Math.abs(u) - 0.45) ** 2 + (v - 0.45) ** 2 > 0.3025)],
};
type Interior = (x: number, y: number, u: number, v: number, hw: number, hh: number, dentro: (u: number, v: number) => boolean) => boolean;
const INTERIORES: Record<string, [string, Interior]> = {
  listras: ["listrado", (x) => mod(x + 1, 4) < 2],
  faixas: ["com faixas", (_x, y) => mod(y + 1, 4) < 2],
  diagonal: ["com diagonal", (_x, _y, u, v) => Math.abs(u - v) < 0.28],
  cruz: ["com cruz", (x, y, _u, _v, _hw, hh) => Math.abs(x) <= 1 || Math.abs(y + Math.round(hh * 0.15)) <= 1],
  metade: ["meio a meio", (x) => x < 0],
  quarteis: ["esquartelado", (x, y, _u, _v, _hw, hh) => x < 0 !== y < -Math.round(hh * 0.1)],
  chevron: ["com chevron", (_x, _y, u, v) => Math.abs(v - (0.15 - Math.abs(u) * 0.55)) < 0.17],
  estrela: ["com estrela", (x, y, _u, _v, _hw, hh) => estrela(x, y, 0, -Math.round(hh * 0.08), hh * 0.5)],
  chefe: ["com topo", (_x, _y, _u, v) => v < -0.45],
  pala: ["com pala", (x, _y, _u, _v, hw) => Math.abs(x) <= hw * 0.3],
  aspa: ["com X", (_x, _y, u, v) => Math.abs(Math.abs(u) - Math.abs(v + 0.1)) < 0.2],
  bola: ["com bola", (x, y, _u, _v, hw, hh) => {
    const r = Math.hypot(x, y + hh * 0.05);
    return (r <= hw * 0.5 && r > hw * 0.5 - 1.4) || r <= 1;
  }],
  tresEstrelas: ["com três estrelas", (x, y, _u, _v, hw, hh) =>
    [-1, 0, 1].some((k) => estrela(x, y, Math.round(k * hw * 0.48), Math.round(-hh * (k === 0 ? 0.52 : 0.4)), hw * 0.27))],
  duplo: ["de contorno duplo", (x, y, _u, _v, hw, hh, dentro) => {
    const a = (d: number) => dentro((x / (hw - d)) * 1, (y / (hh - d)) * 1);
    return a(3.2) && !a(4.6);
  }],
  faixaEstrela: ["com faixa e estrela", (x, y, _u, _v, _hw, hh) => Math.abs(y - Math.round(hh * 0.25)) <= 1 || estrela(x, y, 0, -Math.round(hh * 0.3), hh * 0.32)],
};
// Each outline gets its own set of interiors, so no two crests repeat. The
// classic outline skips interiors the older crests already have.
const COMBINACOES: Record<string, string[]> = {
  classico: ["chevron", "quarteis", "chefe", "pala", "aspa", "bola", "tresEstrelas"],
  arredondado: ["listras", "estrela", "cruz", "metade", "chefe", "faixaEstrela"],
  bico: ["faixas", "diagonal", "estrela", "quarteis", "duplo", "bola"],
  oval: ["listras", "aspa", "metade", "faixaEstrela", "pala", "chevron", "duplo", "estrela"],
  hexagonal: ["faixas", "cruz", "estrela", "chefe", "tresEstrelas", "diagonal", "bola"],
  chanfrado: ["listras", "metade", "bola", "chevron", "aspa", "faixaEstrela"],
  moderno: ["diagonal", "quarteis", "pala", "tresEstrelas", "duplo", "cruz", "faixas"],
};
for (const [cNome, interiores] of Object.entries(COMBINACOES)) {
  const [cRotulo, dentro] = CONTORNOS[cNome];
  for (const iNome of interiores) {
    const [iRotulo, interior] = INTERIORES[iNome];
    add("time", `escudo-${cNome}-${iNome}`, ["Escudo", cRotulo, iRotulo].filter(Boolean).join(" "), centrada((x, y, R) => {
      const hw = Math.round(R * 0.78);
      const hh = Math.round(R * 0.95);
      if (!dentro(x / hw, y / hh)) return false;
      if (!dentro(x / (hw - 1.6), y / (hh - 1.6))) return true; // border
      return interior(x, y, x / hw, y / hh, hw, hh, dentro);
    }));
  }
}

// ===================== Básicos: geometric (26) =====================
const B = (valor: string, rotulo: string, f: Centrada) => add("basicos", valor, rotulo, centrada(f));
B("circulo-em-quatro", "Círculo em quatro", (x, y, R) => {
  const r = Math.hypot(x, y);
  return r <= R && (r > R - 1.4 || (x > 0 && y > 0) || (x < 0 && y < 0));
});
B("xadrez-redondo", "Xadrez redondo", (x, y, R) => {
  const r = Math.hypot(x, y);
  return r <= R && (r > R - 1.4 || mod(Math.floor((x + 1) / 3) + Math.floor((y + 1) / 3), 2) === 0);
});
B("circulo-listrado", "Círculo listrado", (x, y, R) => {
  const r = Math.hypot(x, y);
  return r <= R && (r > R - 1.4 || mod(y, 3) === 0);
});
add("basicos", "raios-oticos", "Raios", (i, j, cols, rows) => {
  const x = i - meio(cols);
  const y = j - meio(rows);
  return Math.hypot(x, y) > 1.5 && mod((Math.atan2(y, x) / (2 * Math.PI)) * 20, 1) < 0.5;
});
B("quadrado-e-losango", "Quadrado e losango", (x, y, R) => {
  const m = Math.max(Math.abs(x), Math.abs(y));
  const d = Math.abs(x) + Math.abs(y);
  const h = Math.round(R / 2);
  return (m <= R && m > R - 1) || (d <= R && d > R - 1) || (m <= h && m > h - 1) || (d <= h && d > h - 1);
});
add("basicos", "ladrilho", "Ladrilho hidráulico", (i, j, cols, rows) => {
  const { di, dj, inteira } = celulaInteira(i, j, cols, rows, 9, 4);
  if (!inteira) return false;
  if (Math.hypot(di, dj) <= 1.2) return true;
  return [[-4.5, -4.5], [4.5, -4.5], [-4.5, 4.5], [4.5, 4.5]].some(([cx, cy]) => {
    const r = Math.hypot(di - cx, dj - cy);
    return r >= 3.4 && r < 4.6;
  });
});
add("basicos", "labirinto-curvo", "Labirinto curvo", (i, j, cols, rows) => {
  const x = i - meio(cols) + 300;
  const y = j - meio(rows) + 300;
  const a = mod(x, 6);
  const b = mod(y, 6);
  const arco = (cx: number, cy: number) => Math.abs(Math.hypot(a - cx, b - cy) - 3) < 0.7;
  return hash(Math.floor(x / 6), Math.floor(y / 6)) % 2 ? arco(0, 0) || arco(6, 6) : arco(6, 0) || arco(0, 6);
});
add("basicos", "labirinto", "Labirinto", (i, j, cols, rows) => {
  const x = i - meio(cols) + 300;
  const y = j - meio(rows) + 300;
  const a = mod(x, 4);
  const b = mod(y, 4);
  return hash(Math.floor(x / 4), Math.floor(y / 4)) % 2 ? a === b : a + b === 3;
});
const BAYER = [[0, 8, 2, 10], [12, 4, 14, 6], [3, 11, 1, 9], [15, 7, 13, 5]];
add("basicos", "degrade-de-pontos", "Degradê de pontos", (i, j, _cols, rows) => (BAYER[j % 4][i % 4] + 0.5) / 16 < 0.06 + 0.84 * (j / (rows - 1)));
const CRESCENTES = (() => {
  const on: boolean[] = [];
  let p = 0;
  for (const w of [1, 1, 2, 2, 3, 3, 4, 4]) {
    for (let k = 0; k < 2; k++) on[p++] = false;
    for (let k = 0; k < w; k++) on[p++] = true;
  }
  return on;
})();
add("basicos", "listras-crescentes", "Listras crescentes", (i, _j, cols) => CRESCENTES[Math.abs(i - meio(cols))] ?? false);
add("basicos", "bolinhas-crescentes", "Bolinhas crescentes", (i, j, cols, rows) => {
  const { di, dj, inteira } = celulaInteira(i, j, cols, rows, 6, 2);
  if (!inteira) return false;
  const k = Math.floor((meio(cols) - 2) / 6);
  const ci = (i - di - meio(cols)) / 6;
  const r = 0.5 + (2 * (ci + k)) / Math.max(1, 2 * k);
  return di * di + dj * dj <= r * r;
});
add("basicos", "xadrez-otico", "Xadrez ótico", (i, j, cols, rows) => {
  const x = i - meio(cols);
  const y = j - meio(rows);
  return mod(Math.floor((x + 2 * Math.sin(y / 2.2)) / 4) + Math.floor((y + 2 * Math.sin(x / 2.2)) / 4), 2) === 0;
});
add("basicos", "circulos-oticos", "Círculos óticos", (i, j, cols, rows) => {
  const R = Math.min(meio(cols), meio(rows));
  return Math.floor(Math.hypot(i - meio(cols) + R * 0.35, j - meio(rows) + R * 0.35) / 2) % 2 === 0;
});
B("sierpinski", "Triângulo de Sierpinski", (x, y) => {
  const a = x + 8;
  const b = y + 8;
  return a >= 0 && b >= 0 && a < 16 && b < 16 && a <= b && (a & (15 - b)) === 0;
});
B("tapete-sierpinski", "Tapete de Sierpinski", (x, y, R) => {
  const n = R >= 13 ? 27 : 9;
  const esc = R >= 13 ? 1 : 2;
  const a = Math.floor((x + Math.floor((n * esc) / 2)) / esc);
  const b = Math.floor((y + Math.floor((n * esc) / 2)) / esc);
  if (a < 0 || b < 0 || a >= n || b >= n) return false;
  for (let k = 1; k < n; k *= 3) if (Math.floor(a / k) % 3 === 1 && Math.floor(b / k) % 3 === 1) return false;
  return true;
});
const HILBERT = (() => {
  const n = 8;
  const pts: [number, number][] = [];
  for (let d = 0; d < n * n; d++) {
    let x = 0;
    let y = 0;
    let t = d;
    for (let s = 1; s < n; s *= 2) {
      const rx = 1 & (t / 2);
      const ry = 1 & (t ^ rx);
      if (ry === 0) {
        if (rx === 1) {
          x = s - 1 - x;
          y = s - 1 - y;
        }
        [x, y] = [y, x];
      }
      x += s * rx;
      y += s * ry;
      t = Math.floor(t / 4);
    }
    pts.push([x * 2, y * 2]);
  }
  const on = new Set<string>();
  pts.forEach(([x, y], k) => {
    on.add(`${x},${y}`);
    if (k > 0) on.add(`${(x + pts[k - 1][0]) / 2},${(y + pts[k - 1][1]) / 2}`);
  });
  return on;
})();
B("curva-de-hilbert", "Curva de Hilbert", (x, y) => HILBERT.has(`${x + 7},${y + 7}`));
B("alvo-quadrado", "Alvo quadrado", (x, y, R) => {
  const m = Math.max(Math.abs(x), Math.abs(y));
  return m <= R && Math.floor(m / 2) % 2 === 0;
});
B("bolhas", "Bolhas", (x, y, R) =>
  [[-0.55, -0.5, 0.32], [0.35, -0.6, 0.22], [0.05, 0.05, 0.4], [-0.6, 0.5, 0.25], [0.6, 0.45, 0.3], [0.72, -0.05, 0.14], [-0.15, -0.82, 0.12]].some(
    ([u, v, k]) => {
      const r = Math.hypot(x - u * R, y - v * R);
      return r <= k * R && r > k * R - 1.3;
    }
  )
);
add("basicos", "grade-triangular", "Grade triangular", (i, j, cols, rows) => {
  const x = i - meio(cols);
  const y = j - meio(rows);
  return mod(y, 4) === 0 || mod(y - 2 * x, 8) === 0 || mod(y + 2 * x, 8) === 0;
});
B("piramide-vista-de-cima", "Pirâmide vista de cima", (x, y, R) => {
  const m = Math.max(Math.abs(x), Math.abs(y));
  const h = Math.round(R / 2);
  return m <= R && (m === R || m === h || Math.abs(x) === Math.abs(y));
});
add("basicos", "trama-de-cesto", "Trama de cesto", (i, j, cols, rows) => {
  const x = i - meio(cols) + 300;
  const y = j - meio(rows) + 300;
  return mod(Math.floor(x / 6) + Math.floor(y / 6), 2) === 0 ? mod(y, 2) === 0 : mod(x, 2) === 0;
});
B("gravata-borboleta", "Gravata-borboleta", (x, y, R) => {
  const ax = Math.abs(x);
  const ay = Math.abs(y);
  if (ax <= 2 && ay <= 2) return true;
  return ax >= 4 && ax <= R && ay <= ax * 0.65 && ay <= R * 0.62;
});
add("basicos", "moldura-de-triangulos", "Moldura de triângulos", (i, j, cols, rows) => {
  const d = Math.min(i, cols - 1 - i, j, rows - 1 - j);
  if (d === 0) return true;
  const ao = d === i || d === cols - 1 - i ? j - meio(rows) : i - meio(cols);
  return d <= 3 - Math.abs(mod(ao + 3, 6) - 3);
});
B("losango-bicolor", "Losango bicolor", (x, y, R) => {
  const d = Math.abs(x) + Math.abs(y);
  return d <= R && (x < 0 || d > R - 1.5 || x === 0);
});
B("listras-onduladas", "Listras onduladas", (x, y) => mod(Math.round(x + 2 * Math.sin((y * Math.PI) / 6)), 6) < 2);
const GIRASSOL = Array.from({ length: 70 }, (_, n) => [Math.sqrt(n + 0.5), n * 2.39996] as const);
B("pontos-em-espiral", "Pontos em espiral", (x, y, R) => {
  const c = (R - 1) / Math.sqrt(70);
  return GIRASSOL.some(([s, a]) => Math.hypot(x - c * s * Math.cos(a), y - c * s * Math.sin(a)) <= 0.75);
});

// ===================== Boho: kilims (22) =====================
type Faixa = { h: number; p: number; t: (dx: number, yl: number, c: number) => boolean };
const FAIXAS: Record<string, Faixa> = {
  linha: { h: 1, p: 0, t: () => true },
  linha2: { h: 3, p: 0, t: (_dx, yl) => yl !== 1 },
  pontos: { h: 1, p: 4, t: (dx) => dx === 0 },
  dentes: { h: 4, p: 8, t: (dx, yl) => Math.abs(dx) <= yl },
  losangos: { h: 7, p: 8, t: (dx, yl) => Math.abs(dx) + Math.abs(yl - 3) === 3 },
  losangosC: { h: 5, p: 6, t: (dx, yl) => Math.abs(dx) + Math.abs(yl - 2) <= 2 },
  xis: { h: 5, p: 6, t: (dx, yl) => Math.abs(dx) === Math.abs(yl - 2) && Math.abs(dx) <= 2 },
  zigue: { h: 4, p: 6, t: (dx, yl) => yl === 3 - Math.min(3, Math.abs(dx)) },
  ampulhetas: { h: 5, p: 6, t: (dx, yl) => Math.abs(dx) <= 2 && Math.abs(dx) >= Math.abs(yl - 2) },
  setas: { h: 5, p: 6, t: (dx, yl) => dx + 3 - (2 - Math.abs(yl - 2)) >= 0 && dx + 3 - (2 - Math.abs(yl - 2)) < 2 },
  cruzes: { h: 5, p: 6, t: (dx, yl) => (dx === 0 && Math.abs(yl - 2) <= 2) || (yl === 2 && Math.abs(dx) <= 2) },
  xadrezinho: { h: 2, p: 2, t: (_dx, yl, c) => mod(c, 2) === yl },
  grega: { h: 5, p: 8, t: (dx, yl) => ["XXXXXXX.", "......X.", "XXXXX.X.", "X...X.X.", "X.XXX.XX"][yl][dx + 4] === "X" },
  ondinha: { h: 3, p: 6, t: (dx, yl) => yl === Math.round(1 - Math.sin(((dx + 3) * Math.PI) / 3)) },
  contas: { h: 3, p: 4, t: (dx, yl) => Math.abs(dx) <= 1 && !(dx === 0 && yl === 1) },
};
function kilim(bandas: string[]): Teste {
  return (i, j, cols, rows) => {
    // symmetric stack: outer..., center, ...outer (mirrored)
    let pilha = [...bandas, ...bandas.slice(0, -1).reverse()];
    const altura = (p: string[]) => p.reduce((s, b) => s + FAIXAS[b].h, 0) + p.length - 1;
    while (altura(pilha) > rows - 2 && pilha.length > 1) pilha = pilha.slice(1, -1);
    const y0 = meio(rows) - Math.floor(altura(pilha) / 2);
    const x = i - meio(cols);
    let y = y0;
    for (let k = 0; k < pilha.length; k++) {
      const f = FAIXAS[pilha[k]];
      if (j >= y && j < y + f.h) {
        const espelhada = k > Math.floor(pilha.length / 2);
        const yl = espelhada ? f.h - 1 - (j - y) : j - y;
        if (f.p === 0) return f.t(0, yl, 0);
        const c = Math.floor((x + Math.floor(f.p / 2)) / f.p);
        const dx = x - c * f.p;
        // whole motifs only
        if (Math.abs(c * f.p) + Math.ceil(f.p / 2) > meio(cols)) return false;
        return f.t(dx, yl, c);
      }
      y += f.h + 1;
    }
    return false;
  };
}
const KILIMS: [string, string, string[]][] = [
  ["kilim-de-losangos", "Kilim de losangos", ["linha", "dentes", "losangos"]],
  ["kilim-de-cruzes", "Kilim de cruzes", ["linha2", "pontos", "cruzes"]],
  ["tapete-andino", "Tapete andino", ["linha", "zigue", "losangosC"]],
  ["faixa-de-ampulhetas", "Faixa de ampulhetas", ["pontos", "linha", "ampulhetas"]],
  ["kilim-de-setas", "Kilim de setas", ["linha2", "setas"]],
  ["grega-boho", "Grega boho", ["linha", "grega"]],
  ["kilim-xadrez", "Kilim xadrez", ["linha", "xadrezinho", "xis"]],
  ["ondas-tecidas", "Ondas tecidas", ["ondinha", "pontos", "ondinha"]],
  ["losangos-e-contas", "Losangos e contas", ["contas", "losangosC"]],
  ["kilim-real", "Kilim real", ["linha2", "dentes", "pontos", "losangos"]],
  ["tapete-tribal", "Tapete tribal", ["dentes", "xis", "losangosC"]],
  ["contas-e-cruzes", "Contas e cruzes", ["contas", "cruzes"]],
];
for (const [valor, rotulo, bandas] of KILIMS) add("boho", valor, rotulo, kilim(bandas));

// ===================== Boho: medallions (18) =====================
type Camada = (r: number, a: number, x: number, y: number, R: number) => boolean;
const anel = (k: number, t = 1.3): Camada => (r, _a, _x, _y, R) => r <= R * k && r > R * k - t;
const anelTracejado = (k: number, n: number): Camada => (r, a, _x, _y, R) => r <= R * k && r > R * k - 1.3 && Math.cos(n * a) > 0;
const disco = (k: number): Camada => (r, _a, _x, _y, R) => r <= R * k;
const pontos = (k: number, n: number, raio: number, f = 0): Camada => (_r, _a, x, y, R) => {
  for (let m = 0; m < n; m++) {
    const t = f + (2 * Math.PI * m) / n;
    if (Math.hypot(x - R * k * Math.cos(t), y - R * k * Math.sin(t)) <= raio) return true;
  }
  return false;
};
const petalas = (n: number, k1: number, k2: number, f = 0): Camada => (r, a, _x, _y, R) => {
  if (r < R * k1 || r > R * k2) return false;
  const t = (r - R * k1) / (R * (k2 - k1));
  return angDist(a, n, f) <= (Math.PI / n) * 0.9 * Math.sin(Math.PI * t);
};
const raios = (n: number, k1: number, k2: number, w: number, f = 0): Camada => (r, a, _x, _y, R) =>
  r >= R * k1 && r <= R * k2 && angDist(a, n, f) * r < w / 2;
const dentes = (n: number, k1: number, k2: number, f = 0): Camada => (r, a, _x, _y, R) =>
  r >= R * k1 && r <= R * k2 && angDist(a, n, f) <= (Math.PI / n) * (1 - (r - R * k1) / (R * (k2 - k1)));
const losangoL = (k: number): Camada => (_r, _a, x, y, R) => {
  const d = Math.abs(x) + Math.abs(y);
  return d <= R * k && d > R * k - 1.3;
};
const quadradoL = (k: number): Camada => (_r, _a, x, y, R) => {
  const m = Math.max(Math.abs(x), Math.abs(y));
  return m <= R * k && m > R * k - 1.3;
};
const estrelaL = (n: number, k1: number, k2: number): Camada => (r, a, _x, _y, R) => {
  const t = 1 - angDist(a, n) / (Math.PI / n);
  return Math.abs(r - R * (k1 + (k2 - k1) * t)) < 0.7;
};
const zigAnel = (k: number, n: number, amp: number): Camada => (r, a, _x, _y, R) => {
  const t = 1 - angDist(a, n) / (Math.PI / n);
  return Math.abs(r - R * (k - amp + 2 * amp * t)) < 0.65;
};
const folhas = (k: number, n: number): Camada => (_r, _a, x, y, R) => {
  for (let m = 0; m < n; m++) {
    const t = (2 * Math.PI * m) / n;
    const cx = R * k * Math.cos(t);
    const cy = R * k * Math.sin(t);
    const tx = -Math.sin(t);
    const ty = Math.cos(t);
    const along = (x - cx) * tx + (y - cy) * ty;
    const across = (x - cx) * Math.cos(t) + (y - cy) * Math.sin(t);
    if ((along / (R * 0.2)) ** 2 + (across / (R * 0.09)) ** 2 <= 1) return true;
  }
  return false;
};
const medalhao = (...camadas: Camada[]): Teste =>
  centrada((x, y, R) => {
    const r = Math.hypot(x, y);
    const a = Math.atan2(y, x);
    return camadas.some((c) => c(r, a, x, y, R));
  });
const MEDALHOES: [string, string, Teste][] = [
  ["rosacea", "Rosácea", medalhao(petalas(8, 0.25, 1), disco(0.18))],
  ["sol-tribal", "Sol tribal", medalhao(dentes(12, 0.66, 1), anel(0.58), disco(0.3))],
  ["estrela-tecida", "Estrela tecida", medalhao(estrelaL(8, 0.45, 1), estrelaL(8, 0.2, 0.5))],
  ["medalhao-de-pontos", "Medalhão de pontos", medalhao(anel(1), pontos(0.74, 12, 1.1), anel(0.5), disco(0.16))],
  ["flor-de-oito-raios", "Flor de oito raios", medalhao(raios(8, 0.32, 1, 2.2), anel(0.32))],
  ["roda-de-contas", "Roda de contas", medalhao(anel(1), anel(0.84), pontos(0.6, 8, 1.6), losangoL(0.32))],
  ["mandala-de-losangos", "Mandala de losangos", medalhao(losangoL(1), losangoL(0.7), quadradoL(0.48), disco(0.14))],
  ["medalhao-ondulado", "Medalhão ondulado", medalhao(zigAnel(0.86, 10, 0.1), zigAnel(0.5, 6, 0.13), disco(0.14))],
  ["lotus-tribal", "Lótus tribal", medalhao(petalas(6, 0.36, 1), anel(0.33), disco(0.12))],
  ["escudo-solar", "Escudo solar", medalhao(quadradoL(1), petalas(4, 0.12, 0.95, Math.PI / 4))],
  ["cata-sol", "Cata-sol", medalhao(dentes(16, 0.8, 1), anel(0.78), raios(16, 0.22, 0.64, 1.2))],
  ["rosa-tecida", "Rosa tecida", medalhao(estrelaL(5, 0.42, 1), anel(0.3), disco(0.1))],
  ["xadrez-circular", "Xadrez circular", centrada((x, y, R) => {
    const r = Math.hypot(x, y);
    return r <= R && (r > R - 1.3 || mod(Math.floor((Math.atan2(y, x) + Math.PI) / (Math.PI / 6)) + Math.floor(r / (R / 4)), 2) === 0);
  })],
  ["petalas-girando", "Pétalas girando", centrada((x, y, R) => {
    const r = Math.hypot(x, y);
    return r <= R && r > 1.5 && Math.cos(6 * Math.atan2(y, x) + r * 0.45) > 0.35;
  })],
  ["grinalda", "Grinalda", medalhao(folhas(0.78, 10), pontos(0.4, 6, 1.1))],
  ["mandala-quadrada", "Mandala quadrada", medalhao(quadradoL(1), quadradoL(0.8), raios(4, 0, 0.8, 1.3, Math.PI / 4), disco(0.25))],
  ["sol-de-pontas-duplas", "Sol de pontas duplas", medalhao(dentes(8, 0.55, 1), dentes(8, 0.3, 0.62, Math.PI / 8), disco(0.18))],
  ["aneis-tracejados", "Anéis tracejados", medalhao(anelTracejado(1, 24), anelTracejado(0.7, 16), anelTracejado(0.42, 8), disco(0.12))],
];
for (const [valor, rotulo, teste] of MEDALHOES) add("boho", valor, rotulo, teste);

// ===================== Boho: figures (15) =====================
const FIGURAS_BOHO: Record<string, [string, string[]]> = {
  lhama: ["Lhama", ["..X........", "..XX.......", ".XXXX......", ".X.XX......", ".XXXX......", "..XXX......", "..XXX......", "..XXXXXXXX.", "..XXXXXXXXX", "..XXXXXXXXX", "..XXXXXXXX.", "..X.X..X.X.", "..X.X..X.X.", "..X.X..X.X."]],
  cervo: ["Cervo", ["X.X.......X.X", "X.X.X...X.X.X", ".XXX.....XXX.", "..X.......X..", "..XX.....XX..", "...XXXXXXX...", "..XXXXXXXXX..", "XXX.XXXXX.XXX", "....XXXXX....", "....XXXXX....", ".....XXX.....", ".....X.X....."]],
  lagarto: ["Lagarto", [".....X.....", "....XXX....", "....XXX....", "X...XXX...X", ".XXXXXXXXX.", "....XXX....", "....XXX....", "....XXX....", ".XXXXXXXXX.", "X...XXX...X", ".....X.....", "......X....", ".....X.....", "....X......", ".....X....."]],
  cobra: ["Cobra", ["............XX.", "...........XXXX", "..XXX......X.XX", ".XX.XX....XX...", "XX...XX..XX....", "X.....XXXX....."]],
  "beija-flor": ["Beija-flor", ["........XX.....", ".......XXX.....", "......XXXX.....", "....XXXXX......", "XXXXX.XXXXX....", "....XXXXXXXX...", ".....XXXXXXXX..", "......XXX..XXX.", ".............XX"]],
  "peixe-tribal": ["Peixe tribal", ["...XXXXXXX....X", ".X...X.X..XX.XX", "X.X.X.X.X.X.XXX", "X.X.X.X.X.X.XXX", ".XX..X.X..XX.XX", "...XXXXXXX....X"]],
  "pena-dupla": ["Penas cruzadas", ["XX.........XX", "XXX.......XXX", ".XXX.....XXX.", ".XXXX...XXXX.", "..XXX...XXX..", "..XXXX.XXXX..", "...XXX.XXX...", "....XX.XX....", ".....X.X.....", "......X......", "......X......", "......X......"]],
  "cavalo-marinho": ["Cavalo-marinho", ["..XXX....", ".XXXXX...", "XX.XXXXXX", ".XXXX....", "..XXX....", "...XXX...", "...XXXX..", "..XXXXX..", "..XXXX...", "...XXX...", "....XX...", "..X..X...", "...XX...."]],
  lavanda: ["Lavanda", [".....X.....", "....X.X....", ".....X.....", "....X.X....", ".....X.....", "..X.X.X.X..", "...X.X.X...", "..X.XXX.X..", "...X.X.X...", ".....X.....", "....XXX....", "....X.X....", "...X...X...", "..X.....X.."]],
};
for (const [valor, [rotulo, d]] of Object.entries(FIGURAS_BOHO)) add("boho", `boho-${valor}`, rotulo, figura(d));
const H = (valor: string, rotulo: string, f: Centrada) => add("boho", valor, rotulo, centrada(f));
H("teia", "Teia", (x, y, R) => {
  const ax = Math.abs(x);
  const ay = Math.abs(y);
  const n = Math.max(ax, ay, (ax + ay) * 0.7071);
  if (n > R) return false;
  return x === 0 || y === 0 || ax === ay || [0.36, 0.68, 1].some((k) => Math.abs(n - R * k) < 0.6);
});
H("girassol", "Girassol", (x, y, R) => {
  const r = Math.hypot(x, y);
  if (r <= R * 0.38) return mod(x + y, 2) === 0 || r > R * 0.38 - 1;
  return r > R * 0.46 && r <= R * (0.72 + 0.28 * Math.abs(Math.cos(6 * Math.atan2(y, x))));
});
H("olho-tribal", "Olho tribal", (x, y, R) => {
  const lente = (s: number) => Math.hypot(x, y - s * 0.9) <= s * 1.3 && Math.hypot(x, y + s * 0.9) <= s * 1.3;
  const r = Math.hypot(x, y);
  const cilios = y < -R * 0.45 && y >= -R * 0.75 && mod(x, 3) === 0 && Math.abs(x) <= R * 0.6;
  return (lente(R) && !lente(R * 0.82)) || (r <= R * 0.36 && r > R * 0.24) || r <= R * 0.1 || cilios;
});
H("samambaia", "Samambaia", (x, y, R) => {
  if (y < -R || y > R) return false;
  const s = (R * 0.25 * (y + R) ** 2) / (4 * R * R);
  const dx = x - s;
  if (Math.abs(dx) < 0.6) return true;
  for (let k = 0; k < 7; k++) {
    const yk = -R * 0.85 + k * ((R * 1.6) / 7);
    const L = ((yk + R) / (2 * R)) * R * 0.85 + 1;
    if (Math.abs(dx) <= L && Math.abs(y - (yk - Math.abs(dx) * 0.5)) < 0.6) return true;
  }
  return false;
});
H("ponta-de-flecha", "Ponta de flecha", (x, y, R) => {
  const ax = Math.abs(x);
  const tri = (s: number) => y >= -s && y <= s * 0.7 && ax <= ((y + s) / (1.7 * s)) * s * 0.75;
  if (!tri(R) || (y > R * 0.35 && ax < R * 0.18)) return false;
  return !tri(R - 2) || mod(Math.round(y + ax * 0.6), 4) === 0;
});
H("lua-e-montanha", "Lua e montanha", (x, y, R) => {
  const pico = (c: number, h: number) => y >= R - h + Math.abs(x - c) * 1.1;
  const montanha = y <= R && (pico(-R * 0.35, R * 0.95) || pico(R * 0.4, R * 0.7));
  const lua = Math.hypot(x - R * 0.45, y + R * 0.55) <= R * 0.32 && Math.hypot(x - R * 0.58, y + R * 0.62) > R * 0.27;
  return montanha || lua;
});

H("ferradura", "Ferradura", (x, y, R) => {
  const r = Math.hypot(x, y);
  const ax = Math.abs(x);
  const corpo = y <= 0 ? r >= R * 0.55 && r <= R * 0.92 : y <= R * 0.85 && ax >= R * 0.55 && ax <= R * 0.92;
  if (!corpo) return false;
  const furos = [[-0.52, -0.52], [0.52, -0.52], [-0.73, 0], [0.73, 0], [-0.73, 0.45], [0.73, 0.45]];
  return !furos.some(([u, v]) => Math.hypot(x - u * R, y - v * R) < 1);
});
H("sol-e-lua", "Sol e lua", (x, y, R) => {
  const r = Math.hypot(x, y);
  if (x < 0) return r <= R * 0.5 || (r >= R * 0.62 && r <= R && angDist(Math.atan2(y, x), 12) * r < 1);
  return r <= R * 0.9 && Math.hypot(x - R * 0.35, y) > R * 0.62;
});
H("passaros", "Pássaros voando", (x, y, R) =>
  [[-0.45, -0.45, 0.45], [0.35, -0.2, 0.38], [-0.1, 0.3, 0.5], [0.6, 0.55, 0.28]].some(([u, v, k]) => {
    const w = Math.abs(x - u * R);
    const s = k * R;
    return w <= s && Math.abs(y - (v * R - 0.55 * s * Math.sin((Math.PI * w) / s))) < 0.75;
  })
);
H("nautilo", "Náutilo", (x, y, R) => {
  const r = Math.hypot(x, y);
  if (r > R || r < 1) return false;
  const b = 0.17;
  const a = R / Math.exp(b * 6 * Math.PI);
  const t = Math.atan2(y, x) + Math.PI;
  const voltas = [0, 1, 2].map((k) => a * Math.exp(b * (t + 2 * Math.PI * k))).filter((v) => v <= R);
  if (voltas.some((v) => Math.abs(r - v) < 0.7)) return true;
  const fora = Math.max(0, ...voltas);
  return r < fora && angDist(t, 12) * r < 0.5;
});
H("pena-de-pavao", "Pena de pavão", (x, y, R) => {
  if (x === 0 && y >= -R * 0.1 && y <= R) return true;
  const ex = x / (R * 0.5);
  const ey = (y + R * 0.25) / (R * 0.75);
  if (ex * ex + ey * ey > 1) return false;
  const ox = x / (R * 0.24);
  const oy = (y + R * 0.38) / (R * 0.3);
  const olho = ox * ox + oy * oy;
  if (olho <= 1) return olho <= 0.35 || olho > 0.7;
  return ex * ex + ey * ey > 0.8 || mod(Math.round(y - Math.abs(x) * 0.6), 3) === 0;
});
H("tear", "Tear", (x, y, R) => {
  const ax = Math.abs(x);
  if (ax > R * 0.85 || Math.abs(y) > R * 0.92) return false;
  if (Math.abs(y) > R * 0.92 - 2 || ax > R * 0.85 - 1) return true;
  return y < 0 ? mod(x, 2) === 0 : mod(x + y, 2) === 0;
});
H("corrente", "Corrente", (x, y, R) =>
  [-0.6, 0, 0.6].some((v) => {
    const cy = Math.round(v * R);
    for (let k = -3; k <= 3; k++) {
      const cx = k * 5;
      if (Math.abs(cx) + 3.5 > R) continue;
      const r = Math.hypot(x - cx, y - cy);
      if (r <= 3.3 && r > 2.1) return true;
    }
    return false;
  })
);
H("triscele", "Tríscele", (x, y, R) =>
  [-90, 30, 150].some((g) => {
    const cx = R * 0.45 * Math.cos((g * Math.PI) / 180);
    const cy = R * 0.45 * Math.sin((g * Math.PI) / 180);
    const r = Math.hypot(x - cx, y - cy);
    if (r > R * 0.5) return false;
    const v = r / 1.6 - (Math.atan2(y - cy, x - cx) + Math.PI) / (2 * Math.PI);
    return v - Math.floor(v) < 0.42;
  })
);
H("bambu", "Bambu", (x, y, R) => {
  if (Math.abs(y) > R) return false;
  return [[-0.55, 0], [0, 3], [0.55, 1]].some(([u, off], k) => {
    const cx = Math.round(u * R);
    const dx = x - cx;
    if (Math.abs(dx) <= 1 && mod(y + off, 7) !== 0) return true;
    const no = y - mod(y + off, 7);
    const lado = k === 1 ? -1 : 1;
    const t = (dx - 2 * lado) * lado;
    return t >= 0 && t <= 3 && y - no === -t + 0 && mod(Math.floor((no + off) / 7), 2) === 0;
  });
});
H("pinha", "Pinha", (x, y, R) => {
  if (Math.abs(x) <= 0.6 && y >= -R && y < -R * 0.82) return true;
  const e = (x / (R * 0.62)) ** 2 + ((y + R * 0.05) / (R * 0.8)) ** 2;
  if (e > 1) return false;
  return e > 0.82 || mod(x + y, 4) === 0 || mod(x - y, 4) === 0;
});

// ===================== Boho: textures (10) =====================
H("gota-tribal", "Gota tribal", (x, y, R) => {
  const gota = (k: number) => {
    const s = R * k;
    return Math.hypot(x, y - 0.3 * s) <= 0.6 * s || (y < 0.3 * s && y >= -s && Math.abs(x) <= (0.6 * (y + s)) / 1.3);
  };
  return (gota(1) && !gota(1 - 1.5 / R)) || (gota(0.64) && !gota(0.64 - 1.5 / R)) || gota(0.28);
});
add("boho", "ikat", "Ikat", (i, j, cols, rows) => {
  const { di, dj, inteira } = celulaInteira(i, j, cols, rows, 10, 4);
  if (!inteira) return false;
  const jitter = (hash(j, 7) % 3) - 1;
  const d = Math.abs(di + jitter) + Math.abs(dj);
  return Math.abs(d - 3) < 0.8 || d <= 0.5;
});
H("leque", "Leque", (x, y, R) => {
  const cy = R * 0.55;
  const r = Math.hypot(x, y - cy);
  if (y > cy || r > R * 1.4 || r < 2) return false;
  const a = Math.atan2(cy - y, x);
  const borda = R * 1.4 - 1.2 * Math.abs(Math.sin(a * 9));
  return r <= borda && (r > borda - 1.3 || mod(Math.floor(a / (Math.PI / 12)), 2) === 0);
});
add("boho", "penas-em-fileira", "Penas em fileira", repetido([".X.", "XXX", "XXX", "XXX", ".X.", ".X."], 2));
add("boho", "sementes", "Sementes", (i, j, cols, rows) => {
  const { di, dj, inteira } = celulaInteira(i, j, cols, rows, 6, 2);
  if (!inteira) return false;
  const s = mod(Math.round((i - di) / 6) + Math.round((j - dj) / 6), 2) ? 1 : -1;
  const u = (di + s * dj) / Math.SQRT2;
  const v = (di - s * dj) / Math.SQRT2;
  return (u / 2.6) ** 2 + (v / 1.2) ** 2 <= 1;
});
H("ponto-cruz", "Ponto cruz", (x, y, R) => {
  if (Math.abs(x) + Math.abs(y) > R * 0.95) return false;
  const a = mod(x + 1, 3);
  const b = mod(y + 1, 3);
  return a === b || a + b === 2;
});
add("boho", "shibori", "Shibori", (i, j, cols, rows) => {
  const { di, dj, inteira } = celulaInteira(i, j, cols, rows, 10, 4);
  if (!inteira) return false;
  const r = Math.hypot(di, dj);
  return r <= 0.8 || (Math.abs(r - 3.5) < 0.7 && Math.cos(5 * Math.atan2(dj, di)) > -0.2);
});
add("boho", "escada-tribal", "Escada tribal", (i, j) => mod(Math.floor(i / 2) + Math.floor(j / 2), 4) === 0);
add("boho", "fio-de-contas", "Fios de contas", (i, j, cols, rows) => {
  const x = i - meio(cols);
  const y = j - meio(rows);
  const cx = Math.round(x / 6) * 6;
  if (Math.abs(cx) + 2 > meio(cols)) return false;
  const cy = Math.round((y - mod(cx / 6, 2) * 3) / 6) * 6 + mod(cx / 6, 2) * 3;
  const r = Math.hypot(x - cx, y - cy);
  return (x === cx && r > 1.6) || (r <= 1.8 && r > 0.6);
});
add("boho", "folhagem", "Folhagem", repetido(["...XX", "..XXX", ".XX.X", "XXXX.", "X...."], 2));

export const FORMAS_EXTRAS_3: Record<string, Teste> = Object.fromEntries(lista.map((f) => [f.valor, f.teste]));
export const ROTULOS_EXTRAS_3 = lista.map(({ valor, rotulo, grupo }) => ({ valor, rotulo, grupo }));
