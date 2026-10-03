import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";
import { FramedWeave } from "@/components/framed-weave";
import { PageHeader } from "@/components/page-header";

export const dynamic = "force-dynamic";

export const metadata: Metadata = pageMetadata({
  title: "Sobre",
  description:
    "Conheça a história e o processo por trás do SentArte.",
  path: "/sobre",
});

export default function SobrePage() {
  return (
    <>
      <PageHeader
        titulo="Sobre o SentArte"
        resumo="Um ateliê pequeno, um processo que não muda de peça para peça: corda náutica, alumínio e muitas horas de trançado à mão."
      />
      <section className="mx-auto grid max-w-6xl gap-12 px-6 py-16 md:grid-cols-2 md:items-center">
        <div className="space-y-5 text-sm leading-relaxed text-ink-soft">
          <p>
            O SentArte nasceu da vontade de fazer cadeiras de praia que aguentassem mais do que
            um verão — e que, de quebra, contassem alguma coisa sobre quem senta nelas. Por isso
            cada cadeira sai personalizada: na cor, na trama ou numa frase trançada no encosto.
          </p>
          <p>
            O processo não mudou desde a primeira peça: estrutura em alumínio, corda náutica de
            polipropileno e um trançado feito à mão, fio a fio, sem pressa. É esse cuidado que
            garante que a cadeira aguente sol, areia e maresia por temporadas seguidas.
          </p>
          <p>
            Cada cadeira é feita sob encomenda, com um resumo do pedido confirmado com você antes
            de começar. Fica pronta em até 5 dias úteis e segue para qualquer lugar do
            Brasil.
          </p>
        </div>
        <FramedWeave imagemUrl="/photos/sand-texture.jpg" alt="Areia de praia com ondulações formadas pelo vento" />
      </section>
    </>
  );
}
