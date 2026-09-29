import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";
import { Configurator } from "@/components/home/configurator";
import { PageHeader } from "@/components/page-header";
import { getContent } from "@/lib/content-store";

export const dynamic = "force-dynamic";

export const metadata: Metadata = pageMetadata({
  title: "Monte a sua cadeira de praia",
  description:
    "Escolha as cores e o trançado, escreva um nome e veja a prévia da sua cadeira de praia personalizada antes de pedir.",
  path: "/personalizar",
});

// The configurator's preview is a chair illustration — bags and lounge
// chairs don't fit it, so only the chair category is offered as a "Modelo".
const CATEGORIAS_EXCLUIDAS = ["bolsas", "espreguicadeiras"];

export default async function PersonalizarPage() {
  const content = await getContent();
  const categorias = content.categorias.filter((c) => !CATEGORIAS_EXCLUIDAS.includes(c.slug));

  return (
    <>
      <PageHeader
        titulo="Monte a sua trama"
        resumo="Escolha o modelo, a forma do trançado e as cores para ver uma prévia. Quer um nome ou uma frase trançada junto? É só escrever. Quando estiver do seu jeito, manda pra gente pelo WhatsApp."
      />
      <section className="mx-auto max-w-6xl px-6 py-14">
        <Configurator categorias={categorias} whatsappNumero={content.site.whatsappNumero} />
      </section>
    </>
  );
}
