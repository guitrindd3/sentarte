import type { Modelo } from "./content-schema";

const SUFFIX = " personalizado";

export type ModeloPair = { base: Modelo; personalizado?: Modelo };

/**
 * Groups a flat modelos list so that "<Nome> personalizado" attaches to its
 * "<Nome>" sibling instead of rendering as its own separate card. Models
 * with no personalizado sibling (or a personalizado with no base) render
 * alone. Order follows the original list, keyed by each pair's base model.
 */
export function pairPersonalizados(modelos: Modelo[]): ModeloPair[] {
  const byName = new Map(modelos.map((m) => [m.nome, m] as const));
  const attached = new Set<string>();

  for (const modelo of modelos) {
    if (modelo.nome.endsWith(SUFFIX)) {
      const baseName = modelo.nome.slice(0, -SUFFIX.length);
      if (byName.has(baseName)) attached.add(modelo.nome);
    }
  }

  const pairs: ModeloPair[] = [];
  for (const modelo of modelos) {
    if (attached.has(modelo.nome)) continue;
    const personalizado = byName.get(`${modelo.nome}${SUFFIX}`);
    pairs.push({ base: modelo, personalizado });
  }
  return pairs;
}
