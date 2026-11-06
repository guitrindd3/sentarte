import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CompartilharPassaporte } from "@/components/compartilhar-passaporte";
import { WeavePattern } from "@/components/weave-pattern";
import { getContent } from "@/lib/content-store";
import { fotosDaProducao } from "@/lib/fotos-producao";
import { FIOS } from "@/lib/palette";
import { acharProduto, caminhoDoModelo, slugDoModelo } from "@/lib/produtos";
import {
  codigoDoPassaporte,
  comPadroes,
  lerConfigPassaporte,
  lerPassaporte,
  linkDoPassaporte,
  numeroBonito,
  numeroDoCodigo,
  rotuloTipo,
} from "@/lib/passaporte";
import { redisAtivo } from "@/lib/redis";

// A chair's passport (lib/passaporte.ts), opened from the QR tag tied to it.
// Public but unlisted (signed number in the URL, noindex): it shows the woven
// name, never the buyer's name, city or order.
export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: PageProps<"/p/[codigo]">): Promise<Metadata> {
  const { codigo } = await params;
  const n = numeroDoCodigo(codigo);
  return { title: n ? `Cadeira nº ${numeroBonito(n)}` : "Passaporte", robots: { index: false, follow: false } };
}

const dia = (iso: string) => new Intl.DateTimeFormat("pt-BR", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(`${iso}T12:00:00Z`));
const diaMs = (ms: number) => new Intl.DateTimeFormat("pt-BR", { day: "numeric", month: "long", year: "numeric", timeZone: "America/Sao_Paulo" }).format(new Date(ms));
const nomeDaCor = (c: string) => FIOS.find((f) => f.cor.toLowerCase() === c.toLowerCase())?.nome;
const num = (v: number) => v.toLocaleString("pt-BR");

export default async function PassaportePage({ params }: PageProps<"/p/[codigo]">) {
  const { codigo } = await params;
  const n = numeroDoCodigo(codigo);
  if (n === null || !redisAtivo()) notFound();
  const [p, cfg, content] = await Promise.all([lerPassaporte(n), lerConfigPassaporte(), getContent()]);
  if (!p) notFound();
  const { artesa, horas, metros } = comPadroes(p, cfg);
  const fotos = await fotosDaProducao(p.ref).catch(() => []);
  const doBuilder = p.imagem?.startsWith("/api/cadeira?");
  const base = p.modelo.replace(/ personalizado$/i, "");
  const produto = !doBuilder && p.categoriaSlug ? acharProduto(content, slugDoModelo(base)) : undefined;
  const igual = doBuilder ? `/personalizar?${p.imagem!.split("?")[1]}` : produto ? caminhoDoModelo(base, p.categoriaSlug!) : "/personalizar";
  const feitaEm = p.prontaEm ? dia(p.prontaEm) : diaMs(p.criadoEm);
  const titulo = `Cadeira nº ${numeroBonito(p.n)}`;

  const dados: { r: string; v: string }[] = [
    { r: p.prontaEm ? "Ficou pronta em" : "Começou a ser trançada em", v: feitaEm },
    { r: "Tipo", v: rotuloTipo(p.tipo) },
    ...(horas ? [{ r: "Horas de trabalho", v: `${num(horas)} h, à mão` }] : []),
    ...(metros ? [{ r: "Fio usado", v: `${num(metros)} metros` }] : []),
    ...(p.extras?.length ? [{ r: "Detalhes", v: p.extras.join(", ") }] : []),
  ];

  return (
    <article className="pb-16">
      <section className="border-b border-line bg-canvas-deep">
        <div className="mx-auto grid max-w-5xl gap-8 px-6 py-10 md:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] md:items-center md:py-16">
          <div className="relative mx-auto aspect-[4/5] w-full max-w-sm overflow-hidden border border-line bg-paper">
            {p.imagem && doBuilder ? (
              // eslint-disable-next-line @next/next/no-img-element -- server render of the built chair
              <img src={p.imagem} alt={p.modelo} className="h-full w-full object-contain" />
            ) : p.imagem ? (
              <Image src={p.imagem} alt={p.modelo} fill priority sizes="(min-width: 768px) 380px, 100vw" className="object-cover" />
            ) : (
              <WeavePattern colorA={p.corA ?? "#2b2420"} colorB={p.corB ?? "#efe6d6"} cell={34} band={22} className="h-full w-full" />
            )}
            <span className="absolute left-3 top-3 bg-ink px-2.5 py-1 font-mono text-xs tracking-widest text-canvas">Nº {numeroBonito(p.n)}</span>
          </div>
          <div>
            <p className="text-sm tracking-wide text-ink-soft">Passaporte · Ateliê SentArte</p>
            <h1 className="mt-2 font-serif text-4xl font-semibold tracking-tight text-ink md:text-5xl">
              Cadeira <span className="align-[0.35em] font-sans text-[0.45em] font-medium tracking-normal">nº</span> {numeroBonito(p.n)}
            </h1>
            <p className="mt-3 text-lg text-ink">
              {p.modelo}
              {p.nome ? (
                <>
                  , com o nome <strong className="font-semibold">&ldquo;{p.nome}&rdquo;</strong> trançado
                </>
              ) : null}
              .
            </p>
            {p.colecao ? (
              <Link
                href={`/colecao/${p.colecao.id}`}
                className="mt-4 inline-flex items-center gap-2 border border-ink px-3 py-1.5 text-sm text-ink hover:bg-ink hover:text-canvas"
              >
                <span className="font-semibold">
                  nº {String(p.colecao.numero).padStart(2, "0")} de {p.colecao.total}
                </span>
                <span>{p.colecao.nome}</span>
              </Link>
            ) : null}
            <p className="mt-5 max-w-[48ch] leading-relaxed text-ink-soft">
              Feita uma a uma, à mão, {artesa ? <>por <strong className="font-medium text-ink">{artesa}</strong></> : "no Ateliê SentArte"}, no Espírito Santo. Não existe
              outra igual a ela.
            </p>
            {p.corA || p.corB ? (
              <div className="mt-5 flex flex-wrap gap-4 text-sm text-ink">
                {[p.corA, p.corB].filter((c): c is string => Boolean(c)).map((c, i) => (
                  <span key={i} className="inline-flex items-center gap-2">
                    <span className="h-6 w-6 rounded-full border border-line" style={{ background: c }} aria-hidden />
                    {nomeDaCor(c) ?? (i === 0 ? "Fio principal" : "Fio do detalhe")}
                  </span>
                ))}
              </div>
            ) : null}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-6 pt-12">
        <dl className="grid border-l border-t border-line sm:grid-cols-2 lg:grid-cols-3">
          {dados.map((d) => (
            <div key={d.r} className="border-b border-r border-line bg-paper p-5">
              <dt className="text-xs text-ink-soft">{d.r}</dt>
              <dd className="mt-1 font-serif text-xl font-medium tracking-tight text-ink">{d.v}</dd>
            </div>
          ))}
        </dl>
      </section>

      {fotos.length ? (
        <section className="mx-auto max-w-5xl px-6 pt-12">
          <h2 className="font-serif text-2xl font-medium tracking-tight text-ink">Ela sendo feita</h2>
          <p className="mt-1 text-sm text-ink-soft">Fotos tiradas no ateliê, enquanto ela era trançada.</p>
          <ul className="mt-5 grid grid-cols-[repeat(2,minmax(0,1fr))] gap-4 sm:grid-cols-[repeat(3,minmax(0,1fr))]">
            {fotos.map((f) => (
              <li key={f.id}>
                {/* eslint-disable-next-line @next/next/no-img-element -- served from Redis through the passport's signed code */}
                <img src={`/api/passaporte/${codigoDoPassaporte(p.n)}/${f.id}`} alt={f.legenda} className="aspect-square w-full border border-line object-cover" />
                <p className="mt-2 text-sm text-ink">{f.legenda}</p>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="mx-auto mt-12 grid max-w-5xl gap-6 px-6 md:grid-cols-2">
        <div className="border border-line bg-paper p-6">
          <h2 className="font-serif text-xl font-medium tracking-tight text-ink">Gostou dela?</h2>
          <p className="mt-1 text-sm text-ink-soft">Dá para pedir uma igual, com o seu nome, ou montar a sua do zero.</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link
              href={igual ?? "/personalizar"}
              data-rastro="Passaporte: quero uma igual"
              className="inline-flex items-center justify-center border border-ink bg-ink px-5 py-2.5 text-sm font-medium text-canvas transition-colors hover:bg-transparent hover:text-ink"
            >
              Quero uma igual
            </Link>
            <CompartilharPassaporte url={linkDoPassaporte(p.n)} titulo={titulo} />
          </div>
        </div>
        <div className="border border-line bg-paper p-6">
          <h2 className="font-serif text-xl font-medium tracking-tight text-ink">Cuidando dela</h2>
          <p className="mt-1 text-sm leading-relaxed text-ink-soft">
            Depois da praia, um enxágue com água doce tira o sal. Deixe secar na sombra antes de guardar.
          </p>
          <Link href="/garantia-e-cuidados" className="mt-3 inline-block text-sm font-medium text-ink underline underline-offset-2">
            Garantia e cuidados
          </Link>
        </div>
      </section>
    </article>
  );
}
