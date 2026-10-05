import { Carousel } from "@/components/home/carousel";
import { CategoryBento } from "@/components/home/category-bento";
import { ContactCta } from "@/components/home/contact-cta";
import { Depoimentos } from "@/components/home/depoimentos";
import { MedidasCadeiras } from "@/components/medidas-cadeiras";
import { MaterialSpec } from "@/components/home/material-spec";
import { PersonalizationSteps } from "@/components/home/personalization-steps";
import { PullQuote } from "@/components/home/pull-quote";
import { TeamShowcase } from "@/components/home/team-showcase";
import type { Metadata } from "next";
import { OfferStrip } from "@/components/offer-strip";
import { textoSimples } from "@/components/texto-rico";
import { getContent } from "@/lib/content-store";
import { textosDaPagina } from "@/lib/textos-paginas";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

export default async function Home() {
  const content = await getContent();
  const t = textosDaPagina(content.paginas, "inicio");
  const zap = content.site.whatsappNumero;

  return (
    <>
      <Carousel hero={content.hero} whatsappNumero={zap} fotos={t.fotos("carrossel")} />
      <OfferStrip />
      <CategoryBento categorias={content.categorias} titulo={t.linha("escolhaTitulo")} />
      <TeamShowcase categorias={content.categorias} whatsappNumero={zap} titulo={t.linha("nossasTitulo")} texto={textoSimples(t.linha("nossasTexto"))} />
      <PersonalizationSteps titulo={t.linha("passosTitulo")} passos={t.blocos("passos").map((b) => ({ titulo: b.titulo, texto: textoSimples(b.texto) }))} />
      <PullQuote frase={textoSimples(t.linha("frase"))} assinatura={textoSimples(t.linha("fraseAssinatura"))} />
      <MaterialSpec foto={t.linha("materialFoto")} titulo={t.linha("materialTitulo")} texto={textoSimples(t.linha("materialTexto"))} itens={t.blocos("materialItens").map((b) => ({ titulo: b.titulo, texto: textoSimples(b.texto) }))} />
      <MedidasCadeiras whatsappNumero={content.site.whatsappNumero} />
      <Depoimentos depoimentos={content.depoimentos} titulo={t.linha("depoimentosTitulo")} googleUrl={content.site.googleUrl} />
      <ContactCta whatsappNumero={zap} instagramHandle={content.site.instagramHandle} titulo={t.linha("contatoTitulo")} texto={textoSimples(t.linha("contatoTexto"))} />
    </>
  );
}
