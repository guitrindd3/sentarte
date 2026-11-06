import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { BackLink } from "@/components/back-link";
import { ContagemColecao, EsperaColecao } from "@/components/colecao-espera";
import { ModeloCard } from "@/components/modelo-card";
import { TextoRico } from "@/components/texto-rico";
import { colecaoPublica, idColecaoValido } from "@/lib/colecoes";
import { getContent } from "@/lib/content-store";
import { CATEGORIA_COM_PRECO } from "@/lib/offer";
import { redisAtivo } from "@/lib/redis";
import { pageMetadata } from "@/lib/seo";

// A numbered collection (lib/colecoes.ts): live count of chairs left, the
// waiting list before it opens / after it sells out, and its chairs (the
// cards themselves switch to "lista de espera" while they can't be bought).
export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: PageProps<"/colecao/[id]">): Promise<Metadata> {
  const { id } = await params;
  const c = redisAtivo() && idColecaoValido(id) ? await colecaoPublica(id).catch(() => null) : null;
  if (!c) return { title: "Coleção" };
  return pageMetadata({
    title: c.nome,
    description: `${c.nome}: edição numerada de ${c.total} cadeiras de praia trançadas à mão no Ateliê SentArte. Cada uma com seu número e passaporte.`,
    path: `/colecao/${c.id}`,
  });
}

const dataHora = (ms: number) =>
  new Intl.DateTimeFormat("pt-BR", { weekday: "long", day: "2-digit", month: "long", hour: "2-digit", minute: "2-digit", timeZone: "America/Sao_Paulo" }).format(new Date(ms));

export default async function ColecaoPage({ params }: PageProps<"/colecao/[id]">) {
  const { id } = await params;
  if (!redisAtivo() || !idColecaoValido(id)) notFound();
  const c = await colecaoPublica(id);
  if (!c) notFound();
  const content = await getContent();
  const cadeiras = content.categorias.find((x) => x.slug === CATEGORIA_COM_PRECO);
  const modelos = (cadeiras?.modelos ?? []).filter((m) => c.modelos.includes(m.nome));
  const capa = modelos.find((m) => m.imagemUrl)?.imagemUrl;
  const pct = Math.round((c.vendidos / c.total) * 100);
  const fechada = c.situacao === "esgotada" || c.situacao === "encerrada";

  return (
    <>
      <section className="bg-ink text-canvas">
        <div className="mx-auto grid max-w-6xl gap-10 px-6 pb-14 pt-4 md:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] md:items-center md:pb-20 md:pt-6">
          <div>
            <div className="[&_button]:text-canvas/75 [&_button:hover]:text-canvas">
              <BackLink fallback="/categoria/cadeiras" />
            </div>
            <p className="mt-6 text-sm tracking-wide text-canvas/70">Edição numerada · {c.total} cadeiras</p>
            <h1 className="mt-2 font-serif text-4xl font-semibold tracking-tight md:text-6xl">{c.nome}</h1>
            {c.descricao ? (
              <div className="mt-5 max-w-[52ch] space-y-3 text-sm leading-relaxed text-canvas/80 md:text-base">
                <TextoRico texto={c.descricao} whatsappNumero={content.site.whatsappNumero} />
              </div>
            ) : null}

            <div className="mt-8 max-w-md">
              {c.situacao === "aberta" ? (
                <>
                  <p className="font-serif text-2xl font-medium">
                    {c.restam === 1 ? "Resta 1 cadeira" : `Restam ${c.restam} cadeiras`} <span className="text-canvas/60">de {c.total}</span>
                  </p>
                  <div className="mt-3 h-2 overflow-hidden bg-canvas/15" aria-hidden>
                    <div className="h-full bg-canvas" style={{ width: `${Math.max(2, pct)}%` }} />
                  </div>
                  <a href="#cadeiras" className="mt-6 inline-flex items-center justify-center bg-canvas px-6 py-3 text-sm font-semibold text-ink hover:bg-canvas/85">
                    Escolher a minha
                  </a>
                </>
              ) : c.situacao === "espera" ? (
                <>
                  <p className="mb-3 text-sm text-canvas/80">{c.abreEm ? `Abre ${dataHora(c.abreEm)}.` : "Abre em breve. Entre na lista para saber primeiro."}</p>
                  {c.abreEm ? <ContagemColecao abreEm={c.abreEm} /> : null}
                  <a href="#espera" className="mt-6 inline-flex items-center justify-center bg-canvas px-6 py-3 text-sm font-semibold text-ink hover:bg-canvas/85">
                    Entrar na lista de espera
                  </a>
                </>
              ) : (
                <>
                  <p className="font-serif text-2xl font-medium">{c.situacao === "esgotada" ? "Esgotada" : "Edição encerrada"}</p>
                  <p className="mt-1 text-sm text-canvas/75">
                    {c.situacao === "esgotada" ? `As ${c.total} cadeiras já têm dono, cada uma com o seu número.` : "Essa edição terminou."}
                  </p>
                </>
              )}
            </div>
          </div>
          {capa ? (
            <div className="relative aspect-[4/5] w-full overflow-hidden border border-canvas/20">
              <Image src={capa} alt={c.nome} fill priority sizes="(min-width: 768px) 40vw, 100vw" className="object-cover" />
              <span className="absolute bottom-3 left-3 bg-canvas px-3 py-1.5 text-sm font-medium text-ink">
                nº 01 a {String(c.total).padStart(2, "0")}
              </span>
            </div>
          ) : null}
        </div>
      </section>

      <section className="border-b border-line bg-canvas-deep">
        <div className="mx-auto grid max-w-6xl gap-6 px-6 py-10 text-sm text-ink sm:grid-cols-3">
          <p>
            <strong className="block font-serif text-lg font-medium">Cada uma tem seu número</strong>
            <span className="text-ink-soft">A sua sai com o número dela na edição, de 1 a {c.total}.</span>
          </p>
          <p>
            <strong className="block font-serif text-lg font-medium">Passaporte com QR code</strong>
            <span className="text-ink-soft">Uma etiqueta presa na cadeira conta a história dela: quem trançou, quando e com quanto fio.</span>
          </p>
          <p>
            <strong className="block font-serif text-lg font-medium">Não volta</strong>
            <span className="text-ink-soft">Quando as {c.total} acabarem, essa edição não é feita de novo.</span>
          </p>
        </div>
      </section>

      {c.situacao !== "aberta" ? (
        <section id="espera" className="mx-auto max-w-3xl scroll-mt-24 px-6 pt-14">
          <h2 className="font-serif text-2xl font-medium tracking-tight text-ink">{fechada ? "Próxima edição" : "Lista de espera"}</h2>
          <div className="mt-4">
            <EsperaColecao id={c.id} nome={c.nome} esgotada={fechada} />
          </div>
        </section>
      ) : null}

      <section id="cadeiras" className="mx-auto max-w-6xl scroll-mt-24 px-6 py-14">
        <h2 className="font-serif text-2xl font-medium tracking-tight text-ink">{modelos.length === 1 ? "A cadeira da coleção" : "As cadeiras da coleção"}</h2>
        {modelos.length && cadeiras ? (
          <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {modelos.map((m) => (
              <ModeloCard
                key={m.id}
                modelo={m}
                personalizado={cadeiras.modelos.find((x) => x.nome === `${m.nome} personalizado`)}
                categoria={cadeiras.titulo}
                categoriaSlug={cadeiras.slug}
                whatsappNumero={content.site.whatsappNumero}
              />
            ))}
          </div>
        ) : (
          <p className="mt-3 text-sm text-ink-soft">As fotos das cadeiras aparecem aqui em breve.</p>
        )}
      </section>
    </>
  );
}
