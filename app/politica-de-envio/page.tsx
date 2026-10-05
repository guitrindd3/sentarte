import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";
import { PaginaDeTexto } from "@/components/pagina-de-texto";
import { textosDaPagina } from "@/lib/textos-paginas";
import { getContent } from "@/lib/content-store";

export const dynamic = "force-dynamic";

export const metadata: Metadata = pageMetadata({
  title: "Envio",
  description:
    "Como funciona o envio e a retirada das peças do SentArte.",
  path: "/politica-de-envio",
});

export default async function PoliticaDeEnvioPage() {
  const { site, paginas } = await getContent();
  const t = textosDaPagina(paginas, "envio");
  return (
    <PaginaDeTexto
      titulo={t.linha("titulo")}
      secoes={t.blocos("secoes")}
      whatsappNumero={site.whatsappNumero}
      nome={site.nome}
    />
  );
}
