import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";
import { FramedWeave } from "@/components/framed-weave";
import { PageHeader } from "@/components/page-header";
import { TextoRico, textoSimples } from "@/components/texto-rico";
import { textosDaPagina } from "@/lib/textos-paginas";
import { getContent } from "@/lib/content-store";

// Pre-rendered and cached (2026-10-06, the site felt slow): rebuilt every 10 min
// at most, and right away when the admin saves (revalidatePath("/", "layout")).
export const revalidate = 600;

export const metadata: Metadata = pageMetadata({
  title: "Sobre",
  description:
    "Conheça a história e o processo por trás do SentArte.",
  path: "/sobre",
});

export default async function SobrePage() {
  const { site, paginas } = await getContent();
  const t = textosDaPagina(paginas, "sobre");
  return (
    <>
      <PageHeader
        titulo={textoSimples(t.linha("titulo"), site.nome)}
        resumo={textoSimples(t.linha("resumo"), site.nome)}
      />
      <section className="mx-auto grid max-w-6xl gap-12 px-6 py-16 md:grid-cols-2 md:items-center">
        <div className="space-y-5 text-sm leading-relaxed text-ink-soft">
          <TextoRico texto={t.linha("texto")} whatsappNumero={site.whatsappNumero} nome={site.nome} />
        </div>
        <FramedWeave imagemUrl={t.linha("foto")} alt={t.linha("foto").startsWith("/photos/") ? "Areia de praia com ondulações formadas pelo vento" : `Foto do ateliê ${site.nome}`} />
      </section>
    </>
  );
}
