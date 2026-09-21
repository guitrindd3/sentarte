import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ModeloCard } from "@/components/modelo-card";
import { WeavePattern } from "@/components/weave-pattern";
import { getContent } from "@/lib/content-store";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: PageProps<"/categoria/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const { categorias } = await getContent();
  const categoria = categorias.find((c) => c.slug === slug);
  if (!categoria) return {};
  return {
    title: categoria.titulo,
    description: categoria.intro,
  };
}

export default async function CategoriaPage({ params }: PageProps<"/categoria/[slug]">) {
  const { slug } = await params;
  const content = await getContent();
  const categoria = content.categorias.find((c) => c.slug === slug);
  if (!categoria) notFound();

  return (
    <>
      <section className="border-b border-line bg-canvas-deep px-6 py-14">
        <div className="mx-auto max-w-6xl">
          <h1 className="font-serif text-3xl font-medium tracking-tight text-ink md:text-4xl">{categoria.titulo}</h1>
          <p className="mt-4 max-w-[60ch] text-sm leading-relaxed text-ink-soft">
            {categoria.intro}
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-14">
        {categoria.modelos.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {categoria.modelos.map((modelo) => (
              <ModeloCard
                key={modelo.id}
                modelo={modelo}
                categoria={categoria.titulo}
                whatsappNumero={content.site.whatsappNumero}
              />
            ))}
          </div>
        ) : (
          <p className="text-sm text-ink-soft">Nenhum modelo cadastrado nessa categoria ainda.</p>
        )}
      </section>

      <section className="relative overflow-hidden border-t border-line bg-espresso px-6 py-14 text-canvas">
        <WeavePattern
          colorA={categoria.corA}
          colorB={categoria.corB}
          cell={48}
          band={32}
          className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 opacity-20"
        />
        <div className="relative mx-auto max-w-6xl">
          <p className="max-w-[50ch] font-serif text-xl">
            Não achou exatamente o que procurava? Toda peça é feita sob encomenda — conta pra
            gente o que você tem em mente.
          </p>
        </div>
      </section>
    </>
  );
}
