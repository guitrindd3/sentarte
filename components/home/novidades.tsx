import Image from "next/image";
import Link from "next/link";
import type { SiteContent } from "@/lib/content-schema";
import { PRAZO_PRODUCAO_DIAS_UTEIS, precoDoModelo } from "@/lib/offer";
import { produtosDaLoja, type Produto } from "@/lib/produtos";
import { ChamadaOferta, EnfeitesDaFoto, PrecoVitrine } from "@/components/home/preco-vitrine";
import { FotosPassando } from "@/components/home/fotos-passando";

// Homepage "Novidades" showcase (user 2026-11-23: where the material block was,
// "coloque mais novidades de venda… mais cadeira para as pessoas verem… deixa
// bonito"). The newest chairs by Modelo.criadoEm: one big card + 7 smaller
// ones and a closing "Ver todas" tile, so the grid is always full (4 cols on
// desktop: big = 2x2, 4 beside it, 4 below; 2 cols on phones).
// Plain server-rendered links (no ModeloCard) to keep the homepage light.

const QUANTOS = 8;
const DIAS_NOVO = 60;

const ehDesenho = (p: Produto) => p.grupo === "desenhos";

export function Novidades({ content }: { content: SiteContent }) {
  const produtos = produtosDaLoja(content).filter((p) => p.base.imagemUrl);
  if (produtos.length < 3) return null;
  const quando = (p: Produto) => p.base.criadoEm ?? "";
  // Newest first; chairs with the same (or no) date keep the catalog order, newest-added last → reverse it.
  const lista = produtos
    .map((p, i) => ({ p, i }))
    .sort((a, b) => quando(b.p).localeCompare(quando(a.p)) || b.i - a.i)
    .slice(0, QUANTOS)
    .map((x) => x.p);
  // "Novo" = within DIAS_NOVO of the newest chair (pure: the page is cached, no clock read in render).
  const maisNovo = quando(lista[0]);
  const limite = maisNovo ? new Date(new Date(maisNovo).getTime() - DIAS_NOVO * 86_400_000).toISOString() : "9";
  const novo = (p: Produto) => quando(p) >= limite;
  const [destaque, ...resto] = lista;
  // Photos for the "Ver todas" tile: the chairs NOT already shown above, then the rest.
  const mostrados = new Set(lista.map((p) => p.slug));
  const fotosTile = [...produtos.filter((p) => !mostrados.has(p.slug)), ...lista]
    .slice(0, 14)
    .map((p) => ({ src: p.base.imagemUrl!, alt: p.base.nome }));

  // Full screen width, no side margins (user 2026-11-23: "cubra toda área… não
  // quero margem nesse aqui… deixa mais como venda"). Grid: phones 2 cols,
  // md 4 cols (big 2x2 + 8 cells = 3 rows), xl 6 cols (big 2x2 + 8 = 2 rows).
  return (
    <section className="border-t border-line bg-paper pt-12 md:pt-16" aria-labelledby="titulo-novidades">
      <div className="flex flex-wrap items-end justify-between gap-x-10 gap-y-4 px-4 sm:px-6 lg:px-10">
        <div className="max-w-2xl">
          <p className="text-sm text-ink-soft">Recém-trançadas</p>
          <h2 id="titulo-novidades" className="mt-2 font-serif text-3xl font-medium tracking-tight text-ink md:text-5xl">
            Novidades do ateliê
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-ink-soft md:text-base">
            As cadeiras mais novas que saíram das nossas mãos. Todas feitas sob encomenda e prontas em até{" "}
            {PRAZO_PRODUCAO_DIAS_UTEIS} dias úteis.
          </p>
          <ChamadaOferta />
        </div>
        <Link
          href="/categoria/cadeiras"
          data-rastro="Novidades: ver todas"
          className="hidden border-b border-ink pb-0.5 text-sm font-semibold text-ink hover:opacity-70 md:inline-block"
        >
          Ver todas as {produtos.length} cadeiras
        </Link>
      </div>

      <ul className="mt-8 grid grid-cols-2 gap-1 md:mt-10 md:grid-cols-4 md:gap-1.5 xl:grid-cols-6">
        <li className="col-span-2 md:row-span-2">
          <Cartao p={destaque} novo={novo(destaque)} grande />
        </li>
        {resto.map((p) => (
          <li key={p.slug}>
            <Cartao p={p} novo={novo(p)} />
          </li>
        ))}
        <li className={resto.length % 2 === 0 ? "col-span-2 md:col-span-1" : ""}>
          <Link
            href="/categoria/cadeiras"
            data-rastro="Novidades: tile ver todas"
            className="group relative flex h-full min-h-56 flex-col justify-between overflow-hidden bg-ink p-5 text-canvas"
          >
              <FotosPassando fotos={fotosTile} />
              <span className="relative font-serif text-2xl font-medium leading-tight tracking-tight [text-shadow:0_1px_12px_rgb(0_0_0/0.45)]">
                Ver todas as cadeiras
              </span>
              <span className="relative mt-4 block [text-shadow:0_1px_10px_rgb(0_0_0/0.5)]">
                <span className="block text-sm font-semibold">{produtos.length} modelos</span>
                <span className="block text-sm text-canvas/85">Times, boho, desenhos e a sua própria trama</span>
                <span className="mt-3 inline-block border border-canvas/70 px-3 py-1.5 text-xs font-semibold transition-colors group-hover:bg-canvas group-hover:text-ink">
                  Ver o catálogo
                </span>
              </span>
          </Link>
        </li>
      </ul>
    </section>
  );
}

function Cartao({ p, novo, grande = false }: { p: Produto; novo: boolean; grande?: boolean }) {
  const preco = precoDoModelo(p.base, ehDesenho(p));
  return (
    <Link
      href={`/cadeira/${p.slug}`}
      data-rastro={`Novidades: ${p.base.nome}`}
      className="group flex h-full flex-col bg-canvas"
    >
      <span className={`relative block overflow-hidden ${grande ? "aspect-square md:aspect-auto md:min-h-[24rem] md:flex-1" : "aspect-square"}`}>
        <Image
          src={p.base.imagemUrl!}
          alt={p.base.nome}
          fill
          className="object-cover transition-transform duration-700 group-hover:scale-105"
          sizes={grande ? "(min-width: 1280px) 34vw, (min-width: 768px) 50vw, 100vw" : "(min-width: 1280px) 17vw, (min-width: 768px) 25vw, 50vw"}
        />
        <EnfeitesDaFoto grande={grande} />
        {novo ? (
          <span className="absolute right-3 top-3 bg-ink px-2 py-1 text-xs font-semibold text-canvas">
            Novo
          </span>
        ) : null}
      </span>
      <span className={`flex flex-col ${grande ? "gap-4 p-5 sm:flex-row sm:items-end sm:justify-between md:p-7" : "flex-1 gap-3 p-3 sm:p-4"}`}>
        <span className="min-w-0">
          <span className={`block font-serif font-medium leading-tight text-ink ${grande ? "text-2xl md:text-4xl" : "text-base sm:text-lg"}`}>
            {p.base.nome}
          </span>
          <span className="mt-1.5 block">
            <PrecoVitrine preco={preco} grande={grande} />
          </span>
        </span>
        <span
          className={`mt-auto block shrink-0 bg-verde text-center font-semibold text-white transition-colors group-hover:bg-verde-escuro ${
            grande ? "px-7 py-3 text-base" : "px-3 py-2 text-sm"
          }`}
        >
          {grande ? "Comprar agora" : "Comprar"}
        </span>
      </span>
    </Link>
  );
}
