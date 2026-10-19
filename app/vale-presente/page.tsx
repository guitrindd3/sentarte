import type { Metadata } from "next";
import { ComprarVale } from "@/components/comprar-vale";
import { PageHeader } from "@/components/page-header";
import { getContent } from "@/lib/content-store";
import { PRAZO_PRODUCAO_DIAS_UTEIS } from "@/lib/offer";
import { pageMetadata } from "@/lib/seo";
import { whatsappUrl } from "@/lib/urls";
import { VALIDADE_VALE_DIAS } from "@/lib/vale";

export const revalidate = 600;

export const metadata: Metadata = pageMetadata({
  title: "Vale-presente",
  description:
    "Dê uma cadeira de praia personalizada de presente: compre um vale-presente da SentArte e a pessoa escolhe o modelo, as cores e o nome.",
  path: "/vale-presente",
});

export default async function ValePresentePage() {
  const { site } = await getContent();
  const meses = Math.round(VALIDADE_VALE_DIAS / 30);
  const passos = [
    ["Você compra o vale", "Escolha o valor e pague no Pix ou no cartão. Não tem frete."],
    ["Recebe o código na hora", "Assim que o pagamento é aprovado, o código aparece na tela e na página Acompanhar pedido."],
    ["Dá de presente", "Mande o código para a pessoa no WhatsApp, num cartão ou embrulhado como quiser."],
    ["Ela escolhe a cadeira", `No carrinho, em "Tem cupom de desconto?", ela digita o código e o valor sai do total.`],
  ];
  return (
    <>
      <PageHeader
        voltarPara="/"
        titulo="Vale-presente"
        resumo="Não sabe qual cadeira escolher para alguém? Dê um vale: a pessoa escolhe o modelo, as cores e o nome trançado."
      />
      <section className="mx-auto grid max-w-6xl gap-10 px-6 py-14 md:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
        <ComprarVale />
        <div>
          <h2 className="font-serif text-2xl font-medium tracking-tight text-ink">Como funciona</h2>
          <ol className="mt-5 space-y-4">
            {passos.map(([t, x], i) => (
              <li key={t} className="flex gap-4">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-ink font-serif text-ink">{i + 1}</span>
                <span>
                  <span className="block font-medium text-ink">{t}</span>
                  <span className="block text-sm leading-relaxed text-ink-soft">{x}</span>
                </span>
              </li>
            ))}
          </ol>
          <ul className="mt-8 space-y-2 border-t border-line pt-6 text-sm text-ink-soft">
            <li>Vale por {meses} meses a partir da compra.</li>
            <li>Serve para qualquer cadeira do site e soma com o desconto automático do carrinho.</li>
            <li>É usado de uma vez: se a compra der menos que o vale, a diferença não fica guardada.</li>
            <li>A cadeira fica pronta em até {PRAZO_PRODUCAO_DIAS_UTEIS} dias úteis depois que a pessoa fizer o pedido.</li>
          </ul>
          <p className="mt-6 text-sm text-ink-soft">
            Prefere combinar de outro jeito?{" "}
            <a
              href={whatsappUrl(site.whatsappNumero, "Oi! Quero comprar um vale-presente da SentArte.")}
              target="_blank"
              rel="noreferrer"
              className="font-medium text-ink underline underline-offset-2"
            >
              Fale com a gente no WhatsApp
            </a>
            .
          </p>
        </div>
      </section>
    </>
  );
}
