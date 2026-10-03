import Image from "next/image";
import type { Depoimento } from "@/lib/content-schema";

/** Real customer quotes, added in /admin. Renders nothing while there are none. */
export function Depoimentos({ depoimentos }: { depoimentos: Depoimento[] }) {
  if (!depoimentos.length) return null;
  return (
    <section className="px-6 py-14 md:py-20" aria-labelledby="titulo-depoimentos">
      <div className="mx-auto max-w-6xl">
        <h2 id="titulo-depoimentos" className="font-serif text-3xl font-medium tracking-tight text-ink md:text-4xl">
          Quem já tem a sua
        </h2>
        <ul className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {depoimentos.map((d) => (
            <li key={d.id} className="flex flex-col border border-line bg-paper">
              {d.fotoUrl ? (
                <span className="relative block aspect-square w-full overflow-hidden">
                  <Image
                    src={d.fotoUrl}
                    alt={`${d.nome} com a cadeira SentArte`}
                    fill
                    className="object-cover"
                    sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                  />
                </span>
              ) : null}
              <blockquote className="flex flex-1 flex-col p-5">
                <p className="text-ink">&ldquo;{d.texto}&rdquo;</p>
                <footer className="mt-4 text-sm text-ink-soft">
                  {d.nome}
                  {d.cidade ? `, ${d.cidade}` : ""}
                </footer>
              </blockquote>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
