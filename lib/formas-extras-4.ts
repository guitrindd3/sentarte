import type { Categoria } from "./formas-categorias";
import { centrada, figura, meio, mod, type Teste } from "./formas-extras-2";

// Fourth batch (2026-10-09, user: "quero mais formas para todos... 6 categorias...
// em cada um 100 formas"): new pixel animals for the new "Bichos" tab, a few
// beach/sport/boho figures, and plain repeat patterns for "Básicos" plus some
// geometric figures. Same contract as the other batches: (i, j, cols, rows) →
// detail colour?. Every figure was reviewed on a contact sheet before shipping.

const lista: { valor: string; rotulo: string; grupo: Categoria; teste: Teste }[] = [];
const add = (grupo: Categoria, valor: string, rotulo: string, teste: Teste) => lista.push({ valor, rotulo, grupo, teste });

// ===================== Pixel figures =====================
const FIGURAS: [Categoria, string, string, string[]][] = [
  ["bichos", "bicho-girafa", "Girafa", ["..X.X.........", "..XXX.........", ".XXXXX........", "XX.XXX........", "XXXXXX........", "...XXX........", "...XXX........", "...XXX........", "...XXX........", "...XXXXXXXXXX.", "...XXXXXXXXXXX", "...XXXXXXXXXX.", "...XX.XX.XX.X.", "...XX.XX.XX.X.", "...XX.XX.XX.X."]],
  ["bichos", "bicho-elefante", "Elefante", [".....XXXXXXXX..", "..XXXXXXXXXXXX.", ".XXX.XXXXXXXXXX", "XX.X.XXXXXXXXXX", "XXXX.XXXXXXXXXX", "XXX.XXXXXXXXXXX", "XX..XXXXXXXXXXX", "XX..XXX.XXX.XXX", "XX..XXX.XXX.XXX", ".X..XXX.XXX.XXX"]],
  ["bichos", "bicho-leao", "Leão", ["...XXXXXXX...", ".XXXXXXXXXXX.", ".XXX.....XXX.", "XXX.......XXX", "XX..X...X..XX", "XX.........XX", "XX....X....XX", "XXX..XXX..XXX", ".XXX.....XXX.", ".XXXX.X.XXXX.", "...XXXXXXX..."]],
  ["bichos", "bicho-macaco", "Macaco", ["....XXXXX....", "..XXXXXXXXX..", ".XXXXXXXXXXX.", "XXXX.XXX.XXXX", "X.XX.X.X.XX.X", "XXX.......XXX", "..X.X...X.X..", "..X.......X..", "..XX.XXX.XX..", "...XX...XX...", "....XXXXX...."]],
  ["bichos", "bicho-zebra", "Zebra", ["X.X...........", "XXXX..........", "X.XXX.........", "XXXXX.........", "XX.XX.........", "..XX.XXXXXXXX.", "..XXX.X.X.X.XX", "..XX.X.X.X.XX.", "..XXXXXXXXXXX.", "..X.X.....X.X.", "..X.X.....X.X.", "..XX.X....XX.X"]],
  ["bichos", "bicho-panda", "Panda", ["XXX.......XXX", "XXX.......XXX", "..X.......X..", ".X.........X.", "X..XX...XX..X", "X.XXX...XXX.X", "X.XX.....XX.X", "X.....X.....X", ".X...XXX...X.", "..X.......X..", "...XXXXXXX..."]],
  ["bichos", "bicho-raposa", "Raposa", ["X.........X", "XX.......XX", "XXX.....XXX", "XXXXXXXXXXX", "XXXXXXXXXXX", "XX..XXX..XX", "XXX.XXX.XXX", ".XXXXXXXXX.", "..XXX.XXX..", "...XX.XX...", "....XXX....", ".....X....."]],
  ["bichos", "bicho-ovelha", "Ovelha", ["......XX.XX.XX.", "....XXXXXXXXXXX", ".XXXXXXXXXXXXXX", "XXX.XXXXXXXXXXX", "X.X.XXXXXXXXXXX", "XXX.XXXXXXXXXXX", ".X...XXXXXXXXX.", ".....XX.XX.XX..", ".....X..X...X..", ".....X..X...X.."]],
  ["bichos", "bicho-galinha", "Galinha", ["..XX..........", ".XXXX.........", "XXX.X.........", ".XXXX.........", "..XXX......XX.", "..XXXX....XXX.", ".XXXXXXXXXXXX.", ".XXXXXXXXXXXX.", "..XXXXXXXXXX..", "...XXXXXXXX...", ".....X..X.....", "....XX.XX....."]],
  ["bichos", "bicho-pintinho", "Pintinho", ["...XXXX....", "..XXXXXX...", "XXXX.XXX...", "..XXXXXX...", "...XXXXXXX.", "..XXXXXXXXX", "..XXXXXXXXX", "...XXXXXXX.", "....X..X...", "...XX.XX..."]],
  ["bichos", "bicho-galo", "Galo", ["..X.X..........", "..XXX..........", ".XXXX.......XX.", "XX.XX......X..X", ".XXXX.....X....", "..XXX....XX..X.", "..XXXX..XXX.X..", ".XXXXXXXXXXX...", ".XXXXXXXXXX....", "..XXXXXXXX.....", "....X..X.......", "...XX.XX......."]],
  ["bichos", "bicho-rato", "Ratinho", ["...XX..........", "..XXXX.........", ".XXXXXXXXXX....", "XX.XXXXXXXXX...", "XXXXXXXXXXXXX..", ".XXXXXXXXXXXX..", "...XX....XX.XX.", "..............X", "...........XXX."]],
  ["bichos", "bicho-esquilo", "Esquilo", ["......XXXXX..", ".....XXXXXXX.", ".XX..XX...XXX", "XXXX.XX....XX", "X.XX.XXX...XX", "XXXX..XXX.XX.", ".XXXX.XXXXX..", "..XXXXXXXX...", "..XXXXXXX....", "..XX..XX....."]],
  ["bichos", "bicho-ourico", "Ouriço", [".....X.X.X.X...", "...X.X.X.X.X.X.", "..XXXXXXXXXXXX.", ".XXXXXXXXXXXXXX", "XX.XXXXXXXXXXXX", "XXXXXXXXXXXXXXX", ".XXXXXXXXXXXXX.", "..X..X...X..X.."]],
  ["bichos", "bicho-coala", "Coala", [".XXX.....XXX.", "XXXXX...XXXXX", "XX..XXXXX..XX", "XX.XXXXXXX.XX", ".XXX.XXX.XXX.", "..XXXXXXXXX..", "..XXX...XXX..", "..XX.....XX..", "...X.....X...", "....XXXXX...."]],
  ["bichos", "bicho-canguru", "Canguru", ["XX...........", ".XX..........", ".XXXX........", "XX.XXX.......", "XXXXXX.......", "...XXXX......", "...XXXXX.....", "..XXXXXXX....", ".XXXXXXXXX...", ".X..XXXXXXX..", "....XXXXXXXX.", "...XXX....XXX"]],
  ["bichos", "bicho-camelo", "Camelo", ["...........XX..", "....XX..XX.XXX.", "...XXXXXXXXXXX.", "..XXXXXXXXXXX..", "..XXXXXXXXXX...", ".XXXXXXXXXXX...", "XX.XXXXXXXX....", "...X.X..X.X....", "...X.X..X.X....", "...X.X..X.X...."]],
  ["bichos", "bicho-hipopotamo", "Hipopótamo", [".XX..XX.........", "XXXXXXXX........", "XX.XX.XXXXXXXXX.", "XXXXXXXXXXXXXXXX", "XXXXXXXXXXXXXXXX", "X.X.XXXXXXXXXXXX", "XXXXXXXXXXXXXXXX", ".XXXXXXXXXXXXXX.", "...XXX.....XXX.."]],
  ["bichos", "bicho-jacare", "Jacaré", ["...........X.X.X.....", "XXXXXXXX..XXXXXXXX...", "X.X.X.XXXXXXXXXXXXXX.", "XXXXXXXXXXXXXXXXXXXXX", ".......XX.....XX....X"]],
  ["bichos", "bicho-morcego", "Morcego", ["X.....X.X.....X", "XX....XXX....XX", "XXXX.XXXXX.XXXX", "XXXXXX.X.XXXXXX", "XXXXXXXXXXXXXXX", ".XXXXXXXXXXXXX.", "..X.X.XXX.X.X..", ".......X......."]],
  ["bichos", "bicho-aranha", "Aranha", ["......X......", "......X......", "X....XXX....X", ".X..XXXXX..X.", "..XXXXXXXXX..", "X...XXXXX...X", ".XXXXXXXXXXX.", "....XXXXX....", "..XX.XXX.XX..", ".X.........X."]],
  ["bichos", "bicho-formiga", "Formiga", [".X........X..", "..X......X...", "...XX..XX....", "..XXXX.XXXX..", ".XXXXXXXXXXX.", "..XXXX.XXXXXX", "...XX..XXXXX.", "..X..X.X.X...", ".X..X..X..X.."]],
  ["bichos", "bicho-libelula", "Libélula", ["XXXX...X...XXXX", ".XXXXX.X.XXXXX.", "...XXXXXXXXX...", ".XXXXXXXXXXXXX.", "XXXX..XXX..XXXX", ".......X.......", ".......X.......", ".......X.......", ".......X.......", ".......X......."]],
  ["bichos", "bicho-golfinho", "Golfinho", ["........XX.......", ".......XXX.......", "....XXXXXXXX.....", "..XXXXXXXXXXXX...", ".XX.XXXXXXXXXXX..", "XXXXXXXXXXXXXXXX.", "....XXXXXXXXXXXXX", "......XX....XX.XX", "............X...X"]],
  ["bichos", "bicho-foca", "Foca", ["..XXX..........", ".XXXXX.........", "XXX.XX.........", "XXXXXX.........", ".XXXXXX........", "..XXXXXXXXXX...", "..XXXXXXXXXXX..", ".XXXXXXXXXXXXXX", "XXX...XXXXXXX.X"]],
  ["bichos", "bicho-agua-viva", "Água-viva", ["...XXXXXXX...", ".XXXXXXXXXXX.", "XXXXXXXXXXXXX", "XXX.XXXXX.XXX", "XXXXXXXXXXXXX", "X.X.X.X.X.X.X", "X.X.X.X.X.X.X", ".X..X.X..X.X.", "X..X..X.X..X.", ".X..X.X..X..X"]],
  ["bichos", "bicho-arraia", "Arraia", ["......X......", ".....XXX.....", "...XXXXXXX...", ".XXXXXXXXXXX.", "XXXX.XXX.XXXX", ".XXXXXXXXXXX.", "...XXXXXXX...", "......X......", "......X......", ".......X.....", "........X...."]],
  ["bichos", "bicho-camarao", "Camarão", ["X............", ".XXXXXX......", "...XXXXXXX...", "..XX.XXXXXX..", "..XXXXXXXXXX.", "......XXXXXX.", "......XXXXX..", "....XXXXXX...", "...XXX.......", "..XX.X......."]],
  ["bichos", "bicho-papagaio", "Papagaio", ["...XXXX....", "..XXXXXX...", ".XXX.XXXX..", "XXXXXXXXX..", "XX.XXXXXXX.", "X..XXXXXXX.", "...XXXXXXXX", "....XXXXXXX", "....XXXXXX.", ".....X.XX..", ".....XXXX..", "......XXX..", ".......XX.."]],
  ["bichos", "bicho-tucano", "Tucano", [".......XXXX...", "XXXXXXXXXXXX..", "XXXXXXXXX.XXX.", ".XXXXXXXXXXXX.", ".......XXXXXX.", "......XXXXXXX.", "......XXXXXXXX", ".......XXXXXXX", "........XXXXX.", ".........X.X.."]],
  ["bichos", "bicho-gaivota", "Gaivota", ["XX...........XX", ".XXX.......XXX.", "..XXXX...XXXX..", "....XXX.XXX....", "......XXX......"]],
  ["bichos", "bicho-pomba", "Pomba", ["..XXX.........", ".XX.XX........", "XXXXXX........", "..XXXXX....XXX", "..XXXXXXXXXXXX", "...XXXXXXXXXX.", "....XXXXXXXXX.", ".....XXXXXX...", ".......X.X...."]],
  ["bichos", "bicho-aguia", "Águia", ["......XX.......", ".....XXXX......", "XX...X.XXX...XX", "XXX..XXXX...XXX", "XXXXX.XX..XXXXX", ".XXXXXXXXXXXXX.", "..XXXXXXXXXXX..", "....XXXXXXX....", ".....XXXXX.....", ".....X.X.X....."]],
  ["bichos", "bicho-cisne", "Cisne", ["..XXX.........", "XXX.X.........", "..XXX.........", "..XX..........", "..XX..........", "..XX....XX....", "..XXX..XXXXXX.", "..XXXXXXXXXXXX", "...XXXXXXXXXX.", "....XXXXXXXX.."]],
  ["bichos", "bicho-unicornio", "Unicórnio", ["X.............", ".X............", "..XXX.........", ".XXXXX........", "XX.XXXX.......", "XXXXXXXX......", "...XXXXXX.....", "...XXXXXXXXXX.", "...XXXXXXXXXXX", "...XXXXXXXXXX.", "...X.X....X.X.", "...X.X....X.X."]],
  ["bichos", "bicho-preguica", "Bicho-preguiça", ["XXXXXXXXXXXXXXX", "..X.........X..", "..X.........X..", "..XXXXXXXXXXX..", "..XXXXXXXXXXX..", "...XXXXXXXXX...", "...XX.XXX.XX...", "...XXXX.XXXX...", "....XX...XX....", ".....XXXXX....."]],
  ["bichos", "bicho-capivara", "Capivara", ["..XX............", ".XXXXXXXXXXXXX..", "XX.XXXXXXXXXXXX.", "XXXXXXXXXXXXXXXX", "XXXXXXXXXXXXXXXX", "..XXXXXXXXXXXXX.", "...XX.......XX.."]],
  ["bichos", "bicho-tatu", "Tatu", ["......XXXXXX....", "....XXX.X.X.XX..", "...XXX.X.X.X.XX.", "..XXXX.X.X.X.XXX", "XXXXXX.X.X.X.XXX", ".XX.XXXXXXXXXXX.", "....XX......XX.."]],
  ["bichos", "bicho-onca", "Onça", ["X.......X......", "XXXXXXXXX......", "XX.XXX.XX......", "XXXXXXXXX..XXX.", ".XXX.XXXXXXXXXX", "..XXXXX.XXX.XXX", "..XX.XXXXX.XXX.", "..XXXXXXXXXXXX.", "..X.X.....X.X..", "..X.X.....X.X.."]],
  ["bichos", "bicho-arara", "Arara", ["...XXX.....", "..XXXXX....", ".XX.XXX....", "XXXXXXX....", "X..XXXXX...", "...XXXXXX..", "...XXXXXX..", "....XXXXX..", ".....XXX...", ".....XXX...", "......XX...", "......XX...", ".......X..."]],
  ["bichos", "bicho-peixe-palhaco", "Peixe-palhaço", ["....XXXXXX.......", "..XX.XX.XXXX...XX", ".XX.XX.XX.XXX.XXX", "XXX.XX.XX.XXXXXXX", "X.X.XX.XX.XXXXXXX", "XXX.XX.XX.XXX.XXX", ".XX.XX.XX.XX...XX", "..XXXXXXXXX......"]],
  ["bichos", "bicho-baiacu", "Baiacu", ["..X..X..X..X..", "X.XXXXXXXXXX.X", ".XXXXXXXXXXXX.", "XXX.XXXXXXXXX.", "XXXXXXXXXXXXXX", "XXXXXXXXXXXX..", ".XXXXXXXXXXXXX", "X.XXXXXXXXXX.X", "..X..X..X..X.."]],
  ["bichos", "bicho-lagosta", "Lagosta", [".X..X.....X..X.", "XXX.XX...XX.XXX", "XXX..X...X..XXX", ".X...XXXXX...X.", "..XX.XXXXX.XX..", ".....XXXXX.....", "...XX.XXX.XX...", "......XXX......", "......XXX......", ".....XXXXX.....", "....XX.X.XX...."]],
  ["bichos", "bicho-minhoca", "Minhoca", ["...........XX.", "..........XXXX", "..XXX.....X.XX", ".XXXXX...XXXX.", "XXX.XXX.XXX...", "XX...XXXXX...."]],
  ["bichos", "bicho-lobo", "Lobo uivando", ["..X...........", ".XX...........", ".XXX.X........", "XXXXXX........", "..XXXX........", "..XXXXX.......", "..XXXXXX......", "..XXXXXXX.....", "..XXXXXXXX..X.", "..XXXXXXXXXXX.", "..XX.XXXXXX...", "..XX.XX..XX..."]],
  ["bichos", "bicho-tigre", "Tigre", ["XX.......XX", "XXXXXXXXXXX", "X.X.XXX.X.X", "XXXXXXXXXXX", "X.XX...XX.X", "XX.X...X.XX", "XXXXX.XXXXX", "X..X...X..X", ".XX.X.X.XX.", "..XXXXXXX.."]],
  ["bichos", "bicho-burro", "Burrinho", ["X.X...........", "X.X...........", "XXXX..........", "XX.X..........", "XXXXX.........", "XXXXXXXXXXXXX.", "..XXXXXXXXXXXX", "..XXXXXXXXXXX.", "..X.X.....X.X.", "..X.X.....X.X."]],
  ["bichos", "bicho-pavao", "Pavão", ["..X.XX.X.XX.X..", ".X.X..X.X..X.X.", "X.X.XX.X.XX.X.X", ".XXXXX.X.XXXXX.", "X.XXXXXXXXXXX.X", ".XXXXXXXXXXXXX.", "...XXXX.XXXX...", "......XXX......", "......XX.......", ".....XXX.......", "......X.X......"]],
  ["bichos", "bicho-lesma", "Lesma", ["X.X............", ".X.X...........", ".XXX....XXXX...", ".XXX...X.XX.X..", ".XXX..X.X..X.X.", ".XXXX.X..XX..X.", ".XXXXXXX....XX.", "XXXXXXXXXXXXXXX"]],
  ["bichos", "bicho-cabra", "Cabrinha", ["XX............", "..X...........", "..XXX.........", ".XX.XX........", ".XXXXX........", ".X.XXXXXXXXXX.", "...XXXXXXXXXXX", "...XXXXXXXXXX.", "...X.X....X.X.", "...X.X....X.X."]],
  ["bichos", "bicho-siri", "Siri", ["XX...........XX", "X.X.........X.X", ".XX..X...X..XX.", "...XX.X.X.XX...", "...XXXXXXXXX...", "..XXXXXXXXXXX..", ".X.XXXXXXXXX.X.", "X..X.......X..X"]],
  ["time", "esporte-skate", "Skate", ["XXXXXXXXXXXXXXX", ".XXXXXXXXXXXXX.", "...X.......X...", "..XXX.....XXX..", "..XXX.....XXX.."]],
  ["time", "esporte-patins", "Patins", ["..XXXX......", "..X..X......", "..XXXX......", "..X..X......", "..XXXXX.....", "..XXXXXXXXX.", ".XXXXXXXXXXX", "XXXXXXXXXXXX", "............", ".XX..XX..XX.", ".XX..XX..XX."]],
  ["time", "esporte-cesta", "Cesta de basquete", ["XXXXXXXXXXXXX", "X...........X", "X...XXXXX...X", "X...X...X...X", "XXXXXXXXXXXXX", "...XXXXXXX...", "...X.X.X.X...", "....X.X.X....", "....X.X.X....", ".....XXX....."]],
  ["time", "esporte-beach-tennis", "Beach tennis", ["..XXXXXX.......", ".XXXXXXXX......", "XX.XX.XXXX.....", "XXXXXXXXXX.....", "XX.XX.XXXX.....", "XXXXXXXXXX.....", ".XXXXXXXX......", "..XXXXXX...XXX.", "....XX....XXXXX", "....XX....XXXXX", "....XX.....XXX.", "....XX........."]],
  ["time", "esporte-placar", "Placar", ["XXXXXXXXXXXXXXXXX", "X...............X", "X.XXX.......XXX.X", "X.X.X.......X.X.X", "X.X.X..XXX..X.X.X", "X.X.X.......X.X.X", "X.XXX.......XXX.X", "X...............X", "XXXXXXXXXXXXXXXXX"]],
  ["time", "esporte-garrafinha", "Garrafinha", ["..XXX..", "..XXX..", ".XXXXX.", "XXXXXXX", "X.....X", "XXXXXXX", "XXXXXXX", "XXXXXXX", "X.....X", "XXXXXXX", ".XXXXX."]],
  ["time", "esporte-kettlebell", "Kettlebell", ["..XXXXXXX..", ".XX.....XX.", ".X.......X.", ".XX.....XX.", "..XXXXXXX..", ".XXXXXXXXX.", "XXXXXXXXXXX", "XXXXXXXXXXX", "XXXXXXXXXXX", ".XXXXXXXXX."]],
  ["time", "esporte-rede-volei", "Rede de vôlei", ["X...........X", "XXXXXXXXXXXXX", "XX.X.X.X.X.XX", "XXXXXXXXXXXXX", "XX.X.X.X.X.XX", "XXXXXXXXXXXXX", "X...........X", "X...........X", "X...........X", "X...........X"]],
  ["time", "esporte-cartoes", "Cartões do juiz", ["XXXXX........", "X...X........", "X...X..XXXXX.", "X...X..XXXXX.", "X...X..XXXXX.", "X...X..XXXXX.", "XXXXX..XXXXX.", ".......XXXXX."]],
  ["time", "esporte-primeiro-lugar", "Primeiro lugar", ["XX.......XX", ".XX.....XX.", "..XX...XX..", "...XXXXX...", "..XXXXXXX..", ".XXXX.XXXX.", ".XXX..XXXX.", ".XXXX.XXXX.", ".XXXX.XXXX.", ".XXX...XXX.", "..XXXXXXX..", "...XXXXX..."]],
  ["divertidos", "fig-pipa", "Pipa", [".....X.....", "....XXX....", "...XX.XX...", "..XXX.XXX..", ".XXXX.XXXX.", "XXXXXXXXXXX", ".XXXX.XXXX.", "..XXX.XXX..", "...XX.XX...", "....XXX....", ".....X.....", "....X......", ".....X.X...", "......X...."]],
  ["divertidos", "fig-castelo-de-areia", "Castelo de areia", ["......X.......", "......XX......", "......X.......", "X.X..XXXX..X.X", "XXX..X.XX..XXX", "XXX..XXXX..XXX", "XXXXXXXXXXXXXX", "XXXXX....XXXXX", "XXXX......XXXX", "XXXX......XXXX"]],
  ["divertidos", "fig-balde-e-pa", "Balde e pá", ["..XXXXXX......X", ".X......X....XX", "XXXXXXXXXX..XX.", "XXXXXXXXXX.XX..", ".XXXXXXXX.XX...", ".XXXXXXXX.X....", ".XXXXXXXXXXX...", "..XXXXXX.XXX...", "..XXXXXX.XX...."]],
  ["divertidos", "fig-chapeu-de-palha", "Chapéu de palha", [".....XXXXX.....", "....XXXXXXX....", "....XXXXXXX....", "....XXXXXXX....", "....X.....X....", "XXXXXXXXXXXXXXX", ".XXXXXXXXXXXXX."]],
  ["divertidos", "fig-biquini", "Biquíni", ["X...........X", ".X.........X.", "..XX.....XX..", ".XXXX...XXXX.", "XXXXXX.XXXXXX", "XXXXXX.XXXXXX", ".............", "XXXXXXXXXXXXX", ".XXXXXXXXXXX.", "...XXXXXXX...", ".....XXX....."]],
  ["divertidos", "fig-coco", "Coco", [".......XX.....", "......XXXXX...", "...XXXXX......", "..XXXXXXXX....", ".XXXXXXXXXX...", "XXX.XXXXXXXX..", "XXXXXXXXXXXX..", "XXXXXXXXXXXX..", ".XXXXXXXXXX...", "..XXXXXXXX....", "...XXXXXX....."]],
  ["divertidos", "fig-acai", "Açaí na tigela", ["...X.X..X.X...", "..XXXXXXXXXX..", ".X.XX.XX.XX.X.", "XXXXXXXXXXXXXX", "X............X", ".X..........X.", "..XX......XX..", "....XXXXXX....", ".....XXXX....."]],
  ["divertidos", "fig-milho", "Milho", ["....XXX....", "...XX.XX...", "...X.X.X...", "...XX.XX...", "...X.X.X...", "XX.XX.XX.XX", ".XXX.X.XXX.", "..XXX.XXX..", "...XXXXX...", "....XXX....", ".....X....."]],
  ["divertidos", "fig-pastel", "Pastel", ["......XXXXX......", "....XXXXXXXXX....", "..XXXXXXXXXXXXX..", ".XXXXXXXXXXXXXXX.", "XXXXXXXXXXXXXXXXX", "X.X.X.X.X.X.X.X.X"]],
  ["divertidos", "fig-boia", "Boia", ["....XXXXX....", "..XXX.X.XXX..", ".XX.......XX.", ".X..XXXXX..X.", "XX.XX...XX.XX", "X..X.....X..X", "XX.XX...XX.XX", ".X..XXXXX..X.", ".XX.......XX.", "..XXX.X.XXX..", "....XXXXX...."]],
  ["boho", "boho-pampas", "Capim-dos-pampas", ["..X...X...X..", ".XXX.XXX.XXX.", ".XXX.XXX.XXX.", "XXX..XXX..XXX", "XX...XXX...XX", ".X....X....X.", "..X...X...X..", "...X..X..X...", "....X.X.X....", ".....XXX.....", "....XXXXX....", "....XXXXX....", ".....XXX....."]],
  ["boho", "boho-saguaro", "Cacto saguaro", ["......X......", ".....XXX.....", ".X...XXX.....", "XXX..XXX.....", "XXX..XXX..X..", "XXX..XXX.XXX.", "XXXXXXXX.XXX.", ".XXXXXXX.XXX.", ".....XXXXXXX.", ".....XXXXXX..", ".....XXX.....", ".....XXX.....", "XXXXXXXXXXXXX"]],
  ["boho", "boho-vaso-com-galhos", "Vaso com galhos", ["X.X.....X.X", ".X.X...X.X.", "X.X.X.X.X.X", ".X.X.X.X.X.", "...X.X.X...", "....XXX....", "...XXXXX...", "..XXXXXXX..", "..X.X.X.X..", "..XXXXXXX..", "..X.X.X.X..", "...XXXXX..."]],
  ["boho", "boho-olho-grego", "Olho grego", ["....XXXXX....", "..XXXXXXXXX..", ".XXX.....XXX.", ".XX..XXX..XX.", "XX..XXXXX..XX", "XX..XX.XX..XX", "XX..XXXXX..XX", ".XX..XXX..XX.", ".XXX.....XXX.", "..XXXXXXXXX..", "....XXXXX...."]],
  ["boho", "boho-macrame", "Macramê", ["XXXXXXXXXXXXX", "X.X.X.X.X.X.X", ".X.X.X.X.X.X.", "..X.X.X.X.X..", "...X.X.X.X...", "..X.X.X.X.X..", ".X.X.X.X.X.X.", "..X.X.X.X.X..", "...X.X.X.X...", "....X.X.X....", ".....X.X.....", "......X......", ".....X.X.....", "....X...X...."]],
];
for (const [grupo, valor, rotulo, d] of FIGURAS) add(grupo, valor, rotulo, figura(d));

// ===================== Básicos (31, formulas) =====================
const xc = (i: number, cols: number) => i - meio(cols);
const yc = (j: number, rows: number) => j - meio(rows);

add("basicos", "listras-grossa-fina", "Listras grossa e fina", (i, _j, cols) => {
  const p = mod(xc(i, cols) + 1, 7);
  return p < 3 || p === 4;
});
add("basicos", "faixas-grossa-fina", "Faixas grossa e fina", (_i, j, _c, rows) => {
  const p = mod(yc(j, rows) + 1, 7);
  return p < 3 || p === 4;
});
add("basicos", "listras-pijama", "Listras de pijama", (i, _j, cols) => {
  const p = mod(xc(i, cols), 7);
  return p === 0 || p === 2;
});
add("basicos", "faixas-pijama", "Faixas de pijama", (_i, j, _c, rows) => {
  const p = mod(yc(j, rows), 7);
  return p === 0 || p === 2;
});
add("basicos", "riscas-pontilhadas", "Riscas pontilhadas", (i, j, cols) => mod(xc(i, cols), 5) === 0 && j % 2 === 0);
add("basicos", "xadrez-vichy", "Xadrez vichy", (i, j, cols, rows) => {
  const a = mod(xc(i, cols) + 1, 6) < 3;
  const b = mod(yc(j, rows) + 1, 6) < 3;
  return (a && b) || ((a || b) && (i + j) % 2 === 0);
});
add("basicos", "tarta", "Tartã", (i, j, cols, rows) => {
  const a = mod(xc(i, cols) + 1, 10);
  const b = mod(yc(j, rows) + 1, 10);
  return (a < 3 && b < 3) || a === 6 || b === 6;
});
add("basicos", "grade-dupla", "Grade dupla", (i, j, cols, rows) => {
  const a = mod(xc(i, cols) + 1, 9);
  const b = mod(yc(j, rows) + 1, 9);
  return a === 0 || a === 2 || b === 0 || b === 2;
});
add("basicos", "janela", "Janela", (i, j, cols, rows) => {
  const a = mod(xc(i, cols) + 5, 10);
  const b = mod(yc(j, rows) + 5, 10);
  return a === 0 || b === 0 || (a === 5 && b === 5);
});
add("basicos", "quadradinhos", "Quadradinhos", (i, j, cols, rows) => mod(xc(i, cols), 6) < 2 && mod(yc(j, rows), 6) < 2);
add("basicos", "pontos-em-x", "Pontos em X", (i, j, cols, rows) => {
  const x = xc(i, cols);
  const y = yc(j, rows);
  return mod(x + y, 4) === 0 && mod(x - y, 8) === 0;
});
add("basicos", "moldura-arredondada", "Moldura arredondada", (i, j, cols, rows) => {
  const hx = meio(cols) - 1;
  const hy = meio(rows) - 1;
  const x = Math.abs(xc(i, cols));
  const y = Math.abs(yc(j, rows));
  const r = 5;
  const dentro = (m: number) => {
    const ax = hx - m;
    const ay = hy - m;
    if (x > ax || y > ay) return false;
    if (x > ax - r && y > ay - r) return Math.hypot(x - (ax - r), y - (ay - r)) <= r;
    return true;
  };
  return dentro(0) && !dentro(2);
});
add("basicos", "moldura-tracejada", "Moldura tracejada", (i, j, cols, rows) => {
  const borda = i < 2 || j < 2 || i >= cols - 2 || j >= rows - 2;
  return borda && mod(i < 2 || i >= cols - 2 ? j : i, 5) < 3;
});
add("basicos", "moldura-de-bolinhas", "Moldura de bolinhas", (i, j, cols, rows) => {
  const naBorda = i === 1 || j === 1 || i === cols - 2 || j === rows - 2;
  return naBorda && mod(i === 1 || i === cols - 2 ? j - 1 : i - 1, 3) === 0;
});
add("basicos", "borda-xadrez", "Borda xadrez", (i, j, cols, rows) => {
  const borda = i < 4 || j < 4 || i >= cols - 4 || j >= rows - 4;
  return borda && (Math.floor(i / 2) + Math.floor(j / 2)) % 2 === 0;
});
add("basicos", "centro-listrado", "Centro listrado", (i, j, cols, rows) => {
  const x = Math.abs(xc(i, cols));
  const y = Math.abs(yc(j, rows));
  const h = Math.min(meio(cols), meio(rows)) * 0.6;
  return (x <= h && y <= h && mod(i, 3) === 0) || ((x === Math.ceil(h) + 1 || y === Math.ceil(h) + 1) && x <= h + 1 && y <= h + 1);
});
add("basicos", "faixa-ondulada", "Faixa ondulada", (i, j, cols, rows) => {
  const c = 3.5 * Math.sin((i * 2 * Math.PI) / 18);
  return Math.abs(yc(j, rows) - c) <= 1.3;
});
add("basicos", "faixa-ziguezague", "Faixa em ziguezague", (i, j, cols, rows) => {
  const t = mod(i, 8);
  const c = (t < 4 ? t : 8 - t) - 2;
  return Math.abs(yc(j, rows) - c) <= 1;
});
add("basicos", "canto-triangulo", "Triângulo no canto", (i, j, cols, rows) => i + (rows - 1 - j) < Math.min(cols, rows) * 0.55);
add("basicos", "dois-cantos", "Dois cantos", (i, j, cols, rows) => {
  const s = Math.min(cols, rows) * 0.42;
  return i + j < s || cols - 1 - i + (rows - 1 - j) < s;
});
add("basicos", "l-bicolor", "Faixa em L", (i, j, cols, rows) => i < cols * 0.28 || j >= rows * 0.72);
add("basicos", "faixa-com-pontos", "Faixa com pontinhos", (i, j, cols, rows) => {
  const y = Math.abs(yc(j, rows));
  return y <= 2 || (y === 5 && mod(xc(i, cols), 3) === 0);
});
add("basicos", "xadrez-vazado", "Xadrez vazado", (i, j, cols, rows) => {
  const a = mod(xc(i, cols) + 3, 6);
  const b = mod(yc(j, rows) + 3, 6);
  const cheio = (Math.floor((xc(i, cols) + 3) / 6) + Math.floor((yc(j, rows) + 3) / 6)) % 2 === 0;
  return cheio ? true : a === 0 || a === 5 || b === 0 || b === 5;
});
add("basicos", "pontos-grandes-e-pequenos", "Pontos grandes e pequenos", (i, j, cols, rows) => {
  const x = mod(xc(i, cols) + 4, 8) - 4;
  const y = mod(yc(j, rows) + 4, 8) - 4;
  const grande = (Math.floor((xc(i, cols) + 4) / 8) + Math.floor((yc(j, rows) + 4) / 8)) % 2 === 0;
  return grande ? Math.hypot(x, y) <= 2.2 : x === 0 && y === 0;
});
add("basicos", "diagonais-duplas", "Diagonais duplas", (i, j) => {
  const p = mod(i + j, 8);
  return p === 0 || p === 2;
});
add("basicos", "linhas-onduladas-em-pe", "Linhas onduladas em pé", (i, j, cols) =>
  mod(xc(i, cols) - Math.round(1.6 * Math.sin((j * 2 * Math.PI) / 10)), 6) === 0
);
add("basicos", "faixa-dupla-diagonal", "Faixa dupla diagonal", (i, j, cols, rows) => {
  const d = i - j - (cols - rows) / 2;
  return Math.abs(d - 4) <= 1.5 || Math.abs(d + 4) <= 1.5;
});
add("basicos", "meio-xadrez", "Meio xadrez", (i, j, cols, rows) => j < meio(rows) && (Math.floor(i / 3) + Math.floor(j / 3)) % 2 === 0);
add("basicos", "faixa-xadrez", "Faixa xadrez", (i, j, cols, rows) => {
  const y = yc(j, rows) + 2;
  return y >= 0 && y < 4 && (Math.floor(i / 2) + Math.floor(y / 2)) % 2 === 0;
});
add("basicos", "argolinhas", "Argolinhas", (i, j, cols, rows) => {
  const x = mod(xc(i, cols) + 3, 7) - 3;
  const y = mod(yc(j, rows) + 3, 7) - 3;
  const r = Math.hypot(x, y);
  return r > 1.2 && r <= 2.3;
});
add("basicos", "borda-ondulada", "Borda ondulada", (i, j, cols, rows) => {
  const o = (t: number) => 2 + Math.round(Math.sin((t * 2 * Math.PI) / 8));
  return j <= o(i) || rows - 1 - j <= o(i) || i <= o(j) || cols - 1 - i <= o(j);
});

// ===================== Geométricos (6, formulas) =====================
add("geometricos", "hexagrama", "Estrela de seis pontas", centrada((x, y, R) => {
  const r = R * 0.9;
  const tri = (s: number) => {
    const yy = s * y;
    return yy >= -r * 0.5 && Math.abs(x) * 1.732 <= r - yy;
  };
  return tri(1) || tri(-1);
}));
add("geometricos", "elipse", "Elipse", centrada((x, y, R) => (x / (R * 0.95)) ** 2 + (y / (R * 0.55)) ** 2 <= 1));
add("geometricos", "circulo-pontilhado", "Círculo pontilhado", centrada((x, y, R) => {
  for (let k = 0; k < 16; k++) {
    const a = (k / 16) * 2 * Math.PI;
    if (Math.hypot(x - Math.cos(a) * R * 0.8, y - Math.sin(a) * R * 0.8) <= 1.1) return true;
  }
  return false;
}));
add("geometricos", "losango-duplo", "Losango duplo", centrada((x, y, R) => {
  const d = Math.abs(x) + Math.abs(y);
  return (d <= R * 0.95 && d > R * 0.8) || (d <= R * 0.5 && d > R * 0.35);
}));
add("geometricos", "triangulos-em-roda", "Triângulos em roda", centrada((x, y, R) => {
  const a = Math.atan2(y, x);
  const r = Math.hypot(x, y);
  const setor = mod(a + Math.PI / 6, Math.PI / 3) - Math.PI / 6;
  return r > R * 0.3 && r <= R * 0.95 && Math.abs(setor) * r <= (r - R * 0.3) * 0.45;
}));
add("geometricos", "cinco-losangos", "Cinco losangos", centrada((x, y, R) => {
  const d = R * 0.6;
  const s = R * 0.3;
  return [[0, 0], [d, 0], [-d, 0], [0, d], [0, -d]].some(([cx, cy]) => Math.abs(x - cx) + Math.abs(y - cy) <= s);
}));

export const FORMAS_EXTRAS_4: Record<string, Teste> = Object.fromEntries(lista.map((f) => [f.valor, f.teste]));
export const ROTULOS_EXTRAS_4 = lista.map(({ valor, rotulo, grupo }) => ({ valor, rotulo, grupo }));
