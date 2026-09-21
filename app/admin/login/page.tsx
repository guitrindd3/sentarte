"use client";

import { useActionState } from "react";
import { loginAction } from "../actions";
import { inputClass } from "../_ui";

export default function AdminLoginPage() {
  const [state, action, pending] = useActionState(loginAction, undefined);

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-6">
      <h1 className="font-serif text-2xl text-ink">Painel do Sentarte</h1>
      <p className="mt-2 text-sm text-ink-soft">Entre com a senha de administrador.</p>
      <form action={action} className="mt-6 space-y-4">
        <label className="block">
          <span className="text-sm text-ink-soft">Senha</span>
          <input
            id="password"
            name="password"
            type="password"
            required
            autoFocus
            className={`mt-1 ${inputClass}`}
          />
        </label>
        {state?.error ? <p className="text-sm text-clay">{state.error}</p> : null}
        <button
          disabled={pending}
          type="submit"
          className="w-full border border-ink bg-ink px-4 py-2 text-sm font-medium text-canvas transition-colors hover:bg-transparent hover:text-ink disabled:opacity-60"
        >
          {pending ? "Entrando…" : "Entrar"}
        </button>
      </form>
    </main>
  );
}
