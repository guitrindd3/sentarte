import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BackLink } from "@/components/back-link";
import { Depoimentos } from "@/components/home/depoimentos";
import { FotosClientes } from "@/components/fotos-clientes";
import { JsonLd } from "@/components/json-ld";
import { MedidasCadeiras } from "@/components/medidas-cadeiras";
import { ProdutoCompra } from "@/components/produto-compra";
import { WeavePattern } from "@/components/weave-pattern";
import { getContent } from "@/lib/content-store";
import { SITE_URL } from "@/lib/nav";
import { formatBRL, precoCadeira, precoPix, PRECO_CADEIRA, PRECO_CADEIRA_COM_NOME } from "@/lib/offer";
import { acharProduto, GRUPOS, produtosDaLoja, relacionados, type Produto } from "@/lib/produtos";
import { pageMetadata } from "@/lib/seo";
import { TextoRico, textoSimples } from "@/components/texto-rico";
import { textosDaPagina } from "@/lib/textos-paginas";

// One page per chair (2026-10-19). Pre-rendered and cached like the catalog
// pages: rebuilt every 10 min at most, and right away when the admin saves.
export const revalidate = 600;

export async function generateStaticParams() {
  return produtosDaLoja(await getContent()).map((p) => ({ slug: p.slug }));
}

const ehDesenho = (p: Produto) => p.grupo === "desenhos";

function titulo(p: Produto) {
  if (p.grupo === "times") return `Cadeira de praia do ${p.base.nome}`;
  return `Cadeira de praia ${p.base.nome}`;
}

export async function generateMetadata({ params }: PageProps<"/cadeira/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const p = acharProduto(await getContent(), slug);
  if (!p) return {};
  const preco = precoCadeira(ehDesenho(p));
  return pageMetadata({
    title: titulo(p),
    description: `${p.base.descricao} Trançada à mão em corda náutica e alumínio${
      ehDesenho(p) ? "" : ", com ou sem o seu nome"
    }. ${formatBRL(preco)} (${formatBRL(precoPix(preco))} no Pix), envio para todo o Brasil.`,
    path: `/cadeira/${p.slug}`,
    imagem: p.base.imagemUrl,
  });
}

export default async function CadeiraPage({ params }: PageProps<"/cadeira/[slug]">) {
  const { slug } = await params;
  const content = await getContent();
  const p = acharProduto(content, slug);
  if (!p) notFound();

  const grupo = GRUPOS[p.grupo];
  const fotos = [p.base.imagemUrl, ...(p.base.variantes ?? []), ...(p.base.fotosExtras ?? [])].filter(Boolean);
  const comNome = ehDesenho(p);
  const parecidas = relacionados(content, p);
  const url = `${SITE_URL}/cadeira/${p.slug}`;
  const tp = textosDaPagina(content.paginas, "cadeira");

  const migalhas = [
    { nome: "Início", href: "/" },
    { nome: "Cadeiras de praia", href: "/categoria/cadeiras" },
    ...(p.grupo === "outros" ? [] : [{ nome: grupo.titulo, href: grupo.href }]),
  ];

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Product",
          name: titulo(p),
          description: p.base.descricao,
          ...(fotos.length ? { image: fotos.map((f) => new URL(f!, SITE_URL).href) } : {}),
          brand: { "@type": "Brand", name: content.site.nome },
          url,
          offers: {
            "@type": "AggregateOffer",
            lowPrice: (comNome ? PRECO_CADEIRA_COM_NOME : PRECO_CADEIRA).toFixed(2),
            highPrice: PRECO_CADEIRA_COM_NOME.toFixed(2),
            offerCount: comNome ? 1 : 2,
            priceCurrency: "BRL",
            availability: "https://schema.org/MadeToOrder",
            url,
          },
        }}
      />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [...migalhas, { nome: p.base.nome, href: `/cadeira/${p.slug}` }].map((m, i) => ({
            "@type": "ListItem",
            position: i + 1,
            name: m.nome,
            item: `${SITE_URL}${m.href}`,
          })),
        }}
      />

      <section className="mx-auto max-w-6xl px-6 pb-14 pt-4 md:pt-6">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
          <BackLink fallback={grupo.href} />
          <nav aria-label="Você está em" className="hidden text-sm text-ink-soft sm:block">
            <ol className="flex flex-wrap items-center gap-1.5">
              {migalhas.map((m) => (
                <li key={m.href} className="flex items-center gap-1.5">
                  <Link href={m.href} className="hover:text-ink hover:underline">
                    {m.nome}
                  </Link>
                  <span aria-hidden="true">/</span>
                </li>
              ))}
              <li aria-current="page" className="text-ink">
                {p.base.nome}
              </li>
            </ol>
          </nav>
        </div>
        <div className="mt-4">
          <ProdutoCompra
            slug={p.slug}
            modelo={p.base}
            personalizado={p.personalizado}
            categoria={p.categoria.titulo}
            categoriaSlug={p.categoria.slug}
            whatsappNumero={content.site.whatsappNumero}
          />
        </div>
      </section>

      <section className="border-t border-line bg-canvas-deep px-6 py-14" aria-labelledby="titulo-detalhes">
        <div className="mx-auto grid max-w-6xl gap-10 md:grid-cols-2">
          <div>
            <h2 id="titulo-detalhes" className="font-serif text-2xl font-medium tracking-tight text-ink md:text-3xl">
              {textoSimples(tp.linha("comoTitulo"))}
            </h2>
            <div className="mt-3 max-w-[55ch] space-y-3 leading-relaxed text-ink-soft">
              <TextoRico texto={tp.linha("comoTexto")} whatsappNumero={content.site.whatsappNumero} />
            </div>
          </div>
          <dl className="grid gap-3 text-sm sm:grid-cols-2">
            {[
              ...tp.blocos("detalhes").map((b) => [textoSimples(b.titulo), textoSimples(b.texto)]),
              ["Personalização", comNome ? "O desenho é feito do seu jeito" : "Com ou sem o seu nome trançado"],
            ].map(([rotulo, valor]) => (
              <div key={rotulo} className="border border-line bg-paper p-4">
                <dt className="text-ink-soft">{rotulo}</dt>
                <dd className="mt-1 font-medium text-ink">{valor}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <MedidasCadeiras whatsappNumero={content.site.whatsappNumero} />

      {parecidas.length ? (
        <section className="border-t border-line px-6 py-14" aria-labelledby="titulo-parecidas">
          <div className="mx-auto max-w-6xl">
            <h2 id="titulo-parecidas" className="font-serif text-2xl font-medium tracking-tight text-ink md:text-3xl">
              Você também pode gostar
            </h2>
            <ul className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-6">
              {parecidas.map((q) => {
                const preco = precoCadeira(ehDesenho(q));
                return (
                  <li key={q.slug}>
                    <Link
                      href={`/cadeira/${q.slug}`}
                      data-rastro={`Sugestão: ${q.base.nome}`}
                      className="group block border border-line bg-paper transition-all duration-300 hover:-translate-y-1 hover:border-ink hover:shadow-[6px_6px_0_0_var(--line)]"
                    >
                      <span className="relative block aspect-square overflow-hidden border-b border-line bg-canvas">
                        {q.base.imagemUrl ? (
                          <Image
                            src={q.base.imagemUrl}
                            alt={q.base.nome}
                            fill
                            className="object-cover transition-transform duration-300 group-hover:scale-105"
                            sizes="(min-width: 768px) 25vw, 50vw"
                          />
                        ) : (
                          <WeavePattern colorA={q.base.corA} colorB={q.base.corB} className="h-full w-full" />
                        )}
                      </span>
                      <span className="block p-3 sm:p-4">
                        <span className="block font-serif font-medium text-ink">{q.base.nome}</span>
                        <span className="mt-0.5 block text-sm text-ink">{formatBRL(preco)}</span>
                        <span className="block text-xs text-ink-soft">{formatBRL(precoPix(preco))} no Pix</span>
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        </section>
      ) : null}

      <div className="border-t border-line pb-14">
        <FotosClientes depoimentos={content.depoimentos} />
        <Depoimentos
          depoimentos={content.depoimentos}
          titulo="O que dizem os clientes"
          googleUrl={content.site.googleUrl}
        />
      </div>
    </>
  );
}
