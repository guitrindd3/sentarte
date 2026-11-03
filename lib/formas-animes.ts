import type { Categoria } from "./formas-categorias";
import { figura, meio, mod, repetido, type Teste } from "./formas-extras-2";
import { glyphPixel } from "./pixel-font";

// "Animes e desenhos" tab (2026-11-03, user: "crie um também de animes e
// desenhos... faça 100 formas"). Every figure is ORIGINAL: things fans of
// anime/cartoons recognise (ninja gear, hero masks, comic balloons, kawaii
// faces, mecha, Japanese motifs) but never a real character, logo or name —
// selling a licensed character (Marvel, Toei, Shueisha…) without a licence
// is infringement; the user validated this approach. Don't add real
// characters here. Also a few traditional Japanese patterns (public domain:
// ichimatsu, asanoha, seigaiha, yagasuri, kagome) — user: "coloca alguma em
// padrão japonês, se eu não gostar eu peço para tirar".

const G = (w: number, h: number, f: (x: number, y: number) => boolean) =>
  Array.from({ length: h }, (_, y) => Array.from({ length: w }, (_, x) => (f(x, y) ? "X" : ".")).join(""));

/** Rows padded to the widest one (hand-drawn rows may differ by a cell). */
const P = (d: string[]) => {
  const w = Math.max(...d.map((r) => r.length));
  return d.map((r) => r.padEnd(w, "."));
};

const dentroPoligono = (x: number, y: number, pts: [number, number][]) => {
  let dentro = false;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const [xi, yi] = pts[i];
    const [xj, yj] = pts[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) dentro = !dentro;
  }
  return dentro;
};
const pontasEstrela = (cx: number, cy: number, R: number, r: number, n = 5, giro = -Math.PI / 2) =>
  Array.from({ length: n * 2 }, (_, k) => {
    const a = giro + (k * Math.PI) / n;
    const raio = k % 2 === 0 ? R : r;
    return [cx + raio * Math.cos(a), cy + raio * Math.sin(a)] as [number, number];
  });
const naEstrela = (x: number, y: number, cx: number, cy: number, R: number, r: number, n = 5) =>
  dentroPoligono(x, y, pontasEstrela(cx, cy, R, r, n));
const dist = (x: number, y: number, cx: number, cy: number) => Math.hypot(x - cx, y - cy);

/** 5x7 letters from the name font, 1 cell apart. */
function noTexto(t: string, x: number, y: number) {
  if (y < 0 || y >= 7 || x < 0) return false;
  const k = Math.floor(x / 6);
  return k < t.length && glyphPixel(t[k], x % 6, y);
}

/** Comic "explosion" balloon, optionally with a word cut out of it. */
function estouro(w: number, h: number, pontas: number, texto = "") {
  const cx = (w - 1) / 2;
  const cy = (h - 1) / 2;
  const tw = texto.length * 6 - 1;
  const tx = Math.round(cx - (tw - 1) / 2);
  const ty = Math.round(cy - 3);
  return G(w, h, (x, y) => {
    const dx = (x - cx) / (w / 2);
    const dy = (y - cy) / (h / 2);
    const a = Math.atan2(dy, dx);
    const fase = (((a / (2 * Math.PI)) * pontas) % 1 + 1) % 1;
    const limite = (texto ? 0.86 : 0.72) + (texto ? 0.2 : 0.3) * Math.abs(fase * 2 - 1);
    if (Math.hypot(dx, dy) > limite) return false;
    return !noTexto(texto, x - tx, y - ty);
  });
}

const DESENHOS: [string, string, string[]][] = [
  // ——— Heróis e quadrinhos ———
  ["an-mascara-heroi", "Máscara de herói", P([
    "X...............X",
    "XX.............XX",
    "XXXX.........XXXX",
    "XXXXXXXXXXXXXXXXX",
    "XXX...XXXXX...XXX",
    "XX.....XXX.....XX",
    "XXX...XXXXX...XXX",
    "XXXXXXX...XXXXXXX",
    "..XXXX.....XXXX..",
  ])],
  ["an-rosto-heroi", "Rosto de herói mascarado", P([
    "...XXXXXXX...",
    ".XXXXXXXXXXX.",
    "XXXXXXXXXXXXX",
    "XXXXXXXXXXXXX",
    "XXX.XXXXX.XXX",
    "XX...XXX...XX",
    "X.....X.....X",
    "XX....X....XX",
    "XXX..XXX..XXX",
    "XXXXXXXXXXXXX",
    ".XXXXXXXXXXX.",
    "..XXXXXXXXX..",
    "....XXXXX....",
  ])],
  ["an-teia", "Teia de aranha", G(19, 19, (x, y) => {
    const dx = x - 9, dy = y - 9;
    if (dx === 0 || dy === 0 || dx === dy || dx === -dy) return true;
    const r = Math.max(Math.abs(dx), Math.abs(dy), (Math.abs(dx) + Math.abs(dy)) * 0.72);
    return [3, 6, 9].includes(Math.round(r));
  })],
  ["an-aranha", "Aranha", P([
    "X.............X",
    ".X...........X.",
    "..X....X....X..",
    "XX.X..XXX..X.XX",
    "..XXXXXXXXXXX..",
    "....XXXXXXX....",
    "XXXXXXXXXXXXXXX",
    "....XXXXXXX....",
    "..XXXXXXXXXXX..",
    "XX.X.XXXXX.X.XX",
    "..X...XXX...X..",
    ".X...........X.",
    "X.............X",
  ])],
  ["an-pow", "POW!", estouro(23, 15, 14, "POW")],
  ["an-bum", "BUM!", estouro(23, 15, 12, "BUM")],
  ["an-zap", "ZAP!", estouro(23, 15, 16, "ZAP")],
  ["an-balao-fala", "Balão de fala", P([
    "....XXXXXXXXX....",
    "..XXXXXXXXXXXXX..",
    ".XXXXXXXXXXXXXXX.",
    "XXXXXXXXXXXXXXXXX",
    "XXXXX.XX.XX.XXXXX",
    "XXXXXXXXXXXXXXXXX",
    ".XXXXXXXXXXXXXXX.",
    "..XXXXXXXXXXXXX..",
    "....XXXXXXXXX....",
    "....XXX..........",
    "...XX............",
    "..X..............",
  ])],
  ["an-balao-pensamento", "Balão de pensamento", P([
    "...XXX..XXXX.....",
    "..XXXXXXXXXXXX...",
    ".XXXXXXXXXXXXXXX.",
    "XXXXXXXXXXXXXXXXX",
    ".XXXXXXXXXXXXXXXX",
    "XXXXXXXXXXXXXXXX.",
    ".XXXXXXXXXXXXXXX.",
    "..XXXX.XXXX.XXX..",
    ".................",
    "...XX............",
    "...XX............",
    ".................",
    ".X...............",
  ])],
  ["an-balao-grito", "Balão de grito", estouro(19, 17, 13, "!")],
  ["an-escudo-raio", "Escudo de raio", P([
    "XXXXXXXXXXXXX",
    "XXXXXXX.XXXXX",
    "XXXXXX..XXXXX",
    "XXXXX..XXXXXX",
    "XXXX.....XXXX",
    ".XXXXX..XXXX.",
    ".XXXX..XXXXX.",
    "..XX..XXXXX..",
    "...XXXXXXX...",
    "....XXXXX....",
    ".....XXX.....",
  ])],
  ["an-emblema-estrela", "Emblema de estrela", G(15, 15, (x, y) => dist(x, y, 7, 7) <= 7.2 && !naEstrela(x, y, 7, 7.4, 6, 2.6))],
  ["an-explosao", "Explosão", estouro(21, 17, 11)],

  // ——— Anime ———
  ["an-cabelo-espetado", "Cabelo espetado", P([
    "X......X......X",
    "XX....XXX....XX",
    ".XXX.XXXXX.XXX.",
    "..XXXXXXXXXXX..",
    "XXXXXXXXXXXXXXX",
    "XXXXXXXXXXXXXXX",
    "XX.XX.XXX.XX.XX",
    "X..X...X...X..X",
    "XX...........XX",
    ".X..XX...XX..X.",
    ".X..XX...XX..X.",
    ".X...........X.",
    "..X...XXX...X..",
    "...X.......X...",
    "....XXXXXXX....",
  ])],
  ["an-olhos-anime", "Olhos de anime", P([
    "XXXXXX.......XXXXXX",
    "...................",
    ".XXXXX.......XXXXX.",
    "XXXXXXX.....XXXXXXX",
    "X..XXXX.....X..XXXX",
    "X..XXXX.....X..XXXX",
    "XXXXXXX.....XXXXXXX",
    "XXXXXXX.....XXXXXXX",
    "XXXX.XX.....XXXX.XX",
    "XXXXXXX.....XXXXXXX",
    ".XXXXX.......XXXXX.",
  ])],
  ["an-olhos-estrela", "Olhos brilhando", G(21, 11, (x, y) => naEstrela(x, y, 5, 5.4, 5.6, 2.3) || naEstrela(x, y, 15, 5.4, 5.6, 2.3))],
  ["an-simbolo-raiva", "Símbolo de raiva", P([
    "...XX...XX...",
    "...XX...XX...",
    "...XX...XX...",
    "XXXX.....XXXX",
    "XXX.......XXX",
    ".............",
    ".............",
    "XXX.......XXX",
    "XXXX.....XXXX",
    "...XX...XX...",
    "...XX...XX...",
    "...XX...XX...",
  ])],
  ["an-carinha-kawaii", "Carinha >_<", P([
    "....XXXXXXX....",
    "..XX.......XX..",
    ".X...........X.",
    "X..X.......X..X",
    "X...X.....X...X",
    "X..X.......X..X",
    "X.............X",
    "X.XX..XXX..XX.X",
    "X......X......X",
    ".X...........X.",
    "..XX.......XX..",
    "....XXXXXXX....",
  ])],
  ["an-carinha-feliz", "Carinha ^_^", P([
    "....XXXXXXX....",
    "..XX.......XX..",
    ".X...........X.",
    "X...X.....X...X",
    "X..X.X...X.X..X",
    "X.............X",
    "X.XX.XXXXX.XX.X",
    "X.....X.X.....X",
    "X......X......X",
    ".X...........X.",
    "..XX.......XX..",
    "....XXXXXXX....",
  ])],
  ["an-gatinho-kawaii", "Gatinho kawaii", P([
    "X.............X",
    "XX...........XX",
    "XXX.........XXX",
    "XXXXXXXXXXXXXXX",
    "XXXXXXXXXXXXXXX",
    "XXX..XXXXX..XXX",
    "XXX..XXXXX..XXX",
    "XXXXXXX.XXXXXXX",
    "XXXXX.X.X.XXXXX",
    "XXXXXX.X.XXXXXX",
    ".XXXXXXXXXXXXX.",
    "...XXXXXXXXX...",
  ])],
  ["an-onigiri", "Onigiri com carinha", P([
    "......X......",
    ".....X.X.....",
    "....X...X....",
    "...X.....X...",
    "..X.X...X.X..",
    ".X.........X.",
    "X.....X.....X",
    "X...XXXXX...X",
    "X...XXXXX...X",
    "XXXXXXXXXXXXX",
  ])],
  ["an-lamen", "Tigela de lámen", P([
    "..........X..X.",
    ".........X..X..",
    "..X.X...X..X...",
    "...X.X.X..X....",
    "..X.X.X..X.....",
    "XXXXXXXXXXXXXXX",
    "X.X.X.X.X.X.X.X",
    "XXXXXXXXXXXXXXX",
    ".XXXXXXXXXXXXX.",
    "..XXXXXXXXXXX..",
    "....XXXXXXX....",
    "...XXXXXXXXX...",
  ])],
  ["an-sushi", "Sushi", P([
    "..XXXXXXXXXXX..",
    ".XX.XX.XX.XX.X.",
    "XXXXXXXXXXXXXXX",
    "X.............X",
    "X..X..X..X..X.X",
    "X.............X",
    ".XXXXXXXXXXXXX.",
  ])],
  ["an-dango", "Dango no palito", P([
    "..XXX..",
    ".XXXXX.",
    ".XXXXX.",
    "..XXX..",
    "..XXX..",
    ".X...X.",
    ".X...X.",
    "..XXX..",
    "..XXX..",
    ".XXXXX.",
    ".XXXXX.",
    "..XXX..",
    "...X...",
    "...X...",
    "...X...",
  ])],
  ["an-ninja", "Ninja", P([
    "....XXXXXXX......",
    "..XXXXXXXXXXX....",
    ".XXXXXXXXXXXXX...",
    ".XXXXXXXXXXXXXXXX",
    "XXXXXXXXXXXXXXX.X",
    "XX...........XXX.",
    "XX..XX...XX..XX..",
    "XX...........XX..",
    "XXXXXXXXXXXXXXX..",
    ".XXXXXXXXXXXXX...",
    "..XXXXXXXXXXX....",
    "....XXXXXXX......",
  ])],
  ["an-shuriken", "Shuriken", G(15, 15, (x, y) => {
    const dx = x - 7, dy = y - 7;
    if (dx * dx + dy * dy <= 1) return false;
    const ax = Math.abs(dx), ay = Math.abs(dy);
    return (ax <= 1 && ay <= 7 - ax * 2) || (ay <= 1 && ax <= 7 - ay * 2) || ax + ay <= 4;
  })],
  ["an-kunai", "Kunai", P([
    ".....X.....",
    "....XXX....",
    "...XXXXX...",
    "..XXXXXXX..",
    "..XXXXXXX..",
    "...XXXXX...",
    "....XXX....",
    "..XXXXXXX..",
    "....XXX....",
    "....X.X....",
    "....XXX....",
    "....X.X....",
    "....XXX....",
    "....XXX....",
    "...X...X...",
    "....XXX....",
  ])],
  ["an-katana", "Katana", G(17, 17, (x, y) => {
    const s = x + y;
    if (x >= 6 && x <= 16 && (s === 16 || s === 17)) return true;
    if (Math.abs(x - 5) + Math.abs(y - 11) <= 1 || (x === 4 && y === 10) || (x === 6 && y === 12)) return true;
    return x <= 3 && (s === 16 || s === 17) && (x + (s === 16 ? 0 : 1)) % 2 === 0;
  })],
  ["an-kabuto", "Capacete de samurai", P([
    "XX.............XX",
    ".XX...........XX.",
    "..XXX.......XXX..",
    "....XXX...XXX....",
    "......XXXXX......",
    "....XXXXXXXXX....",
    "..XXXXXXXXXXXXX..",
    ".XXXXXXXXXXXXXXX.",
    "XXXXXXXXXXXXXXXXX",
    "XX.XXXXXXXXXXX.XX",
    "X..XXX.....XXX..X",
    "...XX.......XX...",
  ])],
  ["an-torii", "Portal torii", P([
    "X...............X",
    "XXXXXXXXXXXXXXXXX",
    ".XXXXXXXXXXXXXXX.",
    "...XX...X...XX...",
    "..XXXXXXXXXXXXX..",
    "...XX.......XX...",
    "...XX.......XX...",
    "...XX.......XX...",
    "...XX.......XX...",
    "...XX.......XX...",
    "..XXXX.....XXXX..",
  ])],
  ["an-sakura", "Flor de cerejeira", G(17, 17, (x, y) => {
    if (dist(x, y, 8, 8) <= 1.2) return false;
    for (let k = 0; k < 5; k++) {
      const a = -Math.PI / 2 + (k * 2 * Math.PI) / 5;
      const px = 8 + 4.6 * Math.cos(a), py = 8.4 + 4.6 * Math.sin(a);
      const nx = 8 + 8.2 * Math.cos(a), ny = 8.4 + 8.2 * Math.sin(a);
      if (dist(x, y, px, py) <= 3.1 && dist(x, y, nx, ny) > 1.5 && dist(x, y, 8, 8.4) > 1.6) return true;
    }
    return false;
  })],
  ["an-carpa-koi", "Carpa koi", P([
    ".....XXX.........",
    "...XXXXXXXX....XX",
    ".XXXX.XXXXXXX.XXX",
    "XXXXXXXX..XXXXXX.",
    "XXXXXXXX..XXXXXX.",
    ".XXXXXXXXXXXX.XXX",
    "...XXXXXXXX....XX",
    ".....XXX.........",
  ])],
  ["an-kitsune", "Máscara de raposa", P([
    "X.............X",
    "XX...........XX",
    "X.X.........X.X",
    "X..XXXXXXXXX..X",
    "X.............X",
    "X..XXX...XXX..X",
    "X...XX...XX...X",
    ".X...........X.",
    "..X....X....X..",
    "...X.......X...",
    "....X.....X....",
    ".....X...X.....",
    "......XXX......",
  ])],
  ["an-dragao-oriental", "Dragão oriental", G(23, 15, (x, y) => {
    if (dist(x, y, 3, 5) <= 2.8) return !(x === 3 && y === 4);
    if ((x === 1 && y <= 2) || (x === 5 && y <= 2 && y >= 1)) return true;
    if (x < 5 || x > 22) return false;
    const c = 7 + 4 * Math.sin((x - 4) / 3);
    if (Math.abs(y - c) <= 1.3) return true;
    return x % 3 === 0 && y < c && y >= c - 2.4;
  })],
  ["an-lanterna", "Lanterna japonesa", P([
    "....XXX....",
    "..XXXXXXX..",
    ".X.......X.",
    "XXXXXXXXXXX",
    "X.........X",
    "XXXXXXXXXXX",
    "X.........X",
    "XXXXXXXXXXX",
    ".X.......X.",
    "..XXXXXXX..",
    "....XXX....",
    ".....X.....",
    "....XXX....",
  ])],
  ["an-leque", "Leque japonês", G(19, 12, (x, y) => {
    const d = dist(x, y, 9, 11);
    if (d > 9.6) return false;
    if (d <= 2.2) return true;
    const a = Math.atan2(11 - y, x - 9);
    const fase = ((a / Math.PI) * 8) % 1;
    return d <= 3.4 || fase > 0.18 || d > 8.6;
  })],
  ["an-monte-fuji", "Monte Fuji", P([
    "...........XXX.......",
    "..........XXXXX......",
    "...........XXX.......",
    ".....................",
    "......XXXXXXXXX......",
    ".....X..X...X..X.....",
    "....X.X.X.X.X.X.X....",
    "...XXXXXXXXXXXXXXX...",
    "..XXXXXXXXXXXXXXXXX..",
    ".XXXXXXXXXXXXXXXXXXX.",
    "XXXXXXXXXXXXXXXXXXXXX",
  ])],
  ["an-bola-energia", "Bola de energia", G(17, 17, (x, y) => {
    const d = dist(x, y, 8, 8);
    if (d <= 3.6) return true;
    const a = Math.atan2(y - 8, x - 8);
    const raio = (((a / (2 * Math.PI)) * 8) % 1 + 1) % 1;
    return (d >= 5 && d <= 8.4 && raio < 0.22) || (d > 4.4 && d <= 5.2);
  })],
  ["an-nuvem-voadora", "Nuvem voadora", P([
    "..........XXX....",
    ".......XXXXXXXX..",
    "...X.XXXXXXXXXXX.",
    "..X.XXXXXXXXXXXXX",
    ".X.XXXXXXXXXXXXX.",
    "X.XXXXXXXXXXXXX..",
    ".X..XXXX..XXXX...",
  ])],
  ["an-cristal", "Cristal mágico", P([
    "....X....",
    "...XXX...",
    "..XXXXX..",
    ".XX.X.XX.",
    "XX..X..XX",
    "X...X...X",
    "X...X...X",
    "X...X...X",
    "XX..X..XX",
    ".XX.X.XX.",
    "..XXXXX..",
    "...XXX...",
    "....X....",
  ])],
  ["an-coracao-alado", "Coração com asas", P([
    "X......XX.XX......X",
    "XX....XXXXXXX....XX",
    "XXXXXXXXXXXXXXXXXXX",
    ".XXXXX.XXXXX.XXXXX.",
    "..XXXX..XXX..XXXX..",
    ".........X.........",
  ])],
  ["an-laco", "Laço de fita", P([
    "XXX.........XXX",
    "X.XXX.....XXX.X",
    "X...XXX.XXX...X",
    "X.....XXX.....X",
    "X....XXXXX....X",
    "X.....XXX.....X",
    "X...XXX.XXX...X",
    "X.XXX.X.X.XXX.X",
    "XXX..X...X..XXX",
    "....X.....X....",
  ])],

  // ——— Robôs e espaço ———
  ["an-robo-gigante", "Robô gigante", P([
    "X.............X",
    ".X...........X.",
    "..X....X....X..",
    "...XX.XXX.XX...",
    "....XXXXXXX....",
    "XXXXXXXXXXXXXXX",
    "XX....XXX....XX",
    "XXXX.XXXXX.XXXX",
    "XXXXXXXXXXXXXXX",
    "XX.X.X.X.X.X.XX",
    "XXXXXXXXXXXXXXX",
    ".XXXXXXXXXXXXX.",
    "...XXXXXXXXX...",
  ])],
  ["an-robo-fofo", "Robozinho fofo", P([
    "......X......",
    ".....XXX.....",
    "......X......",
    "..XXXXXXXXX..",
    "..XX.XXX.XX..",
    "..XXXXXXXXX..",
    "..XXX...XXX..",
    "..XXXXXXXXX..",
    "......X......",
    "XX.XXXXXXX.XX",
    ".XXXX.X.XXXX.",
    "...XXXXXXX...",
    "...XX...XX...",
    "..XXX...XXX..",
  ])],
  ["an-alien", "Alienzinho", P([
    "X.............X",
    ".X...........X.",
    "..X..XXXXX..X..",
    "...XXXXXXXXX...",
    "..XXXXXXXXXXX..",
    ".XXXXXXXXXXXXX.",
    ".X...XXXXX...X.",
    ".XX...XXX...XX.",
    "..XX..XXX..XX..",
    "..XXXXXXXXXXX..",
    "...XXXXXXXXX...",
    "....XXX.XXX....",
    ".....XXXXX.....",
    "......XXX......",
  ])],
  ["an-disco-voador", "Disco voador", P([
    ".....XXXXX.....",
    "....X..X..X....",
    "....X.....X....",
    "..XXXXXXXXXXX..",
    "XXXXXXXXXXXXXXX",
    "X.XX.XX.XX.XX.X",
    "XXXXXXXXXXXXXXX",
    "..XXXXXXXXXXX..",
    "....X..X..X....",
    "...X...X...X...",
    "..X....X....X..",
  ])],
  ["an-foguete", "Foguetinho", P([
    "....X....",
    "...XXX...",
    "..XXXXX..",
    "..XXXXX..",
    "..X...X..",
    "..X...X..",
    "..XXXXX..",
    "..XXXXX..",
    ".XXXXXXX.",
    "XX.XXX.XX",
    "X..X.X..X",
    "...X.X...",
    "..X.X.X..",
    "...X.X...",
  ])],
  ["an-astronauta", "Capacete de astronauta", P([
    "....XXXXXXX....",
    "..XXXXXXXXXXX..",
    ".XXXXXXXXXXXXX.",
    ".XX.........XX.",
    "XX..XX.......XX",
    "XX..X........XX",
    "XX...........XX",
    "XX...........XX",
    ".XX.........XX.",
    ".XXXXXXXXXXXXX.",
    "..XXXXXXXXXXX..",
    "XXXXXXXXXXXXXXX",
    "XX.X.XXXXX.X.XX",
    "XXXXXXXXXXXXXXX",
  ])],
  ["an-portal", "Portal em espiral", G(19, 19, (x, y) => {
    const d = dist(x, y, 9, 9);
    if (d > 9.3) return false;
    if (d > 8.3) return true;
    const a = Math.atan2(y - 9, x - 9);
    const fase = (((d / 2.6 - a / (2 * Math.PI)) % 1) + 1) % 1;
    return fase < 0.45;
  })],
  ["an-planeta-carinha", "Planetinha com carinha", G(21, 15, (x, y) => {
    const d = dist(x, y, 10, 7);
    const anel = Math.abs(((x - 10) / 10.2) ** 2 + ((y - 8.2 + (x - 10) * 0.22) / 2.6) ** 2 - 1) < 0.34;
    if (d <= 5.6) {
      const olho = (x === 8 || x === 12) && (y === 5 || y === 6);
      const boca = y === 9 && x >= 9 && x <= 11;
      return !(olho || boca);
    }
    return anel && !(d <= 6.6 && y < 8);
  })],

  // ——— Monstrinhos e games ———
  ["an-slime", "Slime", P([
    "......X......",
    ".....XXX.....",
    "....XXXXX....",
    "...XXXXXXX...",
    "..XXXXXXXXX..",
    ".XX..XXX..XX.",
    ".XX..XXX..XX.",
    "XXXXXXXXXXXXX",
    "XXXX.....XXXX",
    "XXXXX...XXXXX",
    ".XXXXXXXXXXX.",
  ])],
  ["an-fantasminha", "Fantasminha fofo", P([
    "....XXXXX....",
    "..XX.....XX..",
    ".X.........X.",
    ".X..X...X..X.",
    "X...X...X...X",
    "X.XX.....XX.X",
    "X.....X.....X",
    "X...........X",
    "X...........X",
    "X..XX...XX..X",
    "X.X..X.X..X.X",
    "XX....X....XX",
  ])],
  ["an-monstrinho", "Monstrinho de um olho", P([
    "X...........X",
    "XX.........XX",
    ".XXXXXXXXXXX.",
    "XXXXXXXXXXXXX",
    "XXXX.....XXXX",
    "XXX..XXX..XXX",
    "XXX..XXX..XXX",
    "XXXX.....XXXX",
    "XXXXXXXXXXXXX",
    "XX.........XX",
    "XXX.X.X.X.XXX",
    "XXXXXXXXXXXXX",
    ".XX.......XX.",
  ])],
  ["an-dragaozinho", "Dragãozinho", P([
    "...XXX.........",
    "..XXXXX....X...",
    "..X.XXXX..XX...",
    "XXXXXXXX.XXX...",
    ".XXXXXXXXXXX...",
    "....XXXXXXXXX..",
    "....XXXXXXXXXX.",
    "....XXXXXXX.XXX",
    "....XX...XX..XX",
  ])],
  ["an-pocao", "Poção mágica", P([
    "....XXX....",
    "....X.X....",
    "...XXXXX...",
    "....X.X....",
    "...X...X...",
    "..X.....X..",
    ".X..X....X.",
    "XXXXXXXXXXX",
    "XXXX.XXXXXX",
    "XXXXXXX.XXX",
    ".XXXXXXXXX.",
    "..XXXXXXX..",
  ])],
  ["an-espada-rpg", "Espada de aventura", P([
    ".....X.....",
    "....XXX....",
    "....X.X....",
    "....X.X....",
    "....X.X....",
    "....X.X....",
    "....X.X....",
    "....X.X....",
    "....XXX....",
    "XXXXXXXXXXX",
    ".X..XXX..X.",
    "....X.X....",
    "....XXX....",
    "....X.X....",
    "...XXXXX...",
  ])],
  ["an-tres-vidas", "Três vidas", (() => {
    const c = [".XX.XX.", "XX.XXXX", "XXXXXXX", ".XXXXX.", "..XXX..", "...X..."];
    return c.map((r) => `${r}.${r}.${r}`);
  })()],
  ["an-moeda", "Moeda de jogo", G(15, 15, (x, y) => {
    const d = dist(x, y, 7, 7);
    if (d > 7.2) return false;
    if (d > 5.6 && d <= 6.4) return false;
    return !(x === 7 && Math.abs(y - 7) <= 3);
  })],
  ["an-cogumelo", "Cogumelo com carinha", P([
    "....XXXXXXX....",
    "..XXXX...XXXX..",
    ".XXXX.....XXXX.",
    "XXXXXX...XXXXXX",
    "XX..XXXXXXX..XX",
    "X....XXXXX....X",
    "XX..XXXXXXX..XX",
    "XXXXXXXXXXXXXXX",
    "...X.......X...",
    "...X..X.X..X...",
    "...X.......X...",
    "....XXXXXXX....",
  ])],
  ["an-bau", "Baú do tesouro", P([
    "..XXXXXXXXXXX..",
    ".X...........X.",
    "X.............X",
    "XXXXXXXXXXXXXXX",
    "X.....XXX.....X",
    "XXXXXXX.XXXXXXX",
    "X.....XXX.....X",
    "X.............X",
    "XXXXXXXXXXXXXXX",
  ])],
  ["an-caveirinha", "Caveirinha", P([
    "...XXXXXXX...",
    ".XXXXXXXXXXX.",
    "XXXXXXXXXXXXX",
    "XX...XXX...XX",
    "XX...XXX...XX",
    "XXXXXX.XXXXXX",
    ".XXXXXXXXXXX.",
    "..XX.X.X.XX..",
    "..XXXXXXXXX..",
  ])],
  ["an-bomba", "Bomba de desenho", P([
    "..........X.X",
    "........X..X.",
    ".......X..X.X",
    "......X......",
    "....XXXX.....",
    "..XXXXXXXX...",
    ".XXXXXXXXXX..",
    "XX.XXXXXXXXX.",
    "X..XXXXXXXXX.",
    "XX.XXXXXXXXX.",
    "XXXXXXXXXXXX.",
    ".XXXXXXXXXX..",
    "..XXXXXXXX...",
  ])],
  ["an-fliperama", "Fliperama", P([
    "XXXXXXXXXXX",
    "X.........X",
    "X.XXXXXXX.X",
    "X.X.....X.X",
    "X.X.X.X.X.X",
    "X.XXXXXXX.X",
    "X.........X",
    "XXXXXXXXXXX",
    "X.X..X.X..X",
    "X.........X",
    "XXXXXXXXXXX",
    "XX.......XX",
  ])],
  ["an-chapeu-de-palha", "Chapéu de palha", P([
    ".....XXXXXXXXX.....",
    "....X.........X....",
    "....X.........X....",
    "....XXXXXXXXXXX....",
    "....XXXXXXXXXXX....",
    ".XXXXXXXXXXXXXXXXX.",
    "XX...............XX",
    ".XXXXXXXXXXXXXXXXX.",
  ])],
  ["an-pergaminho", "Pergaminho ninja", P([
    ".XX.........XX.",
    "X..XXXXXXXXX..X",
    "X.X.........X.X",
    "X.X.XXXXXXX.X.X",
    "X.X.........X.X",
    "X.X.XXXXX...X.X",
    "X.X.........X.X",
    "X..XXXXXXXXX..X",
    ".XX.........XX.",
  ])],
  ["an-bandana-ninja", "Bandana de ninja", P([
    "....XXXXXXXXX.....",
    "XXXXX.......XXXXXX",
    "XXXXX.X.X.X.XXX..X",
    "XXXXX.......XXXX..",
    "....XXXXXXXXX.XX..",
    "..............XX..",
    "...............XX.",
  ])],

  // ——— Bichinhos fofos ———
  ["an-panda", "Panda", P([
    "XXX.........XXX",
    "XXXX.......XXXX",
    "XXX.XXXXXXX.XXX",
    ".X...........X.",
    "X..XXX...XXX..X",
    "X..XX.X.X.XX..X",
    "X..XXX...XXX..X",
    "X......X......X",
    "X.....X.X.....X",
    ".X...........X.",
    "..XXXXXXXXXXX..",
  ])],
  ["an-coelhinho", "Coelhinho kawaii", P([
    "..XX.....XX..",
    ".X..X...X..X.",
    ".X..X...X..X.",
    ".X..X...X..X.",
    "..X..XXX..X..",
    ".X.........X.",
    "X...........X",
    "X..X.....X..X",
    "X.XX..X..XX.X",
    "X....X.X....X",
    ".X.........X.",
    "..XXXXXXXXX..",
  ])],
  ["an-pinguim", "Pinguim fofo", P([
    "....XXXXX....",
    "..XXXXXXXXX..",
    ".XXX.....XXX.",
    ".XX..X.X..XX.",
    "XX....X....XX",
    "XX.........XX",
    "XX.........XX",
    ".XX.......XX.",
    "..XXXXXXXXX..",
    "..XX.....XX..",
  ])],
  ["an-sapinho", "Sapinho kawaii", P([
    ".XXX.....XXX.",
    "X.X.X...X.X.X",
    "X...XXXXX...X",
    ".XXX.....XXX.",
    "X...........X",
    "X.XX.....XX.X",
    "X...XXXXX...X",
    ".X.........X.",
    "..XXXXXXXXX..",
  ])],
  ["an-polvo", "Polvinho kawaii", P([
    "....XXXXX....",
    "..XXXXXXXXX..",
    ".XXXXXXXXXXX.",
    ".XXX.XXX.XXX.",
    ".XXXXXXXXXXX.",
    ".XX.XX.XX.XX.",
    ".XXXX...XXXX.",
    "..XXXXXXXXX..",
    ".X.X.X.X.X.X.",
    "X..X..X..X..X",
    "X.X..X.X..X.X",
  ])],
  ["an-baleia", "Baleia kawaii", P([
    "..X.X..........",
    "...X...........",
    "..XXX..........",
    "....XXXXXX.....",
    "..XXXXXXXXXX..X",
    ".XXXXXXXXXXXXXX",
    ".XX.XXXXXXXXXX.",
    "XXXXXXXXXXXXX..",
    ".X..XXXXXXXX...",
    "..XXXXXXXXX....",
  ])],
  ["an-unicornio", "Unicórnio", P([
    "X..............",
    ".X.............",
    "..X....X.......",
    "...XX.XX.......",
    "...XXXXXXX.....",
    "..XXXXXXXXXX...",
    ".XXX.XXXXXXXX..",
    "XXXXXXXXXXXXXX.",
    "XXXXXXXXXX.XXXX",
    ".XXXX...XXXX.XX",
    "........XXXXX.X",
    ".........XXXXX.",
  ])],
  ["an-raposinha", "Raposinha", P([
    "X.............X",
    "XX...........XX",
    "XXX.........XXX",
    "XXXXXXXXXXXXXXX",
    "XXXXXXXXXXXXXXX",
    "XXX..XXXXX..XXX",
    ".XXX.XXXXX.XXX.",
    "..X....X....X..",
    "...X.......X...",
    "....X.XXX.X....",
    ".....X...X.....",
    "......XXX......",
  ])],
  ["an-pintinho", "Pintinho", P([
    "....XXX....",
    "...XXXXX...",
    "..XX.XX.X..",
    "..XXXXXXXXX",
    "..XXXXXXX..",
    ".XXXXXXXXX.",
    "XXX.XXXXXX.",
    "XX..XXXXXX.",
    ".XXXXXXXXX.",
    "..XXXXXXX..",
    "...X...X...",
    "..XX..XX...",
  ])],
  ["an-gato-da-sorte", "Gato da sorte", P([
    "..X.....X.......",
    ".XXX...XXX...XX.",
    ".XXXXXXXXX..XXXX",
    ".XX.XXX.XX..XXXX",
    ".XXXXXXXXX...XX.",
    ".XXX.X.XXX...XX.",
    "..XXXXXXX...XX..",
    "..XXXXXXXXXXX...",
    ".XXX.....XXX....",
    ".XX...X...XX....",
    ".XX..XXX..XX....",
    ".XX.......XX....",
    ".XXXXXXXXXXX....",
    "..XXX...XXX.....",
  ])],

  // ——— Fofuras do céu e outras ———
  ["an-estrela-sorrindo", "Estrela sorrindo", G(19, 18, (x, y) => {
    if (!naEstrela(x, y, 9, 9.6, 9.6, 4.2)) return false;
    const olho = (x === 7 || x === 11) && (y === 8 || y === 9);
    const boca = (y === 12 && x >= 8 && x <= 10) || (y === 11 && (x === 7 || x === 11));
    return !(olho || boca);
  })],
  ["an-sol-kawaii", "Solzinho kawaii", G(19, 19, (x, y) => {
    const d = dist(x, y, 9, 9);
    if (d <= 5.6) {
      const olho = (x === 7 || x === 11) && (y === 8 || y === 7);
      const boca = (y === 11 && x >= 8 && x <= 10) || (y === 10 && (x === 7 || x === 11));
      return !(olho || boca);
    }
    const a = Math.atan2(y - 9, x - 9);
    const fase = (((a / (2 * Math.PI)) * 8 + 0.5) % 1 + 1) % 1;
    return d >= 6.8 && d <= 9.4 && Math.abs(fase - 0.5) < 0.15;
  })],
  ["an-nuvem-kawaii", "Nuvenzinha kawaii", P([
    "......XXXX.......",
    "....XX....XXXXX..",
    "...X.......X...X.",
    ".XX.............X",
    "X...............X",
    "X...X.....X.....X",
    "X...X.....X.....X",
    "X.XX..XXX..XX...X",
    ".X.............X.",
    "..XXXXXXXXXXXXX..",
  ])],
  ["an-lua-dormindo", "Lua dormindo", G(21, 17, (x, y) => {
    if (x >= 14) {
      const zx = x - 14, zy = y;
      return zy <= 4 && ((zy === 0 && zx <= 4) || (zy === 4 && zx <= 4) || (zy > 0 && zy < 4 && zx === 4 - zy));
    }
    const dentro = dist(x, y, 7, 9) <= 7.5 && dist(x, y, 10.5, 6.5) > 6.2;
    if (!dentro) return false;
    const olho = y === 9 && x >= 3 && x <= 5;
    return !olho;
  })],
  ["an-arco-iris-kawaii", "Arco-íris com nuvens", G(23, 13, (x, y) => {
    const nuvem = dist(x, y, 3, 10.5) <= 2.7 || dist(x, y, 5.5, 10.8) <= 2.3 || dist(x, y, 19, 10.5) <= 2.7 || dist(x, y, 16.5, 10.8) <= 2.3;
    if (nuvem) return true;
    const d = dist(x, y, 11, 11);
    return y <= 10 && ((d >= 10 && d < 11.2) || (d >= 7.6 && d < 8.8) || (d >= 5.2 && d < 6.4));
  })],
  ["an-coracao-kawaii", "Coração com carinha", P([
    "..XXXXX...XXXXX..",
    ".XXXXXXX.XXXXXXX.",
    "XXXXXXXXXXXXXXXXX",
    "XXXX..XXXXX..XXXX",
    "XXXX..XXXXX..XXXX",
    "XXXXXXXXXXXXXXXXX",
    ".XX.XXX...XXX.XX.",
    "..XXXXXX.XXXXXX..",
    "...XXXXXXXXXXX...",
    ".....XXXXXXX.....",
    ".......XXX.......",
    "........X........",
  ])],
  ["an-bubble-tea", "Chá de bolinhas", P([
    "......X....",
    ".....X.....",
    "....X......",
    "XXXXXXXXXXX",
    "X...X.....X",
    ".X..X....X.",
    ".X.X.....X.",
    ".X.......X.",
    ".X.X.X.X.X.",
    ".XX.X.X.XX.",
    ".X.X.X.X.X.",
    "..XXXXXXX..",
  ])],
  ["an-microfone", "Microfone de idol", P([
    "..XXXXX..",
    ".XX.X.XX.",
    ".X.X.X.X.",
    ".XX.X.XX.",
    "..XXXXX..",
    "...XXX...",
    "....X....",
    "....X....",
    "...XXX...",
    "...XXX...",
    "...XXX...",
    "....X....",
  ])],
  ["an-chapeu-mago", "Chapéu de mago", P([
    "........X......",
    ".......XX......",
    "......XXX......",
    "......XXXX.....",
    ".....XX.XX.....",
    ".....XXXXXX....",
    "....XXXXXXX....",
    "....XXXXXXXX...",
    "XXXXXXXXXXXXXXX",
    ".XXXXXXXXXXXXX.",
  ])],
  ["an-livro-magico", "Livro de magia", P([
    ".XXXXXX.XXXXXX.",
    "X......X......X",
    "X.XXXX.X.XXXX.X",
    "X......X......X",
    "X.XXX..X.XXX..X",
    "X......X......X",
    "X.XXXX.X.XXXX.X",
    "X......X......X",
    ".XXXXXXXXXXXXX.",
  ])],
  ["an-varinha", "Varinha de estrela", G(17, 17, (x, y) => {
    if (naEstrela(x, y, 11.5, 5.5, 5.4, 2.3)) return true;
    return x + y === 16 && x >= 1 && x <= 7;
  })],
  ["an-daruma", "Boneco daruma", P([
    "....XXXXXXX....",
    "..XXXXXXXXXXX..",
    ".XXX.......XXX.",
    ".XX..X...X..XX.",
    "XX...........XX",
    "XX....XXX....XX",
    "XXX.........XXX",
    "XXXXXXXXXXXXXXX",
    "XXXXXX...XXXXXX",
    "XXXXXX...XXXXXX",
    ".XXXXXXXXXXXXX.",
    "..XXXXXXXXXXX..",
    "....XXXXXXX....",
  ])],
  ["an-mascara-oni", "Máscara de oni", P([
    "X.............X",
    "XX...........XX",
    ".XX..XXXXX..XX.",
    "..XXXXXXXXXXX..",
    ".XXXXXXXXXXXXX.",
    ".XX..XXXXX..XX.",
    ".X....XXX....X.",
    ".XXXXXXXXXXXXX.",
    ".XXXXX...XXXXX.",
    ".X.X.......X.X.",
    ".XX.X.X.X.X.XX.",
    "..XXXXXXXXXXX..",
    "....XXXXXXX....",
  ])],
  ["an-bento", "Marmita bentô", P([
    "XXXXXXXXXXXXXXX",
    "X......X......X",
    "X.X.X..X.XXX..X",
    "X..X...X.XXX..X",
    "X.X.X..X......X",
    "XXXXXXXXXXXXXXX",
    "X..XX..X..X.X.X",
    "X.XXXX.X.X.X..X",
    "X..XX..X..X.X.X",
    "XXXXXXXXXXXXXXX",
  ])],
  ["an-bichinho-virtual", "Bichinho virtual", P([
    "....XXXXX....",
    "..XX.....XX..",
    ".X.........X.",
    "X..XXXXXXX..X",
    "X..X.....X..X",
    "X..X.X.X.X..X",
    "X..X..X..X..X",
    "X..XXXXXXX..X",
    "X...........X",
    "X..X..X..X..X",
    ".X.........X.",
    "..XX.....XX..",
    "....XXXXX....",
  ])],
  ["an-chibi", "Bonequinho chibi", P([
    "..X...X...X..",
    "..XX.XXX.XX..",
    ".XXXXXXXXXXX.",
    "XXXXXXXXXXXXX",
    "XX.X.X.X.X.XX",
    "X...........X",
    "X..XX...XX..X",
    "X..XX...XX..X",
    ".X....X....X.",
    "..XXXXXXXXX..",
    "....XXXXX....",
    "..XXXXXXXXX..",
    "....XXXXX....",
    "....X...X....",
  ])],
  ["an-mao-joinha", "Joinha", P([
    ".....XX.....",
    "....XXX.....",
    "....XX......",
    "...XXX......",
    "XX.XXXXXXXX.",
    "XX.X.......X",
    "XX.XXXXXXXX.",
    "XX.X.......X",
    "XX.XXXXXXXX.",
    "XX.X......X.",
    "XX.XXXXXXX..",
  ])],
  ["an-raio-anime", "Raio de poder", P([
    "........XXXX",
    ".......XXXX.",
    "......XXXX..",
    ".....XXXX...",
    "....XXXXXXXX",
    "...XXXXXXXX.",
    "......XXXX..",
    ".....XXXX...",
    "....XXX.....",
    "...XX.......",
    "..X.........",
  ])],
];

// Traditional Japanese patterns (public domain), filling the whole panel
// from its centre like the boho kilims.
const ladrilho = (d: string[]): Teste => (i, j, cols, rows) =>
  d[mod(j - meio(rows), d.length)][mod(i - meio(cols), d[0].length)] === "X";

const distLinha = (x: number, y: number, ang: number, passo: number, desloc = 0) => {
  const v = x * -Math.sin(ang) + y * Math.cos(ang) - desloc;
  const m = mod(v, passo);
  return Math.min(m, passo - m);
};

const PADROES: [string, string, Teste][] = [
  ["an-ichimatsu", "Xadrez ichimatsu", ladrilho(["XXX...", "XXX...", "XXX...", "...XXX", "...XXX", "...XXX"])],
  ["an-asanoha", "Padrão asanoha", (i, j, cols, rows) => {
    const x = i - meio(cols), y = j - meio(rows);
    const s = 16;
    const h = (s * Math.sqrt(3)) / 2;
    const angs: [number, number][] = [[0, h], [Math.PI / 3, h], [-Math.PI / 3, h], [Math.PI / 2, s / 2], [Math.PI / 6, s / 2], [-Math.PI / 6, s / 2]];
    return angs.some(([a, p]) => distLinha(x, y + 0.5, a, p) < 0.5);
  }],
  ["an-seigaiha", "Ondas seigaiha", (i, j, cols, rows) => {
    const x = i - meio(cols), y = j - meio(rows);
    const R = 7;
    for (let k = Math.ceil(y / 3) + 3; k >= Math.floor(y / 3) - 1; k--) {
      const cy = k * 3;
      const desl = mod(k, 2) === 0 ? 0 : R;
      const cx = Math.round((x - desl) / (2 * R)) * 2 * R + desl;
      const d = dist(x, y, cx, cy);
      if (y <= cy && d <= R + 0.5) return mod(R + 0.5 - d, 2.4) < 1;
    }
    return false;
  }],
  ["an-yagasuri", "Flechas yagasuri", (i, j, cols, rows) => {
    const x = i - meio(cols) + 2, y = j - meio(rows);
    const c = Math.floor(x / 5);
    const u = Math.abs(mod(x, 5) - 2);
    const v = mod(y + (mod(c, 2) === 0 ? u : -u) + (mod(c, 2) === 0 ? 0 : 3), 6);
    return mod(x, 5) !== 4 && v < 3;
  }],
  ["an-kagome", "Trama kagome", (i, j, cols, rows) => {
    const x = i - meio(cols), y = j - meio(rows);
    const p = 7;
    return distLinha(x, y, 0, p, 0.5) < 0.5 || distLinha(x, y, Math.PI / 3, p, 3.5) < 0.55 || distLinha(x, y, -Math.PI / 3, p, 3.5) < 0.55;
  }],
  ["an-chuva-sakura", "Chuva de sakura", repetido([".X.X.", "XXXXX", ".XXX.", "XX.XX"], 3)],
];

const GRUPO: Categoria = "animes";
export const FORMAS_ANIMES: Record<string, Teste> = Object.fromEntries([
  ...DESENHOS.map(([valor, , d]) => [valor, figura(d)] as const),
  ...PADROES.map(([valor, , t]) => [valor, t] as const),
]);
export const ROTULOS_ANIMES = [...DESENHOS, ...PADROES].map(([valor, rotulo]) => ({ valor, rotulo, grupo: GRUPO }));
