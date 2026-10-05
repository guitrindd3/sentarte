import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";
import { PaginaDeTexto } from "@/components/pagina-de-texto";
import { textosDaPagina } from "@/lib/textos-paginas";
import { getContent } from "@/lib/content-store";

export const dynamic = "force-dynamic";

export const metadata: Metadata = pageMetadata({
  title: "Termos de uso",
  description:
    "Termos de uso do site do SentArte.",
  path: "/termos-de-uso",
});

export default async function TermosDeUsoPage() {
  const { site, paginas } = await getContent();
  const t = textosDaPagina(paginas, "termos");
  return (
    <PaginaDeTexto
      titulo={t.linha("titulo")}
      intro={t.linha("intro")}
      secoes={t.blocos("secoes")}
      whatsappNumero={site.whatsappNumero}
      nome={site.nome}
    />
  );
}
