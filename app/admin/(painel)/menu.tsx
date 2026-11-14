import type { ReactNode } from "react";

// Admin menu entries + their icons, shared by the sidebar / bottom bar
// (nav.tsx, client) and the phone "Mais" page (server). Plain module on
// purpose: data exported from a "use client" file reaches server pages as a
// client reference, not as the values.

export type ItemMenu = { href: string; rotulo: string; texto: string; icone: ReactNode };

export const ICONES = {
  inicio: <path d="M4 11.5 12 5l8 6.5V19a1 1 0 0 1-1 1h-4.5v-5h-5v5H5a1 1 0 0 1-1-1z" />,
  acessos: <path d="M4 20h16M7 16v-4M11 16V8M15 16v-6M19 16V5" />,
  clientes: (
    <>
      <circle cx="9" cy="8.5" r="3" />
      <path d="M3.5 19c.6-3 2.8-4.8 5.5-4.8s4.9 1.8 5.5 4.8M15.5 6a3 3 0 0 1 0 5.6M17 14.6c1.8.6 3 2.1 3.5 4.4" />
    </>
  ),
  orcamentos: <path d="M7 3.5h10a1 1 0 0 1 1 1v15a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1v-15a1 1 0 0 1 1-1zM9 8h6M9 11.5h6M9 15h3.5" />,
  avisos: <path d="M6 16.5V11a6 6 0 1 1 12 0v5.5l1.5 2h-15zM10 20.5a2 2 0 0 0 4 0" />,
  vagas: <path d="M5 6.5h14v13H5zM5 10.5h14M9 4v4M15 4v4M8.5 14l2 2 4-4" />,
  cupons: <path d="M4 7.5A1.5 1.5 0 0 1 5.5 6h13A1.5 1.5 0 0 1 20 7.5V10a2 2 0 0 0 0 4v2.5a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 16.5V14a2 2 0 0 0 0-4zM9.5 14.5l5-5M9.75 9.75h.01M14.25 14.25h.01" />,
  campanhas: <path d="M4 6.5h16v11H4zM4 7l8 6 8-6" />,
  colecoes: <path d="M5 4.5h14v15H5zM9 4.5v15M12.5 9h3.5M12.5 12.5h3.5M12.5 16h2" />,
  passaportes: <path d="M6 3.5h12a1 1 0 0 1 1 1v15a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1v-15a1 1 0 0 1 1-1zM8.5 8h2.5v2.5H8.5zM13 8h2.5v2.5H13zM8.5 12.5h2.5V15H8.5zM13.5 13h2M13.5 16h2M8.5 17.5h3" />,
  cartoes: <path d="M4 6.5h16a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-9a1 1 0 0 1 1-1zM8.5 12a1.5 1.5 0 1 0 0-.01M12 10.5h5M12 13.5h3.5" />,
  cadeiras: (
    <>
      <path d="M7 4h10l-1 8H8z" />
      <path d="M6 12h12M8 12l-2 8M16 12l2 8M9.5 4v8M12 4v8M14.5 4v8" />
    </>
  ),
  montar: <path d="M5 19.5 15.5 9M14 5.5l4.5 4.5M12.5 4 20 11.5M4.5 14.5l5 5" />,
  depoimentos: <path d="M5 5h14a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1h-8l-4 3.5V16H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1zM8 9.5h8M8 12.5h5" />,
  site: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 3.5v2M12 18.5v2M3.5 12h2M18.5 12h2M6 6l1.4 1.4M16.6 16.6 18 18M6 18l1.4-1.4M16.6 7.4 18 6" />
    </>
  ),
  paginas: <path d="M7 3.5h7l4 4V20a.5.5 0 0 1-.5.5h-10A.5.5 0 0 1 7 20zM14 3.5V8h4M10 12h5M10 15.5h5" />,
  seguranca: <path d="M12 3.5 5 6v5.5c0 4.3 3 7.7 7 9 4-1.3 7-4.7 7-9V6zM9 12l2 2 4-4" />,
  mais: <path d="M5 12h.01M12 12h.01M19 12h.01" strokeWidth="3" />,
  venda: <path d="M12 5v14M5 12h14" />,
  abrir: <path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" />,
  sair: <path d="M14 4h4a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1h-4M10 16l-4-4 4-4M6 12h10" />,
} satisfies Record<string, ReactNode>;

const item = (href: string, rotulo: string, icone: ReactNode, texto: string): ItemMenu => ({ href, rotulo, texto, icone });

export const INICIO = item("/admin", "Início", ICONES.inicio, "Resumo do dia.");
export const ACESSOS = item("/admin/acessos", "Acessos", ICONES.acessos, "Visitas, buscas e cliques do site.");
export const CLIENTES = item("/admin/clientes", "Clientes", ICONES.clientes, "Pedidos, vendas e lista de novidades.");
export const CADEIRAS = item("/admin/catalogo", "Cadeiras", ICONES.cadeiras, "Fotos, nomes e preços das cadeiras.");

/** "Mais" page on phones, in groups. Same entries as the desktop sidebar. */
export const GRUPOS_MAIS: { titulo: string; itens: ItemMenu[] }[] = [
  {
    titulo: "Vendas",
    itens: [
      item("/admin/orcamentos", "Orçamentos", ICONES.orcamentos, "Pedidos da página Eventos."),
      item("/admin/vendas/nova", "Lançar venda", ICONES.venda, "Venda fechada no WhatsApp."),
      item("/admin/cupons", "Cupons", ICONES.cupons, "Códigos de desconto."),
      item("/admin/campanhas", "Campanhas", ICONES.campanhas, "E-mails e cupom de saída."),
      item("/admin/colecoes", "Coleções", ICONES.colecoes, "Edições numeradas."),
    ],
  },
  {
    titulo: "Produção e envio",
    itens: [
      item("/admin/vagas", "Vagas da semana", ICONES.vagas, "Cadeiras por semana."),
      item("/admin/avisos", "Avisos e envio", ICONES.avisos, "Aviso de venda e remetente."),
      item("/admin/passaportes", "Passaportes", ICONES.passaportes, "História de cada cadeira."),
      item("/admin/cartoes", "Cartões", ICONES.cartoes, "Cartões e etiquetas para imprimir."),
    ],
  },
  {
    titulo: "Site",
    itens: [
      item("/admin/montar", "Montar e publicar", ICONES.montar, "Crie uma trama e publique."),
      item("/admin/paginas", "Páginas", ICONES.paginas, "Sobre, FAQ, políticas."),
      item("/admin/depoimentos", "Depoimentos", ICONES.depoimentos, "Avaliações de clientes."),
      item("/admin/site", "Textos e contato", ICONES.site, "WhatsApp, Instagram, Google."),
      item("/admin/seguranca", "Segurança", ICONES.seguranca, "Código no celular e entradas."),
    ],
  },
];

/** Top of the desktop sidebar and of the phone bottom bar; the rest goes in GRUPOS_MAIS. */
export const PRINCIPAIS: ItemMenu[] = [INICIO, CLIENTES, CADEIRAS, ACESSOS];

export const MAIS: ItemMenu = item("/admin/mais", "Mais", ICONES.mais, "");

/** Pages reached from "Mais" on phones (the Mais tab lights up on them). */
export const DENTRO_DE_MAIS = ["/admin/mais", "/admin/vendas", ...GRUPOS_MAIS.flatMap((g) => g.itens.map((i) => i.href))];

export function Icone({ children, className = "h-5 w-5" }: { children: ReactNode; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className={`shrink-0 ${className}`} aria-hidden>
      {children}
    </svg>
  );
}
