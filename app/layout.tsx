import type { Metadata } from "next";
import { Archivo, Bodoni_Moda } from "next/font/google";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { getContent } from "@/lib/content-store";
import { SITE_URL } from "@/lib/nav";
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
  const title = `${site.nome} — cadeiras de praia trançadas à mão`;

  return {
    metadataBase: new URL(SITE_URL),
    title: {
      default: title,
      template: `%s · ${site.nome}`,
    },
    description: site.descricao,
    alternates: { canonical: "/" },
    openGraph: {
      title,
      description: site.descricao,
      siteName: site.nome,
      locale: "pt_BR",
      type: "website",
      url: SITE_URL,
    },
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
        <SiteHeader siteName={site.nome} whatsappNumero={site.whatsappNumero} />
        <main className="flex-1">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
