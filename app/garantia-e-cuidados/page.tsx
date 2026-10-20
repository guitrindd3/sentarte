import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";
import { getContent } from "@/lib/content-store";
import { PaginaDeTexto } from "@/components/pagina-de-texto";
import { textosDaPagina } from "@/lib/textos-paginas";

// Pre-rendered and cached like the other policy pages (texts in Páginas → Garantia e cuidados).
export const revalidate = 600;

export const metadata: Metadata = pageMetadata({
  title: "Garantia e cuidados",
  description: "Garantia de 90 dias contra defeito de fabricação e como cuidar da sua cadeira de praia trançada SentArte.",
  path: "/garantia-e-cuidados",
});

export default async function GarantiaPage() {
  const { site, paginas } = await getContent();
  const t = textosDaPagina(paginas, "garantia");
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
