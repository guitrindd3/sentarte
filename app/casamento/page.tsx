import type { Metadata } from "next";
import Link from "next/link";
import { chairListJsonLd, pageMetadata } from "@/lib/seo";
import { JsonLd } from "@/components/json-ld";
import { ModeloCard } from "@/components/modelo-card";
import { OrcamentoCasamento } from "@/components/orcamento-casamento";
import { PageHeader } from "@/components/page-header";
import { TextoRico, textoSimples } from "@/components/texto-rico";
import { textosDaPagina } from "@/lib/textos-paginas";
import { getContent } from "@/lib/content-store";
import { modelosDoGrupo } from "@/lib/grupos";
import { formatBRL, precoCadeira } from "@/lib/offer";

// Wedding chairs (2026-10-23, user picked it from the growth ideas). No real
// wedding photos yet, so the three ideas show chairs drawn by the builder's
// renderer (labelled as examples) and open /personalizar on that design.
// Chairs the atelier publishes to "Casamento" from the admin show up below.
export const revalidate = 600;

export const metadata: Metadata = pageMetadata({
  title: "Cadeira de praia personalizada para casamento",
  description:
    "Cadeira dos noivos, dos padrinhos e da daminha com os nomes trançados à mão. Peça o orçamento do seu casamento pelo WhatsApp.",
  path: "/casamento",
});

// Same order as the "ideias" blocks in lib/textos-paginas.ts.
const EXEMPLOS = [
  "f=coracao&a=F3F1EC&b=7A2E3A&e=0.45&fx=0.5&fy=0.22&n=ANA+%26+LEO&nx=0.5&ny=0.72&t=0.85",
  "f=lisa&a=F3F1EC&b=C99A2E&n=MADRINHA&nx=0.5&ny=0.5",
  "tc=infantil&f=coracaozinhos&a=F3F1EC&b=E85A97&n=DAMINHA&nx=0.5&ny=0.5",
];

export default async function CasamentoPage() {
  const content = await getContent();
  const tp = textosDaPagina(content.paginas, "casamento");
  const ideias = tp.blocos("ideias");
  const cadeiras = content.categorias.find((c) => c.slug === "cadeiras");
  const modelos = modelosDoGrupo(cadeiras, "casamento");
  const zap = content.site.whatsappNumero;

  return (
    <>
      <PageHeader
        voltarPara="/categoria/cadeiras"
        titulo={textoSimples(tp.linha("titulo"))}
        resumo={textoSimples(tp.linha("resumo"))}
      />

      <section className="mx-auto max-w-6xl px-6 py-14">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
          {EXEMPLOS.map((qs, i) => (
            <article key={qs}>
              {/* eslint-disable-next-line @next/next/no-img-element -- server-rendered PNG of the design */}
              <img
                src={`/api/cadeira?${qs}`}
                alt={`Exemplo: ${ideias[i]?.titulo ?? "cadeira de casamento"}`}
                width={480}
                height={560}
                loading={i === 0 ? "eager" : "lazy"}
                className="w-full border border-line bg-canvas"
              />
              <p className="mt-1 text-xs text-ink-soft">Exemplo montado no Monte a sua trama</p>
              <h2 className="mt-4 font-serif text-2xl font-medium tracking-tight text-ink">{ideias[i]?.titulo}</h2>
              <p className="mt-2 text-sm leading-relaxed text-ink-soft">{ideias[i]?.texto}</p>
              <Link
                href={`/personalizar?${qs}`}
                className="mt-4 inline-flex rounded-full border border-ink px-5 py-2 text-sm font-medium text-ink transition-colors hover:bg-ink hover:text-canvas"
              >
                Começar com este
              </Link>
            </article>
          ))}
        </div>
        <p className="mt-10 text-sm text-ink-soft">
          Cada cadeira com nome sai por {formatBRL(precoCadeira(true))}; a infantil com nome, por{" "}
          {formatBRL(precoCadeira(true, "infantil"))}. Para o casamento inteiro, peça o orçamento abaixo.
        </p>
      </section>

      {modelos.length > 0 && cadeiras ? (
        <section className="mx-auto max-w-6xl px-6 pb-14">
          <JsonLd data={chairListJsonLd(modelos)} />
          <h2 className="font-serif text-2xl font-medium tracking-tight text-ink">Cadeiras de casamento</h2>
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
          <OrcamentoCasamento whatsappNumero={zap} />
        </div>
      </section>
    </>
  );
}
