"use client";

import { useState } from "react";
import type { Resultado } from "../../actions";
import { AdminForm, BotaoExcluir, inputClass, SaveButton } from "../../_ui";
import { BotaoChamar } from "./chamar-lista";
import type { CupomPublico } from "@/lib/cupom";

type Acao = (prev: Resultado, fd: FormData) => Promise<Resultado>;

function telefone(n: string) {
  const m = n.match(/^55(\d{2})(\d{4,5})(\d{4})$/);
  return m ? `(${m[1]}) ${m[2]}-${m[3]}` : n;
}

/** One person on the "novidades" list: call, edit the sign-up (name/number), remove. */
export function LinhaInteressado({
  nome,
  whatsapp,
  desde,
  cupons,
  editar,
  excluir,
}: {
  nome: string;
  whatsapp: string;
  desde: string;
  cupons: CupomPublico[];
  editar: Acao;
  excluir: Acao;
}) {
  const [editando, setEditando] = useState(false);
  const primeiro = nome.trim().split(/\s+/)[0] ?? nome;

  if (editando) {
    return (
      <li className="py-3">
        <AdminForm action={editar} aoSalvar={() => setEditando(false)} className="grid gap-3 rounded-xl bg-canvas p-4 sm:grid-cols-2">
          <label className="block text-sm font-semibold text-ink">
            Nome
            <input name="nome" defaultValue={nome} required maxLength={60} autoFocus className={`${inputClass} mt-1`} />
          </label>
          <label className="block text-sm font-semibold text-ink">
            WhatsApp
            <input name="whatsapp" defaultValue={telefone(whatsapp)} required inputMode="tel" maxLength={20} className={`${inputClass} mt-1`} />
          </label>
          <div className="flex flex-wrap items-center gap-2 sm:col-span-2">
            <SaveButton>Salvar cadastro</SaveButton>
            <button type="button" onClick={() => setEditando(false)} className="px-3 py-2 text-sm font-medium text-ink-soft underline">
              Cancelar
            </button>
          </div>
        </AdminForm>
      </li>
    );
  }

  return (
    <li className="flex flex-wrap items-center justify-between gap-3 py-3">
      <div className="min-w-0">
        <p className="font-semibold text-ink">{nome}</p>
        <p className="text-sm text-ink-soft">
          {telefone(whatsapp)}, desde {desde}
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <BotaoChamar nome={nome} whatsapp={whatsapp} cupons={cupons} />
        <button type="button" onClick={() => setEditando(true)} className="rounded-full border border-line px-3 py-1.5 text-sm font-semibold text-ink hover:border-wood hover:text-wood-dark">
          Editar
        </button>
        <BotaoExcluir action={excluir} rotulo="Tirar" pergunta={`Tirar ${primeiro} da lista?`} />
      </div>
    </li>
  );
}
