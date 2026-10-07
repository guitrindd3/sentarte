"use client";

import { useState } from "react";
import { idDaVisita } from "@/lib/rastro";

/** Footer opt-in for news and coupons on WhatsApp (admin "Clientes"). */
export function ListaNovidades() {
  const [estado, setEstado] = useState<"livre" | "enviando" | "ok">("livre");
  const [erro, setErro] = useState("");

  if (estado === "ok") {
    return (
      <p className="text-sm text-ink" role="status">
        Prontinho! Quando tiver novidade ou cupom, a gente te chama no WhatsApp.
      </p>
    );
  }

  return (
    <form
      data-sem-rastro
      className="w-full"
      onSubmit={async (e) => {
        e.preventDefault();
        const f = new FormData(e.currentTarget);
        setErro("");
        setEstado("enviando");
        try {
          const res = await fetch("/api/interessados", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              nome: f.get("nome"),
              whatsapp: f.get("whatsapp"),
              aceito: f.get("aceito") === "on",
              site: f.get("site"),
              vid: idDaVisita(),
            }),
          });
          const j = (await res.json()) as { ok?: boolean; erro?: string };
          if (!res.ok || !j.ok) throw new Error(j.erro || "Não deu para cadastrar agora.");
          setEstado("ok");
        } catch (err) {
          setErro(err instanceof Error ? err.message : "Não deu para cadastrar agora.");
          setEstado("livre");
        }
      }}
    >
      <div className="flex flex-col gap-2 sm:flex-row">
        <label className="sr-only" htmlFor="nov-nome">Seu nome</label>
        <input id="nov-nome" name="nome" autoComplete="name" required maxLength={60} placeholder="Seu nome" className="min-w-0 flex-1 border border-line bg-paper px-3 py-2.5 text-base text-ink placeholder:text-ink-soft focus:border-ink focus:outline-none sm:text-sm" />
        <label className="sr-only" htmlFor="nov-whats">Seu WhatsApp com DDD</label>
        <input id="nov-whats" name="whatsapp" required inputMode="tel" autoComplete="tel" maxLength={20} placeholder="WhatsApp com DDD" className="min-w-0 flex-1 border border-line bg-paper px-3 py-2.5 text-base text-ink placeholder:text-ink-soft focus:border-ink focus:outline-none sm:text-sm" />
        {/* honeypot */}
        <input name="site" tabIndex={-1} autoComplete="off" aria-hidden className="hidden" />
        <button type="submit" disabled={estado === "enviando"} className="border border-ink bg-ink px-5 py-2.5 text-sm font-medium text-canvas transition-colors hover:bg-transparent hover:text-ink disabled:opacity-60">
          {estado === "enviando" ? "Enviando…" : "Quero receber"}
        </button>
      </div>
      <label className="mt-2 flex items-start gap-2 text-xs text-ink-soft">
        <input type="checkbox" name="aceito" required className="mt-0.5 accent-[var(--ink)]" />
        <span>
          Aceito receber novidades e cupons do SentArte no WhatsApp. Posso sair quando quiser, é só pedir.{" "}
          <a href="/politica-de-privacidade" className="underline underline-offset-2">Privacidade</a>
        </span>
      </label>
      {erro ? <p className="mt-2 text-sm text-clay-dark">{erro}</p> : null}
    </form>
  );
}
