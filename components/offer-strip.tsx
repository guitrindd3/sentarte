import {
  CUPOM_CODIGO,
  CUPOM_DESCONTO,
  CUPOM_MIN_ITENS,
  formatBRL,
  PARCELAS_MAX,
  PIX_DESCONTO,
  PRAZO_PRODUCAO_DIAS_UTEIS,
  PRECO_CADEIRA,
} from "@/lib/offer";

const ITENS = [
  {
    destaque: formatBRL(PRECO_CADEIRA),
    texto: `em até ${PARCELAS_MAX}x no cartão ou ${Math.round(PIX_DESCONTO * 100)}% off no Pix`,
  },
  {
    destaque: "Frete grátis",
    texto: "para todo o Brasil",
  },
  {
    destaque: `Até ${PRAZO_PRODUCAO_DIAS_UTEIS} dias úteis`,
    texto: "para ficar pronta",
  },
  {
    destaque: `${Math.round(CUPOM_DESCONTO * 100)}% de desconto`,
    texto: `levando ${CUPOM_MIN_ITENS} ou mais, cupom ${CUPOM_CODIGO}`,
  },
];

// The commercial terms in one glanceable band. Used full-size on the
// homepage and compact under the header of the catalog pages.
export function OfferStrip({ compact = false }: { compact?: boolean }) {
  return (
    <section aria-label="Condições" className={compact ? "border-b border-line bg-paper" : "border-y border-line bg-paper"}>
      <ul
        className={`mx-auto grid max-w-6xl grid-cols-2 lg:grid-cols-4 ${
          compact ? "px-6 py-4" : "px-6 py-8"
        }`}
      >
        {ITENS.map((item, i) => (
          <li
            key={item.destaque}
            className={`px-4 py-2 ${i % 2 === 1 ? "border-l border-line" : ""} ${
              i >= 2 ? "lg:border-l" : ""
            } ${i === 0 ? "pl-0" : ""} ${i === 2 ? "pl-0 lg:pl-4" : ""}`}
          >
            <p className={`font-serif font-medium tracking-tight text-ink ${compact ? "text-base" : "text-xl"}`}>
              {item.destaque}
            </p>
            <p className="mt-0.5 text-xs leading-snug text-ink-soft">{item.texto}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
