import type { Metadata } from "next";
import { InstagramIcon, WhatsAppIcon } from "@/components/icons";
import { PageHeader } from "@/components/page-header";
import { INSTAGRAM_HANDLE, INSTAGRAM_URL, whatsappUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "Contato",
  description: "Fale com o Sentarte pelo WhatsApp ou Instagram.",
};

export default function ContatoPage() {
  return (
    <>
      <PageHeader
        titulo="Fale com a gente"
        resumo="Todo pedido — orçamento, dúvida de modelo ou prazo — passa pelo WhatsApp. É por lá que a gente confirma cor, trama e personalização antes de começar a trançar."
      />
      <section className="mx-auto max-w-3xl px-6 py-16">
        <div className="grid gap-4 sm:grid-cols-2">
          <a
            href={whatsappUrl("Oi! Vim pelo site e queria falar sobre um pedido.")}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-3 border border-line bg-paper p-5 transition-colors hover:border-marine"
          >
            <WhatsAppIcon className="h-6 w-6 text-marine" />
            <span>
              <span className="block font-serif text-lg text-ink">WhatsApp</span>
              <span className="block text-sm text-ink-soft">Resposta mais rápida</span>
            </span>
          </a>
          <a
            href={INSTAGRAM_URL}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-3 border border-line bg-paper p-5 transition-colors hover:border-marine"
          >
            <InstagramIcon className="h-6 w-6 text-marine" />
            <span>
              <span className="block font-serif text-lg text-ink">Instagram</span>
              <span className="block text-sm text-ink-soft">@{INSTAGRAM_HANDLE}</span>
            </span>
          </a>
        </div>
      </section>
    </>
  );
}
