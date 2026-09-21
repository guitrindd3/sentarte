export const SITE_URL = "https://sentarte.vercel.app";

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
