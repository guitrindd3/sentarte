import Link from "next/link";
import { FramedWeave } from "@/components/framed-weave";
import { WhatsAppIcon } from "@/components/icons";
import { whatsappUrl } from "@/lib/urls";
import type { SiteContent } from "@/lib/content-schema";

export function Hero({ hero, whatsappNumero }: { hero: SiteContent["hero"]; whatsappNumero: string }) {
  return (
    <section className="border-b border-line bg-canvas">
      <div className="mx-auto grid max-w-6xl gap-10 px-6 py-16 md:grid-cols-[1.1fr_1fr] md:items-center md:py-24">
        <div>
          <h1 className="max-w-[16ch] font-serif text-4xl leading-[1.1] text-ink md:text-6xl">
            {hero.titulo}
          </h1>
          <p className="mt-6 max-w-[46ch] text-base leading-relaxed text-ink-soft">
            {hero.subtitulo}
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <Link
              href="/categoria/cadeiras"
              className="border border-ink bg-ink px-6 py-3 text-sm font-medium text-canvas transition-colors hover:bg-transparent hover:text-ink"
            >
              Ver modelos
            </Link>
            <a
              href="#personalizar"
              className="border border-ink px-6 py-3 text-sm font-medium text-ink transition-colors hover:bg-ink hover:text-canvas"
            >
              Montar minha trama
            </a>
            <a
              href={whatsappUrl(whatsappNumero, "Oi! Vim pelo site e queria saber mais sobre as cadeiras.")}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 text-sm font-medium text-marine hover:underline"
            >
              <WhatsAppIcon className="h-4 w-4" />
              Falar no WhatsApp
            </a>
          </div>

          <dl className="mt-12 grid max-w-md grid-cols-1 gap-3 sm:grid-cols-3">
            {hero.tags.map((tag) => (
              <dd
                key={tag}
                className="border border-dashed border-rattan px-3 py-2 text-xs leading-snug text-ink-soft"
              >
                {tag}
              </dd>
            ))}
          </dl>
        </div>

        <FramedWeave colorA="#15564C" colorB="#BD502E" cell={56} band={38} animated />
      </div>
    </section>
  );
}
