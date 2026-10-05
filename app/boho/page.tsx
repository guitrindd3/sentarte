import type { Metadata } from "next";
import { chairListJsonLd, pageMetadata } from "@/lib/seo";
import { JsonLd } from "@/components/json-ld";
import { OfferStrip } from "@/components/offer-strip";
import { ModeloCard } from "@/components/modelo-card";
import { PageHeader } from "@/components/page-header";
import { textoSimples } from "@/components/texto-rico";
import { textosDaPagina } from "@/lib/textos-paginas";
import { getContent } from "@/lib/content-store";
import { BOHO_PADROES } from "@/lib/boho-model";

export const dynamic = "force-dynamic";

export const metadata: Metadata = pageMetadata({
  title: "Cadeira de praia boho",
  description:
    "Cadeiras de praia boho trançadas à mão, com estampas exclusivas em tons terrosos. A partir de R$ 449,90, com envio para todo o Brasil.",
  path: "/boho",
});

export default async function BohoPage() {
  const tp = textosDaPagina((await getContent()).paginas, "boho");
  const content = await getContent();
  const cadeiras = content.categorias.find((c) => c.slug === "cadeiras");
  const modelos = cadeiras
    ? BOHO_PADROES.flatMap((nome) => {
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
      <OfferStrip compact />
      {modelos.length > 0 ? <JsonLd data={chairListJsonLd(modelos)} /> : null}
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
          <p className="text-sm text-ink-soft">Nenhuma estampa boho cadastrada ainda.</p>
        )}
      </section>
    </>
  );
}
