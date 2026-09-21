import type { MetadataRoute } from "next";
import { getContent } from "@/lib/content-store";
import { SITE_URL } from "@/lib/nav";

export const dynamic = "force-dynamic";

const STATIC_ROUTES = [
  "",
  "/sobre",
  "/contato",
  "/faq",
  "/politica-de-privacidade",
  "/termos-de-uso",
  "/politica-de-troca-e-devolucao",
  "/politica-de-envio",
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { categorias } = await getContent();

  const staticEntries = STATIC_ROUTES.map((route) => ({
    url: `${SITE_URL}${route}`,
    lastModified: new Date(),
  }));

  const categoryEntries = categorias.map((categoria) => ({
    url: `${SITE_URL}/categoria/${categoria.slug}`,
    lastModified: new Date(),
  }));

  return [...staticEntries, ...categoryEntries];
}
