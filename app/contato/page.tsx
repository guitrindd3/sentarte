import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";
import Link from "next/link";
import { CartoesRedes } from "@/components/redes-sociais";
import { PageHeader } from "@/components/page-header";
import { textoSimples } from "@/components/texto-rico";
import { textosDaPagina } from "@/lib/textos-paginas";
import { getContent } from "@/lib/content-store";

const ATALHOS = [
  { titulo: "Acompanhar meu pedido", texto: "Veja em que etapa está a sua cadeira e o código de rastreio.", href: "/acompanhar" },
  { titulo: "Perguntas frequentes", texto: "Prazo, frete, pagamento, medidas e cuidados.", href: "/faq" },
  { titulo: "Eventos e empresas", texto: "Cadeiras em quantidade para casamentos, festas e brindes.", href: "/eventos" },
  { titulo: "Avaliar a minha cadeira", texto: "Já recebeu a sua? Conte para a gente como ficou.", href: "/avaliacoes#avaliar" },
];

// Pre-rendered and cached (2026-10-06, the site felt slow): rebuilt every 10 min
// at most, and right away when the admin saves (revalidatePath("/", "layout")).
export const revalidate = 600;

export const metadata: Metadata = pageMetadata({
  title: "Contato",
  description:
    "Fale com o SentArte pelo WhatsApp, Instagram ou Pinterest.",
  path: "/contato",
});

export default async function ContatoPage() {
  const tp = textosDaPagina((await getContent()).paginas, "contato");
  const { site } = await getContent();

  return (
    <>
      <PageHeader
        titulo={textoSimples(tp.linha("titulo"))}
        resumo={textoSimples(tp.linha("resumo"))}
      />
      {/* Redesigned 2026-11-23 (user: "melhorar essa aba de contatos"): network
          cards in their own colours + shortcuts to what people usually come for. */}
      <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6 md:py-14">
        <CartoesRedes site={site} mensagemWhatsapp="Oi! Vim pelo site e queria falar sobre um pedido." />

        <h2 className="mt-12 font-serif text-2xl font-medium tracking-tight text-ink md:mt-16">Talvez você esteja procurando</h2>
        <ul className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {ATALHOS.map((a) => (
            <li key={a.href}>
              <Link
                href={a.href}
                className="block h-full border border-line bg-paper p-5 transition-colors hover:border-ink"
              >
                <span className="block font-serif text-lg font-medium tracking-tight text-ink">{a.titulo}</span>
                <span className="mt-1 block text-sm leading-relaxed text-ink-soft">{a.texto}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
