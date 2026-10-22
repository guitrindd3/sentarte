import { getContent } from "@/lib/content-store";
import { configBlackFridayDaVitrine } from "@/lib/cupons-store";
import { hojeBR, naBlackFriday } from "@/lib/black-friday";
import { grupoDoModelo } from "@/lib/grupos";
import { SITE_URL } from "@/lib/nav";
import { precoCadeira } from "@/lib/offer";
import { GRUPOS, produtosDaLoja } from "@/lib/produtos";

// Product feed for Google Merchant Center free listings (user 2026-10-20,
// "Google Shopping de graça"). Meta (Instagram/Facebook catalog) reads the
// same RSS 2.0 + g: format. One item per chair page, priced like the page:
// the plain chair, or the personalized price for desenhos; during Black
// Friday a sale_price with its dates, like the struck-through price on the site.
// Google fetches it on its own schedule; cached here for an hour.
export const revalidate = 3600;

// Merchant Center treats unlicensed team crests and characters as counterfeit,
// which can suspend the whole account (user 2026-10-22: only chairs without
// third-party brands). Team chairs never go in; of the desenhos only these
// generic ones do, so a character chair added later stays out by default.
// The chairs stay on the site either way.
const DESENHOS_SEM_MARCA = new Set(["borboleta", "coracao-leve", "gato", "sereia-arco-iris", "jv-trindade"]);

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
const abs = (u: string) => (/^https?:\/\//.test(u) ? u : `${SITE_URL}${u.startsWith("/") ? "" : "/"}${u}`);
const brl = (v: number) => `${v.toFixed(2)} BRL`;

export async function GET() {
  const content = await getContent();
  const bf = await configBlackFridayDaVitrine().catch(() => null);
  const hoje = hojeBR();
  const semana = bf?.ligado && bf.minCadeiras <= 1 ? naBlackFriday(hoje, bf.inicioAntecipado) : null;
  // ISO 8601 interval in Brasília time
  const periodo = semana ? `${semana.inicio}T00:00-03:00/${semana.fim}T23:59-03:00` : "";

  const itens = produtosDaLoja(content).flatMap((p) => {
    const m = p.base;
    if (!m.imagemUrl) return [];
    if (p.grupo === "times" || (p.grupo === "desenhos" && !DESENHOS_SEM_MARCA.has(p.slug))) return [];
    const desenho = grupoDoModelo(m) === "desenhos";
    const preco = precoCadeira(desenho);
    const fotos = [...(m.variantes ?? []), ...(m.fotosExtras ?? [])].filter(Boolean).slice(0, 10);
    const descricao =
      (m.descricao?.trim() || `Cadeira de praia ${m.nome}, trançada à mão em corda náutica sobre estrutura de alumínio.`) +
      (desenho ? "" : " Pode levar um nome trançado no encosto.") +
      " Feita sob encomenda pela SentArte, enviamos para todo o Brasil.";
    const tipo = p.grupo === "outros" ? "Cadeiras de praia" : `Cadeiras de praia > ${GRUPOS[p.grupo].titulo}`;
    const linhas = [
      `<g:id>${esc(p.slug)}</g:id>`,
      `<g:title>${esc(`Cadeira de praia ${m.nome} trançada à mão`)}</g:title>`,
      `<g:description>${esc(descricao)}</g:description>`,
      `<g:link>${esc(`${SITE_URL}/cadeira/${p.slug}`)}</g:link>`,
      `<g:image_link>${esc(abs(m.imagemUrl))}</g:image_link>`,
      ...fotos.map((f) => `<g:additional_image_link>${esc(abs(f))}</g:additional_image_link>`),
      "<g:availability>in_stock</g:availability>",
      "<g:condition>new</g:condition>",
      `<g:price>${brl(preco)}</g:price>`,
      ...(semana && bf
        ? [
            `<g:sale_price>${brl(Math.round(preco * (1 - bf.percentual / 100) * 100) / 100)}</g:sale_price>`,
            `<g:sale_price_effective_date>${periodo}</g:sale_price_effective_date>`,
          ]
        : []),
      "<g:brand>SentArte</g:brand>",
      "<g:identifier_exists>no</g:identifier_exists>",
      `<g:product_type>${esc(tipo)}</g:product_type>`,
      // Furniture > Outdoor Furniture > Outdoor Seating > Outdoor Chairs (Google taxonomy)
      "<g:google_product_category>6828</g:google_product_category>",
      "<g:is_bundle>no</g:is_bundle>",
    ];
    return [`<item>\n      ${linhas.join("\n      ")}\n    </item>`];
  });

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title>SentArte — cadeiras de praia</title>
    <link>${SITE_URL}</link>
    <description>Cadeiras de praia trançadas à mão</description>
    ${itens.join("\n    ")}
  </channel>
</rss>
`;
  return new Response(xml, { headers: { "Content-Type": "application/xml; charset=utf-8" } });
}
