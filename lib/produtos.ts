import type { Categoria, Modelo, SiteContent } from "./content-schema";
import { BOHO_NOME } from "./boho-model";
import { grupoDoModelo } from "./grupos";
import { DESENHO_NOME } from "./desenho-model";
import { pairPersonalizados } from "./modelo-pairs";
import { CATEGORIA_COM_PRECO } from "./offer";
import { TIME_DO_CORACAO_NOME } from "./team-models";

// Product pages /cadeira/<slug> (2026-10-19, user: "página própria para cada
// cadeira"). One page per chair the customer can actually buy: the cover
// models that only link to a group page aren't products, and a
// "<Nome> personalizado" sibling lives on its base model's page.

const CAPAS = new Set([TIME_DO_CORACAO_NOME, BOHO_NOME, DESENHO_NOME, "Monte a sua trama"]);

export type Grupo = "times" | "boho" | "desenhos" | "outros";

export type Produto = {
  slug: string;
  base: Modelo;
  personalizado?: Modelo;
  categoria: Categoria;
  grupo: Grupo;
};

/** URL segment from the model's name ("Degradê pôr do sol" → "degrade-por-do-sol"). */
export function slugDoModelo(nome: string) {
  return nome
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/** Product page path, or null for a model that has no page (covers, non-chair categories). */
export function caminhoDoModelo(nome: string, categoriaSlug: string) {
  if (categoriaSlug !== CATEGORIA_COM_PRECO || CAPAS.has(nome)) return null;
  return `/cadeira/${slugDoModelo(nome.replace(/ personalizado$/, ""))}`;
}

const grupoDe = (m: Modelo): Grupo => grupoDoModelo(m) ?? "outros";

export const GRUPOS: Record<Grupo, { titulo: string; href: string }> = {
  times: { titulo: "Times", href: "/times" },
  boho: { titulo: "Boho", href: "/boho" },
  desenhos: { titulo: "Animes e desenhos", href: "/desenhos" },
  outros: { titulo: "Cadeiras de praia", href: "/categoria/cadeiras" },
};

export function produtosDaLoja(content: SiteContent): Produto[] {
  const categoria = content.categorias.find((c) => c.slug === CATEGORIA_COM_PRECO);
  if (!categoria) return [];
  return pairPersonalizados(categoria.modelos)
    .filter(({ base }) => !CAPAS.has(base.nome))
    .map(({ base, personalizado }) => ({
      slug: slugDoModelo(base.nome),
      base,
      personalizado,
      categoria,
      grupo: grupoDe(base),
    }));
}

export function acharProduto(content: SiteContent, slug: string) {
  return produtosDaLoja(content).find((p) => p.slug === slug);
}

/** "Você também pode gostar": same group first, then the others, never itself. */
export function relacionados(content: SiteContent, produto: Produto, n = 4) {
  const outros = produtosDaLoja(content).filter((p) => p.slug !== produto.slug && p.base.imagemUrl);
  const mesmo = outros.filter((p) => p.grupo === produto.grupo);
  const resto = outros.filter((p) => p.grupo !== produto.grupo);
  // Rotate the rest by the slug so every page suggests a different mix.
  const giro = [...produto.slug].reduce((s, c) => s + c.charCodeAt(0), 0) % Math.max(resto.length, 1);
  return [...mesmo, ...resto.slice(giro), ...resto.slice(0, giro)].slice(0, n);
}
