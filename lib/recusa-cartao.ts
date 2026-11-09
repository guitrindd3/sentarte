// Why Mercado Pago refused a card (its `status_detail`), in two voices
// (2026-11-09): what the buyer reads on the checkout, and what the atelier
// reads in the admin, with what to offer when calling the customer.

/** Shown to the buyer right after the refusal. */
export const MOTIVOS_CLIENTE: Record<string, string> = {
  cc_rejected_insufficient_amount: "O cartão não tem limite para esse valor.",
  cc_rejected_bad_filled_security_code: "O código de segurança (CVV) está errado.",
  cc_rejected_bad_filled_date: "A data de validade está errada.",
  cc_rejected_bad_filled_card_number: "O número do cartão está errado.",
  cc_rejected_bad_filled_other: "Algum dado do cartão está errado. Confira e tente de novo.",
  cc_rejected_call_for_authorize: "O banco pediu para você autorizar esse pagamento. Ligue para o banco ou use outro cartão.",
  cc_rejected_card_disabled: "O cartão está bloqueado. Ligue para o banco ou use outro cartão.",
  cc_rejected_duplicated_payment: "Esse pagamento já foi feito agora há pouco. Confira o seu extrato.",
  cc_rejected_high_risk: "O pagamento foi recusado por segurança. Tente outro cartão ou pague no Pix.",
  cc_rejected_max_attempts: "Muitas tentativas com esse cartão. Use outro cartão ou o Pix.",
  cc_rejected_blacklist: "Esse cartão não pode ser usado. Tente outro cartão ou o Pix.",
};

export const MOTIVO_CLIENTE_PADRAO = "O pagamento foi recusado pelo banco. Tente outro cartão ou pague no Pix.";

/** For the atelier: what happened and what to offer. */
export function motivoParaOAtelie(detalhe?: string): { motivo: string; dica: string } {
  switch (detalhe) {
    case "cc_rejected_insufficient_amount":
      return { motivo: "Sem limite no cartão", dica: "Ofereça mais parcelas, outro cartão ou o Pix." };
    case "cc_rejected_bad_filled_security_code":
    case "cc_rejected_bad_filled_date":
    case "cc_rejected_bad_filled_card_number":
    case "cc_rejected_bad_filled_other":
      return { motivo: "Errou um dado do cartão (número, validade ou CVV)", dica: "Peça para tentar de novo com calma, ou mande o link do Pix." };
    case "cc_rejected_call_for_authorize":
      return { motivo: "O banco pediu autorização", dica: "Peça para liberar a compra no app do banco e tentar de novo." };
    case "cc_rejected_card_disabled":
      return { motivo: "Cartão bloqueado ou não ativado", dica: "Ofereça outro cartão ou o Pix." };
    case "cc_rejected_duplicated_payment":
      return { motivo: "Pagamento repetido", dica: "Veja no Mercado Pago se uma das tentativas passou." };
    case "cc_rejected_high_risk":
      return { motivo: "Barrado pela análise antifraude do Mercado Pago", dica: "Esse cartão não vai passar agora: ofereça o Pix." };
    case "cc_rejected_max_attempts":
      return { motivo: "Muitas tentativas com o mesmo cartão", dica: "Ofereça outro cartão ou o Pix." };
    case "cc_rejected_blacklist":
      return { motivo: "Cartão não aceito pelo Mercado Pago", dica: "Ofereça o Pix." };
    case "cc_rejected_other_reason":
      return { motivo: "O banco recusou sem dizer o motivo", dica: "Peça para falar com o banco, ou ofereça o Pix." };
    case "cancelled":
    case "expired":
      return { motivo: "Pagamento cancelado ou vencido", dica: "Mande o link do Pix de novo." };
    default:
      return { motivo: "Pagamento recusado", dica: "Ofereça outro cartão ou o Pix." };
  }
}

/** The refusal that explains the others: after a real reason, retries come back as
 * "too many attempts" / "duplicated", which hide it. */
export function detalhePrincipal(recusas: { detalhe?: string }[]): string | undefined {
  const consequencia = new Set(["cc_rejected_max_attempts", "cc_rejected_duplicated_payment"]);
  return (recusas.find((r) => r.detalhe && !consequencia.has(r.detalhe)) ?? recusas.at(-1))?.detalhe;
}
