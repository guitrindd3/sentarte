import type { Metadata } from "next";
import { Archivo, Bodoni_Moda } from "next/font/google";
import { CartDrawer } from "@/components/cart-drawer";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { Analytics } from "@vercel/analytics/next";
import { JsonLd } from "@/components/json-ld";
import { WhatsAppFloat } from "@/components/whatsapp-float";
import { CartProvider } from "@/lib/cart-context";
import { getContent } from "@/lib/content-store";
import { SITE_URL } from "@/lib/nav";
import { formatBRL, PRECO_CADEIRA, PRECO_CADEIRA_COM_NOME } from "@/lib/offer";
import { instagramUrl } from "@/lib/urls";
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
  const { site } = await getContent();

  return (
    <html lang="pt-BR" className={`${display.variable} ${body.variable} h-full`}>
      <body className="flex min-h-full flex-col font-sans antialiased">
        <CartProvider>
          <SiteHeader siteName={site.nome} whatsappNumero={site.whatsappNumero} />
          <main className="flex-1">{children}</main>
          <SiteFooter />
          <CartDrawer whatsappNumero={site.whatsappNumero} />
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
        <Analytics />
      </body>
    </html>
  );
}
