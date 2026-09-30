import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";
import { PageHeader } from "@/components/page-header";

export const dynamic = "force-dynamic";

export const metadata: Metadata = pageMetadata({
  title: "Termos de uso",
  description:
    "Termos de uso do site do SentArte.",
  path: "/termos-de-uso",
});

export default function TermosDeUsoPage() {
  return (
    <>
      <PageHeader titulo="Termos de uso" />
      <section className="mx-auto max-w-6xl space-y-6 px-6 py-16 [&>*]:max-w-3xl text-sm leading-relaxed text-ink-soft">
        <p>
          Este site apresenta os modelos, materiais e o processo de personalização do SentArte.
          Ele funciona como catálogo — a compra é sempre combinada diretamente pelo WhatsApp ou
          Instagram, onde cor, trama e prazo são confirmados com você antes da produção.
        </p>
        <div>
          <h2 className="font-serif text-lg text-ink">Sobre os modelos exibidos</h2>
          <p className="mt-2">
            As tramas e combinações de cor mostradas no site são ilustrativas do processo de
            personalização. Cada peça é feita sob encomenda, e pequenas variações de tom entre o
            que é exibido e o produto final podem ocorrer, por se tratar de um processo
            artesanal.
          </p>
        </div>
        <div>
          <h2 className="font-serif text-lg text-ink">Uso do conteúdo</h2>
          <p className="mt-2">
            Textos, imagens e o material trançado apresentado neste site pertencem ao SentArte e
            não podem ser reproduzidos comercialmente sem autorização.
          </p>
        </div>
        <div>
          <h2 className="font-serif text-lg text-ink">Alterações</h2>
          <p className="mt-2">
            Estes termos podem ser atualizados sem aviso prévio. A versão vigente é sempre a
            publicada nesta página.
          </p>
        </div>
      </section>
    </>
  );
}
