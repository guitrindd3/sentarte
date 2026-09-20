export const SITE_NAME = "Sentarte";
export const SITE_URL = "https://sentarte.vercel.app";
export const SITE_DESCRIPTION =
  "Cadeiras de praia, bolsas e espreguiçadeiras trançadas à mão, em corda náutica e alumínio, com modelo, cor e personalização escolhidos por você.";

export const WHATSAPP_NUMBER = "5527995201669";
export const INSTAGRAM_HANDLE = "ateliesentarte";
export const INSTAGRAM_URL = `https://instagram.com/${INSTAGRAM_HANDLE}`;

export function whatsappUrl(message: string) {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}

export const NAV_LINKS = [
  { label: "Cadeiras", href: "/categoria/cadeiras" },
  { label: "Bolsas", href: "/categoria/bolsas" },
  { label: "Espreguiçadeiras", href: "/categoria/espreguicadeiras" },
  { label: "Sobre", href: "/sobre" },
  { label: "Contato", href: "/contato" },
] as const;

export const FOOTER_LINKS = {
  institucional: [
    { label: "Sobre o Sentarte", href: "/sobre" },
    { label: "Contato", href: "/contato" },
    { label: "Perguntas frequentes", href: "/faq" },
  ],
  politicas: [
    { label: "Privacidade", href: "/politica-de-privacidade" },
    { label: "Termos de uso", href: "/termos-de-uso" },
    { label: "Trocas e devoluções", href: "/politica-de-troca-e-devolucao" },
    { label: "Envio", href: "/politica-de-envio" },
  ],
};
