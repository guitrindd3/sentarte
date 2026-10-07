"use client";

import { useState } from "react";
import { idDaVisita } from "@/lib/rastro";

const ROTULOS = ["", "Não gostei", "Poderia ser melhor", "Boa", "Muito boa", "Amei!"];

/** "Já tem a sua? Avalie" — stars + comment, reviewed by the atelier before it shows. */
export function Avaliar({ googleUrl }: { googleUrl?: string }) {
  const [aberto, setAberto] = useState(false);
  const [estrelas, setEstrelas] = useState(0);
  const [passando, setPassando] = useState(0);
  const [estado, setEstado] = useState<"livre" | "enviando" | "ok">("livre");
  const [erro, setErro] = useState("");

  if (estado === "ok") {
    return (
      <div className="border border-line bg-paper p-5 text-sm text-ink" role="status">
        <p className="font-serif text-lg">Obrigado pela avaliação!</p>
        <p className="mt-1 text-ink-soft">Ela aparece aqui assim que o ateliê conferir.</p>
        {googleUrl ? (
          <p className="mt-3">
            Quer ajudar ainda mais?{" "}
            <a href={googleUrl} target="_blank" rel="noreferrer" className="font-medium underline underline-offset-2">
              Avalie também no Google
            </a>
            . Leva 1 minutinho.
          </p>
        ) : null}
      </div>
    );
  }

  if (!aberto) {
    return (
      <button type="button" onClick={() => setAberto(true)} className="inline-flex items-center gap-2 border border-ink px-5 py-2.5 text-sm font-medium text-ink transition-colors hover:bg-ink hover:text-canvas">
        ★ Já tem a sua? Avalie
      </button>
    );
  }

  const mostrar = passando || estrelas;
  return (
    <form
      data-sem-rastro
      className="max-w-xl border border-line bg-paper p-5"
      onSubmit={async (e) => {
        e.preventDefault();
        if (!estrelas) return setErro("Escolha de 1 a 5 estrelas.");
        const f = new FormData(e.currentTarget);
        setErro("");
        setEstado("enviando");
        try {
          const res = await fetch("/api/avaliacoes", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ estrelas, nome: f.get("nome"), cidade: f.get("cidade"), texto: f.get("texto"), site: f.get("site"), vid: idDaVisita() }),
          });
          const j = (await res.json()) as { ok?: boolean; erro?: string };
          if (!res.ok || !j.ok) throw new Error(j.erro || "Não deu para enviar agora.");
          setEstado("ok");
        } catch (err) {
          setErro(err instanceof Error ? err.message : "Não deu para enviar agora.");
          setEstado("livre");
        }
      }}
    >
      <p className="font-serif text-lg text-ink">Como ficou a sua cadeira?</p>
      <div className="mt-2 flex items-center gap-3" onMouseLeave={() => setPassando(0)}>
        <div className="flex" role="radiogroup" aria-label="Estrelas">
          {[1, 2, 3, 4, 5].map((i) => (
            <button
              key={i}
              type="button"
              role="radio"
              aria-checked={estrelas === i}
              aria-label={`${i} ${i === 1 ? "estrela" : "estrelas"}`}
              onMouseEnter={() => setPassando(i)}
              onClick={() => setEstrelas(i)}
              className="p-0.5"
            >
              <svg viewBox="0 0 24 24" className={`h-8 w-8 transition ${i <= mostrar ? "text-rattan" : "text-line"}`} fill="currentColor" aria-hidden>
                <path d="m12 2.8 2.8 5.8 6.3.9-4.6 4.5 1.1 6.3L12 17.3l-5.6 3 1.1-6.3L2.9 9.5l6.3-.9z" />
              </svg>
            </button>
          ))}
        </div>
        <span className="text-sm text-ink-soft">{ROTULOS[mostrar]}</span>
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <label className="block text-sm">
          <span className="text-ink-soft">Seu nome</span>
          <input name="nome" autoComplete="name" required maxLength={60} className="mt-1 w-full border border-line bg-canvas px-3 py-2 text-base text-ink focus:border-ink focus:outline-none sm:text-sm" />
        </label>
        <label className="block text-sm">
          <span className="text-ink-soft">Cidade (opcional)</span>
          <input name="cidade" maxLength={60} className="mt-1 w-full border border-line bg-canvas px-3 py-2 text-base text-ink focus:border-ink focus:outline-none sm:text-sm" />
        </label>
      </div>
      <label className="mt-3 block text-sm">
        <span className="text-ink-soft">Conte como ficou</span>
        <textarea name="texto" required minLength={3} maxLength={600} rows={3} className="mt-1 w-full border border-line bg-canvas px-3 py-2 text-base text-ink focus:border-ink focus:outline-none sm:text-sm" />
      </label>
      <input name="site" tabIndex={-1} autoComplete="off" aria-hidden className="hidden" />
      <p className="mt-2 text-xs text-ink-soft">Seu nome, cidade e comentário aparecem no site depois que o ateliê conferir.</p>
      {erro ? <p className="mt-2 text-sm text-clay-dark">{erro}</p> : null}
      <div className="mt-4 flex items-center gap-3">
        <button type="submit" disabled={estado === "enviando"} className="border border-ink bg-ink px-5 py-2.5 text-sm font-medium text-canvas transition-colors hover:bg-transparent hover:text-ink disabled:opacity-60">
          {estado === "enviando" ? "Enviando…" : "Enviar avaliação"}
        </button>
        <button type="button" onClick={() => setAberto(false)} className="text-sm text-ink-soft underline-offset-2 hover:underline">
          Cancelar
        </button>
      </div>
    </form>
  );
}
