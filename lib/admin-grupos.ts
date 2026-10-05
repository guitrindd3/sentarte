import { BOHO_PADROES } from "./boho-model";
import { CAPAS } from "./cover-links";
import { DESENHO_TEMAS } from "./desenho-model";
import { CATEGORIAS_OCULTAS } from "./offer";
import { TIMES } from "./team-models";

/**
 * For the admin: where a model shows up on the site. Collections are matched
 * by EXACT name (see lib/team-models.ts etc.), so renaming one of these models
 * drops it from its collection page — the editor warns about that.
 */
export function ondeAparece(nome: string, categoriaSlug: string): {
  href: string;
  grupo?: string;
  capa?: boolean;
  oculto?: boolean;
} {
  if (CATEGORIAS_OCULTAS.has(categoriaSlug)) return { href: `/categoria/${categoriaSlug}`, oculto: true };
  if (CAPAS[nome]) return { href: CAPAS[nome].href, grupo: "Capa de coleção", capa: true };
  const time = nome.replace(/ personalizado$/, "");
  if (TIMES.includes(time)) return { href: "/times", grupo: "Times" };
  if (BOHO_PADROES.includes(nome)) return { href: "/boho", grupo: "Boho" };
  if (DESENHO_TEMAS.includes(nome)) return { href: "/desenhos", grupo: "Desenhos" };
  return { href: `/categoria/${categoriaSlug}` };
}
