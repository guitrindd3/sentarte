import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ModeloCard } from "@/components/modelo-card";
import { WeavePattern } from "@/components/weave-pattern";
import { CATEGORIAS, getCategoria, getSubcategorias } from "@/lib/categories";

export function generateStaticParams() {
  return CATEGORIAS.map((categoria) => ({ slug: categoria.slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/categoria/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const categoria = getCategoria(slug);
  if (!categoria) return {};
  return {
    title: categoria.titulo,
    description: categoria.intro,
  };
}

export default async function CategoriaPage({ params }: PageProps<"/categoria/[slug]">) {
  const { slug } = await params;
  const categoria = getCategoria(slug);
  if (!categoria) notFound();

  const parent = categoria.parent ? getCategoria(categoria.parent) : undefined;
  const subcategorias = getSubcategorias(categoria.slug);

  return (
    <>
      <section className="border-b border-line bg-canvas-deep px-6 py-14">
        <div className="mx-auto max-w-6xl">
          {parent ? (
            <Link href={`/categoria/${parent.slug}`} className="text-sm text-marine hover:underline">
              ← {parent.titulo}
            </Link>
          ) : null}
          <h1 className="mt-3 max-w-[24ch] font-serif text-3xl text-ink md:text-4xl">
            {categoria.titulo}
          </h1>
          <p className="mt-4 max-w-[60ch] text-sm leading-relaxed text-ink-soft">
            {categoria.intro}
          </p>

          {subcategorias.length > 0 ? (
            <div className="mt-6 flex flex-wrap gap-3">
              {subcategorias.map((sub) => (
                <Link
                  key={sub.slug}
                  href={`/categoria/${sub.slug}`}
                  className="border border-dashed border-rattan px-3 py-1.5 text-sm text-ink-soft transition-colors hover:border-marine hover:text-marine"
                >
                  {sub.titulo}
                </Link>
              ))}
            </div>
          ) : null}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-14">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {categoria.modelos.map((modelo) => (
            <ModeloCard key={modelo.nome} modelo={modelo} categoria={categoria.titulo} />
          ))}
        </div>
      </section>

      <section className="relative overflow-hidden border-t border-line bg-navy px-6 py-14 text-canvas">
        <WeavePattern
          colorA="#A9835A"
          colorB="#BD502E"
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
