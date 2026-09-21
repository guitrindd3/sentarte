import type { Metadata } from "next";
import { InstagramIcon, WhatsAppIcon } from "@/components/icons";
import { PageHeader } from "@/components/page-header";
import { getContent } from "@/lib/content-store";
import { instagramUrl, whatsappUrl } from "@/lib/urls";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Contato",
  description: "Fale com o Sentarte pelo WhatsApp ou Instagram.",
};

export default async function ContatoPage() {
  const { site } = await getContent();

  return (
    <>
      <PageHeader
        titulo="Fale com a gente"
        resumo="Todo pedido — orçamento, dúvida de modelo ou prazo — passa pelo WhatsApp. É por lá que a gente confirma cor, trama e personalização antes de começar a trançar."
      />
      <section className="mx-auto max-w-3xl px-6 py-16">
        <div className="grid gap-4 sm:grid-cols-2">
          <a
            href={whatsappUrl(site.whatsappNumero, "Oi! Vim pelo site e queria falar sobre um pedido.")}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-3 border border-line bg-paper p-5 transition-colors hover:border-wood"
          >
            <WhatsAppIcon className="h-6 w-6 text-wood" />
            <span>
              <span className="block font-serif text-lg text-ink">WhatsApp</span>
              <span className="block text-sm text-ink-soft">Resposta mais rápida</span>
            </span>
          </a>
          <a
            href={instagramUrl(site.instagramHandle)}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-3 border border-line bg-paper p-5 transition-colors hover:border-wood"
          >
            <InstagramIcon className="h-6 w-6 text-wood" />
            <span>
              <span className="block font-serif text-lg text-ink">Instagram</span>
              <span className="block text-sm text-ink-soft">@{site.instagramHandle}</span>
            </span>
          </a>
        </div>
      </section>
    </>
  );
}
