"use client";

import { useEffect, useState } from "react";
import { rotuloDesconto, type CupomPublico } from "@/lib/cupom";
import { SITE_URL } from "@/lib/nav";
import { whatsappUrl } from "@/lib/urls";
import { inputClass } from "../../_ui";
import { CopiarNumeros } from "./copiar";

const CHAVE = "sentarte-admin-cupom-boas-vindas";
const SEM_CUPOM = "";
const primeiroNome = (n: string) => n.trim().split(/\s+/)[0] ?? n;

/** Welcome message for someone who joined the "novidades" list in the footer. */
export function boasVindas(nome: string, cupom?: CupomPublico) {
  const linhas = [
    `Oi, ${primeiroNome(nome)}! Tudo bem? Aqui é do Ateliê SentArte 😊`,
    "",
    "Que bom ter você na nossa lista de novidades! Por aqui você fica sabendo antes de todo mundo dos modelos novos e das promoções.",
    "",
    `Nossas cadeiras de praia são trançadas à mão, uma a uma. Dá para escolher a sua com as cores do seu time, num estilo boho ou até montar do seu jeito, com o seu nome: ${SITE_URL}/personalizar`,
  ];
  if (cupom) {
    const quando = cupom.minCadeiras > 1 ? ` levando ${cupom.minCadeiras} cadeiras ou mais` : "";
    linhas.push("", `🎁 Um presente de boas-vindas: use o cupom *${cupom.codigo}* no carrinho do site e ganhe ${rotuloDesconto(cupom)} de desconto${quando}.`);
  }
  linhas.push("", "Qualquer dúvida, é só responder esta mensagem!");
  return linhas.join("\n");
}

/**
 * Coupon picker + preview for the welcome message; the list's "Chamar" buttons
 * read the choice through the `sentarte:cupom-boas-vindas` event.
 */
export function EscolherCupom({ cupons }: { cupons: CupomPublico[] }) {
  const [codigo, setCodigo] = useCupomEscolhido(cupons);
  const cupom = cupons.find((c) => c.codigo === codigo);
  const exemplo = boasVindas("Cliente", cupom);
  return (
    <div className="mb-4 space-y-3 rounded-xl bg-canvas p-4">
      <label className="block text-sm font-semibold text-ink">
        Cupom de boas-vindas na mensagem
        <select
          className={`${inputClass} mt-1`}
          value={codigo}
          onChange={(e) => {
            setCodigo(e.target.value);
          }}
        >
          <option value={SEM_CUPOM}>Sem cupom</option>
          {cupons.map((c) => (
            <option key={c.codigo} value={c.codigo}>
              {c.codigo}: {rotuloDesconto(c)}
              {c.minCadeiras > 1 ? `, a partir de ${c.minCadeiras} cadeiras` : ""}
            </option>
          ))}
        </select>
      </label>
      <p className="whitespace-pre-line rounded-xl bg-paper px-4 py-3 text-sm text-ink">{exemplo}</p>
      <CopiarNumeros numeros={[]} texto={exemplo} rotulo="Copiar mensagem (para lista de transmissão)" />
    </div>
  );
}

export function BotaoChamar({ nome, whatsapp, cupons }: { nome: string; whatsapp: string; cupons: CupomPublico[] }) {
  const [codigo] = useCupomEscolhido(cupons);
  const cupom = cupons.find((c) => c.codigo === codigo);
  return (
    <a
      href={whatsappUrl(whatsapp, boasVindas(nome, cupom))}
      target="_blank"
      rel="noreferrer"
      className="rounded-full border border-verde px-3 py-1.5 text-sm font-semibold text-verde-escuro hover:bg-verde/5"
    >
      Chamar
    </a>
  );
}

/** Shared choice, remembered in this browser. Default: the valid coupon for any order with the smallest discount. */
function useCupomEscolhido(cupons: CupomPublico[]) {
  const padrao =
    [...cupons].filter((c) => c.minCadeiras <= 1).sort((a, b) => a.valor - b.valor)[0]?.codigo ?? SEM_CUPOM;
  const [codigo, setCodigoLocal] = useState(padrao);

  useEffect(() => {
    const ler = () => {
      try {
        const salvo = localStorage.getItem(CHAVE);
        if (salvo !== null && (salvo === SEM_CUPOM || cupons.some((c) => c.codigo === salvo))) setCodigoLocal(salvo);
      } catch {}
    };
    ler();
    window.addEventListener("sentarte:cupom-boas-vindas", ler);
    return () => window.removeEventListener("sentarte:cupom-boas-vindas", ler);
  }, [cupons]);

  const setCodigo = (c: string) => {
    try {
      localStorage.setItem(CHAVE, c);
    } catch {}
    setCodigoLocal(c);
    window.dispatchEvent(new Event("sentarte:cupom-boas-vindas"));
  };
  return [codigo, setCodigo] as const;
}
