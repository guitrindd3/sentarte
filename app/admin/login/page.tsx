"use client";

import Image from "next/image";
import Link from "next/link";
import { useActionState } from "react";
import { loginAction } from "../actions";
import { btnPrimary, inputClass } from "../_ui";

export default function AdminLoginPage() {
  const [state, action, pending] = useActionState(loginAction, undefined);

  return (
    <div className="grid min-h-screen place-items-center bg-espresso px-4 py-10">
      <div className="w-full max-w-sm rounded-3xl bg-paper p-7 shadow-2xl sm:p-9">
        <Image src="/brand/logo.png" alt="" width={64} height={64} className="mx-auto rounded-full" />
        <h1 className="mt-4 text-center font-serif text-2xl font-medium tracking-tight text-ink">Painel do ateliê</h1>
        <p className="mt-1 text-center text-sm text-ink-soft">Entre para editar as cadeiras, fotos e textos do site.</p>
        <form action={action} className="mt-7 space-y-4">
          <label className="block">
            <span className="text-sm font-semibold text-ink">Senha</span>
            <input id="password" name="password" type="password" required autoFocus autoComplete="current-password" className={`mt-1.5 ${inputClass}`} />
          </label>
          {state?.error ? <p className="rounded-lg bg-[#fbeee8] px-3 py-2 text-sm text-clay-dark">{state.error}</p> : null}
          <button disabled={pending} type="submit" className={`${btnPrimary} w-full py-3`}>
            {pending ? "Entrando…" : "Entrar"}
          </button>
        </form>
        <p className="mt-6 text-center text-xs text-ink-soft">
          <Link href="/" className="underline-offset-2 hover:underline">Voltar para o site</Link>
        </p>
      </div>
    </div>
  );
}
