"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { EnvioME } from "@/lib/clientes";
import type { OpcaoEnvio } from "@/lib/melhor-envio";
import { formatBRL } from "@/lib/offer";
import { atualizarEnvioAction, cotarEnvioAction, criarEnvioAction, pagarEnvioAction, tirarEnvioAction, type Resultado } from "../../../actions";
import { avisar, btnPrimary, btnSecondary } from "../../../_ui";

// Label steps on the admin order page: quote → cart → pay+print → tracking.

const STATUS: Record<string, string> = {
  pending: "no carrinho (não pago)",
  released: "paga, etiqueta liberada",
  generated: "etiqueta gerada",
  posted: "postado",
  delivered: "entregue",
  canceled: "cancelado",
  undelivered: "não entregue",
};

export function Etiqueta({
  refPedido,
  envios,
  etiquetaUrl,
  freteCobrado,
}: {
  refPedido: string;
  envios: EnvioME[];
  etiquetaUrl?: string;
  freteCobrado?: number;
}) {
  const router = useRouter();
  const [opcoes, setOpcoes] = useState<OpcaoEnvio[] | null>(null);
  const [escolhida, setEscolhida] = useState<number | null>(null);
  const [erro, setErro] = useState("");
  const [ocupado, setOcupado] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const rodar = (rotulo: string, fn: () => Promise<Resultado>) => {
    setErro("");
    setOcupado(rotulo);
    startTransition(async () => {
      const r = await fn();
      setOcupado(null);
      if (r?.ok) {
        avisar("ok", r.msg);
        router.refresh();
      } else if (r) {
        setErro(r.erro);
        avisar("erro", r.erro);
      }
    });
  };

  const cotar = () => {
    setErro("");
    setOcupado("cotar");
    startTransition(async () => {
      const r = await cotarEnvioAction(refPedido);
      setOcupado(null);
      if (r.ok) {
        setOpcoes(r.opcoes);
        setEscolhida(r.opcoes[0]?.id ?? null);
      } else setErro(r.erro);
    });
  };

  if (envios.length) {
    const pagos = Boolean(etiquetaUrl) || envios.some((e) => e.status && e.status !== "pending");
    return (
      <div className="space-y-4">
        <ul className="space-y-2 text-sm">
          {envios.map((e, i) => (
            <li key={e.id} className="rounded-xl border border-line/70 px-4 py-3">
              <span className="font-semibold text-ink">
                Etiqueta {envios.length > 1 ? `${i + 1} de ${envios.length}` : ""} — {e.servico}
              </span>
              <span className="block text-ink-soft">
                {STATUS[e.status ?? ""] ?? e.status}
                {e.rastreio ? (
                  <>
                    , rastreio <strong className="font-mono text-ink">{e.rastreio}</strong>
                  </>
                ) : null}
              </span>
            </li>
          ))}
        </ul>
        {erro ? <p className="rounded-xl bg-[#fbeee8] px-4 py-3 text-sm text-clay-dark">{erro}</p> : null}
        <div className="flex flex-wrap gap-2">
          {etiquetaUrl ? (
            <a href={etiquetaUrl} target="_blank" rel="noreferrer" className={btnPrimary}>
              Imprimir etiqueta
            </a>
          ) : (
            <button type="button" disabled={ocupado !== null} onClick={() => rodar("pagar", () => pagarEnvioAction(refPedido))} className={btnPrimary}>
              {ocupado === "pagar" ? "Pagando e gerando…" : "Pagar com o saldo e gerar etiqueta"}
            </button>
          )}
          <button type="button" disabled={ocupado !== null} onClick={() => rodar("atualizar", () => atualizarEnvioAction(refPedido))} className={btnSecondary}>
            {ocupado === "atualizar" ? "Atualizando…" : "Atualizar rastreio"}
          </button>
          <a href="https://melhorenvio.com.br/carrinho" target="_blank" rel="noreferrer" className={btnSecondary}>
            Abrir o Melhor Envio
          </a>
          {!pagos ? (
            <button
              type="button"
              disabled={ocupado !== null}
              onClick={() => rodar("tirar", () => tirarEnvioAction(refPedido))}
              className="rounded-full px-3 py-2 text-sm font-medium text-clay hover:bg-clay/10"
            >
              {ocupado === "tirar" ? "Tirando…" : "Tirar do carrinho"}
            </button>
          ) : null}
        </div>
        {!etiquetaUrl ? (
          <p className="text-xs text-ink-soft">
            &ldquo;Pagar com o saldo&rdquo; usa o dinheiro que estiver na carteira do Melhor Envio. Sem saldo, pague pelo site do Melhor Envio (Pix ou cartão) e imprima por lá; depois clique em &ldquo;Atualizar rastreio&rdquo;.
          </p>
        ) : null}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {opcoes ? (
        <fieldset className="space-y-2">
          <legend className="mb-2 text-sm font-semibold text-ink">
            Escolha a transportadora (preço por cadeira{freteCobrado !== undefined ? `; o cliente pagou ${freteCobrado ? formatBRL(freteCobrado) : "frete grátis"}` : ""})
          </legend>
          {opcoes.map((o) => (
            <label key={o.id} className={`flex cursor-pointer items-center justify-between gap-3 rounded-xl border px-4 py-3 text-sm ${escolhida === o.id ? "border-wood bg-rattan/10" : "border-line/70"}`}>
              <span className="flex items-center gap-3">
                <input type="radio" name="servico" checked={escolhida === o.id} onChange={() => setEscolhida(o.id)} />
                <span>
                  <span className="font-semibold text-ink">{o.nome}</span>
                  {o.prazo ? <span className="block text-ink-soft">{o.prazo} dias úteis</span> : null}
                </span>
              </span>
              <span className="font-semibold text-ink">{formatBRL(o.preco)}</span>
            </label>
          ))}
        </fieldset>
      ) : null}
      {erro ? <p className="rounded-xl bg-[#fbeee8] px-4 py-3 text-sm text-clay-dark">{erro}</p> : null}
      <div className="flex flex-wrap gap-2">
        {opcoes && escolhida !== null ? (
          <button
            type="button"
            disabled={ocupado !== null}
            onClick={() => {
              const o = opcoes.find((x) => x.id === escolhida);
              if (o) rodar("criar", () => criarEnvioAction(refPedido, o));
            }}
            className={btnPrimary}
          >
            {ocupado === "criar" ? "Colocando no carrinho…" : "Colocar no carrinho do Melhor Envio"}
          </button>
        ) : null}
        <button type="button" disabled={ocupado !== null} onClick={cotar} className={opcoes ? btnSecondary : btnPrimary}>
          {ocupado === "cotar" ? "Cotando…" : opcoes ? "Cotar de novo" : "Ver transportadoras e preços"}
        </button>
      </div>
    </div>
  );
}
