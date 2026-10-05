import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";
import { getContent } from "@/lib/content-store";
import { PaginaDeTexto } from "@/components/pagina-de-texto";
import { textosDaPagina } from "@/lib/textos-paginas";

export const dynamic = "force-dynamic";

export const metadata: Metadata = pageMetadata({
  title: "Trocas e devoluções",
  description:
    "Regras de troca e devolução para peças feitas sob encomenda pelo SentArte.",
  path: "/politica-de-troca-e-devolucao",
});

export default async function TrocaPage() {
  const { site, paginas } = await getContent();
  const t = textosDaPagina(paginas, "trocas");
  return (
    <PaginaDeTexto
      titulo={t.linha("titulo")}
      secoes={t.blocos("secoes")}
      whatsappNumero={site.whatsappNumero}
      nome={site.nome}
    />
  );
}
