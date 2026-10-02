import { GLYPH_H, GLYPH_W, glyphPixel } from "./pixel-font";

// Second batch (2026-10-02, user: "100 para cada"): 50 more per tab. Same
// contract as formas-extras.ts — (i, j, cols, rows) → detail color? — on the
// backrest pattern grid (29×29) or the seat panel (61×27).

type Teste = (i: number, j: number, cols: number, rows: number) => boolean;
type Grupo = "basicos" | "time" | "boho" | "divertidos";

const meio = (n: number) => Math.floor(n / 2);
const mod = (a: number, n: number) => ((a % n) + n) % n;

function figura(d: string[]): Teste {
  const h = d.length;
  const w = d[0].length;
  return (i, j, cols, rows) => {
    const esc = Math.min((cols * 0.85) / w, (rows * 0.78) / h);
    const x0 = (cols - w * esc) / 2;
    const y0 = (rows - h * esc) / 2;
    const sx = Math.floor((i + 0.5 - x0) / esc);
    const sy = Math.floor((j + 0.5 - y0) / esc);
    return sy >= 0 && sy < h && sx >= 0 && sx < w && d[sy][sx] === "X";
  };
}

/** Small sprite repeated in a staggered grid, centered. */
function repetido(d: string[], gap = 2): Teste {
  const h = d.length;
  const w = d[0].length;
  const pw = w + gap;
  const ph = h + gap;
  return (i, j, cols, rows) => {
    const linha = Math.floor((j - mod(meio(rows) - meio(h), ph) + ph * 50) / ph) - 50;
    const off = linha % 2 === 0 ? 0 : Math.floor(pw / 2);
    const x = mod(i - meio(cols) + meio(w) - off, pw);
    const y = mod(j - meio(rows) + meio(h), ph);
    if (x >= w || y >= h || d[y][x] !== "X") return false;
    // only whole sprites — never a piece cut by the edge
    return i - x >= 0 && i - x + w <= cols && j - y >= 0 && j - y + h <= rows;
  };
}

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
  const s = mod(a, (2 * Math.PI) / 5);
  const t = Math.abs(s / ((2 * Math.PI) / 5) - 0.5) * 2;
  return r <= R * 0.42 + R * 0.58 * t;
}

function noEscudo(i: number, j: number, cols: number, rows: number) {
  const cx = meio(cols);
  const cy = meio(rows);
  const hw = Math.min(10, cols * 0.35);
  const x = Math.abs(i - cx) / hw;
  const y = (j - (cy - 10)) / 21;
  if (y < 0 || y > 1) return false;
  return x <= (y < 0.5 ? 1 : 1 - (y - 0.5) / 0.5);
}

/** Repeating cell of size p centered on the panel; `inteira` when the whole cell (radius r) fits. */
function celulaInteira(i: number, j: number, cols: number, rows: number, p: number, r: number) {
  const di = mod(i - meio(cols) + Math.floor(p / 2), p) - Math.floor(p / 2);
  const dj = mod(j - meio(rows) + Math.floor(p / 2), p) - Math.floor(p / 2);
  const ci = i - di;
  const cj = j - dj;
  const inteira = ci - r >= 0 && ci + r <= cols - 1 && cj - r >= 0 && cj + r <= rows - 1;
  return { di, dj, inteira };
}

/** V lines (chevrons), kept only when the whole V fits top to bottom. */
function chevronInteiro(i: number, j: number, cols: number, rows: number, p: number, incl: number, paraCima = false) {
  const larg = 1.5;
  const dx = Math.abs(i - meio(cols));
  const y = paraCima ? j + dx * incl : j - dx * incl;
  const k = Math.floor(y / p);
  if (y - k * p >= larg) return false;
  const topo = paraCima ? k * p - meio(cols) * incl : k * p;
  const base = paraCima ? k * p + larg : k * p + meio(cols) * incl + larg;
  return topo >= 0 && base <= rows;
}

/** Figure drawn in coordinates centered on the panel; R = largest radius that fits. */
type Centrada = (x: number, y: number, R: number) => boolean;
const centrada = (f: Centrada): Teste => (i, j, cols, rows) => f(i - meio(cols), j - meio(rows), Math.min(meio(cols), meio(rows)) - 1);
const hex = (x: number, y: number, r: number) => Math.abs(y) <= r * 0.87 && Math.abs(x) + Math.abs(y) * 0.577 <= r;
const oct = (x: number, y: number, r: number) => Math.abs(x) <= r && Math.abs(y) <= r && Math.abs(x) + Math.abs(y) <= r * 1.42;
/** Horizontal almond (eye) shape, half-width ≈ 0.94·s. */
const lente = (x: number, y: number, s: number) => Math.hypot(x, y - s * 0.9) <= s * 1.3 && Math.hypot(x, y + s * 0.9) <= s * 1.3;
const mais = (x: number, y: number, a: number, L: number) => (Math.abs(x) <= a && Math.abs(y) <= L) || (Math.abs(y) <= a && Math.abs(x) <= L);

const lista: { valor: string; rotulo: string; grupo: Grupo; teste: Teste }[] = [];
const add = (grupo: Grupo, valor: string, rotulo: string, teste: Teste) => lista.push({ valor, rotulo, grupo, teste });

// ===================== Básicos (50) =====================
for (const [w, g] of [[1, 6], [5, 3]] as const) {
  add("basicos", `lv-${w}-${g}`, `Listras ${w}·${g}`, (i, _j, cols) => mod(Math.abs(i - meio(cols)) + meio(w), w + g) < w);
}
for (const [w, g] of [[1, 5], [4, 4]] as const) {
  add("basicos", `fh-${w}-${g}`, `Faixas ${w}·${g}`, (_i, j, _c, rows) => mod(Math.abs(j - meio(rows)) + meio(w), w + g) < w);
}
for (const n of [10]) {
  add("basicos", `xadrez-${n}`, `Xadrez ${n}`, (i, j, cols, rows) => (Math.floor((i - meio(cols) + 1000 * n) / n) + Math.floor((j - meio(rows) + 1000 * n) / n)) % 2 === 0);
}
add("basicos", "xadrez-retangular", "Xadrez retangular", (i, j) => (Math.floor(i / 6) + Math.floor(j / 3)) % 2 === 0);
add("basicos", "xadrez-diagonal", "Xadrez diagonal", (i, j) => (Math.floor((i + j) / 4) + Math.floor((i - j + 400) / 4)) % 2 === 0);
for (const [p, r] of [[8, 2.2]] as const) {
  add("basicos", `bolas-${p}`, `Bolinhas ${p}`, (i, j, cols, rows) => {
    const { di, dj, inteira } = celulaInteira(i, j, cols, rows, p, Math.ceil(r));
    return inteira && di * di + dj * dj <= r * r;
  });
}
add("basicos", "aneis", "Anéis", (i, j, cols, rows) => {
  const { di, dj, inteira } = celulaInteira(i, j, cols, rows, 9, 4);
  const r = Math.hypot(di, dj);
  return inteira && r >= 2.3 && r < 3.6;
});
for (const [p, l, dir] of [[12, 5, 1]] as const) {
  add("basicos", `diag-${p}-${l}-${dir > 0 ? "d" : "e"}`, `Diagonais ${dir > 0 ? "↘" : "↙"} ${p}`, (i, j) => mod(i + dir * j, p) < l);
}
for (const p of [5]) add("basicos", `grade-${p}`, `Grade ${p}`, (i, j) => i % p === 0 || j % p === 0);
add("basicos", "grade-diagonal-larga", "Grade diagonal larga", (i, j) => mod(i + j, 10) === 0 || mod(i - j, 10) === 0);
add("basicos", "grade-pontilhada", "Grade pontilhada", (i, j) => (i % 6 === 0 && j % 2 === 0) || (j % 6 === 0 && i % 2 === 0));
for (const [a, b] of [[2, 6]] as const) {
  add("basicos", `moldura-${a}-${b}`, `Moldura ${a}·${b}`, (i, j, cols, rows) => {
    const bd = Math.min(i, cols - 1 - i, j, rows - 1 - j);
    return bd === a || bd === b;
  });
}
add("basicos", "moldura-cheia", "Moldura cheia", (i, j, cols, rows) => {
  const bd = Math.min(i, cols - 1 - i, j, rows - 1 - j);
  return bd >= 2 && bd <= 4;
});
add("basicos", "tijolos-grandes", "Tijolos grandes", (i, j) => j % 6 === 5 || (Math.floor(j / 6) % 2 === 0 ? i % 12 === 0 : (i + 6) % 12 === 0));
add("basicos", "tijolos-em-pe", "Tijolos em pé", (i, j) => i % 4 === 3 || (Math.floor(i / 4) % 2 === 0 ? j % 8 === 0 : (j + 4) % 8 === 0));
add("basicos", "pied-de-poule-grande", "Pied-de-poule grande", (i, j) => ["XX..", "XXX.", "..XX", ".X.."][Math.floor(j / 2) % 4][Math.floor(i / 2) % 4] === "X");
add("basicos", "barras-centrais", "Três barras", (i, _j, cols) => [-6, 0, 6].some((d) => Math.abs(i - meio(cols) - d) <= 1));
add("basicos", "quadrado-vazado", "Quadrado vazado", (i, j, cols, rows) => {
  const m = Math.max(Math.abs(i - meio(cols)), Math.abs(j - meio(rows)));
  return m >= 6 && m <= 8;
});
add("basicos", "circulo-cheio", "Círculo cheio", (i, j, cols, rows) => Math.hypot(i - meio(cols), j - meio(rows)) <= Math.min(meio(cols), meio(rows)) - 3);
add("basicos", "dois-circulos", "Dois círculos", (i, j, cols, rows) => {
  const r = Math.hypot(i - meio(cols), j - meio(rows));
  const R = Math.min(meio(cols), meio(rows)) - 1;
  return (r <= R && r > R - 1.5) || (r <= R - 5 && r > R - 6.5);
});
add("basicos", "losango-cheio", "Losango cheio", (i, j, cols, rows) => Math.abs(i - meio(cols)) / (meio(cols) - 1) + Math.abs(j - meio(rows)) / (meio(rows) - 1) <= 0.7);
add("basicos", "cruz-diagonal-fina", "X fino", (i, j, cols, rows) => {
  const u = i / (cols - 1);
  const v = j / (rows - 1);
  return Math.abs(u - v) < 0.035 || Math.abs(u + v - 1) < 0.035;
});

// Distinct figures (2026-10-02, user found the numbered variants repetitive)
const B = (valor: string, rotulo: string, f: Centrada) => add("basicos", valor, rotulo, centrada(f));
B("hexagono", "Hexágono", (x, y, R) => hex(x, y, R) && !hex(x, y, R - 2.2));
B("octogono", "Octógono", (x, y, R) => oct(x, y, R) && !(oct(x, y, R - 2.5) && !oct(x, y, R - 4.5)));
B("triangulo-cheio", "Triângulo", (x, y, R) => y >= -R * 0.8 && y <= R * 0.8 && Math.abs(x) <= ((y + R * 0.8) / (1.6 * R)) * R);
B("estrela-vazada", "Estrela vazada", (x, y, R) => estrela(x, y, 0, 1, R) && !estrela(x, y, 0, 1, R - 3.5));
B("anel", "Anel", (x, y, R) => {
  const r = Math.hypot(x, y);
  return r <= R && r > R - 3.5;
});
B("semicirculo", "Semicírculo", (x, y, R) => y >= -R * 0.4 && Math.hypot(x, y + R * 0.4) <= R);
B("quatro-quadrados", "Quatro quadrados", (x, y, R) => {
  const ax = Math.abs(x);
  const ay = Math.abs(y);
  const a = R * 0.2;
  if (ax < a || ay < a || ax > R || ay > R) return false;
  return ax < a + 1.5 || ay < a + 1.5 || ax > R - 1.5 || ay > R - 1.5;
});
B("nove-bolas", "Nove bolas", (x, y, R) => {
  const p = R * 0.68;
  const cx = Math.max(-1, Math.min(1, Math.round(x / p))) * p;
  const cy = Math.max(-1, Math.min(1, Math.round(y / p))) * p;
  return Math.hypot(x - cx, y - cy) <= R * 0.27;
});
B("quatro-pontas", "Quatro pontas", (x, y, R) => {
  const ax = Math.abs(x);
  const ay = Math.abs(y);
  return (ax <= R && ay <= (ax - 1) * 0.45) || (ay <= R && ax <= (ay - 1) * 0.45);
});
B("cata-vento", "Cata-vento", (x, y, R) => Math.abs(x) <= R && Math.abs(y) <= R && mod(Math.atan2(y, x), Math.PI / 2) < Math.PI / 4);
B("zigurate", "Zigurate", (x, y, R) => {
  if (y < -R * 0.8 || y > R * 0.8) return false;
  const k = Math.min(4, Math.floor((y + R * 0.8) / ((1.6 * R) / 5)));
  return Math.abs(x) <= ((k + 1) * R) / 5;
});
B("olho", "Olho", (x, y, R) => (lente(x, y, R) && !lente(x, y, R * 0.75)) || Math.hypot(x, y) <= R * 0.26);
B("estrela-oito", "Estrela de oito pontas", (x, y, R) => {
  const ax = Math.abs(x);
  const ay = Math.abs(y);
  const s = R * 0.68;
  return (Math.max(ax, ay) <= s || ax + ay <= s * 1.45) && Math.hypot(x, y) > R * 0.22;
});
B("seta-dupla", "Seta dupla", (x, y, R) => {
  const ax = Math.abs(x);
  const ay = Math.abs(y);
  return ay <= R && (ax <= 1 || (ay >= R * 0.35 && ax <= (R - ay) * 0.9));
});
B("seta-grande", "Seta para cima", (x, y, R) => (y >= -R && y <= 0 && Math.abs(x) <= (y + R) * 0.9) || (y > 0 && y <= R && Math.abs(x) <= 2));
B("curva", "Curva", (x, y, R) => Math.abs(x) <= R && Math.abs(y - R * 0.45 * Math.sin((x * Math.PI) / R)) <= 1.6);
B("cruz-vazada", "Cruz vazada", (x, y, R) => mais(x, y, R * 0.35, R) && !mais(x, y, R * 0.35 - 2, R - 2));
B("quadrados-sobrepostos", "Quadrados sobrepostos", (x, y, R) => {
  const s = R * 0.6;
  const q = (cx: number, cy: number) => {
    const m = Math.max(Math.abs(x - cx), Math.abs(y - cy));
    return m <= s && m > s - 1.5;
  };
  return q(-R * 0.38, -R * 0.38) || q(R * 0.38, R * 0.38);
});
B("circulos-entrelacados", "Círculos entrelaçados", (x, y, R) => {
  const s = R * 0.6;
  const r1 = Math.hypot(x + R * 0.38, y);
  const r2 = Math.hypot(x - R * 0.38, y);
  return (r1 <= s && r1 > s - 1.5) || (r2 <= s && r2 > s - 1.5);
});
B("tres-circulos", "Três círculos", (x, y, R) =>
  [[0, -R * 0.5], [-R * 0.55, R * 0.45], [R * 0.55, R * 0.45]].some(([cx, cy]) => Math.hypot(x - cx, y - cy) <= R * 0.42)
);
B("trapezio", "Trapézio", (x, y, R) => Math.abs(y) <= R * 0.6 && Math.abs(x) <= R * 0.45 + ((y + R * 0.6) / (1.2 * R)) * R * 0.5);
B("paralelogramo", "Paralelogramo", (x, y, R) => Math.abs(y) <= R * 0.5 && Math.abs(x + y * 0.8) <= R * 0.55);
B("cantoneiras", "Cantoneiras", (x, y, R) => {
  const ax = Math.abs(x);
  const ay = Math.abs(y);
  return (ax > R - 2 && ax <= R && ay >= R * 0.35 && ay <= R) || (ay > R - 2 && ay <= R && ax >= R * 0.35 && ax <= R);
});
B("quadrado-losango", "Quadrado com losango", (x, y, R) => {
  const m = Math.max(Math.abs(x), Math.abs(y));
  const d = Math.abs(x) + Math.abs(y);
  return (m <= R && m > R - 1.5) || (d <= R - 3 && d > R - 4.5) || d <= 1;
});
B("circulo-no-quadrado", "Círculo no quadrado", (x, y, R) => {
  const m = Math.max(Math.abs(x), Math.abs(y));
  return (m <= R && m > R - 1.5) || Math.hypot(x, y) <= R * 0.6;
});
B("pilula", "Pílula", (x, y, R) => {
  const h = R * 0.45;
  const c = R * 0.5;
  return Math.abs(y) <= h && (Math.abs(x) <= c || Math.hypot(Math.abs(x) - c, y) <= h);
});

// ===================== Estilo time (50) =====================
for (const t of ["2", "8", "13", "22"]) add("time", `numero-${t}`, `Número ${t}`, texto(t));
add("time", "cruz-fina", "Cruz fina", (i, j, cols, rows) => Math.abs(i - meio(cols)) === 0 || Math.abs(j - meio(rows)) === 0);
add("time", "cruz-nordica-larga", "Cruz nórdica larga", (i, j, cols, rows) => Math.abs(j - meio(rows)) <= 3 || Math.abs(i - Math.floor(cols * 0.35)) <= 3);
add("time", "cruz-com-borda", "Cruz com borda", (i, j, cols, rows) => {
  const a = Math.abs(i - meio(cols));
  const b = Math.abs(j - meio(rows));
  return (a <= 4 || b <= 4) && !(a <= 2 || b <= 2);
});
add("time", "cruz-de-malta", "Cruz de malta", (i, j, cols, rows) => {
  const dx = Math.abs(i - meio(cols));
  const dy = Math.abs(j - meio(rows));
  const R = Math.min(meio(cols), meio(rows)) - 2;
  return (dx <= R && dy <= R) && ((dy <= 1 + dx * 0.55 && dx >= dy * 0.2) || (dx <= 1 + dy * 0.55 && dy >= dx * 0.2)) && Math.max(dx, dy) > 1;
});
for (const n of [3]) {
  add("time", `estrelas-${n}`, `${n} estrelas`, (i, j, cols, rows) => {
    const p = Math.floor(Math.min((cols - 2) / n, rows / 2));
    return Array.from({ length: n }, (_, k) => k - (n - 1) / 2).some((k) => estrela(i, j, meio(cols) + k * p, meio(rows), p * 0.46));
  });
}
add("time", "escudo-vazado", "Escudo vazado", (i, j, cols, rows) => {
  if (!noEscudo(i, j, cols, rows)) return false;
  const cx = meio(cols);
  const cy = meio(rows);
  const x = Math.abs(i - cx) / (Math.min(10, cols * 0.35) - 2);
  const y = (j - (cy - 8)) / 17;
  return !(y >= 0 && y <= 1 && x <= (y < 0.5 ? 1 : 1 - (y - 0.5) / 0.5));
});
add("time", "escudo-faixas", "Escudo com faixas", (i, j, cols, rows) => noEscudo(i, j, cols, rows) && mod(j - meio(rows), 6) < 3);
add("time", "escudo-cruz", "Escudo com cruz", (i, j, cols, rows) => noEscudo(i, j, cols, rows) && !(Math.abs(i - meio(cols)) <= 1 || Math.abs(j - (meio(rows) - 3)) <= 1));
add("time", "escudo-xadrez", "Escudo xadrez", (i, j, cols, rows) => noEscudo(i, j, cols, rows) && (Math.floor(i / 3) + Math.floor(j / 3)) % 2 === 0);
add("time", "escudo-faixa-diagonal", "Escudo com diagonal", (i, j, cols, rows) => noEscudo(i, j, cols, rows) && Math.abs(i - meio(cols) - (j - meio(rows))) > 2);
add("time", "tricolor-diagonal", "Tricolor diagonal", (i, j, cols, rows) => {
  const t = i / (cols - 1) + j / (rows - 1);
  return t < 0.67 || t > 1.33;
});
add("time", "bicolor-diagonal", "Bicolor diagonal", (i, j, cols, rows) => i / (cols - 1) > j / (rows - 1));
add("time", "faixa-grossa-deitada", "Faixa grossa deitada", (_i, j, _c, rows) => Math.abs(j - meio(rows)) <= 5);
add("time", "faixa-grossa-em-pe", "Faixa grossa em pé", (i, _j, cols) => Math.abs(i - meio(cols)) <= 6);
add("time", "duas-faixas-em-pe", "Duas faixas em pé", (i, _j, cols) => {
  const d = Math.abs(i - meio(cols));
  return d >= 3 && d <= 6;
});
add("time", "bola-e-faixa", "Bola na faixa", (i, j, cols, rows) => {
  const naFaixa = Math.abs(j - meio(rows)) <= 2;
  const r = Math.hypot(i - meio(cols), j - meio(rows));
  return r <= 6.5 ? r >= 5.2 || r < 1.8 : naFaixa;
});
add("time", "trofeu-estrela", "Estrela de campeão", (i, j, cols, rows) => estrela(i, j, meio(cols), meio(rows) - 2, 8) || (Math.abs(i - meio(cols)) <= 8 && j === meio(rows) + 9));
add("time", "barra-embaixo", "Barra embaixo", (_i, j, _c, rows) => j >= rows - 6);
add("time", "losango-de-time", "Losango de time", (i, j, cols, rows) => {
  const d = Math.abs(i - meio(cols)) / (meio(cols) - 1) + Math.abs(j - meio(rows)) / (meio(rows) - 1);
  return d <= 1 && (d > 0.82 || d < 0.35);
});
add("time", "chevron-time", "Chevron de time", (i, j, cols, rows) => {
  const linha = meio(rows) - 4 + Math.abs(i - meio(cols)) * -0.6 + 8;
  return Math.abs(j - linha) <= 2.5;
});

const T = (valor: string, rotulo: string, f: Centrada) => add("time", valor, rotulo, centrada(f));
add("time", "apito", "Apito", figura(["......XXXXXXX", "..XXXXXXXXXXX", ".XXXXXXX.....", "XXX.XXXX.....", "XX...XXX.....", "XXX.XXXX.....", ".XXXXXX......", "..XXXX......."]));
add("time", "luva-goleiro", "Luva de goleiro", figura(["..X.X.X.X", "..X.X.X.X", "..X.X.X.X", "..XXXXXXX", "X.XXXXXXX", "XXXXXXXXX", ".XXXXXXXX", "..XXXXXXX", "..XXXXXXX", "..X.....X", "..XXXXXXX"]));
add("time", "gol", "Gol", figura(["XXXXXXXXXXXXXXX", "XX.X.X.X.X.X.XX", "X.X.X.X.X.X.X.X", "XX.X.X.X.X.X.XX", "X.X.X.X.X.X.X.X", "XX.X.X.X.X.X.XX", "X.X.X.X.X.X.X.X", "X.............X", "XXXXXXXXXXXXXXX"]));
T("campo", "Campo de futebol", (x, y, R) => {
  const H = R * 0.68;
  const ax = Math.abs(x);
  const ay = Math.abs(y);
  if (ax > R || ay > H) return false;
  const r = Math.hypot(x, y);
  const area = R - R * 0.25;
  return ax > R - 1 || ay > H - 1 || x === 0 || (r <= R * 0.3 && r > R * 0.3 - 1.2) || (ax > area && ax <= area + 1 && ay <= R * 0.35) || (ay > R * 0.35 - 1 && ay <= R * 0.35 && ax >= area);
});
add("time", "texto-gol", "GOL", texto("GOL"));
add("time", "texto-fc", "FC", texto("FC"));
add("time", "bandeira-escanteio", "Bandeira de escanteio", figura(["XXXXXXX....", "XXXXXXXXX..", "XXXXXXXXXXX", "XXXXXXXXX..", "XXXXXXX....", "X..........", "X..........", "X..........", "X..........", "X..........", "XXX........"]));
add("time", "bracadeira", "Braçadeira de capitão", figura(["XXXXXXXXXXXXXXX", "XXXXXX...XXXXXX", "XXXXX.XXX.XXXXX", "XXXXX.XXXXXXXXX", "XXXXX.XXXXXXXXX", "XXXXX.XXX.XXXXX", "XXXXXX...XXXXXX", "XXXXXXXXXXXXXXX"]));
add("time", "megafone", "Megafone", figura(["..........XXX", "........XXXXX", "......XXXXXXX", "XXXXXXXXXXXXX", "XXXXXXXXXXXXX", "XXXXXXXXXXXXX", "..X...XXXXXXX", "..X.....XXXXX", "..XX......XXX"]));
T("cachecol", "Cachecol", (x, y, R) => Math.abs(x) <= R && Math.abs(y) <= R && Math.abs(x + y) <= 5 && mod(x - y, 6) < 3);
T("escudo-redondo", "Escudo redondo", (x, y, R) => {
  const r = Math.hypot(x, y);
  return (r <= R && r > R - 1.8) || estrela(x, y, 0, 1, R * 0.62);
});
T("distintivo-faixa", "Distintivo com faixa", (x, y, R) => {
  const r = Math.hypot(x, y);
  return r <= R && (r > R - 1.8 || Math.abs(y) <= R * 0.22);
});
add("time", "faixas-nas-laterais", "Faixas nas laterais", (i, _j, cols) => i < 4 || i >= cols - 4);
add("time", "listras-nos-lados", "Três listras nos lados", (i, _j, cols) => {
  const d = Math.min(i, cols - 1 - i);
  return d === 1 || d === 4 || d === 7;
});
add("time", "faixa-com-estrelas", "Faixa com estrelas", (i, j, cols, rows) => {
  if (Math.abs(j - meio(rows)) > 4) return false;
  const p = Math.floor(cols / 4);
  return ![-p, 0, p].some((k) => estrela(i, j, meio(cols) + k, meio(rows), 3.6));
});
add("time", "diagonal-com-estrela", "Diagonal com estrela", (i, j, cols, rows) => {
  const u = i / (cols - 1);
  const v = j / (rows - 1);
  return Math.abs(u - v) < 0.1 || estrela(i, j, Math.round(cols * 0.76), Math.round(rows * 0.26), Math.min(cols, rows) * 0.18);
});
add("time", "estrela-entre-faixas", "Estrela entre faixas", (i, j, cols, rows) => {
  const d = Math.abs(j - meio(rows));
  return d === 6 || d === 7 || estrela(i, j, meio(cols), meio(rows), 4.6);
});
T("arquibancada", "Arquibancada", (x, y, R) => {
  if (Math.abs(x) > R || y > R) return false;
  const s = Math.min(5, Math.floor((x + R) / ((2 * R) / 6)));
  const topo = R - ((s + 1) * 2 * R) / 6;
  return y >= topo && mod(Math.round(y - topo), 3) < 2;
});
add("time", "cronometro", "Cronômetro", figura(["....XXX....", ".....X.....", "..XXXXXXX..", ".X.......X.", "X....X....X", "X....X....X", "X....XXX..X", "X.........X", "X.........X", ".X.......X.", "..XXXXXXX.."]));
add("time", "podio", "Pódio", figura([".....XXXXX.....", ".....XX.XX.....", ".....XX.XX.....", "XXXXXXXXXX.....", "XX.XXXXXXX.....", "XX.XXXXXXXXXXXX", "XXXXXXXXXXXX.XX", "XXXXXXXXXXXXXXX", "XXXXXXXXXXXXXXX"]));
add("time", "bone", "Boné", figura(["......X........", "....XXXXX......", "..XXXXXXXXX....", ".XXXX.X.XXXX...", ".XXXXXXXXXXX...", ".XXXXXXXXXXXXXX", ".XXXXXXXXXXXXXX"]));
add("time", "louros", "Louros", figura(["..X.........X..", ".XX.........XX.", "XX...........XX", "X.X.........X.X", "XX...........XX", "X.X.........X.X", ".XX.........XX.", "..XX.......XX..", "...XXX...XXX...", ".....XX.XX.....", "......X.X......"]));
add("time", "escudo-meio-a-meio", "Escudo meio a meio", (i, j, cols, rows) => {
  if (!noEscudo(i, j, cols, rows)) return false;
  const x = Math.abs(i - meio(cols)) / (Math.min(10, cols * 0.35) - 2);
  const y = (j - (meio(rows) - 8)) / 17;
  const dentro = y >= 0 && y <= 1 && x <= (y < 0.5 ? 1 : 1 - (y - 0.5) / 0.5);
  return i <= meio(cols) || !dentro;
});
T("coracao-listrado", "Coração listrado", (x, y, R) => {
  const X = x / (R * 0.85);
  const Y = -y / (R * 0.85) + 0.15;
  return (X * X + Y * Y - 1) ** 3 - X * X * Y ** 3 <= 0 && mod(y, 4) < 2;
});
T("bola-basquete", "Bola de basquete", (x, y, R) => {
  const r = Math.hypot(x, y);
  if (r > R) return false;
  return r > R - 1.5 || x === 0 || y === 0 || Math.abs(Math.hypot(x - R * 1.25, y) - R * 0.85) < 0.7 || Math.abs(Math.hypot(x + R * 1.25, y) - R * 0.85) < 0.7;
});
T("estrela-cadente", "Estrela cadente", (x, y, R) => {
  const sx = R * 0.45;
  const sy = -R * 0.4;
  if (estrela(x, y, sx, sy, R * 0.5)) return true;
  const a = -(x - sx) + (y - sy);
  const b = x - sx + (y - sy);
  return a >= R * 0.55 && a <= R * 1.75 && [-1, 0, 1].some((o) => Math.abs(b - o * 2.4) < 0.9);
});

// ===================== Estilo boho (50) =====================
for (const [amp, per, larg] of [[4, 8, 2], [8, 16, 2]] as const) {
  add("boho", `zz-${amp}-${per}-${larg}`, `Ziguezague ${amp}·${per}`, (i, j, cols, rows) => {
    const tri = Math.abs(mod(i - meio(cols), 2 * amp) - amp);
    const k = Math.floor((j + tri) / per);
    return mod(j + tri, per) < larg && k * per - amp >= 0 && k * per + larg - 1 <= rows - 1;
  });
}
for (const p of [10]) add("boho", `rede-${p}`, `Rede de losangos ${p}`, (i, j) => mod(i + j, p) === 0 || mod(i - j, p) === 0);
for (const n of [4]) {
  add("boho", `losangos-aninhados-${n}`, `Losangos ${n} anéis`, (i, j, cols, rows) => {
    const d = Math.abs(i - meio(cols)) + Math.abs(j - meio(rows));
    return d <= n * 3 && d % 3 === 0;
  });
}
add("boho", "losangos-cheios-grandes", "Losangos cheios", (i, j, cols, rows) => {
  const { di, dj, inteira } = celulaInteira(i, j, cols, rows, 10, 4);
  return inteira && Math.abs(di) + Math.abs(dj) <= 4;
});
add("boho", "losangos-pontilhados", "Losangos pontilhados", (i, j) => {
  const d = Math.abs(mod(i, 10) - 5) + Math.abs(mod(j, 10) - 5);
  return d === 4 && (i + j) % 2 === 0;
});
for (const [p, incl] of [[8, 0.4]] as const) {
  add("boho", `chevron-${p}-${Math.round(incl * 10)}`, `Chevron ${p}`, (i, j, cols, rows) => chevronInteiro(i, j, cols, rows, p, incl));
}
add("boho", "chevron-para-cima", "Chevron para cima", (i, j, cols, rows) => chevronInteiro(i, j, cols, rows, 6, 0.5, true));
add("boho", "chevron-lateral", "Chevron deitado", (i, j, cols, rows) => chevronInteiro(j, i, rows, cols, 7, 0.6));
for (const [alt, per] of [[8, 10]] as const) {
  add("boho", `tri-${alt}-${per}`, `Triângulos ${alt}·${per}`, (i, j, cols, rows) => {
    const k = Math.floor(j / (alt + 2));
    const jj = j % (alt + 2);
    if (jj >= alt || (k + 1) * (alt + 2) > rows + 1) return false;
    return Math.abs(mod(i - meio(cols) + per / 2, per) - per / 2) <= jj * ((per / 2) / alt);
  });
}
add("boho", "triangulos-contorno", "Triângulos vazados", (i, j, cols, rows) => {
  const jj = j % 8;
  if ((Math.floor(j / 8) + 1) * 8 - 1 > rows) return false;
  const m = Math.abs(mod(i - meio(cols) + 5, 10) - 5);
  return jj < 7 && (Math.abs(m - jj * 0.7) < 0.8 || jj === 6);
});
add("boho", "dentes", "Dentes", (i, j, cols, rows) => {
  const m = Math.abs(mod(i - meio(cols), 6) - 3);
  return (j < 6 && j < 6 - m * 1.6) || (j >= rows - 6 && j >= rows - 6 + m * 1.6);
});
for (const [amp, per, esp] of [[3, 14, 6]] as const) {
  add("boho", `onda-${amp}-${per}`, `Ondas ${amp}·${per}`, (i, j, _c, rows) => {
    const w = j - meio(rows) - amp * Math.sin((i * 2 * Math.PI) / per);
    const k = Math.round(w / esp);
    // whole waves only: the line's crest and trough both stay inside
    return Math.abs(w - k * esp) < 0.6 && Math.abs(k * esp) + amp + 1 <= meio(rows);
  });
}
add("boho", "ondas-duplas", "Ondas duplas", (i, j, _c, rows) => {
  const w = j - meio(rows) - 3 * Math.sin((i * Math.PI) / 7);
  const k = Math.floor(w / 9);
  const m = w - k * 9;
  return (m < 1 || (m >= 2.5 && m < 3.5)) && k * 9 - 3 >= -meio(rows) && k * 9 + 6.5 <= meio(rows);
});
add("boho", "mini-losangos", "Mini losangos", repetido([".X.", "X.X", ".X."], 3));
for (const s of [3]) {
  add("boho", `quadrados-${s}`, `Quadrados ${s}`, (i, j, cols, rows) => {
    const m = Math.max(Math.abs(i - meio(cols)), Math.abs(j - meio(rows)));
    return m % s === 0 && m <= Math.min(meio(cols), meio(rows));
  });
}
add("boho", "circulos-concentricos", "Círculos", (i, j, cols, rows) => {
  const r = Math.round(Math.hypot(i - meio(cols), j - meio(rows)));
  return r % 4 === 0 && r <= Math.min(meio(cols), meio(rows));
});
add("boho", "losangos-em-coluna", "Losangos em coluna", (i, j, cols, rows) => {
  const k = Math.round((j - meio(rows)) / 9);
  const d = Math.abs(i - meio(cols)) + Math.abs(j - (meio(rows) + k * 9));
  return Math.abs(k * 9) <= meio(rows) - 4 && (d === 4 || d === 2 || d === 0);
});
add("boho", "losangos-tres", "Três losangos", (i, j, cols, rows) => [-9, 0, 9].some((dx) => {
  const d = Math.abs(i - meio(cols) - dx) + Math.abs(j - meio(rows));
  return d === 4 || d === 2;
}));
add("boho", "escada-dupla", "Escada dupla", (i, j, cols, rows) => {
  const deg = Math.floor(Math.abs(j - meio(rows)) / 3);
  return Math.abs(i - meio(cols)) === (6 - deg) * 2 && deg <= 6;
});
add("boho", "triangulo-vazado", "Triângulo vazado", (i, j, cols, rows) => {
  const h = Math.min(rows - 2, 22);
  const y = j - (meio(rows) - meio(h));
  if (y < 0 || y > h) return false;
  const meia = (y / h) * Math.min(meio(cols) - 1, h * 0.6);
  const d = Math.abs(i - meio(cols));
  return d <= meia && (y >= h - 1 || d > meia - 1.6);
});
add("boho", "mandala-petalas", "Mandala de pétalas", (i, j, cols, rows) => {
  const r = Math.hypot(i - meio(cols), j - meio(rows));
  const a = Math.atan2(j - meio(rows), i - meio(cols));
  const petala = 5 + 6 * Math.abs(Math.cos(4 * a));
  return (r <= petala && r > petala - 1.6) || r < 2;
});
add("boho", "mandala-raios", "Mandala de raios", (i, j, cols, rows) => {
  const r = Math.hypot(i - meio(cols), j - meio(rows));
  const a = Math.atan2(j - meio(rows), i - meio(cols));
  return (Math.abs(r - 4) < 0.8 || Math.abs(r - 10) < 0.8) || (r > 4 && r < 10 && Math.abs(mod((a / Math.PI) * 6, 1) - 0.5) > 0.38);
});
add("boho", "mandala-pontos", "Mandala de pontos", (i, j, cols, rows) => {
  const r = Math.hypot(i - meio(cols), j - meio(rows));
  const a = Math.atan2(j - meio(rows), i - meio(cols));
  return [3, 6.5, 10].some((R) => Math.abs(r - R) < 1 && Math.abs(mod((a / Math.PI) * (R * 1.2), 1) - 0.5) < 0.3);
});
add("boho", "espiral-quadrada-dupla", "Espiral dupla", (i, j, cols, rows) => {
  const m = Math.max(Math.abs(i - meio(cols)), Math.abs(j - meio(rows)));
  return m % 3 === 0 && !(i > meio(cols) && Math.abs(j - meio(rows)) <= 1);
});
add("boho", "olho-de-deus", "Olho de Deus", (i, j, cols, rows) => {
  const dx = Math.abs(i - meio(cols));
  const dy = Math.abs(j - meio(rows));
  const d = dx + dy;
  return d <= Math.min(meio(cols), meio(rows)) - 1 && (d % 4 === 0 || dx === 0 || dy === 0);
});
add("boho", "kilim-largo", "Kilim largo", (i, j, cols, rows) => {
  const dj = Math.abs(j - meio(rows));
  if (dj === 8 || dj === 10) return true;
  const d = Math.abs(mod(i - meio(cols) + 6, 12) - 6) + dj;
  return d <= 6 && d % 2 === 0;
});
add("boho", "faixa-de-losangos", "Faixa de losangos", (i, j, cols, rows) => {
  const dj = Math.abs(j - meio(rows));
  return dj === 5 || (dj < 5 && Math.abs(mod(i - meio(cols) + 5, 10) - 5) === 4 - dj);
});
add("boho", "flechas-para-baixo", "Flechas para baixo", (i, j) => {
  const ii = mod(i, 8) - 4;
  const jj = mod(j, 10);
  return (ii === 0 && jj < 7) || (jj >= 4 && jj <= 7 && Math.abs(ii) === 7 - jj);
});
add("boho", "cruzes-x", "Xizinhos", (i, j) => {
  const a = mod(i, 6) - 3;
  const b = mod(j, 6) - 3;
  return Math.abs(a) === Math.abs(b) && Math.abs(a) <= 2;
});

const H = (valor: string, rotulo: string, f: Centrada) => add("boho", valor, rotulo, centrada(f));
H("filtro-dos-sonhos", "Filtro dos sonhos", (x, y, R) => {
  const cy = -R * 0.35;
  const rr = R * 0.55;
  const dy = y - cy;
  const r = Math.hypot(x, dy);
  if (r <= rr) return r > rr - 1.6 || x === 0 || Math.round(dy) === 0 || Math.abs(Math.abs(x) - Math.abs(dy)) < 0.5;
  return [-R * 0.45, 0, R * 0.45].some((fx) => {
    const fio = Math.abs(x - fx) < 0.5 && y > cy && y < R * 0.55;
    const pena = ((x - fx) / 1.6) ** 2 + ((y - R * 0.75) / 2.4) ** 2 <= 1;
    return fio || pena;
  });
});
add("boho", "fases-da-lua", "Fases da lua", (i, j, cols, rows) => {
  const r0 = Math.min((cols - 4) / 7, meio(rows) * 0.6);
  const dx = i - meio(cols);
  const dy = j - meio(rows);
  const p = r0 * 2.4;
  return [-1, 0, 1].some((k) => {
    const x = dx - k * p;
    if (Math.hypot(x, dy) > r0) return false;
    return k === 0 || Math.hypot(x + k * r0 * 0.8, dy) > r0;
  });
});
add("boho", "hamsa", "Hamsá", figura(["..X.X.X.X..", "..X.X.X.X..", "..X.X.X.X..", "X.XXXXXXX.X", "XXXXXXXXXXX", ".XXXXXXXXX.", ".XXX...XXX.", ".XX..X..XX.", ".XXX...XXX.", ".XXXXXXXXX.", "..XXXXXXX..", "....XXX...."]));
add("boho", "costela-de-adao", "Costela-de-adão", figura(["....XXXXX....", "..XXXXXXXXX..", ".XX.XXXXX.XX.", "XXXX.XXX.XXXX", "X.XXX.X.XXX.X", "XX.XXXXXXX.XX", "XXX.XXXXX.XXX", ".XXXXXXXXXXX.", "..XX.XXX.XX..", "....XXXXX....", "......X......", "......X......", "......X......"]));
add("boho", "ramo", "Ramo", figura(["......X......", ".....XXX.....", "..XX..X..XX..", ".XXXX.X.XXXX.", "..XXX.X.XXX..", "......X......", "..XX..X..XX..", ".XXXX.X.XXXX.", "..XXX.X.XXX..", "......X......", "......X......", "......X......"]));
add("boho", "flor-de-lotus", "Flor de lótus", figura([".......X.......", "......XXX......", "..X..XXXXX..X..", "..XX.XXXXX.XX..", "X.XXX.XXX.XXX.X", "XX.XXX.X.XXX.XX", ".XX.XXXXXXX.XX.", "..XXXXXXXXXXX..", "....XXXXXXX...."]));
H("arvore-da-vida", "Árvore da vida", (x, y, R) => {
  const r = Math.hypot(x, y);
  if (r > R) return false;
  if (r > R - 1.5) return true;
  const ax = Math.abs(x);
  if (ax <= 1 && y >= -R * 0.6 && y <= R * 0.45) return true;
  if ([-R * 0.05, -R * 0.35].some((y0) => Math.abs(y - (y0 - ax * 0.75)) < 0.8 && ax <= R * 0.65)) return true;
  return y > R * 0.35 && Math.abs(y - (R * 0.4 + ax * 0.5)) < 0.8 && ax <= R * 0.6;
});
H("flor-da-vida", "Flor da vida", (x, y, R) => {
  const s = R / 2;
  const anel = (cx: number, cy: number) => Math.abs(Math.hypot(x - cx, y - cy) - s) < 0.7;
  return anel(0, 0) || [0, 1, 2, 3, 4, 5].some((k) => anel(s * Math.cos((k * Math.PI) / 3), s * Math.sin((k * Math.PI) / 3)));
});
H("lua-e-estrelas", "Lua e estrelas", (x, y, R) => {
  const lua = Math.hypot(x + R * 0.25, y) <= R * 0.72 && Math.hypot(x - R * 0.13, y + R * 0.12) > R * 0.6;
  return lua || estrela(x, y, R * 0.62, -R * 0.42, R * 0.3) || estrela(x, y, R * 0.72, R * 0.42, R * 0.22);
});
add("boho", "cristal", "Cristal", figura(["...XXXXX...", "..X.X.X.X..", ".X..X.X..X.", "XXXXXXXXXXX", ".X..X.X..X.", ".X..X.X..X.", "..X.X.X.X..", "..X.X.X.X..", "...XX.XX...", "....X.X....", ".....X....."]));
H("franjas", "Franjas", (x, y, R) => {
  const ax = Math.abs(x);
  if (ax > R) return false;
  if (y >= -R * 0.75 && y <= -R * 0.45) return true;
  if (y <= -R * 0.45) return false;
  if (y <= -R * 0.45 + 2 - Math.abs(mod(x, 4) - 2)) return true;
  return mod(x, 2) === 0 && y <= R * 0.85 - ax * 0.35;
});
add("boho", "tranca", "Trança", (i, j, cols, rows) => {
  const dy = j - meio(rows);
  const A = Math.min(4, meio(rows) * 0.3);
  const s = A * Math.sin(((i - meio(cols)) * Math.PI) / 6);
  return Math.abs(dy - s) < 1.1 || Math.abs(dy + s) < 1.1 || Math.abs(Math.abs(dy) - (A + 3)) < 0.6;
});
add("boho", "infinito", "Infinito", figura(["..XXX.....XXX..", ".X...X...X...X.", "X.....X.X.....X", "X......X......X", "X.....X.X.....X", ".X...X...X...X.", "..XXX.....XXX.."]));
add("boho", "argyle", "Argyle", (i, j, cols, rows) => {
  const { di, dj, inteira } = celulaInteira(i, j, cols, rows, 10, 4);
  if (!inteira) return false;
  const d = Math.abs(di) + Math.abs(dj);
  const par = mod(Math.round((i - di - meio(cols)) / 10 + (j - dj - meio(rows)) / 10), 2) === 0;
  return par ? d <= 4 : d === 4;
});
H("coracao-boho", "Coração boho", (x, y, R) => {
  const c = (k: number) => {
    const X = x / (R * k);
    const Y = -y / (R * k) + 0.15;
    return (X * X + Y * Y - 1) ** 3 - X * X * Y ** 3 <= 0;
  };
  return (c(0.85) && !c(0.68)) || Math.abs(x) + Math.abs(y - R * 0.05) <= R * 0.3;
});
H("olho-no-triangulo", "Olho no triângulo", (x, y, R) => {
  const tri = (s: number) => y >= -s * 0.85 && y <= s * 0.75 && Math.abs(x) <= ((y + s * 0.85) / (1.6 * s)) * s;
  return (tri(R) && !tri(R - 2.6)) || (lente(x, y - R * 0.25, R * 0.45) && Math.hypot(x, y - R * 0.25) > R * 0.1);
});
H("chakana", "Chakana", (x, y, R) => {
  const s = (R + 1) / 4;
  const a = Math.floor(Math.abs(x) / s);
  const b = Math.floor(Math.abs(y) / s);
  return Math.max(a, b) <= 3 && (Math.min(a, b) === 0 || Math.max(a, b) <= 2) && Math.hypot(x, y) > s * 0.9;
});
H("rosa-dos-ventos", "Rosa dos ventos", (x, y, R) => {
  const ax = Math.abs(x);
  const ay = Math.abs(y);
  const longa = (ax <= R && ay <= (R - ax) * 0.22) || (ay <= R && ax <= (R - ay) * 0.22);
  const u = Math.abs((x + y) / Math.SQRT2);
  const v = Math.abs((x - y) / Math.SQRT2);
  const curta = (u <= R * 0.62 && v <= (R * 0.62 - u) * 0.3) || (v <= R * 0.62 && u <= (R * 0.62 - v) * 0.3);
  const r = Math.hypot(x, y);
  return longa || curta || (r > R * 0.4 && r <= R * 0.4 + 1.2);
});
add("boho", "passaro-trovao", "Pássaro trovão", figura([".......X.......", "......XXX......", "X.....XXX.....X", "XX...XXXXX...XX", "XXXX.XXXXX.XXXX", ".XXXXXXXXXXXXX.", "..XXXXXXXXXXX..", "......XXX......", ".....XXXXX.....", "....XX.X.XX....", "...XX..X..XX..."]));
add("boho", "vaso-de-barro", "Vaso de barro", figura(["..XXXXXXX..", "...XXXXX...", "..XXXXXXX..", ".XXXXXXXXX.", "XX.X.X.X.XX", "XXXXXXXXXXX", "X.X.X.X.X.X", "XXXXXXXXXXX", ".XXXXXXXXX.", "..XXXXXXX..", "...XXXXX..."]));

// ===================== Divertidos (50) =====================
const MINI: Record<string, [string, string[]]> = {
  coracaozinhos: ["Coraçõezinhos", [".X.X.", "XXXXX", "XXXXX", ".XXX.", "..X.."]],
  estrelinhas: ["Estrelinhas", ["..X..", ".XXX.", "XXXXX", ".XXX.", ".X.X."]],
  florzinhas: ["Florzinhas", [".X.X.", "XX.XX", "..X..", "XX.XX", ".X.X."]],
  ancoras: ["Âncoras", ["..X..", ".XXX.", "..X..", "X.X.X", ".XXX."]],
  peixinhos: ["Peixinhos", ["..XX..X", ".XXXXXX", "XXXXXX.", ".XXXXXX", "..XX..X"]],
  notinhas: ["Notinhas", ["..XXX", "..X.X", "..X.X", "XXX.X", "XX.XX"]],
  cerejinhas: ["Cerejinhas", ["...X.", "..X.X", "XX.XX", "XX.XX"]],
  fantasminhas: ["Fantasminhas", [".XXX.", "X.X.X", "XXXXX", "XXXXX", "X.X.X"]],
  gatinhos: ["Gatinhos", ["X...X", "XX.XX", "XXXXX", "X.X.X", ".XXX."]],
  borboletinhas: ["Borboletinhas", ["XX.XX", "XXXXX", "..X..", "XXXXX", "XX.XX"]],
};
for (const [valor, [rotulo, d]] of Object.entries(MINI)) add("divertidos", valor, rotulo, repetido(d, d[0].length > 5 ? 3 : 2));

const GRANDES: Record<string, [string, string[]]> = {
  casa: ["Casinha", ["......X......", "....XXXXX....", "..XXXXXXXXX..", "XXXXXXXXXXXXX", ".X.........X.", ".X.XX...XX.X.", ".X.XX...XX.X.", ".X....XX...X.", ".X....XX...X.", ".XXXXXXXXXXX."]],
  arvore: ["Árvore", ["....XXX....", "..XXXXXXX..", ".XXXXXXXXX.", "XXXXXXXXXXX", "XXXXXXXXXXX", ".XXXXXXXXX.", "..XXXXXXX..", ".....X.....", ".....X.....", "....XXX...."]],
  pinheiro: ["Pinheiro", ["....X....", "...XXX...", "..XXXXX..", "...XXX...", "..XXXXX..", ".XXXXXXX.", "..XXXXX..", ".XXXXXXX.", "XXXXXXXXX", "....X....", "...XXX..."]],
  tulipa: ["Tulipa", ["X.X.X", "XXXXX", "XXXXX", ".XXX.", "..X..", "X.X.X", ".XXX.", "..X.."]],
  "guarda-chuva": ["Guarda-chuva", ["....XXX....", "..XXXXXXX..", ".XXXXXXXXX.", "XXXXXXXXXXX", "X.X.X.X.X.X", ".....X.....", ".....X.....", ".....X.....", "...X.X.....", "....X......"]],
  chave: ["Chave", [".XXX.......", "X...X......", "X...XXXXXXX", "X...X..X.X.", ".XXX...X.X."]],
  sino: ["Sino", ["....X....", "...XXX...", "..XXXXX..", "..XXXXX..", ".XXXXXXX.", ".XXXXXXX.", "XXXXXXXXX", "....X...."]],
  presente: ["Presente", ["..X...X..", "...X.X...", "XXXXXXXXX", "X...X...X", "XXXXXXXXX", ".X..X..X.", ".X..X..X.", ".X..X..X.", ".XXXXXXX."]],
  balao: ["Balão", ["..XXXX..", ".XXXXXX.", "XXXXXXXX", "XXXXXXXX", ".XXXXXX.", "..XXXX..", "...XX...", "....X...", "...X....", "....X..."]],
  bolo: ["Bolo", ["..X...X...X..", "..X...X...X..", ".XXXXXXXXXXX.", ".X.X.X.X.X.X.", ".XXXXXXXXXXX.", "XXXXXXXXXXXXX", "X.X.X.X.X.X.X", "XXXXXXXXXXXXX"]],
  xicara: ["Xícara", ["..X.X.X...", "...X.X....", "XXXXXXX...", "XXXXXXXXX.", "XXXXXXX..X", "XXXXXXXXX.", ".XXXXX....", "XXXXXXXX.."]],
  abacate: ["Abacate", ["...XXX...", "..XXXXX..", ".XXXXXXX.", ".XXX.XXX.", "XXX...XXX", "XXX...XXX", "XXXX.XXXX", ".XXXXXXX.", "..XXXXX.."]],
  banana: ["Banana", ["........XX", ".......XX.", "......XXX.", ".....XXXX.", "...XXXXXX.", "XXXXXXXX..", ".XXXXXX...", "..XXX....."]],
  morango: ["Morango", ["..X.X.X..", "...XXX...", "XXXXXXXXX", "X.XXX.XXX", "XXXX.XXXX", ".XX.XXXX.", "..XXX.X..", "...XXX...", "....X...."]],
  uva: ["Uva", ["....X....", "...X.....", ".XX.XX...", "XXXXXXXX.", ".XX.XX.XX", "..XXXXXX.", "...XX.XX.", "....XXX..", ".....X..."]],
  passaro: ["Passarinho", [".....XXX...", "....XXXXX..", "....XX.XXX.", "X..XXXXXX..", "XXXXXXXXX..", ".XXXXXXX...", "..XXXXX....", "....X.X...."]],
  coelho: ["Coelhinho", [".X...X.", ".X...X.", ".X...X.", "XXXXXXX", "X.XXX.X", "XXXXXXX", "XX.X.XX", ".XXXXX."]],
  urso: ["Ursinho", ["XX.....XX", "XXXXXXXXX", ".XXXXXXX.", ".X.XXX.X.", ".XXXXXXX.", ".XXX.XXX.", "..XXXXX.."]],
  sapo: ["Sapinho", [".XX...XX.", "X.XX.XX.X", "XXXXXXXXX", "XXXXXXXXX", "X.......X", ".XXXXXXX.", "XX.....XX"]],
  joaninha: ["Joaninha", ["...X.X...", "....X....", "..XXXXX..", ".XX.X.XX.", "XXXXXXXXX", "X.XXXXX.X", "XXXX.XXXX", ".XXXXXXX.", "..XXXXX.."]],
  abelha: ["Abelhinha", ["..XX..XX..", "..XXXXXX..", "....XX....", "..XXXXXX..", ".X.X.X.X..", "XXXXXXXXXX", ".X.X.X.X..", "..XXXXXX.."]],
  caracol: ["Caracol", ["...XXXX....", "..X....X...", ".X..XX..X..", ".X.X..X.X..", ".X..XX..X.X", "..X....XX.X", "XXXXXXXXXXX"]],
  carro: ["Carrinho", ["...XXXXX.....", "..X..X..X....", ".XXXXXXXXXXX.", "XXXXXXXXXXXXX", "XXXXXXXXXXXXX", "..XX.....XX.."]],
  bicicleta: ["Bicicleta", ["......XX....", ".XX....X....", "...XXXXXX...", "..X...X.X...", ".XXX.X..XXX.", "X.X.XX.X.X.X", "X...X..X...X", ".XXX....XXX."]],
  oculos2: ["Óculos de sol", ["XXXXXXXXXXXXX", "X.XXXX.XXXX.X", "XXXXXX.XXXXXX", ".XXXX...XXXX.", "..XX.....XX.."]],
};
for (const [valor, [rotulo, d]] of Object.entries(GRANDES)) add("divertidos", `fig-${valor}`, rotulo, figura(d));

const NOVOS_DIVERTIDOS: Record<string, [string, string[]]> = {
  dinossauro: ["Dinossauro", ["........XXXXX..", "........XX.XXX.", "........XXXXXXX", "........XXXXX..", "X......XXXXX...", "XX....XXXXXXX..", "XXX..XXXXXXX.X.", ".XXXXXXXXXXX...", "..XXXXXXXXX....", "...XXXXXXX.....", "....XX..XX.....", "....XX..XX....."]],
  robo: ["Robô", [".....X.....", ".....X.....", ".XXXXXXXXX.", ".X.......X.", ".X.XX.XX.X.", ".X.......X.", ".X.XXXXX.X.", ".XXXXXXXXX.", "....XXX....", "XXXXXXXXXXX", "X.XXXXXXX.X", "X.XX.X.XX.X", "..XXXXXXX.."]],
  coruja: ["Coruja", ["X.........X", "XXXXXXXXXXX", "XX...X...XX", "X..X.X.X..X", "XX...X...XX", "XXXXX.XXXXX", "XXXXXXXXXXX", "XX.X.X.X.XX", "XXX.X.X.XXX", ".XXXXXXXXX.", "..X.....X.."]],
  pinguim: ["Pinguim", ["...XXXXX...", "..XXXXXXX..", "..XX.X.XX..", "..X..X..X..", "..X.XXX.X..", ".XX.....XX.", "XXX.....XXX", "XX.......XX", ".X.......X.", ".XX.....XX.", "..XXXXXXX..", "..XX...XX.."]],
  cachorro: ["Cachorro", ["XXX.......XXX", "XXXXXXXXXXXXX", "XXXXXXXXXXXXX", "XXX.XXXXX.XXX", "XX.XXXXXXX.XX", "X..XXXXXXX..X", "...XX...XX...", "...XXX.XXX...", "....XXXXX....", ".....XXX....."]],
  porquinho: ["Porquinho", [".XX.......XX.", ".XXXXXXXXXXX.", "XXXXXXXXXXXXX", "XXX.XXXXX.XXX", "XXXXXXXXXXXXX", "XXXX.....XXXX", "XXXX.X.X.XXXX", "XXXX.....XXXX", ".XXXXXXXXXXX.", "..XXXXXXXXX.."]],
  pato: ["Patinho", ["...XXXX......", "..XXXXXX.....", "..XX.XXX.....", "XXXXXXXX.....", "..XXXXXX.....", "...XXXX......", "..XXXXXXXX..X", ".XXXXXXXXXXXX", ".XXXXXXXXXXX.", "..XXXXXXXXX..", "...XXXXXXX..."]],
  tubarao: ["Tubarão", ["........X........", ".......XX........", "......XXX........", "...XXXXXXXXXX...X", ".XXXXXXXXXXXXX.XX", "XX.XXXXXXXXXXXXXX", "XXXXXXXXXXXXXX.XX", ".X.X.XXXXXXXX...X", "...XXXX.XX......."]],
  hamburguer: ["Hambúrguer", ["...XXXXXXX...", ".XXX.XXX.XXX.", "XXXXXXXXXXXXX", ".............", "X.XXXXXXXXX.X", ".............", "XXXXXXXXXXXXX", ".XXXXXXXXXXX.", ".............", "XXXXXXXXXXXXX", ".XXXXXXXXXXX."]],
  tenis: ["Tênis", ["..XXXX.........", "..X..XX........", "..XX..XX.......", "..XXX..XXXXX...", "..XXXXXXXXXXXX.", ".XXXXXXXXXXXXXX", "XXXXXXXXXXXXXXX", "X.X.X.X.X.X.X.X"]],
  camera: ["Câmera", ["...XXXX....XX..", "XXXXXXXXXXXXXXX", "XXXXX.....XXXXX", "XXXX..XXX..XXXX", "XXX..X...X..XXX", "XXX..X...X..XXX", "XXXX..XXX..XXXX", "XXXXX.....XXXXX", "XXXXXXXXXXXXXXX"]],
  controle: ["Controle de videogame", [".XXXXXXXXXXXXX.", "XXX.XXXXXXX.XXX", "XX...XXXXX.X.XX", "XXX.XXXXXXX.XXX", "XXXXXXXXXXXXXXX", "XXXXX.....XXXXX", ".XXX.......XXX."]],
};
for (const [valor, [rotulo, d]] of Object.entries(NOVOS_DIVERTIDOS)) add("divertidos", `fig-${valor}`, rotulo, figura(d));
add("divertidos", "fig-rosquinha", "Rosquinha", centrada((x, y, R) => {
  const r = Math.hypot(x, y);
  return r <= R * 0.95 && r > R * 0.38 && !(r > R * 0.5 && r < R * 0.85 && mod(x * 7 + y * 3, 11) === 0);
}));
add("divertidos", "fig-ovo-frito", "Ovo frito", centrada((x, y, R) => {
  const r = Math.hypot(x, y);
  const borda = R * (0.82 + 0.12 * Math.sin(5 * Math.atan2(y, x)));
  return r <= borda && !(r > R * 0.34 && r <= R * 0.44);
}));
add("divertidos", "fig-pirulito", "Pirulito", centrada((x, y, R) => {
  const cy = -R * 0.32;
  const rr = R * 0.62;
  const dy = y - cy;
  const r = Math.hypot(x, dy);
  if (r <= rr) {
    const v = r / 2.6 - (Math.atan2(dy, x) + Math.PI) / (2 * Math.PI);
    return v - Math.floor(v) < 0.55 || r > rr - 1.2;
  }
  return Math.abs(x) <= 0.6 && y > cy + rr && y <= R;
}));

export const FORMAS_EXTRAS_2: Record<string, Teste> = Object.fromEntries(lista.map((f) => [f.valor, f.teste]));
export const ROTULOS_EXTRAS_2 = lista.map(({ valor, rotulo, grupo }) => ({ valor, rotulo, grupo }));
