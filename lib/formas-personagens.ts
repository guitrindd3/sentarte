import type { Categoria } from "./formas-categorias";
import { figura, type Teste } from "./formas-extras-2";

// 50 anime-STYLE characters for the "Animes e desenhos" tab (2026-11-03, user:
// "quero formas de personagens de animes… mais 50"). They are ARCHETYPES
// (garoto ninja, garota mágica, lutador de cabelo espetado, pirata de chapéu
// de palha, yokai do folclore…) built from one chibi kit so they share a
// style — never a specific licensed character (no Goku/Naruto/Luffy marks,
// symbols, scars or names). Keys `pa-*`.

const W = 21;
const H = 21;

class Tela {
  g: boolean[][] = Array.from({ length: H }, () => Array(W).fill(false));
  set(x: number, y: number, v = true) {
    if (x >= 0 && x < W && y >= 0 && y < H) this.g[y][x] = v;
  }
  pts(l: [number, number][], v = true) {
    for (const [x, y] of l) this.set(x, y, v);
  }
  ret(x0: number, y0: number, x1: number, y1: number, v = true) {
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) this.set(x, y, v);
  }
  linha(x0: number, y0: number, x1: number, y1: number, v = true) {
    const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0));
    for (let k = 0; k <= n; k++) this.set(Math.round(x0 + ((x1 - x0) * k) / (n || 1)), Math.round(y0 + ((y1 - y0) * k) / (n || 1)), v);
  }
  cada(f: (x: number, y: number) => boolean | undefined, v = true) {
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (f(x, y)) this.set(x, y, v);
  }
  linhas() {
    return this.g.map((r) => r.map((b) => (b ? "X" : ".")).join(""));
  }
}

// head: ellipse centred at (10, 8)
const CX = 10;
const CY = 8;
const naCabeca = (x: number, y: number, folga = 0) => ((x - CX) / (6.3 + folga)) ** 2 + ((y - CY) / (5.6 + folga)) ** 2 <= 1;

type Cabelo = "curto" | "espetado" | "franja" | "longo" | "rabo" | "chiquinhas" | "coque" | "bagunca" | "careca" | "capuz" | "topete";
type Orelhas = "gato" | "raposa" | "coelho" | "lobo" | "elfo" | "chifres" | "chifrinhos" | "urso";
type Chapeu = "bandana" | "palha" | "bone" | "coroa" | "bruxa" | "tiara" | "fone" | "laco" | "capacete" | "faixa" | "aureola" | "kasa";
type Olhos = "normal" | "fechados" | "bravos" | "brilho" | "oculos" | "tapa" | "visor" | "pontos";
type Boca = "sorriso" | "aberta" | "reta" | "presas" | "gato" | "nada";
type Roupa = "camiseta" | "capa" | "marinheiro" | "armadura" | "quimono" | "vestido" | "gakuran" | "manto" | "macacao" | "regata";
type Item = "espada" | "katana" | "cajado" | "varinha" | "microfone" | "bola" | "arco" | "clava" | "guarda-chuva" | "escudo" | "lanca" | "punho" | "leque" | "livro" | "bastao" | "kunai" | "lanterna";

type Op = {
  cabelo?: Cabelo;
  orelhas?: Orelhas;
  chapeu?: Chapeu;
  olhos?: Olhos;
  boca?: Boca;
  roupa?: Roupa;
  item?: Item;
  bochechas?: boolean;
  bigode?: boolean;
  barba?: boolean;
  mascara?: boolean;
  cauda?: "raposa" | "gato" | "nove" | "demonio";
  bracosPraCima?: boolean;
  aura?: boolean;
};

function chibi(o: Op): string[] {
  const t = new Tela();
  const roupa = o.roupa ?? "camiseta";

  // aura behind everything (flame outline)
  if (o.aura)
    t.cada((x, y) => {
      const d = ((x - CX) / 9.6) ** 2 + ((y - 10.5) / 10.2) ** 2;
      const fogo = Math.sin(x * 1.9) > 0.2 ? 0.08 : 0;
      return d <= 1 + fogo && d > 0.86 + fogo && y < 19;
    });
  // cape / cloak behind the body
  if (roupa === "capa" || roupa === "manto")
    t.cada((x, y) => y >= 14 && y <= 20 && Math.abs(x - CX) <= 3 + (y - 14) * (roupa === "manto" ? 0.9 : 1.15));
  if (o.cauda === "raposa" || o.cauda === "gato" || o.cauda === "demonio") {
    if (o.cauda === "raposa") t.cada((x, y) => ((x - 16.5) / 2.6) ** 2 + ((y - 16.5) / 3.6) ** 2 <= 1);
    if (o.cauda === "gato") t.pts([[15, 18], [16, 18], [17, 17], [18, 16], [18, 15], [19, 14]]);
    if (o.cauda === "demonio") t.pts([[15, 18], [16, 19], [17, 19], [18, 18], [19, 17], [19, 16], [18, 16], [20, 16]]);
  }
  if (o.cauda === "nove")
    for (const a of [-1.2, -0.8, -0.4, 0.4, 0.8, 1.2]) t.linha(CX, 17, Math.round(CX + Math.sin(a) * 10), Math.round(17 - Math.cos(a) * 6));

  // body
  const meia = (y: number) => 2 + (y - 14) * 0.5;
  t.cada((x, y) => y >= 14 && y <= 18 && Math.abs(x - CX) <= meia(y));
  if (roupa === "vestido") t.cada((x, y) => y >= 17 && y <= 19 && Math.abs(x - CX) <= 4 + (y - 17));
  if (roupa === "macacao") t.ret(8, 19, 12, 19);
  // legs
  if (roupa !== "vestido" && roupa !== "manto") t.pts([[8, 19], [9, 19], [11, 19], [12, 19], [8, 20], [9, 20], [11, 20], [12, 20]]);
  if (roupa === "vestido") t.pts([[8, 20], [12, 20]]);
  // outfit details (holes in the filled body)
  if (roupa === "marinheiro") {
    t.pts([[9, 15], [11, 15], [10, 16]], false);
    t.pts([[9, 16], [11, 16]], true);
    t.ret(7, 17, 13, 17, false);
  }
  if (roupa === "quimono") t.pts([[8, 14], [9, 15], [10, 16], [12, 14], [11, 15]], false);
  if (roupa === "gakuran") t.pts([[10, 15], [10, 17]], false);
  if (roupa === "regata") t.pts([[8, 14], [12, 14]], false);
  if (roupa === "armadura") {
    t.ret(5, 14, 7, 15);
    t.ret(13, 14, 15, 15);
    t.ret(8, 16, 12, 16, false);
  }
  if (roupa === "camiseta") t.set(10, 14, false);
  // arms
  if (o.bracosPraCima) {
    t.pts([[6, 14], [5, 13], [4, 12], [14, 14], [15, 13], [16, 12]]);
  } else {
    t.pts([[6, 15], [5, 16], [5, 17], [14, 15], [15, 16], [15, 17]]);
  }

  // head: clear, outline
  t.cada((x, y) => naCabeca(x, y), false);
  t.cada((x, y) => naCabeca(x, y) && !naCabeca(x, y, -1));

  // ears (before hair so hair can cover the roots)
  const or = o.orelhas;
  if (or === "gato" || or === "lobo") {
    const alto = or === "lobo" ? 1 : 0;
    t.pts([[5, 3], [4, 2 - alto], [4, 1 - alto], [5, 2], [6, 3], [15, 3], [16, 2 - alto], [16, 1 - alto], [15, 2], [14, 3]]);
    t.pts([[4, 3], [5, 1], [16, 3], [15, 1]]);
  }
  if (or === "raposa") t.cada((x, y) => y <= 4 && y >= 0 && ((Math.abs(x - 5) <= (y + 1) / 2 && x <= 7) || (Math.abs(x - 15) <= (y + 1) / 2 && x >= 13)));
  if (or === "urso") t.cada((x, y) => ((x - 5) ** 2 + (y - 3) ** 2 <= 3.2) || ((x - 15) ** 2 + (y - 3) ** 2 <= 3.2));
  if (or === "coelho") {
    t.ret(6, 0, 7, 3);
    t.ret(13, 0, 14, 3);
    t.pts([[6, 1], [13, 1]], false);
  }
  if (or === "elfo") t.pts([[3, 7], [2, 6], [1, 5], [3, 8], [17, 7], [18, 6], [19, 5], [17, 8]]);
  if (or === "chifres") t.pts([[6, 3], [5, 2], [4, 1], [4, 0], [14, 3], [15, 2], [16, 1], [16, 0], [5, 3], [15, 3]]);
  if (or === "chifrinhos") t.pts([[7, 2], [7, 1], [13, 2], [13, 1]]);

  // hair
  const cab = o.cabelo ?? "curto";
  const topo = (limite: number) => t.cada((x, y) => naCabeca(x, y) && y <= limite);
  if (cab !== "careca" && cab !== "capuz") {
    topo(5);
    // bangs
    t.cada((x, y) => naCabeca(x, y) && ((y === 6 && x % 3 !== 0) || (y === 7 && x % 3 === 1 && cab !== "franja")));
    if (cab === "franja") t.cada((x, y) => naCabeca(x, y) && y === 6);
  }
  if (cab === "espetado") {
    for (const [px, alt] of [[4, 2], [7, 3], [10, 4], [13, 3], [16, 2]] as const)
      t.cada((x, y) => y < 4 && y >= 4 - alt && Math.abs(x - px) <= (y - (4 - alt)) * 0.75);
    t.pts([[3, 5], [2, 4], [17, 5], [18, 4]]);
  }
  if (cab === "bagunca") t.pts([[3, 4], [2, 3], [17, 4], [18, 3], [6, 2], [5, 1], [10, 2], [10, 1], [14, 2], [15, 1]]);
  if (cab === "topete") t.cada((x, y) => y <= 3 && x >= 8 && x <= 15 && y >= 1 + Math.abs(x - 12) * 0.4);
  if (cab === "longo") {
    t.ret(3, 6, 4, 15);
    t.ret(16, 6, 17, 15);
  }
  if (cab === "rabo") t.cada((x, y) => ((x - 18) / 2) ** 2 + ((y - 6) / 4.6) ** 2 <= 1 && x >= 16);
  if (cab === "chiquinhas") {
    t.cada((x, y) => ((x - 2.5) / 2) ** 2 + ((y - 8) / 4.5) ** 2 <= 1 || ((x - 17.5) / 2) ** 2 + ((y - 8) / 4.5) ** 2 <= 1);
    t.pts([[4, 4], [16, 4]]);
  }
  if (cab === "coque") t.cada((x, y) => (x - CX) ** 2 + (y - 1.6) ** 2 <= 3.2);
  if (cab === "capuz") {
    t.cada((x, y) => naCabeca(x, y, 1) && !naCabeca(x, y, -1.6) && y <= 12);
    t.cada((x, y) => naCabeca(x, y) && y <= 5);
  }

  // headwear
  const ch = o.chapeu;
  if (ch === "bandana") {
    t.cada((x, y) => naCabeca(x, y, 0.4) && (y === 5 || y === 6), true);
    t.ret(8, 5, 12, 6, false);
    t.ret(8, 5, 12, 5);
    t.ret(8, 6, 12, 6, false);
    t.set(10, 6);
    t.pts([[17, 6], [18, 7], [19, 8], [18, 6], [19, 6]]);
  }
  if (ch === "faixa") {
    t.cada((x, y) => naCabeca(x, y, 0.4) && y === 5);
    t.pts([[17, 5], [18, 6], [19, 7], [18, 4], [19, 3]]);
  }
  if (ch === "palha") {
    t.cada((x, y) => y <= 3 && y >= 0 && Math.abs(x - CX) <= 5 - (y === 0 ? 1 : 0));
    t.ret(5, 2, 15, 2, false);
    t.ret(5, 2, 15, 2);
    t.ret(6, 1, 14, 1, false);
    t.ret(1, 4, 19, 4);
  }
  if (ch === "bone") {
    t.cada((x, y) => naCabeca(x, y) && y <= 4);
    t.ret(13, 4, 19, 4);
    t.set(10, 2);
  }
  if (ch === "coroa") {
    t.ret(6, 1, 14, 2);
    t.pts([[6, 0], [8, 0], [10, 0], [12, 0], [14, 0]]);
  }
  if (ch === "tiara") t.pts([[7, 3], [8, 2], [10, 1], [10, 2], [12, 2], [13, 3], [9, 2], [11, 2]]);
  if (ch === "laco") t.pts([[13, 1], [12, 2], [13, 3], [14, 2], [15, 1], [16, 2], [15, 3], [16, 1], [12, 1], [12, 3], [16, 3]]);
  if (ch === "aureola") {
    t.ret(7, 0, 13, 0);
    t.pts([[6, 1], [14, 1]]);
  }
  if (ch === "bruxa") {
    t.cada((x, y) => y <= 3 && Math.abs(x - 11 + y * 0.2) <= y * 0.9);
    t.ret(2, 4, 18, 4);
  }
  if (ch === "kasa") t.cada((x, y) => y <= 4 && y >= 0 && Math.abs(x - CX) <= y * 2.2 + 0.5);
  if (ch === "capacete") {
    t.cada((x, y) => naCabeca(x, y, 0.5) && y <= 6);
    t.ret(6, 6, 14, 7);
    t.ret(7, 7, 13, 7, false);
    t.pts([[10, 0], [10, 1], [9, 1], [11, 1]]);
  }
  if (ch === "fone") {
    t.cada((x, y) => naCabeca(x, y, 1) && !naCabeca(x, y, 0) && y <= 4);
    t.ret(2, 6, 4, 10);
    t.ret(16, 6, 18, 10);
  }

  // face
  const olhos = o.olhos ?? "normal";
  if (olhos === "normal" || olhos === "brilho" || olhos === "oculos") {
    t.ret(6, 8, 7, 10);
    t.ret(13, 8, 14, 10);
    if (olhos === "brilho") t.pts([[6, 8], [13, 8]], false);
  }
  if (olhos === "pontos") t.pts([[7, 9], [13, 9], [7, 10], [13, 10]]);
  if (olhos === "fechados") t.pts([[5, 9], [6, 8], [7, 8], [8, 9], [12, 9], [13, 8], [14, 8], [15, 9]]);
  if (olhos === "bravos") {
    t.pts([[5, 7], [6, 8], [7, 8], [8, 9], [15, 7], [14, 8], [13, 8], [12, 9]]);
    t.ret(6, 9, 7, 10);
    t.ret(13, 9, 14, 10);
  }
  if (olhos === "oculos") {
    t.pts([[5, 7], [6, 7], [7, 7], [8, 7], [5, 11], [6, 11], [7, 11], [8, 11], [4, 8], [4, 9], [4, 10], [9, 8], [9, 9], [9, 10]]);
    t.pts([[12, 7], [13, 7], [14, 7], [15, 7], [12, 11], [13, 11], [14, 11], [15, 11], [11, 8], [11, 9], [11, 10], [16, 8], [16, 9], [16, 10]]);
    t.set(10, 8);
  }
  if (olhos === "tapa") {
    t.ret(5, 8, 8, 10);
    t.ret(13, 8, 14, 10);
    t.linha(4, 6, 16, 6);
  }
  if (olhos === "visor") t.ret(5, 8, 15, 10);
  if (o.mascara) t.cada((x, y) => naCabeca(x, y) && y >= 11);
  if (o.bochechas) t.pts([[5, 11], [15, 11]]);
  const boca = o.boca ?? "sorriso";
  if (!o.mascara) {
    if (boca === "sorriso") t.pts([[9, 12], [10, 12], [11, 12]]);
    if (boca === "aberta") t.pts([[9, 11], [10, 11], [11, 11], [9, 12], [11, 12], [10, 12]]);
    if (boca === "reta") t.pts([[9, 12], [10, 12], [11, 12]]);
    if (boca === "presas") t.pts([[9, 11], [10, 11], [11, 11], [9, 12], [11, 12]]);
    if (boca === "gato") t.pts([[8, 11], [9, 12], [10, 11], [11, 12], [12, 11]]);
    if (boca === "sorriso") t.pts([[8, 11], [12, 11]]);
  }
  if (o.bigode) t.pts([[7, 11], [8, 11], [9, 11], [11, 11], [12, 11], [13, 11], [6, 12], [14, 12]]);
  if (o.barba) t.cada((x, y) => y >= 12 && y <= 16 && Math.abs(x - CX) <= 4 - (y - 12) * 0.8 && !(y === 12 && Math.abs(x - CX) <= 1));

  // held item (right hand at ~(15,17))
  const it = o.item;
  if (it === "espada" || it === "katana") {
    const x = 17;
    t.ret(x, 4, x, 14);
    if (it === "espada") t.ret(x - 1, 5, x + 1, 13);
    t.ret(x - 2, 15, x + 2, 15);
    t.ret(x, 16, x, 18);
    t.set(16, 17);
  }
  if (it === "cajado" || it === "bastao" || it === "lanca") {
    t.ret(17, it === "lanca" ? 2 : 4, 17, 20);
    t.set(16, 17);
    if (it === "cajado") t.cada((x, y) => (x - 17) ** 2 + (y - 2.5) ** 2 <= 2.6);
    if (it === "lanca") t.pts([[16, 2], [18, 2], [17, 1], [17, 0], [16, 1], [18, 1]]);
  }
  if (it === "varinha") {
    t.linha(15, 17, 18, 12);
    t.pts([[18, 9], [17, 10], [18, 10], [19, 10], [16, 11], [17, 11], [18, 11], [19, 11], [20, 11], [17, 12], [19, 12]]);
  }
  if (it === "microfone") {
    t.ret(16, 14, 16, 17);
    t.ret(15, 12, 17, 13);
  }
  if (it === "bola") t.cada((x, y) => (x - 18) ** 2 + (y - 16) ** 2 <= 4.5 && !((x - 18) ** 2 + (y - 16) ** 2 <= 1.2 && x === 18));
  if (it === "arco") {
    t.pts([[17, 10], [18, 11], [19, 12], [19, 13], [19, 14], [19, 15], [19, 16], [19, 17], [18, 18], [17, 19]]);
    t.ret(17, 10, 17, 19);
  }
  if (it === "clava") {
    t.linha(16, 18, 18, 10);
    t.ret(17, 6, 20, 10);
    t.pts([[17, 7], [19, 9]], false);
  }
  if (it === "guarda-chuva") {
    t.cada((x, y) => y <= 9 && y >= 6 && Math.abs(x - 18) <= (y - 5) * 1.0);
    t.ret(18, 9, 18, 17);
    t.set(17, 18);
  }
  if (it === "escudo") t.cada((x, y) => y >= 13 && y <= 19 && Math.abs(x - 18) <= (y >= 17 ? 19 - y : 2));
  if (it === "punho") {
    t.ret(15, 9, 17, 11);
    t.pts([[15, 12], [15, 13], [16, 12]]);
  }
  if (it === "leque") t.cada((x, y) => y >= 11 && y <= 16 && Math.hypot(x - 15, y - 17) <= 5 && x >= 15);
  if (it === "livro") {
    t.ret(15, 15, 19, 18);
    t.ret(17, 15, 17, 18, false);
  }
  if (it === "kunai") t.pts([[16, 16], [17, 15], [18, 14], [19, 13], [18, 13], [19, 14], [20, 12]]);
  if (it === "lanterna") {
    t.ret(16, 13, 16, 16);
    t.ret(15, 17, 18, 20);
    t.ret(16, 18, 17, 19, false);
  }
  return t.linhas();
}

const PERSONAGENS: [string, string, Op][] = [
  // ——— Shonen / aventura ———
  ["pa-garoto-ninja", "Garoto ninja", { cabelo: "espetado", chapeu: "bandana", roupa: "camiseta", item: "kunai" }],
  ["pa-garota-ninja", "Garota ninja", { cabelo: "rabo", chapeu: "bandana", roupa: "quimono", item: "kunai" }],
  ["pa-ninja-mascarado", "Ninja mascarado", { cabelo: "bagunca", chapeu: "bandana", mascara: true, roupa: "quimono" }],
  ["pa-ninja-capuz", "Ninja de capuz", { cabelo: "capuz", mascara: true, olhos: "bravos", roupa: "manto" }],
  ["pa-lutador-espetado", "Lutador de cabelo espetado", { cabelo: "espetado", olhos: "bravos", boca: "reta", roupa: "quimono", item: "punho" }],
  ["pa-lutador-aura", "Lutador com aura de poder", { cabelo: "espetado", olhos: "bravos", boca: "aberta", roupa: "regata", aura: true }],
  ["pa-lutador-faixa", "Lutador de faixa", { cabelo: "bagunca", chapeu: "faixa", olhos: "bravos", roupa: "quimono" }],
  ["pa-mestre-barbudo", "Mestre barbudo", { cabelo: "careca", olhos: "oculos", barba: true, roupa: "quimono", item: "bastao" }],
  ["pa-samurai", "Samurai", { cabelo: "coque", olhos: "bravos", boca: "reta", roupa: "quimono", item: "katana" }],
  ["pa-garota-samurai", "Garota samurai", { cabelo: "longo", olhos: "normal", roupa: "quimono", item: "katana" }],
  ["pa-ronin-chapeu", "Andarilho de chapéu", { chapeu: "kasa", cabelo: "careca", olhos: "bravos", boca: "reta", roupa: "manto", item: "katana" }],
  ["pa-pirata-palha", "Pirata de chapéu de palha", { chapeu: "palha", cabelo: "bagunca", boca: "aberta", roupa: "regata", bracosPraCima: true }],
  ["pa-pirata-tapa-olho", "Pirata de tapa-olho", { cabelo: "bagunca", olhos: "tapa", boca: "sorriso", roupa: "capa", item: "espada" }],
  ["pa-espadachim", "Espadachim", { cabelo: "curto", chapeu: "faixa", olhos: "bravos", boca: "reta", roupa: "manto", item: "espada" }],
  ["pa-cacador-demonios", "Caçador de demônios", { cabelo: "bagunca", olhos: "bravos", roupa: "capa", item: "katana" }],
  ["pa-cavaleiro", "Cavaleiro", { chapeu: "capacete", cabelo: "careca", olhos: "visor", roupa: "armadura", item: "escudo" }],
  ["pa-heroi-capa", "Herói de capa", { cabelo: "topete", olhos: "bravos", roupa: "capa", bracosPraCima: true }],
  ["pa-arqueira", "Arqueira", { cabelo: "rabo", orelhas: "elfo", roupa: "camiseta", item: "arco" }],
  ["pa-lanceiro", "Guerreiro de lança", { cabelo: "espetado", chapeu: "faixa", olhos: "bravos", roupa: "armadura", item: "lanca" }],
  ["pa-jogador-bola", "Jogador de anime", { cabelo: "espetado", roupa: "camiseta", item: "bola", boca: "aberta" }],
  // ——— Magia e fantasia ———
  ["pa-garota-magica", "Garota mágica", { cabelo: "chiquinhas", chapeu: "tiara", olhos: "brilho", roupa: "vestido", item: "varinha", bochechas: true }],
  ["pa-bruxinha", "Bruxinha", { cabelo: "longo", chapeu: "bruxa", roupa: "vestido", item: "cajado" }],
  ["pa-maga-elfa", "Maga elfa", { cabelo: "longo", orelhas: "elfo", olhos: "fechados", roupa: "manto", item: "cajado" }],
  ["pa-mago-livro", "Mago do livro", { cabelo: "bagunca", olhos: "oculos", roupa: "manto", item: "livro" }],
  ["pa-princesa", "Princesa", { cabelo: "longo", chapeu: "coroa", roupa: "vestido", bochechas: true }],
  ["pa-anjinho", "Anjinho", { cabelo: "curto", chapeu: "aureola", olhos: "fechados", roupa: "vestido", bochechas: true }],
  ["pa-vampirinho", "Vampirinho", { cabelo: "topete", boca: "presas", olhos: "bravos", roupa: "capa" }],
  ["pa-rei-demonio", "Rei demônio", { cabelo: "espetado", orelhas: "chifres", olhos: "bravos", boca: "presas", roupa: "capa", cauda: "demonio" }],
  ["pa-demoninha", "Demoninha", { cabelo: "chiquinhas", orelhas: "chifrinhos", boca: "presas", roupa: "vestido", cauda: "demonio" }],
  ["pa-idol", "Idol cantando", { cabelo: "chiquinhas", chapeu: "laco", olhos: "fechados", boca: "aberta", roupa: "vestido", item: "microfone" }],
  // ——— Orelhinhas (kemonomimi) ———
  ["pa-garota-gato", "Garota de orelha de gato", { cabelo: "longo", orelhas: "gato", boca: "gato", roupa: "marinheiro", cauda: "gato", bochechas: true }],
  ["pa-garoto-gato", "Garoto de orelha de gato", { cabelo: "bagunca", orelhas: "gato", boca: "gato", roupa: "camiseta", cauda: "gato" }],
  ["pa-garota-raposa", "Garota raposa", { cabelo: "longo", orelhas: "raposa", roupa: "quimono", cauda: "raposa", item: "leque" }],
  ["pa-kitsune-nove", "Raposa de nove caudas", { cabelo: "longo", orelhas: "raposa", olhos: "fechados", roupa: "quimono", cauda: "nove" }],
  ["pa-garota-coelho", "Garota coelhinha", { cabelo: "franja", orelhas: "coelho", roupa: "vestido", bochechas: true }],
  ["pa-garoto-lobo", "Garoto lobo", { cabelo: "espetado", orelhas: "lobo", olhos: "bravos", boca: "presas", roupa: "regata" }],
  ["pa-garota-urso", "Garota ursinha", { cabelo: "franja", orelhas: "urso", roupa: "macacao", bochechas: true }],
  // ——— Escola e dia a dia ———
  ["pa-estudante-marinheiro", "Estudante de uniforme", { cabelo: "franja", roupa: "marinheiro", bochechas: true }],
  ["pa-estudante-gakuran", "Estudante de colarinho", { cabelo: "curto", olhos: "normal", boca: "reta", roupa: "gakuran" }],
  ["pa-garota-oculos", "Garota de óculos", { cabelo: "longo", olhos: "oculos", roupa: "marinheiro", item: "livro" }],
  ["pa-garoto-oculos", "Garoto gênio de óculos", { cabelo: "topete", olhos: "oculos", boca: "reta", roupa: "gakuran" }],
  ["pa-garoto-fone", "Garoto de fone", { cabelo: "bagunca", chapeu: "fone", olhos: "fechados", roupa: "camiseta" }],
  ["pa-garoto-bone", "Garoto de boné", { cabelo: "curto", chapeu: "bone", boca: "aberta", roupa: "camiseta", item: "bola" }],
  ["pa-garota-coque", "Garota de coque", { cabelo: "coque", olhos: "fechados", roupa: "quimono", item: "leque", bochechas: true }],
  ["pa-bebe-chibi", "Bebê chibi", { cabelo: "careca", olhos: "pontos", boca: "aberta", roupa: "macacao", bochechas: true, bracosPraCima: true }],
  // ——— Folclore japonês e robôs ———
  ["pa-oni-clava", "Oni com clava", { cabelo: "bagunca", orelhas: "chifres", olhos: "bravos", boca: "presas", roupa: "regata", item: "clava" }],
  ["pa-yokai-guarda-chuva", "Yokai com guarda-chuva", { cabelo: "careca", olhos: "pontos", boca: "aberta", roupa: "quimono", item: "guarda-chuva" }],
  ["pa-monge-lanterna", "Monge da lanterna", { cabelo: "careca", olhos: "fechados", roupa: "manto", item: "lanterna" }],
  ["pa-piloto-robo", "Piloto de robô", { chapeu: "capacete", cabelo: "careca", olhos: "visor", roupa: "macacao", bracosPraCima: true }],
  ["pa-ciborgue", "Ciborgue", { cabelo: "espetado", olhos: "visor", boca: "reta", roupa: "armadura", item: "punho" }],
];

const GRUPO: Categoria = "animes";
export const FORMAS_PERSONAGENS: Record<string, Teste> = Object.fromEntries(PERSONAGENS.map(([valor, , o]) => [valor, figura(chibi(o))]));
export const ROTULOS_PERSONAGENS = PERSONAGENS.map(([valor, rotulo]) => ({ valor, rotulo, grupo: GRUPO }));
