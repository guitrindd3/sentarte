"use client";

import { useEffect, useState } from "react";
import { idDaVisita } from "@/lib/rastro";

/** "Abre em 3 dias 04:12:09" until a collection opens; reloads the page when it does. */
export function ContagemColecao({ abreEm }: { abreEm: number }) {
  const [agora, setAgora] = useState<number | null>(null);
  useEffect(() => {
    const passo = () => {
      const n = Date.now();
      setAgora(n);
      if (n >= abreEm) {
        clearInterval(t);
        setTimeout(() => location.reload(), 1500);
      }
    };
    const primeiro = setTimeout(passo, 0);
    const t = setInterval(passo, 1000);
    return () => {
      clearTimeout(primeiro);
      clearInterval(t);
    };
  }, [abreEm]);
  if (agora === null) return <div className="h-[4.5rem]" />;
  const s = Math.max(0, Math.floor((abreEm - agora) / 1000));
  const partes = [
    { v: Math.floor(s / 86400), r: "dias" },
    { v: Math.floor((s % 86400) / 3600), r: "horas" },
    { v: Math.floor((s % 3600) / 60), r: "min" },
    { v: s % 60, r: "seg" },
  ];
  return (
    <div className="flex gap-2" role="timer" aria-label="Tempo até abrir">
      {partes.map((p) => (
        <div key={p.r} className="min-w-[4.25rem] border border-canvas/30 px-3 py-2 text-center">
          <p className="font-serif text-3xl font-medium tabular-nums">{String(p.v).padStart(2, "0")}</p>
          <p className="text-xs text-canvas/70">{p.r}</p>
        </div>
      ))}
    </div>
  );
}

/** Waiting-list sign-up for a numbered collection (POST /api/colecao/espera). */
export function EsperaColecao({ id, nome, esgotada }: { id: string; nome: string; esgotada: boolean }) {
  const [estado, setEstado] = useState<"livre" | "enviando" | "feito">("livre");
  const [erro, setErro] = useState("");

  const enviar = async (ev: React.FormEvent<HTMLFormElement>) => {
    ev.preventDefault();
    const f = new FormData(ev.currentTarget);
    setErro("");
    setEstado("enviando");
    try {
      const r = await fetch("/api/colecao/espera", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, nome: f.get("nome"), email: f.get("email"), aceito: f.get("aceito") === "on", site: f.get("site"), vid: idDaVisita() }),
      });
      const j = (await r.json()) as { ok?: boolean; erro?: string };
      if (!r.ok || !j.ok) throw new Error(j.erro ?? "Não deu agora. Tente de novo.");
      setEstado("feito");
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Não deu agora. Tente de novo.");
      setEstado("livre");
    }
  };

  if (estado === "feito") {
    return (
      <div className="border border-ink bg-paper p-5" role="status">
        <p className="font-serif text-xl font-medium tracking-tight text-ink">Você está na lista ✓</p>
        <p className="mt-1 text-sm text-ink-soft">
          {esgotada ? "Assim que sair a próxima edição, você fica sabendo antes de todo mundo." : `Avisamos por e-mail assim que a ${nome} abrir.`}
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={enviar} className="grid gap-3 border border-line bg-paper p-5 sm:grid-cols-2">
      <p className="text-sm text-ink sm:col-span-2">
        {esgotada ? "Quer ficar sabendo da próxima edição numerada?" : "Deixe seu e-mail e a gente avisa na hora em que abrir. As cadeiras são poucas."}
      </p>
      <label className="block text-sm">
        <span className="text-ink-soft">Seu nome</span>
        <input name="nome" maxLength={60} autoComplete="given-name" className="mt-1 w-full border border-line bg-canvas px-3 py-2 text-ink focus:border-ink focus:outline-none" />
      </label>
      <label className="block text-sm">
        <span className="text-ink-soft">Seu e-mail</span>
        <input name="email" type="email" required maxLength={120} autoComplete="email" className="mt-1 w-full border border-line bg-canvas px-3 py-2 text-ink focus:border-ink focus:outline-none" />
      </label>
      <input name="site" tabIndex={-1} autoComplete="off" aria-hidden className="hidden" />
      <label className="flex items-start gap-2 text-xs text-ink-soft sm:col-span-2">
        <input name="aceito" type="checkbox" required className="mt-0.5 h-4 w-4 accent-[var(--ink)]" />
        Aceito receber o aviso desta coleção e novidades do ateliê por e-mail. Dá para sair quando quiser.
      </label>
      <button
        type="submit"
        disabled={estado === "enviando"}
        data-rastro={`Lista de espera: ${nome}`}
        className="inline-flex items-center justify-center border border-ink bg-ink px-5 py-2.5 text-sm font-medium text-canvas transition-colors hover:bg-transparent hover:text-ink disabled:opacity-50 sm:col-span-2 sm:w-fit"
      >
        {estado === "enviando" ? "Enviando…" : "Quero ser avisado"}
      </button>
      {erro ? <p className="text-sm text-red-700 sm:col-span-2" role="alert">{erro}</p> : null}
    </form>
  );
}
