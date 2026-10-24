import type { Metadata } from "next";
import { chairListJsonLd, pageMetadata } from "@/lib/seo";
import { JsonLd } from "@/components/json-ld";
import { AvisoBlackFriday } from "@/components/aviso-black-friday";
import { ChairBuilder } from "@/components/chair-builder";
import { ComecarComEste } from "@/components/comecar-com-este";
import { ModeloCard } from "@/components/modelo-card";
import { OrcamentoEvento } from "@/components/orcamento-evento";
import { PageHeader } from "@/components/page-header";
import { TextoRico, textoSimples } from "@/components/texto-rico";
import { textosDaPagina } from "@/lib/textos-paginas";
import { getContent } from "@/lib/content-store";
import { modelosDoGrupo } from "@/lib/grupos";
import { formatBRL, precoCadeira, TASSEL_PRECO } from "@/lib/offer";

// Orders in quantity: weddings, companies, parties (2026-10-23 as /casamento,
// widened 2026-10-24 — user: "vender em lote para empresas, festas"; /casamento
// redirects here). No real event photos yet, so the four ideas show chairs drawn
// by the builder's renderer (labelled as examples) and load that design into
// the Monte a sua trama builder embedded below (#monte). Chairs the atelier
// publishes to "Eventos" from the admin show up below it.
export const revalidate = 600;

export const metadata: Metadata = pageMetadata({
  title: "Cadeiras de praia personalizadas para eventos e empresas",
  description:
    "Cadeiras trançadas à mão em quantidade para casamento, brinde de empresa, pousadas e festas, com nomes e cores do seu evento. Peça o orçamento pelo WhatsApp.",
  path: "/eventos",
});

// Same order as the "ideias" blocks in lib/textos-paginas.ts.
const EXEMPLOS = [
  "f=coracao&a=F3F1EC&b=7A2E3A&e=0.45&fx=0.5&fy=0.22&n=ANA+%26+LEO&nx=0.5&ny=0.72&t=0.85&ts=b",
  "f=lisa&a=F3F1EC&b=C99A2E&n=MADRINHA&nx=0.5&ny=0.5&ts=b",
  "f=moldura&a=F3F1EC&b=1B2A4A&n=SUA+MARCA&nx=0.5&ny=0.5",
  "f=coroa&a=F6C6D8&b=7A2E3A&e=0.45&fx=0.5&fy=0.22&n=15+ANOS&nx=0.5&ny=0.72&ts=b",
];

export default async function EventosPage() {
  const content = await getContent();
  const tp = textosDaPagina(content.paginas, "eventos");
  const ideias = tp.blocos("ideias");
  const cadeiras = content.categorias.find((c) => c.slug === "cadeiras");
  const modelos = modelosDoGrupo(cadeiras, "eventos");
  const zap = content.site.whatsappNumero;

  return (
    <>
      <PageHeader
        voltarPara="/categoria/cadeiras"
        titulo={textoSimples(tp.linha("titulo"))}
        resumo={textoSimples(tp.linha("resumo"))}
      />

      <section className="mx-auto max-w-6xl px-6 py-14">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4 lg:gap-8">
          {EXEMPLOS.map((qs, i) => (
            <article key={qs}>
              {/* eslint-disable-next-line @next/next/no-img-element -- server-rendered PNG of the design */}
              <img
                src={`/api/cadeira?${qs}`}
                alt={`Exemplo: ${ideias[i]?.titulo ?? "cadeira para evento"}`}
                width={480}
                height={560}
                loading={i === 0 ? "eager" : "lazy"}
                className="w-full border border-line bg-canvas"
              />
              <p className="mt-1 text-xs text-ink-soft">Exemplo montado no Monte a sua trama</p>
              <h2 className="mt-4 font-serif text-xl font-medium tracking-tight text-ink">{ideias[i]?.titulo}</h2>
              <p className="mt-2 text-sm leading-relaxed text-ink-soft">{ideias[i]?.texto}</p>
              <ComecarComEste trama={qs} />
            </article>
          ))}
        </div>
        <p className="mt-10 text-sm text-ink-soft">
          Cada cadeira com nome sai por {formatBRL(precoCadeira(true))}; a infantil com nome, por{" "}
          {formatBRL(precoCadeira(true, "infantil"))}. O tassel dos exemplos é opcional: +{formatBRL(TASSEL_PRECO)} cada um, e dá para pôr 1 ou 2. Para
          várias cadeiras, peça o orçamento no fim da página.
        </p>
      </section>

      <section id="monte" className="mx-auto max-w-6xl scroll-mt-24 px-6 pb-14">
        <h2 className="font-serif text-3xl font-medium tracking-tight text-ink">{textoSimples(tp.linha("monteTitulo"))}</h2>
        <p className="mb-6 mt-2 max-w-2xl text-sm leading-relaxed text-ink-soft">{textoSimples(tp.linha("monteTexto"))}</p>
        <AvisoBlackFriday />
        <ChairBuilder whatsappNumero={zap} />
      </section>

      {modelos.length > 0 && cadeiras ? (
        <section className="mx-auto max-w-6xl px-6 pb-14">
          <JsonLd data={chairListJsonLd(modelos)} />
          <h2 className="font-serif text-2xl font-medium tracking-tight text-ink">Feitas para eventos</h2>
          <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {modelos.map((modelo) => (
              <ModeloCard
                key={modelo.id}
                modelo={modelo}
                categoria={cadeiras.titulo}
                categoriaSlug={cadeiras.slug}
                whatsappNumero={zap}
              />
            ))}
          </div>
        </section>
      ) : null}

      <section id="orcamento" className="border-t border-line bg-paper">
        <div className="mx-auto grid max-w-6xl gap-10 px-6 py-14 md:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
          <div>
            <h2 className="font-serif text-3xl font-medium tracking-tight text-ink">{textoSimples(tp.linha("pedidoTitulo"))}</h2>
            <div className="mt-4 space-y-3 text-sm leading-relaxed text-ink-soft">
              <TextoRico texto={tp.linha("pedidoTexto")} whatsappNumero={zap} />
            </div>
          </div>
          <OrcamentoEvento whatsappNumero={zap} />
        </div>
      </section>
    </>
  );
}
