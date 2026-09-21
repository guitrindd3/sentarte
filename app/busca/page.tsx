import type { Metadata } from "next";
import { ModeloCard } from "@/components/modelo-card";
import { PageHeader } from "@/components/page-header";
import { getContent } from "@/lib/content-store";
import { pairPersonalizados } from "@/lib/modelo-pairs";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Busca",
};

// Accent-insensitive fold: decompose accented letters (NFD) then drop every
// non-ASCII codepoint left behind (the combining marks), same approach as
// slugify() in app/admin/actions.ts.
function fold(text: string) {
  return text.normalize("NFD").replace(/[^\x00-\x7f]/g, "").toLowerCase();
}

export default async function BuscaPage({ searchParams }: PageProps<"/busca">) {
  const { q } = await searchParams;
  const query = typeof q === "string" ? q.trim() : "";
  const content = await getContent();

  const needle = fold(query);
  const resultados = query
    ? content.categorias.flatMap((categoria) => {
        const encontrados = categoria.modelos.filter((modelo) => {
          const haystack = fold(`${modelo.nome} ${modelo.descricao} ${categoria.titulo}`);
          return haystack.includes(needle);
        });
        return pairPersonalizados(encontrados).map((par) => ({ ...par, categoria }));
      })
    : [];

  return (
    <>
      <PageHeader
        titulo="Busca"
        resumo={
          query
            ? `${resultados.length} resultado${resultados.length === 1 ? "" : "s"} para "${query}".`
            : "Digite algo na lupa do menu para procurar um modelo."
        }
      />
      <section className="mx-auto max-w-6xl px-6 pt-10">
        <form method="get" action="/busca" className="flex max-w-md gap-2">
          <input
            type="search"
            name="q"
            defaultValue={query}
            placeholder="Buscar cadeira, bolsa, time..."
            autoFocus
            className="w-full border border-line bg-paper px-4 py-2.5 text-sm text-ink focus:border-ink focus:outline-none"
          />
          <button
            type="submit"
            className="shrink-0 border border-ink bg-ink px-4 py-2.5 text-sm font-medium text-canvas transition-colors hover:bg-transparent hover:text-ink"
          >
            Buscar
          </button>
        </form>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-14">
        {query && resultados.length === 0 ? (
          <p className="text-sm text-ink-soft">
            Nada encontrado para &quot;{query}&quot;. Tenta o nome de uma categoria, como
            &quot;cadeira&quot;, &quot;bolsa&quot; ou o nome de um time.
          </p>
        ) : null}
        {resultados.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {resultados.map(({ base, personalizado, categoria }) => (
              <ModeloCard
                key={base.id}
                modelo={base}
                personalizado={personalizado}
                categoria={categoria.titulo}
                categoriaSlug={categoria.slug}
                whatsappNumero={content.site.whatsappNumero}
              />
            ))}
          </div>
        ) : null}
      </section>
    </>
  );
}
