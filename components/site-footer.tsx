import Link from "next/link";
import { InstagramIcon, WhatsAppIcon } from "@/components/icons";
import { getContent } from "@/lib/content-store";
import { FOOTER_LINKS } from "@/lib/nav";
import { instagramUrl, whatsappUrl } from "@/lib/urls";

export async function SiteFooter() {
  const content = await getContent();
  const { nome, whatsappNumero, instagramHandle } = content.site;

  return (
    <footer className="border-t border-line bg-canvas-deep text-ink">
      <div className="mx-auto grid max-w-6xl grid-cols-2 gap-10 px-6 py-16 md:grid-cols-4">
        <div className="col-span-2 md:col-span-1">
          <p className="font-serif text-xl font-medium tracking-tight">{nome}</p>
          <p className="mt-3 max-w-[26ch] text-sm text-ink-soft">
            Cadeiras de praia, bolsas e espreguiçadeiras trançadas à mão, com personalização sob
            medida.
          </p>
        </div>

        <div>
          <p className="text-sm font-medium tracking-wide text-ink">Institucional</p>
          <ul className="mt-3 space-y-2 text-sm text-ink-soft">
            {FOOTER_LINKS.institucional.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="transition-colors hover:text-ink">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="text-sm font-medium tracking-wide text-ink">Políticas</p>
          <ul className="mt-3 space-y-2 text-sm text-ink-soft">
            {FOOTER_LINKS.politicas.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="transition-colors hover:text-ink">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="text-sm font-medium tracking-wide text-ink">Fale conosco</p>
          <div className="mt-3 flex flex-col gap-2 text-sm text-ink-soft">
            <a
              href={whatsappUrl(whatsappNumero, "Oi! Vim pelo site e queria saber mais sobre as cadeiras.")}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 transition-colors hover:text-ink"
            >
              <WhatsAppIcon className="h-4 w-4" />
              WhatsApp
            </a>
            <a
              href={instagramUrl(instagramHandle)}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 transition-colors hover:text-ink"
            >
              <InstagramIcon className="h-4 w-4" />
              Instagram
            </a>
          </div>
        </div>
      </div>

      <div className="border-t border-line px-6 py-4 text-center text-xs text-ink-soft">
        © {new Date().getFullYear()} {nome}. Todos os direitos reservados.
      </div>
    </footer>
  );
}
