import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";
import { PageHeader } from "@/components/page-header";
import { getContent } from "@/lib/content-store";
import { Depoimentos } from "@/components/home/depoimentos";
import { FotosClientes } from "@/components/fotos-clientes";

// "Avaliações" tab (2026-11-16, user: "não ter que descer no site todo para
// achar"): every approved review, the customer photos and the review form at
// the top, one click from the header menu. Same data as the homepage section.
export const revalidate = 600;

export const metadata: Metadata = pageMetadata({
  title: "Avaliações de clientes",
  description: "O que dizem as clientes que já receberam a sua cadeira SentArte, com fotos. Já tem a sua? Deixe a sua avaliação.",
  path: "/avaliacoes",
});

export default async function AvaliacoesPage() {
  const content = await getContent();
  return (
    <>
      <PageHeader
        titulo="Avaliações"
        resumo="O que dizem as clientes que já receberam a sua cadeira. Já tem a sua? Conte como ficou: sua avaliação aparece aqui depois que o ateliê conferir."
      />
      <Depoimentos depoimentos={content.depoimentos} titulo="Quem já tem a sua" googleUrl={content.site.googleUrl} formPrimeiro />
      <FotosClientes depoimentos={content.depoimentos} />
      <div className="pb-16 md:pb-24" />
    </>
  );
}
