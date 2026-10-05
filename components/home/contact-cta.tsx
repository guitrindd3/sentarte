import { InstagramIcon, WhatsAppIcon } from "@/components/icons";
import { instagramUrl, whatsappUrl } from "@/lib/urls";

export function ContactCta({
  whatsappNumero,
  instagramHandle,
  titulo = "Ficou com dúvida sobre modelo, cor ou prazo?",
  texto = "Fala com a gente antes de fechar o pedido — a gente te ajuda a escolher.",
}: {
  whatsappNumero: string;
  instagramHandle: string;
  titulo?: string;
  texto?: string;
}) {
  return (
    <section className="bg-canvas px-6 py-14 md:py-20">
      <div className="mx-auto max-w-xl border border-line bg-paper px-6 py-10 text-center md:px-10 md:py-14">
        <span className="mx-auto block h-px w-10 bg-line" aria-hidden="true" />
        <h2 className="mt-6 font-serif text-2xl font-medium tracking-tight text-ink">{titulo}</h2>
        <p className="mt-3 text-sm leading-relaxed text-ink-soft">{texto}</p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-4 text-sm font-medium">
          <a
            href={whatsappUrl(whatsappNumero, "Oi! Vim pelo site e queria saber mais sobre as cadeiras.")}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 border border-ink px-5 py-2.5 text-ink transition-colors hover:bg-ink hover:text-canvas"
          >
            <WhatsAppIcon className="h-4 w-4" />
            WhatsApp
          </a>
          <a
            href={instagramUrl(instagramHandle)}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 border border-line px-5 py-2.5 text-ink-soft transition-colors hover:border-ink hover:text-ink"
          >
            <InstagramIcon className="h-4 w-4" />
            Instagram
          </a>
        </div>
      </div>
    </section>
  );
}
