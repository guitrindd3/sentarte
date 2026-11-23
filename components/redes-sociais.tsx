import type { ReactNode } from "react";
import { InstagramIcon, PinterestIcon, WhatsAppIcon } from "@/components/icons";
import type { SiteContent } from "@/lib/content-schema";
import { instagramUrl, whatsappUrl } from "@/lib/urls";

// Contact cards in each network's own colours (user 2026-11-23: "deixe mais
// bonito… com as cores das redes sociais"). Used by the homepage contact block
// and /contato. Brand colours are tokens in globals.css (--whatsapp, --pinterest,
// --instagram, --google-*, .bg-instagram) — only for these cards.

/** 5527995201669 → (27) 99520-1669 */
export function telefoneBonito(numero: string) {
  const n = numero.replace(/\D/g, "").replace(/^55(?=\d{10,11}$)/, "");
  if (n.length < 10) return numero;
  const ddd = n.slice(0, 2);
  const resto = n.slice(2);
  return `(${ddd}) ${resto.slice(0, -4)}-${resto.slice(-4)}`;
}

type Rede = {
  nome: ReactNode;
  rotulo: string;
  linha: string;
  acao: string;
  href: string;
  icone: ReactNode;
  /** Tailwind classes: icon tile background, hover shadow/border colour, action text colour. */
  fundo: string;
  sombra: string;
  corAcao: string;
};

function GoogleNome() {
  return (
    <span aria-label="Google">
      <span className="text-google-azul">G</span>
      <span className="text-google-vermelho">o</span>
      <span className="text-google-amarelo">o</span>
      <span className="text-google-azul">g</span>
      <span className="text-google-verde">l</span>
      <span className="text-google-vermelho">e</span>
    </span>
  );
}

export function redesDoSite(site: SiteContent["site"], mensagemWhatsapp: string): Rede[] {
  const redes: Rede[] = [
    {
      nome: "WhatsApp",
      rotulo: "WhatsApp",
      linha: telefoneBonito(site.whatsappNumero),
      acao: "Chamar agora",
      href: whatsappUrl(site.whatsappNumero, mensagemWhatsapp),
      icone: <WhatsAppIcon className="h-7 w-7" />,
      fundo: "bg-whatsapp",
      sombra: "hover:border-whatsapp hover:shadow-[5px_5px_0_0_var(--whatsapp)]",
      corAcao: "text-whatsapp-escuro",
    },
    {
      nome: "Instagram",
      rotulo: "Instagram",
      linha: `@${site.instagramHandle}`,
      acao: "Seguir",
      href: instagramUrl(site.instagramHandle),
      icone: <InstagramIcon className="h-7 w-7" />,
      fundo: "bg-instagram",
      sombra: "hover:border-instagram hover:shadow-[5px_5px_0_0_var(--instagram)]",
      corAcao: "text-instagram",
    },
  ];
  if (site.pinterestUrl) {
    const perfil = site.pinterestUrl.match(/pinterest\.[a-z.]+\/([^/?#]+)/i)?.[1];
    redes.push({
      nome: "Pinterest",
      rotulo: "Pinterest",
      linha: perfil ? `@${perfil}` : "Nossa página",
      acao: "Ver as pastas",
      href: site.pinterestUrl,
      icone: <PinterestIcon className="h-7 w-7" />,
      fundo: "bg-pinterest",
      sombra: "hover:border-pinterest hover:shadow-[5px_5px_0_0_var(--pinterest)]",
      corAcao: "text-pinterest",
    });
  }
  if (site.googleUrl) {
    redes.push({
      nome: <GoogleNome />,
      rotulo: "Google",
      linha: "Avaliações de clientes",
      acao: "Ver avaliações",
      href: site.googleUrl,
      icone: (
        <svg viewBox="0 0 24 24" className="h-7 w-7" aria-hidden="true">
          <path fill="var(--google-azul)" d="M21.6 12.2c0-.7-.1-1.4-.2-2H12v3.8h5.4a4.6 4.6 0 0 1-2 3v2.5h3.2c1.9-1.7 3-4.3 3-7.3Z" />
          <path fill="var(--google-verde)" d="M12 22c2.7 0 5-.9 6.6-2.5l-3.2-2.5c-.9.6-2 1-3.4 1-2.6 0-4.8-1.8-5.6-4.1H3.1v2.6A10 10 0 0 0 12 22Z" />
          <path fill="var(--google-amarelo)" d="M6.4 13.9a6 6 0 0 1 0-3.8V7.5H3.1a10 10 0 0 0 0 9Z" />
          <path fill="var(--google-vermelho)" d="M12 6c1.5 0 2.8.5 3.8 1.5l2.9-2.9A10 10 0 0 0 3.1 7.5l3.3 2.6C7.2 7.8 9.4 6 12 6Z" />
        </svg>
      ),
      fundo: "bg-paper ring-1 ring-line",
      sombra: "hover:border-google-azul hover:shadow-[5px_5px_0_0_var(--google-amarelo)]",
      corAcao: "text-ink",
    });
  }
  return redes;
}

/** Grid of cards: phones one per row (icon beside the text), from md one column per network. */
export function CartoesRedes({ site, mensagemWhatsapp }: { site: SiteContent["site"]; mensagemWhatsapp: string }) {
  const redes = redesDoSite(site, mensagemWhatsapp);
  const colunas = redes.length >= 4 ? "md:grid-cols-4" : redes.length === 3 ? "md:grid-cols-3" : "md:grid-cols-2";
  return (
    <ul className={`grid gap-3 sm:grid-cols-2 md:gap-4 ${colunas}`}>
      {redes.map((r) => (
        <li key={r.rotulo}>
          <a
            href={r.href}
            target="_blank"
            rel="noreferrer"
            data-rastro={`Contato: ${r.rotulo}`}
            className={`group flex h-full items-center gap-4 border border-line bg-paper p-4 transition-all duration-200 hover:-translate-x-0.5 hover:-translate-y-0.5 md:flex-col md:items-start md:gap-5 md:p-6 ${r.sombra}`}
          >
            <span className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-white ${r.fundo}`}>{r.icone}</span>
            <span className="min-w-0 flex-1">
              <span className="block font-serif text-xl font-medium tracking-tight text-ink">{r.nome}</span>
              <span className="mt-0.5 block truncate text-sm text-ink-soft">{r.linha}</span>
              <span className={`mt-2 inline-block text-sm font-semibold underline-offset-4 group-hover:underline md:mt-4 ${r.corAcao}`}>
                {r.acao}
              </span>
            </span>
          </a>
        </li>
      ))}
    </ul>
  );
}
