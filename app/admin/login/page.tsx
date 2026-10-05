"use client";

import Image from "next/image";
import Link from "next/link";
import { useActionState, useState } from "react";
import { loginAction } from "../actions";
import { btnPrimary, inputClass } from "../_ui";

export default function AdminLoginPage() {
  const [state, action, pending] = useActionState(loginAction, undefined);
  const codigo = state?.etapa === "codigo";
  // Phone keyboard: numbers for the app code; letters too for a recovery code (user 2026-10-05).
  const [reserva, setReserva] = useState(false);

  return (
    <div className="grid min-h-screen place-items-center bg-espresso px-4 py-10">
      <div className="w-full max-w-sm rounded-3xl bg-paper p-7 shadow-2xl sm:p-9">
        <Image src="/brand/logo.png" alt="" width={64} height={64} className="mx-auto rounded-full" />
        <h1 className="mt-4 text-center font-serif text-2xl font-medium tracking-tight text-ink">
          {codigo ? "Código do celular" : "Painel do ateliê"}
        </h1>
        <p className="mt-1 text-center text-sm text-ink-soft">
          {codigo
            ? reserva
              ? "Sem o celular? Digite um dos seus códigos reserva (cada um funciona uma vez)."
              : "Abra o app autenticador e digite o código de 6 números do SentArte."
            : "Entre para editar as cadeiras, fotos e textos do site."}
        </p>
        <form action={action} className="mt-7 space-y-4">
          {codigo ? (
            <div>
              <label className="block">
                <span className="text-sm font-semibold text-ink">{reserva ? "Código reserva" : "Código do app"}</span>
                <input
                  key={reserva ? "reserva" : "codigo"}
                  name="codigo"
                  required
                  autoFocus
                  inputMode={reserva ? "text" : "numeric"}
                  autoComplete={reserva ? "off" : "one-time-code"}
                  autoCapitalize={reserva ? "characters" : "off"}
                  autoCorrect="off"
                  spellCheck={false}
                  maxLength={12}
                  placeholder={reserva ? "ABCD-EF23" : "000000"}
                  className={`mt-1.5 text-center font-mono text-2xl tracking-[0.3em] uppercase ${inputClass}`}
                />
              </label>
              <input type="hidden" name="etapa" value="codigo" />
              <button
                type="button"
                onClick={() => setReserva((r) => !r)}
                className="mt-2 text-xs font-medium text-wood-dark underline underline-offset-2"
              >
                {reserva ? "Voltar para o código do app (só números)" : "Usar código reserva (com letras)"}
              </button>
            </div>
          ) : (
            <label className="block">
              <span className="text-sm font-semibold text-ink">Senha</span>
              <input
                key="senha"
                id="password"
                name="password"
                type="password"
                required
                autoFocus
                autoComplete="current-password"
                className={`mt-1.5 ${inputClass}`}
              />
            </label>
          )}
          {state?.error ? <p className="rounded-lg bg-[#fbeee8] px-3 py-2 text-sm text-clay-dark">{state.error}</p> : null}
          <button disabled={pending} type="submit" className={`${btnPrimary} w-full py-3`}>
            {pending ? "Conferindo…" : codigo ? "Confirmar" : "Entrar"}
          </button>
        </form>
        <p className="mt-6 text-center text-xs text-ink-soft">
          <Link href="/" className="underline-offset-2 hover:underline">
            Voltar para o site
          </Link>
        </p>
      </div>
    </div>
  );
}
