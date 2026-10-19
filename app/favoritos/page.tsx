import type { Metadata } from "next";
import { ListaFavoritos } from "@/components/lista-favoritos";
import { PageHeader } from "@/components/page-header";
import { getContent } from "@/lib/content-store";
import { produtosDaLoja } from "@/lib/produtos";
import { pageMetadata } from "@/lib/seo";

// The visitor's saved chairs (2026-10-19). The list lives in their browser
// (localStorage), so the page ships every chair and the client filters.
export const revalidate = 600;

export const metadata: Metadata = pageMetadata({
  title: "Meus favoritos",
  description: "As cadeiras que você guardou para ver depois.",
  path: "/favoritos",
  noindex: true,
});

export default async function FavoritosPage() {
  const content = await getContent();
  const produtos = produtosDaLoja(content).map((p) => ({
    slug: p.slug,
    base: p.base,
    personalizado: p.personalizado,
    categoria: p.categoria.titulo,
    categoriaSlug: p.categoria.slug,
  }));
  return (
    <>
      <PageHeader
        voltarPara="/categoria/cadeiras"
        titulo="Meus favoritos"
        resumo="As cadeiras que você guardou tocando no coração. Ficam salvas neste aparelho, sem precisar de cadastro."
      />
      <section className="mx-auto max-w-6xl px-6 py-14">
        <ListaFavoritos produtos={produtos} whatsappNumero={content.site.whatsappNumero} />
      </section>
    </>
  );
}
