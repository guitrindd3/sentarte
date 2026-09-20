import Link from "next/link";
import { InstagramIcon, WhatsAppIcon } from "@/components/icons";
import { FOOTER_LINKS, INSTAGRAM_URL, SITE_NAME, whatsappUrl } from "@/lib/site";

export function SiteFooter() {
  return (
    <footer className="border-t-2 border-rattan bg-navy text-canvas">
      <div className="mx-auto grid max-w-6xl grid-cols-2 gap-10 px-6 py-16 md:grid-cols-4">
        <div className="col-span-2 md:col-span-1">
          <p className="font-serif text-xl">{SITE_NAME}</p>
          <p className="mt-3 max-w-[26ch] text-sm text-canvas/70">
            Cadeiras de praia, bolsas e espreguiçadeiras trançadas à mão, com personalização sob
            medida.
          </p>
        </div>

        <div>
          <p className="text-sm font-medium tracking-wide text-rattan">Institucional</p>
          <ul className="mt-3 space-y-2 text-sm text-canvas/70">
            {FOOTER_LINKS.institucional.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="transition-colors hover:text-canvas">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="text-sm font-medium tracking-wide text-rattan">Políticas</p>
          <ul className="mt-3 space-y-2 text-sm text-canvas/70">
            {FOOTER_LINKS.politicas.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="transition-colors hover:text-canvas">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="text-sm font-medium tracking-wide text-rattan">Fale conosco</p>
          <div className="mt-3 flex flex-col gap-2 text-sm text-canvas/70">
            <a
              href={whatsappUrl("Oi! Vim pelo site e queria saber mais sobre as cadeiras.")}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 transition-colors hover:text-canvas"
            >
              <WhatsAppIcon className="h-4 w-4" />
              WhatsApp
            </a>
            <a
              href={INSTAGRAM_URL}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 transition-colors hover:text-canvas"
            >
              <InstagramIcon className="h-4 w-4" />
              Instagram
            </a>
          </div>
        </div>
      </div>

      <div className="border-t border-canvas/10 px-6 py-4 text-center text-xs text-canvas/50">
        © {new Date().getFullYear()} {SITE_NAME}. Todos os direitos reservados.
      </div>
    </footer>
  );
}
