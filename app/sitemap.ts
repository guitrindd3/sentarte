import type { MetadataRoute } from "next";
import { getContent } from "@/lib/content-store";
import { SITE_URL } from "@/lib/nav";
import { produtosDaLoja } from "@/lib/produtos";

export const dynamic = "force-dynamic";

// Most important pages first. No lastModified: the content has no reliable
// per-page edit date, and a value that changes on every fetch just teaches
// crawlers to ignore it.
const STATIC_ROUTES = [
  "",
  "/times",
  "/boho",
  "/desenhos",
  "/casamento",
  "/personalizar",
  "/vale-presente",
  "/sobre",
  "/contato",
  "/faq",
  "/garantia-e-cuidados",
  "/politica-de-envio",
  "/politica-de-troca-e-devolucao",
  "/politica-de-privacidade",
  "/termos-de-uso",
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const content = await getContent();
  const { categorias } = content;

  return [
    ...STATIC_ROUTES.map((route) => ({ url: `${SITE_URL}${route}` })),
    ...categorias.map((categoria) => ({ url: `${SITE_URL}/categoria/${categoria.slug}` })),
    ...produtosDaLoja(content).map((p) => ({ url: `${SITE_URL}/cadeira/${p.slug}` })),
  ];
}
