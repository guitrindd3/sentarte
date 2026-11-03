import type { Forma } from "./chair-render";
import { ROTULOS_EXTRAS } from "./formas-extras";
import { ROTULOS_EXTRAS_2 } from "./formas-extras-2";
import { FORMAS_OCULTAS, ROTULOS_EXTRAS_3 } from "./formas-extras-3";
import { ROTULOS_GATOS } from "./formas-gatos";
import { categoriaDa, type Categoria } from "./formas-categorias";
import { ROTULOS_EXTRAS_4 } from "./formas-extras-4";
import { ROTULOS_EXTRAS_5 } from "./formas-extras-5";
import { ROTULOS_BOHO_TRIBAL } from "./formas-boho-tribal";
import { ROTULOS_BOHO_CULTURAS } from "./formas-boho-culturas";
import { ROTULOS_ANIMES } from "./formas-animes";
import { ROTULOS_PERSONAGENS } from "./formas-personagens";
import { subgrupoDa } from "./formas-subgrupos";

// Every shape of the Monte a sua trama grid (moved out of chair-builder.tsx
// 2026-11-03 so the sub-groups in lib/formas-subgrupos.ts can read it).

type Grupo = Categoria;

export const FORMAS: { valor: Forma; rotulo: string; grupo: Grupo }[] = [
  { valor: "lisa", rotulo: "Lisa", grupo: "basicos" },
  { valor: "listras", rotulo: "Listras", grupo: "basicos" },
  { valor: "faixas", rotulo: "Faixas", grupo: "basicos" },
  { valor: "xadrez", rotulo: "Xadrez", grupo: "basicos" },
  { valor: "bolinhas", rotulo: "Bolinhas", grupo: "basicos" },
  { valor: "moldura", rotulo: "Moldura", grupo: "basicos" },
  { valor: "diagonais", rotulo: "Diagonais", grupo: "basicos" },
  { valor: "quadriculado", rotulo: "Quadriculado", grupo: "basicos" },
  { valor: "pontilhado", rotulo: "Pontilhado", grupo: "basicos" },
  { valor: "faixas-duplas", rotulo: "Faixas duplas", grupo: "basicos" },
  { valor: "listras-finas", rotulo: "Listras finas", grupo: "basicos" },
  { valor: "faixas-largas", rotulo: "Faixas largas", grupo: "basicos" },
  { valor: "xadrez-grande", rotulo: "Xadrez grande", grupo: "basicos" },
  { valor: "xadrez-miudo", rotulo: "Xadrez miúdo", grupo: "basicos" },
  { valor: "bolinhas-grandes", rotulo: "Bolinhas grandes", grupo: "basicos" },
  { valor: "moldura-dupla", rotulo: "Moldura dupla", grupo: "basicos" },
  { valor: "grade-diagonal", rotulo: "Grade diagonal", grupo: "basicos" },
  { valor: "degraus", rotulo: "Degraus", grupo: "basicos" },
  { valor: "cantos", rotulo: "Cantos", grupo: "basicos" },
  { valor: "duas-colunas", rotulo: "Duas colunas", grupo: "basicos" },
  { valor: "meio-a-meio", rotulo: "Meio a meio", grupo: "time" },
  { valor: "faixa-diagonal", rotulo: "Faixa diagonal", grupo: "time" },
  { valor: "faixa-central", rotulo: "Faixa no meio", grupo: "time" },
  { valor: "listras-largas", rotulo: "Listras largas", grupo: "time" },
  { valor: "escudo", rotulo: "Escudo", grupo: "time" },
  { valor: "duas-faixas", rotulo: "Duas faixas", grupo: "time" },
  { valor: "faixa-vertical", rotulo: "Faixa em pé", grupo: "time" },
  { valor: "cruz", rotulo: "Cruz", grupo: "time" },
  { valor: "coroa", rotulo: "Coroa", grupo: "time" },
  { valor: "estrelas", rotulo: "Estrelas", grupo: "time" },
  { valor: "tricolor-vertical", rotulo: "Tricolor em pé", grupo: "time" },
  { valor: "tricolor-horizontal", rotulo: "Tricolor deitado", grupo: "time" },
  { valor: "aros", rotulo: "Aros", grupo: "time" },
  { valor: "faixa-v", rotulo: "Faixa em V", grupo: "time" },
  { valor: "diagonal-invertida", rotulo: "Diagonal invertida", grupo: "time" },
  { valor: "quadrantes", rotulo: "Quadrantes", grupo: "time" },
  { valor: "numero-10", rotulo: "Número 10", grupo: "time" },
  { valor: "bola", rotulo: "Bola", grupo: "time" },
  { valor: "trofeu", rotulo: "Troféu", grupo: "time" },
  { valor: "escudo-estrela", rotulo: "Escudo com estrela", grupo: "time" },
  { valor: "diamante", rotulo: "Diamante", grupo: "boho" },
  { valor: "ziguezague", rotulo: "Ziguezague", grupo: "boho" },
  { valor: "espiral", rotulo: "Caracol", grupo: "boho" },
  { valor: "sol", rotulo: "Sol", grupo: "boho" },
  { valor: "losangos", rotulo: "Losangos", grupo: "boho" },
  { valor: "setas", rotulo: "Setas", grupo: "boho" },
  { valor: "ondas", rotulo: "Ondas", grupo: "boho" },
  { valor: "triangulos", rotulo: "Triângulos", grupo: "boho" },
  { valor: "totem", rotulo: "Totem", grupo: "boho" },
  { valor: "mandala", rotulo: "Mandala", grupo: "boho" },
  { valor: "escamas", rotulo: "Escamas", grupo: "boho" },
  { valor: "flechas", rotulo: "Flechas", grupo: "boho" },
  { valor: "bandeirinhas", rotulo: "Bandeirinhas", grupo: "boho" },
  { valor: "triangulo-grande", rotulo: "Triângulo grande", grupo: "boho" },
  { valor: "arco-iris", rotulo: "Arco-íris", grupo: "boho" },
  { valor: "kilim", rotulo: "Kilim", grupo: "boho" },
  { valor: "ziguezague-duplo", rotulo: "Ziguezague duplo", grupo: "boho" },
  { valor: "espinha-de-peixe", rotulo: "Espinha de peixe", grupo: "boho" },
  { valor: "sol-nascente", rotulo: "Sol nascente", grupo: "boho" },
  { valor: "penas", rotulo: "Penas", grupo: "boho" },
  { valor: "coracao", rotulo: "Coração", grupo: "divertidos" },
  { valor: "estrela", rotulo: "Estrela", grupo: "divertidos" },
  { valor: "ancora", rotulo: "Âncora", grupo: "divertidos" },
  { valor: "flor", rotulo: "Flor", grupo: "divertidos" },
  { valor: "lua", rotulo: "Lua", grupo: "divertidos" },
  { valor: "sorriso", rotulo: "Sorriso", grupo: "divertidos" },
  { valor: "peixe", rotulo: "Peixe", grupo: "divertidos" },
  { valor: "oculos", rotulo: "Óculos", grupo: "divertidos" },
  { valor: "borboleta", rotulo: "Borboleta", grupo: "divertidos" },
  { valor: "coqueiro", rotulo: "Coqueiro", grupo: "divertidos" },
  { valor: "abacaxi", rotulo: "Abacaxi", grupo: "divertidos" },
  { valor: "sorvete", rotulo: "Sorvete", grupo: "divertidos" },
  { valor: "pata", rotulo: "Patinha", grupo: "divertidos" },
  { valor: "nota", rotulo: "Nota musical", grupo: "divertidos" },
  { valor: "raio", rotulo: "Raio", grupo: "divertidos" },
  { valor: "guarda-sol", rotulo: "Guarda-sol", grupo: "divertidos" },
  { valor: "concha", rotulo: "Concha", grupo: "divertidos" },
  { valor: "melancia", rotulo: "Melancia", grupo: "divertidos" },
  { valor: "gatinho", rotulo: "Gatinho", grupo: "divertidos" },
  ...ROTULOS_GATOS,
  { valor: "cacto", rotulo: "Cacto", grupo: "divertidos" },
  ...ROTULOS_EXTRAS,
  ...ROTULOS_EXTRAS_2,
  ...ROTULOS_EXTRAS_3,
  ...ROTULOS_EXTRAS_4,
  ...ROTULOS_EXTRAS_5,
  ...ROTULOS_BOHO_TRIBAL,
  ...ROTULOS_BOHO_CULTURAS,
  ...ROTULOS_PERSONAGENS,
  ...ROTULOS_ANIMES,
];
/** What the shape grid shows: near-duplicates stay out (they still render for old links). */
export const FORMAS_VISIVEIS = FORMAS.filter((f) => !FORMAS_OCULTAS.has(f.valor)).map((f) => ({ ...f, grupo: categoriaDa(f.valor, f.grupo) }));
/** Lowercase, no accents — so "coracao" finds "Coração". */
export const semAcento = (t: string) => t.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
export const ROTULOS_BUSCA = FORMAS_VISIVEIS.map((f) => semAcento(f.rotulo));
/** Sub-group of each visible shape inside its tab (lib/formas-subgrupos.ts). */
export const SUBGRUPO_DA_FORMA = FORMAS_VISIVEIS.map((f) => subgrupoDa(f.grupo, f.valor, f.rotulo));
