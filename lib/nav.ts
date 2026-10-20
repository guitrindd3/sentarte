export const SITE_URL = "https://sentarte.com.br";

export const NAV_LINKS = [
  { label: "Cadeiras", href: "/categoria/cadeiras" },
  { label: "Times", href: "/times" },
  { label: "Boho", href: "/boho" },
  { label: "Desenhos", href: "/desenhos" },
  { label: "Monte a sua", href: "/personalizar" },
  { label: "Vale-presente", href: "/vale-presente" },
  { label: "Sobre", href: "/sobre" },
] as const;

export const FOOTER_LINKS = {
  institucional: [
    { label: "Sobre o SentArte", href: "/sobre" },
    { label: "Contato", href: "/contato" },
    { label: "Perguntas frequentes", href: "/faq" },
    { label: "Acompanhar pedido", href: "/acompanhar" },
    { label: "Vale-presente", href: "/vale-presente" },
  ],
  politicas: [
    { label: "Privacidade", href: "/politica-de-privacidade" },
    { label: "Termos de uso", href: "/termos-de-uso" },
    { label: "Garantia e cuidados", href: "/garantia-e-cuidados" },
    { label: "Trocas e devoluções", href: "/politica-de-troca-e-devolucao" },
    { label: "Envio", href: "/politica-de-envio" },
  ],
};
