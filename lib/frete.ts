// Shipping quote. Shared types/helpers only — the actual quote runs on the
// server (lib/frete-servidor.ts) because it needs the Melhor Envio token.

export type Frete = {
  /** BRL; 0 means free. */
  valor: number;
  /** Carrier's delivery days, counted after the chair is ready. */
  prazoDias?: number;
  servico?: string;
};

/** What /api/frete answers: a quote, or "can't quote this CEP online". */
export type RespostaFrete = { frete: Frete } | { indisponivel: true; motivo?: string };

export const soDigitosCep = (cep: string) => cep.replace(/\D/g, "").slice(0, 8);
