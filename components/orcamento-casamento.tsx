"use client";

import { useState } from "react";
import { WhatsAppIcon } from "@/components/icons";
import { whatsappUrl } from "@/lib/urls";

// Wedding quote (2026-10-23): no backend — the answers become one WhatsApp
// message, like every order started outside the cart.

const campo = "mt-1 w-full border border-line bg-canvas px-3 py-2 text-base text-ink focus:border-ink focus:outline-none";

const QUANTOS = [
  ["noivos", "Cadeiras dos noivos"],
  ["padrinhos", "Padrinhos e madrinhas"],
  ["criancas", "Daminhas e pajens (infantil)"],
] as const;
type Quanto = (typeof QUANTOS)[number][0];

const dataBR = (iso: string) => (/^\d{4}-\d{2}-\d{2}$/.test(iso) ? iso.split("-").reverse().join("/") : "");

export function OrcamentoCasamento({ whatsappNumero }: { whatsappNumero: string }) {
  const [casal, setCasal] = useState("");
  const [data, setData] = useState("");
  const [cidade, setCidade] = useState("");
  const [qtd, setQtd] = useState<Record<Quanto, number>>({ noivos: 2, padrinhos: 0, criancas: 0 });
  const [cores, setCores] = useState("");
  const [obs, setObs] = useState("");

  const total = qtd.noivos + qtd.padrinhos + qtd.criancas;
  const mensagem = [
    "Oi! Quero um orçamento de cadeiras para casamento.",
    casal.trim() && `Noivos: ${casal.trim()}`,
    dataBR(data) && `Data do casamento: ${dataBR(data)}`,
    cidade.trim() && `Cidade: ${cidade.trim()}`,
    ...QUANTOS.filter(([k]) => qtd[k] > 0).map(([k, rotulo]) => `${rotulo}: ${qtd[k]}`),
    cores.trim() && `Cores da festa: ${cores.trim()}`,
    obs.trim() && `Observação: ${obs.trim()}`,
  ]
    .filter(Boolean)
    .join("\n");

  return (
    <form
      className="grid grid-cols-2 gap-3 text-sm"
      onSubmit={(e) => {
        e.preventDefault();
        window.open(whatsappUrl(whatsappNumero, mensagem), "_blank", "noopener");
      }}
    >
      <label className="col-span-2">
        <span className="text-ink-soft">Nomes dos noivos</span>
        <input value={casal} onChange={(e) => setCasal(e.target.value)} maxLength={80} placeholder="Ana e Leo" className={campo} />
      </label>
      <label className="max-sm:col-span-2">
        <span className="text-ink-soft">Data do casamento</span>
        <input type="date" value={data} onChange={(e) => setData(e.target.value)} className={campo} />
      </label>
      <label className="max-sm:col-span-2">
        <span className="text-ink-soft">Cidade</span>
        <input value={cidade} onChange={(e) => setCidade(e.target.value)} maxLength={60} autoComplete="address-level2" className={campo} />
      </label>
      <fieldset className="col-span-2 mt-1 space-y-2 border-t border-line pt-3">
        <legend className="sr-only">Quantas cadeiras</legend>
        {QUANTOS.map(([k, rotulo]) => (
          <div key={k} className="flex items-center justify-between gap-3">
            <span className="text-ink">{rotulo}</span>
            <span className="flex items-center border border-line">
              <button
                type="button"
                onClick={() => setQtd((q) => ({ ...q, [k]: Math.max(0, q[k] - 1) }))}
                className="h-10 w-10 text-lg text-ink-soft hover:text-ink"
                aria-label={`Menos ${rotulo.toLowerCase()}`}
              >
                −
              </button>
              <span className="w-8 text-center tabular-nums text-ink">{qtd[k]}</span>
              <button
                type="button"
                onClick={() => setQtd((q) => ({ ...q, [k]: Math.min(99, q[k] + 1) }))}
                className="h-10 w-10 text-lg text-ink-soft hover:text-ink"
                aria-label={`Mais ${rotulo.toLowerCase()}`}
              >
                +
              </button>
            </span>
          </div>
        ))}
      </fieldset>
      <label className="col-span-2">
        <span className="text-ink-soft">Cores da festa (opcional)</span>
        <input value={cores} onChange={(e) => setCores(e.target.value)} maxLength={80} placeholder="Branco e dourado" className={campo} />
      </label>
      <label className="col-span-2">
        <span className="text-ink-soft">Algo mais? (opcional)</span>
        <textarea value={obs} onChange={(e) => setObs(e.target.value)} maxLength={300} rows={3} className={campo} />
      </label>
      <button
        type="submit"
        disabled={total === 0}
        data-rastro="Orçamento de casamento"
        className="col-span-2 mt-2 flex w-full items-center justify-center gap-2 rounded-full bg-verde px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-verde-escuro disabled:opacity-50"
      >
        <WhatsAppIcon className="h-5 w-5" />
        Pedir orçamento no WhatsApp
      </button>
    </form>
  );
}
