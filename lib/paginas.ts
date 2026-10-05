/** Friendly names for site paths, for the admin's statistics and visit journeys. */
const PAGINAS: Record<string, string> = {
  "/": "Página inicial",
  "/times": "Cadeiras de time",
  "/boho": "Cadeiras boho",
  "/desenhos": "Animes e desenhos",
  "/personalizar": "Monte a sua trama",
  "/c": "Cadeira montada (link do WhatsApp)",
  "/busca": "Busca",
  "/faq": "Perguntas frequentes",
  "/sobre": "Sobre",
  "/contato": "Contato",
  "/pedido": "Pedido pago (volta do Mercado Pago)",
  "/politica-de-envio": "Política de envio",
  "/politica-de-troca-e-devolucao": "Trocas e devoluções",
  "/politica-de-privacidade": "Privacidade",
  "/termos-de-uso": "Termos de uso",
};

export function nomeDaPagina(p: string, categorias: { slug: string; titulo: string }[] = []) {
  if (PAGINAS[p]) return PAGINAS[p];
  const cat = p.startsWith("/categoria/") ? categorias.find((c) => `/categoria/${c.slug}` === p) : undefined;
  return cat?.titulo ?? p;
}
