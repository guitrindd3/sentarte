import { BOHO_PADROES } from "./boho-model";
import type { Modelo } from "./content-schema";
import { CAPAS } from "./cover-links";
import { DESENHO_TEMAS } from "./desenho-model";
import { CATEGORIAS_OCULTAS } from "./offer";
import type { GrupoColecao } from "./grupos";
import { TIMES } from "./team-models";

/**
 * For the admin: where a model shows up on the site. Collections are matched
 * by EXACT name (see lib/team-models.ts etc.), so renaming one of these models
 * drops it from its collection page — the editor warns about that.
 */
export function ondeAparece(nome: string, categoriaSlug: string, grupo?: Modelo["grupo"]): {
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
  // published from the admin (Modelo.grupo, 2026-10-19)
  if (grupo === "times") return { href: "/times", grupo: "Times" };
  if (grupo === "boho") return { href: "/boho", grupo: "Boho" };
  if (grupo === "desenhos") return { href: "/desenhos", grupo: "Desenhos" };
  if (grupo === "eventos") return { href: "/eventos", grupo: "Eventos" };
  return { href: `/categoria/${categoriaSlug}` };
}

/** Collection choices in the admin's chair forms (sets `Modelo.grupo`). */
export const OPCOES_COLECAO: { valor: "" | GrupoColecao; rotulo: string }[] = [
  { valor: "", rotulo: "Nenhuma (só na lista de cadeiras)" },
  { valor: "times", rotulo: "Cadeiras de time (/times)" },
  { valor: "boho", rotulo: "Cadeiras boho (/boho)" },
  { valor: "desenhos", rotulo: "Animes e desenhos (/desenhos)" },
  { valor: "eventos", rotulo: "Eventos e empresas (/eventos)" },
];

/** The `colecao` field of a chair form; null = not sent (leave as is). */
export function colecaoDoForm(formData: FormData): GrupoColecao | undefined | null {
  if (!formData.has("colecao")) return null;
  const v = String(formData.get("colecao"));
  return OPCOES_COLECAO.some((o) => o.valor === v && v) ? (v as GrupoColecao) : undefined;
}
