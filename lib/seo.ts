import type { Metadata } from "next";
import { PRECO_CADEIRA, PRECO_CADEIRA_COM_NOME } from "./offer";

const SITE_NOME = "SentArte";

// Per-page metadata. openGraph is rebuilt in full here because Next merges
// metadata shallowly: a page's `openGraph` replaces the layout's whole
// object, so passing only `url` would drop siteName/locale/title.
export function pageMetadata({
  title,
  description,
  path,
  noindex,
}: {
  title: string;
  description?: string;
  path: string;
  noindex?: boolean;
}): Metadata {
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      title: `${title} | ${SITE_NOME}`,
      description,
      url: path,
      siteName: SITE_NOME,
      locale: "pt_BR",
      type: "website",
    },
    ...(noindex ? { robots: { index: false, follow: true } } : {}),
  };
}

// schema.org ItemList of chair Products (with the fixed chair price), so
// catalog pages can show up with price info in search results.
export function chairListJsonLd(
  modelos: { nome: string; descricao: string; imagemUrl?: string }[],
  { soPersonalizada = false }: { soPersonalizada?: boolean } = {}
) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: modelos.map((m, i) => ({
      "@type": "ListItem",
      position: i + 1,
      item: {
        "@type": "Product",
        name: `Cadeira de praia ${m.nome}`,
        description: m.descricao,
        ...(m.imagemUrl ? { image: m.imagemUrl } : {}),
        brand: { "@type": "Brand", name: SITE_NOME },
        offers: {
          "@type": "AggregateOffer",
          lowPrice: (soPersonalizada ? PRECO_CADEIRA_COM_NOME : PRECO_CADEIRA).toFixed(2),
          highPrice: PRECO_CADEIRA_COM_NOME.toFixed(2),
          offerCount: soPersonalizada ? 1 : 2,
          priceCurrency: "BRL",
          availability: "https://schema.org/MadeToOrder",
          shippingDetails: {
            "@type": "OfferShippingDetails",
            shippingRate: { "@type": "MonetaryAmount", value: "0", currency: "BRL" },
            shippingDestination: { "@type": "DefinedRegion", addressCountry: "BR" },
          },
        },
      },
    })),
  };
}
