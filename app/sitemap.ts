import type { MetadataRoute } from "next";
import { CATEGORIAS } from "@/lib/categories";
import { SITE_URL } from "@/lib/site";

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

export default function sitemap(): MetadataRoute.Sitemap {
  const staticEntries = STATIC_ROUTES.map((route) => ({
    url: `${SITE_URL}${route}`,
    lastModified: new Date(),
  }));

  const categoryEntries = CATEGORIAS.map((categoria) => ({
    url: `${SITE_URL}/categoria/${categoria.slug}`,
    lastModified: new Date(),
  }));

  return [...staticEntries, ...categoryEntries];
}
