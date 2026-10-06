import Link from "next/link";
import { ListaNovidades } from "@/components/lista-novidades";
import { InstagramIcon, LockIcon, StarIcon, WhatsAppIcon } from "@/components/icons";
import { getContent } from "@/lib/content-store";
import { FOOTER_LINKS } from "@/lib/nav";
import { instagramUrl, whatsappUrl } from "@/lib/urls";

export async function SiteFooter() {
  const content = await getContent();
  const { nome, whatsappNumero, instagramHandle, googleUrl } = content.site;

  return (
    <footer id="rodape" className="border-t border-line bg-canvas-deep text-ink">
      <div className="border-b border-line">
        <div className="mx-auto grid max-w-6xl gap-4 px-6 py-8 md:grid-cols-[1fr_1.4fr] md:items-center md:gap-10">
          <div>
            <p className="font-serif text-xl font-medium tracking-tight">Novidades e cupons no seu WhatsApp</p>
            <p className="mt-1 text-sm text-ink-soft">Modelos novos e promoções antes de todo mundo. Sem spam.</p>
          </div>
          <ListaNovidades />
        </div>
      </div>
      <div className="mx-auto grid max-w-6xl grid-cols-2 gap-10 px-6 py-16 md:grid-cols-4">
        <div className="col-span-2 md:col-span-1">
          <p className="font-serif text-xl font-medium tracking-tight">{nome}</p>
          <p className="mt-3 max-w-[26ch] text-sm text-ink-soft">
            Cadeiras de praia trançadas à mão, personalizadas do seu jeito. Enviamos para todo o
            Brasil.
          </p>
        </div>

        <div>
          <p className="text-sm font-medium tracking-wide text-ink">Institucional</p>
          <ul className="mt-2 text-sm text-ink-soft">
            {FOOTER_LINKS.institucional.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="inline-block py-1.5 transition-colors hover:text-ink">
                  {link.label}
                </Link>
              </li>
            ))}
            {/* Staff entrance to /admin (moved here from the bottom corner 2026-10-06: the WhatsApp button covered it) */}
            <li>
              <Link href="/admin" data-sem-rastro className="inline-flex items-center gap-1.5 py-1.5 transition-colors hover:text-ink">
                <LockIcon className="h-3.5 w-3.5" />
                Área do ateliê
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <p className="text-sm font-medium tracking-wide text-ink">Políticas</p>
          <ul className="mt-2 text-sm text-ink-soft">
            {FOOTER_LINKS.politicas.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="inline-block py-1.5 transition-colors hover:text-ink">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="text-sm font-medium tracking-wide text-ink">Fale conosco</p>
          <div className="mt-2 flex flex-col text-sm text-ink-soft">
            <a
              href={whatsappUrl(whatsappNumero, "Oi! Vim pelo site e queria saber mais sobre as cadeiras.")}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 py-1.5 transition-colors hover:text-ink"
            >
              <WhatsAppIcon className="h-4 w-4" />
              WhatsApp
            </a>
            <a
              href={instagramUrl(instagramHandle)}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 py-1.5 transition-colors hover:text-ink"
            >
              <InstagramIcon className="h-4 w-4" />
              Instagram
            </a>
            {googleUrl ? (
              <a href={googleUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 py-1.5 transition-colors hover:text-ink">
                <StarIcon className="h-4 w-4" />
                Avaliações no Google
              </a>
            ) : null}
          </div>
        </div>
      </div>

      <div className="border-t border-line px-6 py-4 text-xs text-ink-soft">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-x-6 gap-y-2 sm:justify-between">
          <p>
            © {new Date().getFullYear()} {nome}. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
}
