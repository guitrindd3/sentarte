import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";
import { getContent } from "@/lib/content-store";
import { PaginaDeTexto } from "@/components/pagina-de-texto";
import { textosDaPagina } from "@/lib/textos-paginas";

// Pre-rendered and cached (2026-10-06, the site felt slow): rebuilt every 10 min
// at most, and right away when the admin saves (revalidatePath("/", "layout")).
export const revalidate = 600;

export const metadata: Metadata = pageMetadata({
  title: "Política de privacidade",
  description:
    "Como o SentArte trata os dados de quem entra em contato.",
  path: "/politica-de-privacidade",
});

export default async function PoliticaDePrivacidadePage() {
  const { site, paginas } = await getContent();
  const t = textosDaPagina(paginas, "privacidade");
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
