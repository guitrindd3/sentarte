import type { Metadata } from "next";
import { Configurator } from "@/components/home/configurator";
import { PageHeader } from "@/components/page-header";
import { getContent } from "@/lib/content-store";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Monte a sua trama",
  description: "Escolha o modelo, a forma do trançado e as cores para ver uma prévia da sua cadeira.",
};

export default async function PersonalizarPage() {
  const content = await getContent();

  return (
    <>
      <PageHeader
        titulo="Monte a sua trama"
        resumo="Escolha o modelo, a forma do trançado e as cores para ver uma prévia. Quer um nome ou uma frase trançada junto? É só escrever. Quando estiver do seu jeito, manda pra gente pelo WhatsApp."
      />
      <section className="mx-auto max-w-6xl px-6 py-14">
        <Configurator categorias={content.categorias} whatsappNumero={content.site.whatsappNumero} />
      </section>
    </>
  );
}
