import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";
import { InstagramIcon, StarIcon, WhatsAppIcon } from "@/components/icons";
import { PageHeader } from "@/components/page-header";
import { textoSimples } from "@/components/texto-rico";
import { textosDaPagina } from "@/lib/textos-paginas";
import { getContent } from "@/lib/content-store";
import { instagramUrl, whatsappUrl } from "@/lib/urls";

export const dynamic = "force-dynamic";

export const metadata: Metadata = pageMetadata({
  title: "Contato",
  description:
    "Fale com o SentArte pelo WhatsApp ou Instagram.",
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
      <section className="mx-auto max-w-6xl px-6 py-16 [&>*]:max-w-3xl">
        <div className="grid gap-4 sm:grid-cols-2">
          <a
            href={whatsappUrl(site.whatsappNumero, "Oi! Vim pelo site e queria falar sobre um pedido.")}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-3 border border-line bg-paper p-5 transition-colors hover:border-ink"
          >
            <WhatsAppIcon className="h-6 w-6 text-ink" />
            <span>
              <span className="block font-serif text-lg text-ink">WhatsApp</span>
              <span className="block text-sm text-ink-soft">Resposta mais rápida</span>
            </span>
          </a>
          <a
            href={instagramUrl(site.instagramHandle)}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-3 border border-line bg-paper p-5 transition-colors hover:border-ink"
          >
            <InstagramIcon className="h-6 w-6 text-ink" />
            <span>
              <span className="block font-serif text-lg text-ink">Instagram</span>
              <span className="block text-sm text-ink-soft">@{site.instagramHandle}</span>
            </span>
          </a>
          {site.googleUrl ? (
            <a
              href={site.googleUrl}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-3 border border-line bg-paper p-5 transition-colors hover:border-ink sm:col-span-2"
            >
              <StarIcon className="h-6 w-6 text-ink" />
              <span>
                <span className="block font-serif text-lg text-ink">Avaliações no Google</span>
                <span className="block text-sm text-ink-soft">Já comprou? Conte como ficou a sua cadeira</span>
              </span>
            </a>
          ) : null}
        </div>
      </section>
    </>
  );
}
