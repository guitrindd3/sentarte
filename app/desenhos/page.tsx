import type { Metadata } from "next";
import { chairListJsonLd, pageMetadata } from "@/lib/seo";
import { JsonLd } from "@/components/json-ld";
import { OfferStrip } from "@/components/offer-strip";
import { ModeloCard } from "@/components/modelo-card";
import { PageHeader } from "@/components/page-header";
import { textoSimples } from "@/components/texto-rico";
import { textosDaPagina } from "@/lib/textos-paginas";
import { getContent } from "@/lib/content-store";
import { DESENHO_TEMAS } from "@/lib/desenho-model";

// Pre-rendered and cached (2026-10-06, the site felt slow): rebuilt every 10 min
// at most, and right away when the admin saves (revalidatePath("/", "layout")).
export const revalidate = 600;

export const metadata: Metadata = pageMetadata({
  title: "Cadeira de praia com desenho, anime ou nome",
  description:
    "Cadeira de praia personalizada com o seu desenho ou personagem de anime, trançado à mão. R$ 489,90, com envio para todo o Brasil.",
  path: "/desenhos",
});

export default async function DesenhosPage() {
  const tp = textosDaPagina((await getContent()).paginas, "desenhos");
  const content = await getContent();
  const cadeiras = content.categorias.find((c) => c.slug === "cadeiras");
  const modelos = cadeiras
    ? DESENHO_TEMAS.flatMap((nome) => {
        const modelo = cadeiras.modelos.find((m) => m.nome === nome);
        return modelo ? [modelo] : [];
      })
    : [];

  return (
    <>
      <PageHeader
        voltarPara="/categoria/cadeiras"
        titulo={textoSimples(tp.linha("titulo"))}
        resumo={textoSimples(tp.linha("resumo"))}
      />
      <OfferStrip compact soPersonalizada />
      {modelos.length > 0 ? <JsonLd data={chairListJsonLd(modelos, { soPersonalizada: true })} /> : null}
      <section className="mx-auto max-w-6xl px-6 py-14">
        {modelos.length > 0 && cadeiras ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {modelos.map((modelo) => (
              <ModeloCard
                key={modelo.id}
                modelo={modelo}
                categoria={cadeiras.titulo}
                categoriaSlug={cadeiras.slug}
                whatsappNumero={content.site.whatsappNumero}
              />
            ))}
          </div>
        ) : (
          <p className="text-sm text-ink-soft">Nenhum exemplo cadastrado ainda.</p>
        )}
      </section>
    </>
  );
}
