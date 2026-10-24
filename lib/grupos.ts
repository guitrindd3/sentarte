import { BOHO_PADROES } from "./boho-model";
import type { Categoria, Modelo } from "./content-schema";
import { DESENHO_TEMAS } from "./desenho-model";
import { TIMES } from "./team-models";

// Which collection page (/times, /boho, /desenhos, /eventos) a chair belongs to. The
// original chairs are curated by EXACT name in code; chairs published from
// the admin (Monte a sua trama → "Publicar no site", 2026-10-19) carry
// `Modelo.grupo` instead. Every page and the pricing ask here.

export type GrupoColecao = "times" | "boho" | "desenhos" | "eventos";

// eventos (2026-10-23, first "casamento") has no curated chairs: only ones published from the admin.
const LISTAS: Record<GrupoColecao, string[]> = { times: TIMES, boho: BOHO_PADROES, desenhos: DESENHO_TEMAS, eventos: [] };

export function grupoDoModelo(m: Pick<Modelo, "nome" | "grupo">): GrupoColecao | null {
  const base = m.nome.replace(/ personalizado$/, "");
  if (TIMES.includes(base)) return "times";
  if (BOHO_PADROES.includes(m.nome)) return "boho";
  if (DESENHO_TEMAS.includes(m.nome)) return "desenhos";
  return m.grupo ?? null;
}

/** A collection's chairs: the curated ones in list order, then the published ones in admin order. */
export function modelosDoGrupo(cadeiras: Categoria | undefined, grupo: GrupoColecao): Modelo[] {
  if (!cadeiras) return [];
  const curados = LISTAS[grupo].flatMap((nome) => cadeiras.modelos.filter((m) => m.nome === nome));
  const extras = cadeiras.modelos.filter(
    (m) => m.grupo === grupo && !LISTAS[grupo].includes(m.nome) && !/ personalizado$/.test(m.nome)
  );
  return [...curados, ...extras];
}

/** Names of every desenho chair (priced as personalized), for the server's order math. */
export function nomesDesenho(categorias: Categoria[]): Set<string> {
  return new Set(modelosDoGrupo(categorias.find((c) => c.slug === "cadeiras"), "desenhos").map((m) => m.nome));
}
