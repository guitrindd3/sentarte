import type { Categoria, Modelo } from "./content-schema";

// Curated by name, not stored as a flag in the schema — these are the real
// team chairs uploaded via /admin on 2026-09-21. If a team model gets
// renamed or removed in the admin, update this list to match.
export const TIMES = ["Flamengo", "Corinthians", "Botafogo", "Fluminense", "Palmeiras", "Vasco"];

export type TeamPair = { base: Modelo; personalizado?: Modelo };

/** The "Cadeiras de praia" category's generic placeholder that links to /times. */
export const TIME_DO_CORACAO_NOME = "Time do coração";

export function getTeamPairs(categorias: Categoria[]): TeamPair[] {
  const cadeiras = categorias.find((c) => c.slug === "cadeiras");
  if (!cadeiras) return [];

  return TIMES.flatMap((nome) => {
    const base = cadeiras.modelos.find((m) => m.nome === nome);
    if (!base) return [];
    const personalizado = cadeiras.modelos.find((m) => m.nome === `${nome} personalizado`);
    return [{ base, personalizado }];
  });
}
