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

const lista: { valor: string; rotulo: string; grupo: Grupo; teste: Teste }[] = [];
const add = (grupo: Grupo, valor: string, rotulo: string, teste: Teste) => lista.push({ valor, rotulo, grupo, teste });

// ===================== Básicos (50) =====================
for (const [w, g] of [[1, 2], [1, 6], [2, 4], [2, 6], [3, 2], [3, 6], [5, 3], [5, 5]] as const) {
  add("basicos", `lv-${w}-${g}`, `Listras ${w}·${g}`, (i, _j, cols) => mod(Math.abs(i - meio(cols)) + meio(w), w + g) < w);
}
for (const [w, g] of [[1, 2], [1, 5], [2, 4], [2, 6], [3, 2], [3, 3], [4, 4], [6, 3]] as const) {
  add("basicos", `fh-${w}-${g}`, `Faixas ${w}·${g}`, (_i, j, _c, rows) => mod(Math.abs(j - meio(rows)) + meio(w), w + g) < w);
}
for (const n of [8, 9, 10]) {
  add("basicos", `xadrez-${n}`, `Xadrez ${n}`, (i, j, cols, rows) => (Math.floor((i - meio(cols) + 1000 * n) / n) + Math.floor((j - meio(rows) + 1000 * n) / n)) % 2 === 0);
}
add("basicos", "xadrez-retangular", "Xadrez retangular", (i, j) => (Math.floor(i / 6) + Math.floor(j / 3)) % 2 === 0);
add("basicos", "xadrez-diagonal", "Xadrez diagonal", (i, j) => (Math.floor((i + j) / 4) + Math.floor((i - j + 400) / 4)) % 2 === 0);
for (const [p, r] of [[5, 1.2], [6, 1.6], [8, 2.2], [10, 3.2]] as const) {
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
for (const [p, l, dir] of [[6, 1, 1], [8, 3, 1], [12, 5, 1], [6, 1, -1], [8, 3, -1]] as const) {
  add("basicos", `diag-${p}-${l}-${dir > 0 ? "d" : "e"}`, `Diagonais ${dir > 0 ? "↘" : "↙"} ${p}`, (i, j) => mod(i + dir * j, p) < l);
}
for (const p of [3, 5, 6, 8]) add("basicos", `grade-${p}`, `Grade ${p}`, (i, j) => i % p === 0 || j % p === 0);
add("basicos", "grade-diagonal-larga", "Grade diagonal larga", (i, j) => mod(i + j, 10) === 0 || mod(i - j, 10) === 0);
add("basicos", "grade-pontilhada", "Grade pontilhada", (i, j) => (i % 6 === 0 && j % 2 === 0) || (j % 6 === 0 && i % 2 === 0));
for (const [a, b] of [[2, 6], [1, 4], [3, 7]] as const) {
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

// ===================== Estilo time (50) =====================
for (const n of [10, 4, 6, 8, 9, 11]) add("time", `listrado-${n}`, `Listrado ${n}`, (i, _j, cols) => Math.floor((i * n) / cols) % 2 === 1);
for (const n of [10, 4, 6, 8, 9, 11]) add("time", `aros-${n}`, `Aros ${n}`, (_i, j, _c, rows) => Math.floor((j * n) / rows) % 2 === 1);
for (const t of ["2", "3", "4", "5", "6", "8", "13", "17", "19", "22"]) add("time", `numero-${t}`, `Número ${t}`, texto(t));
for (const [larg, inv] of [[0.12, false], [0.2, false], [0.35, false], [0.12, true], [0.2, true], [0.35, true]] as const) {
  add("time", `faixa-${inv ? "inv" : "dir"}-${Math.round(larg * 100)}`, `Diagonal ${inv ? "↙" : "↘"} ${Math.round(larg * 100)}`, (i, j, cols, rows) => {
    const u = i / (cols - 1);
    const v = j / (rows - 1);
    return Math.abs((inv ? 1 - u : u) - v) < larg;
  });
}
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
for (const n of [2, 3, 4]) {
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

// ===================== Estilo boho (50) =====================
for (const [amp, per, larg] of [[2, 5, 1], [4, 8, 2], [5, 10, 1], [5, 12, 3], [6, 9, 2], [3, 10, 2], [8, 16, 2], [4, 6, 1], [6, 14, 4], [3, 7, 3]] as const) {
  add("boho", `zz-${amp}-${per}-${larg}`, `Ziguezague ${amp}·${per}`, (i, j, cols, rows) => {
    const tri = Math.abs(mod(i - meio(cols), 2 * amp) - amp);
    const k = Math.floor((j + tri) / per);
    return mod(j + tri, per) < larg && k * per - amp >= 0 && k * per + larg - 1 <= rows - 1;
  });
}
for (const p of [6, 10, 12]) add("boho", `rede-${p}`, `Rede de losangos ${p}`, (i, j) => mod(i + j, p) === 0 || mod(i - j, p) === 0);
for (const n of [3, 4, 5]) {
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
for (const [p, incl] of [[5, 0.5], [8, 0.4], [10, 0.7], [4, 0.3]] as const) {
  add("boho", `chevron-${p}-${Math.round(incl * 10)}`, `Chevron ${p}`, (i, j, cols, rows) => chevronInteiro(i, j, cols, rows, p, incl));
}
add("boho", "chevron-para-cima", "Chevron para cima", (i, j, cols, rows) => chevronInteiro(i, j, cols, rows, 6, 0.5, true));
add("boho", "chevron-lateral", "Chevron deitado", (i, j, cols, rows) => chevronInteiro(j, i, rows, cols, 7, 0.6));
for (const [alt, per] of [[4, 6], [8, 10], [5, 12]] as const) {
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
for (const [amp, per, esp] of [[2, 10, 5], [3, 14, 6], [5, 20, 9]] as const) {
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
for (const s of [3, 5]) {
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

// ===================== Divertidos (50) =====================
const MINI: Record<string, [string, string[]]> = {
  coracaozinhos: ["Coraçõezinhos", [".X.X.", "XXXXX", "XXXXX", ".XXX.", "..X.."]],
  estrelinhas: ["Estrelinhas", ["..X..", ".XXX.", "XXXXX", ".XXX.", ".X.X."]],
  florzinhas: ["Florzinhas", [".X.X.", "XX.XX", "..X..", "XX.XX", ".X.X."]],
  ancoras: ["Âncoras", ["..X..", ".XXX.", "..X..", "X.X.X", ".XXX."]],
  peixinhos: ["Peixinhos", ["..XX..X", ".XXXXXX", "XXXXXX.", ".XXXXXX", "..XX..X"]],
  patinhas: ["Patinhas", ["X.X.X", ".....", ".XXX.", "XXXXX", ".X.X."]],
  cactinhos: ["Cactinhos", ["..X..", "X.X..", "XXX.X", "..XXX", "..X.."]],
  notinhas: ["Notinhas", ["..XXX", "..X.X", "..X.X", "XXX.X", "XX.XX"]],
  raiozinhos: ["Raiozinhos", ["..XX", ".XX.", "XXXX", ".XX.", "XX.."]],
  luas: ["Luazinhas", [".XXX.", "XX...", "X....", "XX...", ".XXX."]],
  soizinhos: ["Solzinhos", ["X.X.X", ".XXX.", "XXXXX", ".XXX.", "X.X.X"]],
  nuvenzinhas: ["Nuvenzinhas", [".XX...", "XXXXX.", "XXXXXX"]],
  gotinhas: ["Gotinhas", ["..X..", ".XXX.", "XXXXX", ".XXX."]],
  folhinhas: ["Folhinhas", ["...XX", ".XXX.", "XXX..", "X...."]],
  cerejinhas: ["Cerejinhas", ["...X.", "..X.X", "XX.XX", "XX.XX"]],
  cogumelinhos: ["Cogumelinhos", [".XXX.", "XXXXX", ".XXX.", "..X..", ".XXX."]],
  fantasminhas: ["Fantasminhas", [".XXX.", "X.X.X", "XXXXX", "XXXXX", "X.X.X"]],
  alienzinhos: ["Alienzinhos", ["X...X", ".XXX.", "X.X.X", "XXXXX", ".X.X."]],
  gatinhos: ["Gatinhos", ["X...X", "XX.XX", "XXXXX", "X.X.X", ".XXX."]],
  borboletinhas: ["Borboletinhas", ["XX.XX", "XXXXX", "..X..", "XXXXX", "XX.XX"]],
  conchinhas: ["Conchinhas", [".XXX.", "X.X.X", "XXXXX", ".XXX."]],
  coroinhas: ["Coroinhas", ["X.X.X", "XXXXX", "XXXXX"]],
  diamantinhos: ["Diamantinhos", [".XXX.", "XXXXX", ".XXX.", "..X.."]],
  sorrisinhos: ["Carinhas", [".XXX.", "X.X.X", "XXXXX", "X...X", ".XXX."]],
  sorvetinhos: ["Sorvetinhos", [".XXX.", "XXXXX", ".X.X.", "..X.."]],
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

export const FORMAS_EXTRAS_2: Record<string, Teste> = Object.fromEntries(lista.map((f) => [f.valor, f.teste]));
export const ROTULOS_EXTRAS_2 = lista.map(({ valor, rotulo, grupo }) => ({ valor, rotulo, grupo }));
