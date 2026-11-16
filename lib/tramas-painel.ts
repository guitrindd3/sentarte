import { CATEGORIAS, categoriaDa, type Categoria } from "./formas-categorias";
import { FORMAS, semAcento } from "./formas-lista";
import { FORMAS_OCULTAS } from "./formas-extras-3";
import { subgrupoDa } from "./formas-subgrupos";
import { decodificarDesenho } from "./trama-foto";

// Admin "Traçados" (2026-11-16, user: "a pessoa que é adm pode escolher tirar
// ou até mesmo colocar os traçados no monte sua trama… ver os traçados todos…
// tirar qual eu não gostei e adicionar outros que eu gostei").
// Saved in SiteContent.tramas (one commit, site updates in 1-2 min):
// - ocultas: shape keys the admin took out of the grid;
// - mostrar: shapes hidden in code (FORMAS_OCULTAS, near-duplicates) that the admin brought back;
// - novas: shapes the admin drew (29x29 grid or any size, codificarDesenho in lib/trama-foto.ts).
// A hidden shape still renders for old links — nothing is ever deleted from
// the code. A drawn shape travels in the chair link as its grid (f=foto&fd=…,
// seat fa=foto&fda=…), so links keep working even if it's deleted later.

export type TramaNova = { id: string; rotulo: string; grupo: Categoria; grade: string };
export type TramasDoPainel = { ocultas: string[]; mostrar: string[]; novas: TramaNova[] };

export const MAX_TRAMAS_NOVAS = 300;
/** Key a drawn shape gets inside the builder (never put in links). */
export const PREFIXO_NOVA = "nv-";

const GRUPOS_VALIDOS = new Set<string>(CATEGORIAS.map((c) => c.valor));
const CHAVES = new Set(FORMAS.map((f) => f.valor as string));

/** Whatever came from the browser or the JSON file, cleaned. */
export function normalizarTramas(x: unknown): TramasDoPainel {
  const o = (x && typeof x === "object" ? x : {}) as Partial<Record<keyof TramasDoPainel, unknown>>;
  const chaves = (v: unknown) => [...new Set((Array.isArray(v) ? v : []).filter((k): k is string => typeof k === "string" && CHAVES.has(k)))];
  const novas: TramaNova[] = [];
  const ids = new Set<string>();
  for (const n of Array.isArray(o.novas) ? o.novas : []) {
    if (!n || typeof n !== "object") continue;
    const { id, rotulo, grupo, grade } = n as Record<string, unknown>;
    if (typeof id !== "string" || !/^[a-z]{4,12}$/.test(id) || ids.has(id)) continue;
    if (typeof grade !== "string" || !decodificarDesenho(grade)) continue;
    const nome = typeof rotulo === "string" ? rotulo.replace(/\s+/g, " ").trim().slice(0, 40) : "";
    if (!nome) continue;
    ids.add(id);
    novas.push({ id, rotulo: nome, grupo: (typeof grupo === "string" && GRUPOS_VALIDOS.has(grupo) ? grupo : "divertidos") as Categoria, grade });
    if (novas.length >= MAX_TRAMAS_NOVAS) break;
  }
  // "lisa" is where the builder starts: it can't be taken out
  return { ocultas: chaves(o.ocultas).filter((k) => k !== "lisa"), mostrar: chaves(o.mostrar).filter((k) => FORMAS_OCULTAS.has(k)), novas };
}

export type FormaDaGrade = {
  valor: string;
  rotulo: string;
  grupo: Categoria;
  /** Drawn in the admin: the 29x29 grid. */
  grade?: string;
};

/** Every shape the code knows, with its tab and whether the code hides it. */
export const TODAS_AS_FORMAS = FORMAS.map((f) => ({
  valor: f.valor as string,
  rotulo: f.rotulo,
  grupo: categoriaDa(f.valor, f.grupo),
  doCodigoOculta: FORMAS_OCULTAS.has(f.valor),
}));

/** What the builder's grid shows: the code's list with the admin's changes, then the drawn shapes. */
export function formasDoSite(t?: TramasDoPainel | null) {
  const ocultas = new Set(t?.ocultas ?? []);
  const mostrar = new Set(t?.mostrar ?? []);
  const lista: FormaDaGrade[] = TODAS_AS_FORMAS.filter((f) => !ocultas.has(f.valor) && (!f.doCodigoOculta || mostrar.has(f.valor))).map(
    ({ valor, rotulo, grupo }) => ({ valor, rotulo, grupo })
  );
  for (const n of t?.novas ?? []) lista.push({ valor: PREFIXO_NOVA + n.id, rotulo: n.rotulo, grupo: n.grupo, grade: n.grade });
  return {
    lista,
    busca: lista.map((f) => semAcento(f.rotulo)),
    subgrupo: lista.map((f) => subgrupoDa(f.grupo, f.valor, f.rotulo)),
  };
}
