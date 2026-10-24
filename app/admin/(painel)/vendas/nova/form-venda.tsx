"use client";

import { useState } from "react";
import { lancarVendaAction } from "../../../actions";
import { AdminForm, btnSecondary, Card, Field, inputClass, SaveButton } from "../../../_ui";

export type ItemVenda = { descricao: string; qtd: number; preco: string; tipo: "normal" | "infantil" | "reclinavel" | "" };

export type InicialVenda = {
  orcamento?: string;
  codigoOrcamento?: string;
  nome: string;
  whatsapp: string;
  cidade: string;
  itens: ItemVenda[];
  obs: string;
};

const TIPOS = [
  ["normal", "Cadeira normal"],
  ["infantil", "Cadeira infantil"],
  ["reclinavel", "Cadeira reclinável"],
  ["", "Outra coisa"],
] as const;

const FORMAS = [
  ["pix", "Pix"],
  ["cartao", "Cartão"],
  ["transferencia", "Transferência"],
  ["dinheiro", "Dinheiro"],
  ["outro", "Outro"],
] as const;

/** Same reading as the server (actions.ts `reais`), for the live total. */
function reais(v: string) {
  const s = v.replace(/[R$\s]/g, "");
  if (!s) return 0;
  const n = Number(/,\d{1,2}$/.test(s) ? s.replace(/\./g, "").replace(",", ".") : s.replace(/,/g, ""));
  return Number.isFinite(n) ? n : 0;
}
const brl = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

/** Admin "Lançar venda" (2026-10-24): a sale paid on WhatsApp, typed in by hand. */
export function FormVenda({ inicial }: { inicial: InicialVenda }) {
  const [itens, setItens] = useState<ItemVenda[]>(inicial.itens.length ? inicial.itens : [{ descricao: "", qtd: 1, preco: "", tipo: "normal" }]);
  const [frete, setFrete] = useState("");
  const [desconto, setDesconto] = useState("");
  const mudar = (k: number, m: Partial<ItemVenda>) => setItens((l) => l.map((i, j) => (j === k ? { ...i, ...m } : i)));
  const produtos = itens.reduce((s, i) => s + (i.qtd || 0) * reais(i.preco), 0);
  const total = produtos + reais(frete) - reais(desconto);

  return (
    <AdminForm action={lancarVendaAction} className="space-y-6">
      <input type="hidden" name="itens" value={JSON.stringify(itens)} />
      {inicial.orcamento ? <input type="hidden" name="orcamento" value={inicial.orcamento} /> : null}

      <Card titulo="Cliente" descricao={inicial.codigoOrcamento ? `Veio do orçamento ${inicial.codigoOrcamento}. As imagens dele aparecem na página do pedido.` : undefined}>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Nome">
            <input name="nome" required maxLength={80} defaultValue={inicial.nome} className={inputClass} />
          </Field>
          <Field label="WhatsApp">
            <input name="whatsapp" required type="tel" inputMode="tel" defaultValue={inicial.whatsapp} placeholder="(27) 99999-9999" className={inputClass} />
          </Field>
          <Field label="Cidade">
            <input name="cidade" required maxLength={60} defaultValue={inicial.cidade} className={inputClass} />
          </Field>
        </div>
      </Card>

      <Card titulo="O que foi vendido" descricao="Uma linha para cada coisa. Escreva do jeito que vai aparecer para o cliente em Acompanhar pedido.">
        <ul className="space-y-4">
          {itens.map((i, k) => (
            <li key={k} className="grid gap-3 rounded-xl border border-line/70 p-3 sm:grid-cols-[minmax(0,1fr)_11rem_5rem_7.5rem_auto] sm:items-end">
              <Field label="Descrição">
                <input
                  value={i.descricao}
                  onChange={(e) => mudar(k, { descricao: e.target.value })}
                  maxLength={160}
                  placeholder="Ex.: Cadeira com a logo da empresa no encosto"
                  className={inputClass}
                />
              </Field>
              <Field label="Tipo">
                <select value={i.tipo} onChange={(e) => mudar(k, { tipo: e.target.value as ItemVenda["tipo"] })} className={inputClass}>
                  {TIPOS.map(([v, t]) => (
                    <option key={v} value={v}>
                      {t}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Qtd.">
                <input
                  type="number"
                  inputMode="numeric"
                  min={1}
                  max={999}
                  value={i.qtd || ""}
                  onChange={(e) => mudar(k, { qtd: Math.max(0, Math.min(999, Math.floor(Number(e.target.value) || 0))) })}
                  className={inputClass}
                />
              </Field>
              <Field label="Valor de cada">
                <input value={i.preco} onChange={(e) => mudar(k, { preco: e.target.value })} inputMode="decimal" placeholder="489,90" className={inputClass} />
              </Field>
              <button
                type="button"
                onClick={() => setItens((l) => (l.length > 1 ? l.filter((_, j) => j !== k) : l))}
                disabled={itens.length === 1}
                className="h-11 rounded-full px-3 text-sm font-medium text-clay-dark hover:bg-clay/10 disabled:opacity-30"
              >
                Tirar
              </button>
            </li>
          ))}
        </ul>
        <button type="button" onClick={() => setItens((l) => [...l, { descricao: "", qtd: 1, preco: "", tipo: "normal" }])} className={`${btnSecondary} mt-4`}>
          + Outro item
        </button>
        <p className="mt-2 text-xs text-ink-soft">O tipo conta nas vagas da semana e nas etiquetas de envio. Para enfeite, frete à parte ou outra coisa, use &ldquo;Outra coisa&rdquo;.</p>
      </Card>

      <Card titulo="Pagamento">
        <div className="grid gap-4 sm:grid-cols-4">
          <Field label="Como pagou">
            <select name="forma" defaultValue="pix" className={inputClass}>
              {FORMAS.map(([v, t]) => (
                <option key={v} value={v}>
                  {t}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Frete cobrado (R$)">
            <input name="frete" value={frete} onChange={(e) => setFrete(e.target.value)} inputMode="decimal" placeholder="0,00" className={inputClass} />
          </Field>
          <Field label="Transportadora (opcional)">
            <input name="freteServico" maxLength={40} placeholder="Ex.: Correios PAC" className={inputClass} />
          </Field>
          <Field label="Desconto (R$)">
            <input name="desconto" value={desconto} onChange={(e) => setDesconto(e.target.value)} inputMode="decimal" placeholder="0,00" className={inputClass} />
          </Field>
        </div>
        <p className="mt-4 text-right text-lg text-ink">
          Total: <strong className="font-semibold">{brl(Math.max(0, total))}</strong>
        </p>
      </Card>

      <Card
        titulo="Entrega (opcional)"
        descricao="Preencha para gerar a etiqueta do Melhor Envio pelo painel. Se for retirar ou entregar em mão, deixe em branco. A cidade é a de cima."
      >
        <div className="grid gap-4 sm:grid-cols-6">
          <div className="sm:col-span-2">
            <Field label="CEP">
              <input name="cep" inputMode="numeric" maxLength={9} placeholder="29000-000" className={inputClass} />
            </Field>
          </div>
          <div className="sm:col-span-3">
            <Field label="Rua">
              <input name="endereco" maxLength={120} className={inputClass} />
            </Field>
          </div>
          <Field label="Número">
            <input name="numero" maxLength={20} className={inputClass} />
          </Field>
          <div className="sm:col-span-2">
            <Field label="Complemento">
              <input name="complemento" maxLength={60} className={inputClass} />
            </Field>
          </div>
          <div className="sm:col-span-2">
            <Field label="Bairro">
              <input name="bairro" maxLength={60} className={inputClass} />
            </Field>
          </div>
          <Field label="UF">
            <input name="uf" maxLength={2} placeholder="ES" className={`${inputClass} uppercase`} />
          </Field>
          <Field label="CPF">
            <input name="cpf" inputMode="numeric" maxLength={14} className={inputClass} />
          </Field>
        </div>
      </Card>

      <Card titulo="Detalhes da venda" descricao="Só você vê: cores, posição da logo, prazo combinado, o que foi acertado no WhatsApp…">
        <textarea name="obs" rows={5} maxLength={1000} defaultValue={inicial.obs} className={inputClass} />
      </Card>

      <div className="flex flex-wrap items-center justify-end gap-3">
        <p className="text-sm text-ink-soft">A venda entra como paga e em produção, e o cliente pode acompanhar pelo site.</p>
        <SaveButton>Lançar venda</SaveButton>
      </div>
    </AdminForm>
  );
}
