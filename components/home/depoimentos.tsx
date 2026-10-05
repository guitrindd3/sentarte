import Image from "next/image";
import type { Depoimento } from "@/lib/content-schema";

/** Real customer quotes, added in /admin. Renders nothing while there are none. */
export function Depoimentos({ depoimentos, titulo = "Quem já tem a sua" }: { depoimentos: Depoimento[]; titulo?: string }) {
  if (!depoimentos.length) return null;
  return (
    <section className="px-6 pb-2 pt-14 md:pb-4 md:pt-20" aria-labelledby="titulo-depoimentos">
      <div className="mx-auto max-w-6xl">
        <h2 id="titulo-depoimentos" className="font-serif text-3xl font-medium tracking-tight text-ink md:text-4xl">{titulo}</h2>
        <ul className="mt-8 grid gap-4 md:grid-cols-2">
          {depoimentos.map((d) => (
            <li key={d.id} className="flex items-start gap-4 border border-line bg-paper p-4 sm:p-5">
              {d.fotoUrl ? (
                <span className="relative block h-20 w-20 shrink-0 overflow-hidden sm:h-24 sm:w-24">
                  <Image src={d.fotoUrl} alt={`${d.nome} com a cadeira SentArte`} fill className="object-cover" sizes="96px" />
                </span>
              ) : null}
              <blockquote className="min-w-0 flex-1">
                <p className="text-ink">&ldquo;{d.texto}&rdquo;</p>
                <footer className="mt-3 text-sm text-ink-soft">
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
