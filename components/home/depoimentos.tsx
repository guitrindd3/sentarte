import Image from "next/image";
import { Avaliar } from "@/components/avaliar";
import { Estrelas } from "@/components/estrelas";
import type { Depoimento } from "@/lib/content-schema";

/**
 * Real customer reviews (added or approved in /admin). Since 2026-10-05 the
 * section always shows, with stars, the average, and a "Já tem a sua? Avalie"
 * form whose reviews wait for the atelier's approval.
 */
export function Depoimentos({
  depoimentos,
  titulo = "Quem já tem a sua",
  googleUrl,
}: {
  depoimentos: Depoimento[];
  titulo?: string;
  googleUrl?: string;
}) {
  const comEstrelas = depoimentos.filter((d) => d.estrelas);
  const media = comEstrelas.length ? comEstrelas.reduce((s, d) => s + (d.estrelas ?? 0), 0) / comEstrelas.length : 0;

  return (
    <section className="px-6 pb-2 pt-14 md:pb-4 md:pt-20" aria-labelledby="titulo-depoimentos">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 id="titulo-depoimentos" className="font-serif text-3xl font-medium tracking-tight text-ink md:text-4xl">
              {depoimentos.length ? titulo : "Já tem a sua cadeira?"}
            </h2>
            {comEstrelas.length ? (
              <p className="mt-2 flex items-center gap-2 text-sm text-ink-soft">
                <Estrelas valor={media} />
                <span>
                  <strong className="font-semibold text-ink">{media.toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}</strong> de 5,{" "}
                  {comEstrelas.length} {comEstrelas.length === 1 ? "avaliação" : "avaliações"}
                </span>
              </p>
            ) : !depoimentos.length ? (
              <p className="mt-2 text-sm text-ink-soft">Conte como ficou a sua: sua avaliação ajuda quem ainda está escolhendo.</p>
            ) : null}
          </div>
        </div>

        {depoimentos.length ? (
          <ul className="mt-8 grid gap-4 md:grid-cols-2">
            {depoimentos.map((d) => (
              <li key={d.id} className="flex items-start gap-4 border border-line bg-paper p-4 sm:p-5">
                {d.fotoUrl ? (
                  <span className="relative block h-20 w-20 shrink-0 overflow-hidden sm:h-24 sm:w-24">
                    <Image src={d.fotoUrl} alt={`${d.nome} com a cadeira SentArte`} fill className="object-cover" sizes="96px" />
                  </span>
                ) : null}
                <blockquote className="min-w-0 flex-1">
                  {d.estrelas ? <Estrelas valor={d.estrelas} tamanho="h-3.5 w-3.5" /> : null}
                  <p className={`text-ink ${d.estrelas ? "mt-1.5" : ""}`}>&ldquo;{d.texto}&rdquo;</p>
                  <footer className="mt-3 text-sm text-ink-soft">
                    {d.nome}
                    {d.cidade ? `, ${d.cidade}` : ""}
                  </footer>
                </blockquote>
              </li>
            ))}
          </ul>
        ) : null}

        <div className="mt-6">
          <Avaliar googleUrl={googleUrl} />
        </div>
      </div>
    </section>
  );
}
