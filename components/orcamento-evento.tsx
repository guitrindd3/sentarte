"use client";

import { useState } from "react";
import { WhatsAppIcon } from "@/components/icons";
import { whatsappUrl } from "@/lib/urls";

// Quote for orders in quantity (2026-10-23 for weddings, widened 2026-10-24 to
// companies and parties). No backend — the answers become one WhatsApp
// message, like every order started outside the cart.

const campo = "mt-1 w-full border border-line bg-canvas px-3 py-2 text-base text-ink focus:border-ink focus:outline-none";

const TIPOS = [
  { id: "casamento", rotulo: "Casamento", nome: "Nomes dos noivos", exemplo: "Ana e Leo", data: "Data do casamento" },
  { id: "empresa", rotulo: "Empresa ou brinde", nome: "Nome da empresa", exemplo: "Sua empresa", data: "Para quando?" },
  { id: "pousada", rotulo: "Pousada, quiosque ou hotel", nome: "Nome do lugar", exemplo: "Pousada do Sol", data: "Para quando?" },
  { id: "festa", rotulo: "Festa ou aniversário", nome: "Nome de quem é a festa", exemplo: "Maria", data: "Data da festa" },
  { id: "outro", rotulo: "Outro", nome: "Nome do evento", exemplo: "", data: "Para quando?" },
] as const;
type Tipo = (typeof TIPOS)[number]["id"];

const QUANTOS = [
  ["normal", "Cadeiras normais"],
  ["infantil", "Cadeiras infantis"],
  ["reclinavel", "Cadeiras reclináveis"],
] as const;
type Quanto = (typeof QUANTOS)[number][0];

const NOMES = ["O mesmo em todas", "Um nome diferente em cada", "Sem nome", "Ainda não sei"] as const;

const dataBR = (iso: string) => (/^\d{4}-\d{2}-\d{2}$/.test(iso) ? iso.split("-").reverse().join("/") : "");

export function OrcamentoEvento({ whatsappNumero }: { whatsappNumero: string }) {
  const [tipo, setTipo] = useState<Tipo>("casamento");
  const [nome, setNome] = useState("");
  const [data, setData] = useState("");
  const [cidade, setCidade] = useState("");
  const [qtd, setQtd] = useState<Record<Quanto, number>>({ normal: 2, infantil: 0, reclinavel: 0 });
  const [nomes, setNomes] = useState<(typeof NOMES)[number] | "">("");
  const [cores, setCores] = useState("");
  const [obs, setObs] = useState("");

  const t = TIPOS.find((x) => x.id === tipo) ?? TIPOS[0];
  const total = qtd.normal + qtd.infantil + qtd.reclinavel;
  const mensagem = [
    `Oi! Quero um orçamento de cadeiras para ${t.rotulo.toLowerCase()}.`,
    nome.trim() && `${t.nome}: ${nome.trim()}`,
    dataBR(data) && `${t.data.replace("?", "")}: ${dataBR(data)}`,
    cidade.trim() && `Cidade: ${cidade.trim()}`,
    ...QUANTOS.filter(([k]) => qtd[k] > 0).map(([k, rotulo]) => `${rotulo}: ${qtd[k]}`),
    `Total: ${total} ${total === 1 ? "cadeira" : "cadeiras"}`,
    nomes && `Nomes nas cadeiras: ${nomes.toLowerCase()}`,
    cores.trim() && `Cores: ${cores.trim()}`,
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
      <fieldset className="col-span-2">
        <legend className="text-ink-soft">O que é?</legend>
        <div className="mt-1.5 flex flex-wrap gap-2">
          {TIPOS.map((x) => (
            <button
              key={x.id}
              type="button"
              aria-pressed={tipo === x.id}
              onClick={() => setTipo(x.id)}
              className={`rounded-full border px-3 py-1.5 text-sm transition-colors ${
                tipo === x.id ? "border-ink bg-ink text-canvas" : "border-line text-ink hover:border-ink"
              }`}
            >
              {x.rotulo}
            </button>
          ))}
        </div>
      </fieldset>
      <label className="col-span-2">
        <span className="text-ink-soft">{t.nome}</span>
        <input value={nome} onChange={(e) => setNome(e.target.value)} maxLength={80} placeholder={t.exemplo} className={campo} />
      </label>
      <label className="max-sm:col-span-2">
        <span className="text-ink-soft">{t.data}</span>
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
              <input
                type="number"
                inputMode="numeric"
                min={0}
                max={500}
                value={qtd[k]}
                onChange={(e) => setQtd((q) => ({ ...q, [k]: Math.max(0, Math.min(500, Math.floor(Number(e.target.value) || 0))) }))}
                className="w-12 bg-transparent text-center tabular-nums text-ink [appearance:textfield] focus:outline-none [&::-webkit-inner-spin-button]:appearance-none"
                aria-label={rotulo}
              />
              <button
                type="button"
                onClick={() => setQtd((q) => ({ ...q, [k]: Math.min(500, q[k] + 1) }))}
                className="h-10 w-10 text-lg text-ink-soft hover:text-ink"
                aria-label={`Mais ${rotulo.toLowerCase()}`}
              >
                +
              </button>
            </span>
          </div>
        ))}
        <p className="text-right text-xs text-ink-soft">
          Total: {total} {total === 1 ? "cadeira" : "cadeiras"}
        </p>
      </fieldset>
      <label className="col-span-2">
        <span className="text-ink-soft">Nomes nas cadeiras</span>
        <select value={nomes} onChange={(e) => setNomes(e.target.value as typeof nomes)} className={campo}>
          <option value="">Escolha…</option>
          {NOMES.map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
      </label>
      <label className="col-span-2">
        <span className="text-ink-soft">Cores (opcional)</span>
        <input
          value={cores}
          onChange={(e) => setCores(e.target.value)}
          maxLength={80}
          placeholder={tipo === "empresa" || tipo === "pousada" ? "As cores da marca" : "Branco e dourado"}
          className={campo}
        />
      </label>
      <label className="col-span-2">
        <span className="text-ink-soft">Algo mais? (opcional)</span>
        <textarea value={obs} onChange={(e) => setObs(e.target.value)} maxLength={300} rows={3} className={campo} />
      </label>
      <button
        type="submit"
        disabled={total === 0}
        data-rastro="Orçamento de evento"
        className="col-span-2 mt-2 flex w-full items-center justify-center gap-2 rounded-full bg-verde px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-verde-escuro disabled:opacity-50"
      >
        <WhatsAppIcon className="h-5 w-5" />
        Pedir orçamento no WhatsApp
      </button>
    </form>
  );
}
