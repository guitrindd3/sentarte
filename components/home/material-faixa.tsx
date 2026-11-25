import { ICONES_MATERIAL, SeloRustico } from "@/components/icones-rusticos";
import { IlustracaoAgulhas, IlustracaoLinha } from "@/components/home/ilustracoes-atelie";
import { AzevinhoNatal, LuzesTitulo, MeioDoDivisor } from "@/components/natal";

// Homepage version of the material block, without the spool photo (user
// 2026-11-23: the photo section left the home for /sobre, then "quero isso
// aqui em algum lugar da página principal também… logos em cada frase…
// algo rústico"). Same words as /sobre (Páginas → Sobre), so one edit changes both.
export function MaterialFaixa({
  titulo,
  texto,
  itens,
}: {
  titulo: string;
  texto: string;
  itens: { titulo: string; texto: string }[];
}) {
  return (
    <section className="relative overflow-hidden border-t border-line bg-canvas-deep px-6 py-10 text-ink md:py-12" aria-labelledby="titulo-material">
      {/* Spool on the left, crochet hooks on the right (user 2026-11-23), only where
          the sides have room beside the centred column. */}
      <IlustracaoLinha className="pointer-events-none absolute left-8 top-1/2 hidden w-[min(15rem,calc((100vw-72rem)/2-2rem))] -translate-y-1/2 2xl:block" />
      <IlustracaoAgulhas className="pointer-events-none absolute right-8 top-1/2 hidden w-[min(15rem,calc((100vw-72rem)/2-2rem))] -translate-y-1/2 2xl:block" />
      {/* December: warm fairy lights along the top, like "Nossas cadeiras" */}
      <LuzesTitulo />
      <div className="mx-auto max-w-6xl">
        <div className="mx-auto max-w-2xl text-center">
          {/* Phones and narrower screens (no room on the sides): both drawings,
              small, above the title (user 2026-11-23: "no celular não aparece nada"). */}
          <div aria-hidden className="mb-3 flex items-end justify-center gap-6 2xl:hidden">
            <IlustracaoLinha ids="linha-cel" className="h-20 w-[4.7rem] md:h-24 md:w-[5.6rem]" />
            <IlustracaoAgulhas ids="agulha-cel" className="h-20 w-[7.5rem] md:h-24 md:w-36" />
          </div>
          <h2 id="titulo-material" className="font-serif text-3xl font-medium tracking-tight md:text-4xl">
            {titulo}
          </h2>
          <span aria-hidden className="mx-auto mt-3 flex w-40 items-center gap-2 text-wood/60">
            <span className="h-px flex-1 border-t border-dashed border-current" />
            <MeioDoDivisor />
            <span className="h-px flex-1 border-t border-dashed border-current" />
          </span>
          <p className="mt-3 text-sm leading-relaxed text-ink-soft md:text-base">{texto}</p>
        </div>

        <ul className="mx-auto mt-8 grid max-w-md gap-6 md:max-w-none md:grid-cols-3 md:gap-8">
          {itens.slice(0, 3).map((it, i) => {
            const Icone = ICONES_MATERIAL[i];
            return (
              <li key={i} className="flex items-center gap-5 md:flex-col md:items-center md:gap-0 md:text-center">
                {/* Bigger seals, less space around (user 2026-11-23: "diminui um pouco e aumenta um pouco das logos") */}
                <SeloRustico className="h-24 w-24 md:h-28 md:w-28">
                  <Icone className="h-16 w-16 md:h-[4.5rem] md:w-[4.5rem]" />
                  {/* December: a holly sprig pinned on the seal's edge */}
                  <AzevinhoNatal className={`absolute -top-1 h-7 w-10 md:h-8 md:w-12 ${i % 2 ? "-left-3 -rotate-12" : "-right-3 rotate-12"}`} />
                </SeloRustico>
                <div>
                  <h3 className="font-serif text-xl font-medium tracking-tight md:mt-3">{it.titulo}</h3>
                  <p className="mt-1.5 max-w-[34ch] text-sm leading-relaxed text-ink-soft md:mt-2">{it.texto}</p>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
