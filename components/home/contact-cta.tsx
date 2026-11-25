import type { SiteContent } from "@/lib/content-schema";
import { CartoesRedes } from "@/components/redes-sociais";
import { AzevinhoNatal, LuzesTitulo } from "@/components/natal";
import { CintilanteAnoNovo, GuirlandaDeEstrelas } from "@/components/ano-novo";

// Homepage contact block (redesigned 2026-11-23, user: "sobre os contatos… deixe
// mais bonito… com as cores das redes sociais"): one card per network in its
// own colours, WhatsApp first. Title/text editable in Páginas → Página inicial.
export function ContactCta({
  site,
  titulo = "Ficou com dúvida sobre modelo, cor ou prazo?",
  texto = "Fala com a gente antes de fechar o pedido — a gente te ajuda a escolher.",
}: {
  site: SiteContent["site"];
  titulo?: string;
  texto?: string;
}) {
  return (
    <section className="relative border-t border-line bg-canvas px-4 py-12 sm:px-6 md:py-16" aria-labelledby="titulo-contato">
      {/* December: warm fairy lights along the top */}
      <LuzesTitulo />
      <GuirlandaDeEstrelas />
      <div className="mx-auto max-w-6xl">
        <div className="mx-auto max-w-2xl text-center">
          <p className="flex items-center justify-center gap-1.5 text-sm text-ink-soft">
            <AzevinhoNatal className="h-4 w-6" />
            <CintilanteAnoNovo className="h-4 w-6" />
            Fale com o ateliê
          </p>
          <h2 id="titulo-contato" className="mt-2 font-serif text-3xl font-medium tracking-tight text-ink md:text-4xl">
            {titulo}
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-ink-soft md:text-base">{texto}</p>
        </div>
        <div className="mt-8 md:mt-10">
          <CartoesRedes site={site} mensagemWhatsapp="Oi! Vim pelo site e queria saber mais sobre as cadeiras." />
        </div>
      </div>
    </section>
  );
}
