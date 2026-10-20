import type { Metadata } from "next";
import { Archivo, Bodoni_Moda } from "next/font/google";
import { CartDrawer } from "@/components/cart-drawer";
import { FaixaNatal } from "@/components/faixa-natal";
import { DATAS_DO_ANO, faixasDoCalendario } from "@/lib/faixas-calendario";
import { configBlackFridayDaVitrine } from "@/lib/cupons-store";
import { ForaDoAdmin } from "@/components/fora-do-admin";
import { TextoRico } from "@/components/texto-rico";
import { textosDaPagina } from "@/lib/textos-paginas";
import { Rastreador } from "@/components/rastreador";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { JsonLd } from "@/components/json-ld";
import { WhatsAppFloat } from "@/components/whatsapp-float";
import { CartProvider } from "@/lib/cart-context";
import { getContent } from "@/lib/content-store";
import { SITE_URL } from "@/lib/nav";
import { formatBRL, PRECO_CADEIRA, PRECO_CADEIRA_COM_NOME } from "@/lib/offer";
import { instagramUrl } from "@/lib/urls";
import { produtosDaLoja } from "@/lib/produtos";
import "./globals.css";

const display = Bodoni_Moda({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  style: ["normal", "italic"],
});

const body = Archivo({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});


export async function generateMetadata(): Promise<Metadata> {
  const { site } = await getContent();
  const title = `Cadeira de praia personalizada, trançada à mão | ${site.nome}`;

  return {
    metadataBase: new URL(SITE_URL),
    title: {
      default: title,
      template: `%s · ${site.nome}`,
    },
    description: site.descricao,
    // No site-wide canonical/og:url here: set in a layout, they were
    // inherited by every page and told Google each one was the homepage.
    // Each page sets its own `alternates.canonical` instead.
    openGraph: {
      description: site.descricao,
      siteName: site.nome,
      locale: "pt_BR",
      type: "website",
    },
    verification: process.env.GOOGLE_SITE_VERIFICATION
      ? { google: process.env.GOOGLE_SITE_VERIFICATION }
      : undefined,
    twitter: {
      card: "summary_large_image",
      title,
      description: site.descricao,
    },
  };
}

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const content = await getContent();
  const { site, paginas } = content;
  const sugestoes = produtosDaLoja(content).map((p) => ({
    slug: p.slug,
    nome: p.base.nome,
    modeloId: p.base.id,
    imagemUrl: p.base.imagemUrl,
    corA: p.base.corA,
    corB: p.base.corB,
    grupo: p.grupo,
    desenho: p.grupo === "desenhos",
  }));
  // Top strip calendar (lib/faixas-calendario.ts): dates worked out every year, texts from Páginas.
  const faixasTopo = textosDaPagina(paginas, "natal");
  const hojeBR = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(new Date());
  const anoBR = Number(hojeBR.slice(0, 4));
  const faixas = faixasDoCalendario(
    [anoBR - 1, anoBR, anoBR + 1],
    Object.fromEntries(DATAS_DO_ANO.map((d) => [d.id, faixasTopo.linha(d.id === "natal" ? "texto" : `texto_${d.id}`)])),
    faixasTopo.linha("textoVale"),
    Math.min(60, Math.max(1, Number(faixasTopo.linha("antecedencia")) || 21))
  ).filter((f) => f.ate >= hojeBR);
  // Black Friday week (lib/black-friday.ts): settings from the admin's Cupons page, text from Páginas.
  const bf = await configBlackFridayDaVitrine();
  const textoBf = bf.ligado
    ? faixasTopo
        .linha("textoBlackFriday")
        .trim()
        .replace(/\{desconto\}/g, `${bf.percentual.toLocaleString("pt-BR")}%`)
        .replace(/\{condicao\}/g, bf.minCadeiras > 1 ? ` levando ${bf.minCadeiras} ou mais` : "")
    : "";

  return (
    <html lang="pt-BR" className={`${display.variable} ${body.variable} h-full`}>
      <body className="flex min-h-full flex-col font-sans antialiased">
        <CartProvider>
          <ForaDoAdmin>
            {faixas.length || textoBf ? (
              <FaixaNatal
                hojeServidor={hojeBR}
                blackFriday={textoBf ? { conteudo: <TextoRico texto={textoBf} whatsappNumero={site.whatsappNumero} inline />, inicioAntecipado: bf.inicioAntecipado } : null}
                faixas={faixas.map((f) => ({
                  inicio: f.inicio,
                  ate: f.ate,
                  conteudo: <TextoRico texto={f.texto} whatsappNumero={site.whatsappNumero} inline />,
                }))}
              />
            ) : null}
            <SiteHeader siteName={site.nome} whatsappNumero={site.whatsappNumero} />
          </ForaDoAdmin>
          <main className="flex-1">{children}</main>
          <ForaDoAdmin>
            <SiteFooter />
          </ForaDoAdmin>
          <CartDrawer
            whatsappNumero={site.whatsappNumero}
            pagamentoAtivo={Boolean(process.env.MERCADOPAGO_ACCESS_TOKEN)}
            sugestoes={sugestoes}
            categoriaTitulo={content.categorias.find((c) => c.slug === "cadeiras")?.titulo}
          />
          <WhatsAppFloat whatsappNumero={site.whatsappNumero} />
        </CartProvider>
        <JsonLd
          data={{
            "@context": "https://schema.org",
            "@type": "Store",
            name: site.nome,
            url: SITE_URL,
            logo: `${SITE_URL}/brand/logo.png`,
            image: `${SITE_URL}/opengraph-image`,
            description: site.descricao,
            telephone: `+${site.whatsappNumero}`,
            priceRange: `${formatBRL(PRECO_CADEIRA)} a ${formatBRL(PRECO_CADEIRA_COM_NOME)}`,
            areaServed: "BR",
            sameAs: [instagramUrl(site.instagramHandle)],
          }}
        />
        {/* Tells Google the site's name, so results say "SentArte" instead of "Vercel". */}
        <JsonLd
          data={{
            "@context": "https://schema.org",
            "@type": "WebSite",
            name: site.nome,
            alternateName: ["Ateliê SentArte", "Sentarte"],
            url: `${SITE_URL}/`,
          }}
        />
        <Rastreador />
      </body>
    </html>
  );
}
