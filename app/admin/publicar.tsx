"use client";

import { useEffect, useRef, useState } from "react";

// Publishing UX (user 2026-11-03: "na hora de publicar ainda está confuso…
// quero mais detalhado no que eu vou fazer"):
// - ResumoSalvar: before a long form saves, a dialog lists every change
//   (old → new text, new/removed photos, options) and asks to confirm.
// - PainelPublicacao: after a save that committed, a progress card follows
//   the redeploy (Salvo → Atualizando o site → No ar) with "Ver no site".

// --- what changed in a form ---------------------------------------------------

export type Mudanca = {
  rotulo: string;
  antes?: string;
  depois?: string;
  /** new photos (object URLs) */
  fotos?: string[];
  /** a short note instead of before/after ("será removida") */
  nota?: string;
  cores?: [string, string];
};

type Campo = HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;

/** Everything a form would send, except files, keyed by field name. */
export function estadoDoForm(form: HTMLFormElement) {
  const m = new Map<string, string[]>();
  for (const [k, v] of new FormData(form)) {
    if (typeof v !== "string") continue;
    m.set(k, [...(m.get(k) ?? []), v]);
  }
  return m;
}

function rotuloDe(el: Element | null, nome: string) {
  if (!el) return nome;
  const marcado = el.closest("[data-rotulo]")?.getAttribute("data-rotulo");
  if (marcado) return marcado;
  const label = el.closest("label");
  const span = label?.querySelector("span");
  return (span?.textContent || label?.textContent || nome).trim();
}

function textoDoValor(form: HTMLFormElement, nome: string, valor: string | undefined) {
  if (valor === undefined || valor === "") return "(vazio)";
  const el = form.querySelector<Campo>(`[name="${CSS.escape(nome)}"]`);
  if (el instanceof HTMLSelectElement) {
    return Array.from(el.options).find((o) => o.value === valor)?.text ?? valor;
  }
  if (el instanceof HTMLInputElement && (el.type === "radio" || el.type === "checkbox")) {
    const opcao = form.querySelector<HTMLInputElement>(`[name="${CSS.escape(nome)}"][value="${CSS.escape(valor)}"]`);
    const t = opcao?.closest("label")?.getAttribute("data-opcao") ?? opcao?.closest("label")?.textContent?.trim();
    if (el.type === "checkbox" && !t) return "Sim";
    return t || valor;
  }
  return valor;
}

const curto = (s: string, n = 140) => (s.length > n ? `${s.slice(0, n - 1)}…` : s);

/** `previas: false` = only counting (no object URLs made for new photos). */
export function mudancasDoForm(form: HTMLFormElement, inicial: Map<string, string[]>, previas = true): Mudanca[] {
  const lista: Mudanca[] = [];
  const agora = estadoDoForm(form);
  const nomes = new Set([...inicial.keys(), ...agora.keys()]);
  const removidas = new Map<string, number>();

  for (const nome of nomes) {
    const a = inicial.get(nome) ?? [];
    const d = agora.get(nome) ?? [];
    if (a.join("\u0001") === d.join("\u0001")) continue;
    const el = form.querySelector<Campo>(`[name="${CSS.escape(nome)}"]`);
    const rotulo = rotuloDe(el, nome);

    // photo removal flags (FotoSlot checkbox "on", gallery hidden inputs with the URL)
    if (/^remover/i.test(nome)) {
      const n = d.length - a.length;
      if (n > 0) removidas.set(rotulo, (removidas.get(rotulo) ?? 0) + n);
      continue;
    }
    if (el instanceof HTMLInputElement && el.type === "color") {
      lista.push({ rotulo, cores: [a[0] ?? "#000000", d[0] ?? "#000000"] });
      continue;
    }
    if (el instanceof HTMLInputElement && el.type === "checkbox" && a.length + d.length <= 1) {
      lista.push({ rotulo, antes: a.length ? "Sim" : "Não", depois: d.length ? "Sim" : "Não" });
      continue;
    }
    if (a.length <= 1 && d.length <= 1) {
      lista.push({ rotulo, antes: curto(textoDoValor(form, nome, a[0])), depois: curto(textoDoValor(form, nome, d[0])) });
    } else {
      lista.push({ rotulo, nota: "Lista alterada" });
    }
  }

  for (const [rotulo, n] of removidas) {
    lista.push({ rotulo, nota: n === 1 && !/fotos/i.test(rotulo) ? "Foto será removida" : `${n} foto${n > 1 ? "s" : ""} será${n > 1 ? "ão" : ""} removida${n > 1 ? "s" : ""}` });
  }

  for (const input of Array.from(form.querySelectorAll<HTMLInputElement>('input[type="file"]'))) {
    const fs = Array.from(input.files ?? []);
    if (!fs.length) continue;
    lista.push({
      rotulo: rotuloDe(input, input.name),
      nota: fs.length === 1 ? "Foto nova" : `${fs.length} fotos novas`,
      fotos: previas ? fs.map((f) => URL.createObjectURL(f)) : [],
    });
  }
  return lista;
}

// --- confirm dialog -----------------------------------------------------------

export function ResumoSalvar({
  mudancas,
  onVoltar,
  onConfirmar,
}: {
  mudancas: Mudanca[];
  onVoltar: () => void;
  onConfirmar: () => void;
}) {
  const confirmar = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    confirmar.current?.focus();
    const esc = (e: KeyboardEvent) => e.key === "Escape" && onVoltar();
    window.addEventListener("keydown", esc);
    return () => {
      window.removeEventListener("keydown", esc);
      mudancas.forEach((m) => m.fotos?.forEach((u) => URL.revokeObjectURL(u)));
    };
  }, [mudancas, onVoltar]);

  return (
    <div className="fixed inset-0 z-[90] flex items-end justify-center bg-espresso/55 p-0 backdrop-blur-sm sm:items-center sm:p-6" onClick={onVoltar}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="titulo-resumo"
        onClick={(e) => e.stopPropagation()}
        className="admin-sobe flex max-h-[88vh] w-full max-w-lg flex-col overflow-hidden rounded-t-3xl bg-paper shadow-2xl ring-1 ring-black/5 sm:rounded-3xl"
      >
        <div className="border-b border-line/70 bg-gradient-to-br from-canvas to-paper px-6 pb-4 pt-6">
          <p className="text-xs font-semibold text-wood">Antes de publicar</p>
          <h2 id="titulo-resumo" className="mt-1 font-serif text-2xl font-medium tracking-tight text-ink">
            Confira o que vai mudar no site
          </h2>
          <p className="mt-1 text-sm text-ink-soft">
            {mudancas.length === 1 ? "1 alteração" : `${mudancas.length} alterações`}. Depois de confirmar, o site leva 1 a 2 minutos para atualizar.
          </p>
        </div>
        <ul className="flex-1 space-y-2.5 overflow-y-auto px-6 py-5">
          {mudancas.map((m, i) => (
            <li key={i} className="rounded-2xl border border-line/70 bg-canvas/60 px-4 py-3">
              <p className="text-sm font-semibold text-ink">{m.rotulo}</p>
              {m.cores ? (
                <p className="mt-1.5 flex items-center gap-2 text-sm text-ink-soft">
                  <span className="h-5 w-5 rounded-md ring-1 ring-black/10" style={{ background: m.cores[0] }} />
                  passa a ser
                  <span className="h-5 w-5 rounded-md ring-1 ring-black/10" style={{ background: m.cores[1] }} />
                </p>
              ) : m.nota ? (
                <p className={`mt-1 text-sm ${/removid/.test(m.nota) ? "text-clay-dark" : "text-verde-escuro"}`}>{m.nota}</p>
              ) : (
                <div className="mt-1.5 grid gap-1 text-sm">
                  <p className="text-ink-soft line-through decoration-clay/50">{m.antes}</p>
                  <p className="font-medium text-ink">{m.depois}</p>
                </div>
              )}
              {m.fotos?.length ? (
                <div className="mt-2 flex flex-wrap gap-2">
                  {m.fotos.map((u) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img key={u} src={u} alt="" className="h-14 w-14 rounded-lg object-cover ring-2 ring-verde/50" />
                  ))}
                </div>
              ) : null}
            </li>
          ))}
        </ul>
        <div className="flex flex-col-reverse gap-2 border-t border-line/70 bg-paper px-6 py-4 pb-[calc(1rem+env(safe-area-inset-bottom))] sm:flex-row sm:justify-end">
          <button type="button" onClick={onVoltar} className="rounded-full px-5 py-2.5 text-sm font-semibold text-ink-soft transition hover:bg-canvas-deep hover:text-ink">
            Voltar e editar
          </button>
          <button
            ref={confirmar}
            type="button"
            onClick={onConfirmar}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-verde px-6 py-2.5 text-sm font-semibold text-paper shadow-[0_6px_20px_-6px_rgb(31_157_85/0.7)] transition hover:bg-verde-escuro focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-verde/30"
          >
            <IconeEnviar /> Publicar no site
          </button>
        </div>
      </div>
    </div>
  );
}

function IconeEnviar() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4" aria-hidden>
      <path d="M5 12.5 10 17.5 19 7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// --- publish progress ---------------------------------------------------------

export type DetalheSalvou = { msg: string; commit?: string; verNoSite?: string };

const MEDIA_MS = 80_000; // a typical build + promote

export function PainelPublicacao() {
  const [pub, setPub] = useState<{ commit: string; msg: string; link?: string; inicio: number } | null>(null);
  const [fase, setFase] = useState<"publicando" | "no-ar" | "erro">("publicando");
  const [agora, setAgora] = useState(0);

  useEffect(() => {
    const on = (e: Event) => {
      const d = (e as CustomEvent<DetalheSalvou>).detail;
      if (!d?.commit) return;
      const inicio = Date.now();
      setPub({ commit: d.commit, msg: d.msg, link: d.verNoSite, inicio });
      setFase("publicando");
      setAgora(inicio);
    };
    window.addEventListener("admin-salvou", on);
    return () => window.removeEventListener("admin-salvou", on);
  }, []);

  // follow the deploy
  useEffect(() => {
    if (!pub || fase !== "publicando") return;
    let parar = false;
    let timer: ReturnType<typeof setTimeout>;
    const relogio = setInterval(() => setAgora(Date.now()), 500);
    const checar = async () => {
      try {
        const r = await fetch(`/api/admin/status?sha=${pub.commit}`, { cache: "no-store" });
        const j = (await r.json()) as { estado?: string };
        if (parar) return;
        if (j.estado === "no-ar") return setFase("no-ar");
        if (j.estado === "desconhecido") return setFase("erro");
      } catch {}
      if (!parar) timer = setTimeout(checar, 4000);
    };
    timer = setTimeout(checar, 3000);
    return () => {
      parar = true;
      clearTimeout(timer);
      clearInterval(relogio);
    };
  }, [pub, fase]);

  // close by itself a while after it's live
  useEffect(() => {
    if (fase !== "no-ar") return;
    const t = setTimeout(() => setPub(null), 45_000);
    return () => clearTimeout(t);
  }, [fase, pub]);

  if (!pub) return null;
  const passou = Math.max(0, agora - pub.inicio);
  const pronto = fase === "no-ar";
  // eases towards 92% while waiting; jumps to 100% when live
  const pct = pronto ? 100 : Math.min(92, 6 + 86 * (1 - Math.exp(-passou / (MEDIA_MS * 0.55))));
  const demorando = !pronto && passou > 4 * 60_000;
  const seg = Math.round(passou / 1000);

  const etapas = [
    { t: "Alterações salvas", ok: true, ativo: false },
    { t: pronto ? "Site montado" : "Montando o site com a novidade", ok: pronto, ativo: !pronto },
    { t: "No ar para os clientes", ok: pronto, ativo: false },
  ];

  return (
    <div
      role="status"
      aria-live="polite"
      className="admin-sobe fixed inset-x-3 bottom-[calc(5.6rem+env(safe-area-inset-bottom))] z-[85] sm:inset-x-auto sm:right-5 sm:w-[23rem] lg:bottom-5"
    >
      <div className="overflow-hidden rounded-3xl bg-espresso text-paper shadow-[0_24px_60px_-20px_rgba(20,14,8,0.65)] ring-1 ring-white/10">
        <div className="flex items-start justify-between gap-3 px-5 pt-4">
          <div>
            <p className="text-xs font-semibold text-rattan">{pronto ? "Publicado" : fase === "erro" ? "Salvo" : "Publicando"}</p>
            <p className="mt-0.5 text-base font-semibold leading-snug">
              {pronto ? "Pronto! Já está no site." : fase === "erro" ? "Salvo. Confira o site em 2 minutos." : demorando ? "Está demorando mais que o normal…" : "Atualizando o site…"}
            </p>
          </div>
          <button type="button" onClick={() => setPub(null)} className="-mr-1 rounded-full p-1.5 text-paper/60 transition hover:bg-white/10 hover:text-paper" aria-label="Fechar">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4" aria-hidden>
              <path d="M6 6l12 12M18 6 6 18" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <div className="px-5 pt-3">
          <div className="h-2 overflow-hidden rounded-full bg-white/10">
            <div
              className={`h-full rounded-full transition-[width] duration-700 ease-out ${pronto ? "bg-verde" : "admin-listras bg-rattan"}`}
              style={{ width: `${pct}%` }}
            />
          </div>
          <div className="mt-1.5 flex justify-between text-xs text-paper/55">
            <span>{Math.round(pct)}%</span>
            <span>{pronto ? `em ${seg}s` : `${seg}s, costuma levar 1 a 2 min`}</span>
          </div>
        </div>

        <ol className="space-y-2 px-5 py-3.5">
          {etapas.map((e) => (
            <li key={e.t} className="flex items-center gap-2.5 text-sm">
              <span
                className={`grid h-5 w-5 shrink-0 place-items-center rounded-full text-[0.65rem] font-bold ${
                  e.ok ? "bg-verde text-paper" : e.ativo ? "bg-rattan/25 ring-2 ring-rattan" : "bg-white/10"
                }`}
              >
                {e.ok ? "✓" : e.ativo ? <span className="h-1.5 w-1.5 animate-ping rounded-full bg-rattan" /> : null}
              </span>
              <span className={e.ok || e.ativo ? "text-paper" : "text-paper/45"}>{e.t}</span>
            </li>
          ))}
        </ol>

        <div className="flex items-center justify-between gap-3 border-t border-white/10 px-5 py-3">
          <p className="text-xs text-paper/55">{pronto ? pub.msg.replace(/O site atualiza.*$/, "").trim() || "Tudo certo." : "Pode continuar editando."}</p>
          {pronto ? (
            <a
              href={pub.link ?? "/"}
              target="_blank"
              rel="noreferrer"
              className="shrink-0 rounded-full bg-paper px-4 py-1.5 text-sm font-semibold text-espresso transition hover:bg-rattan"
            >
              Ver no site
            </a>
          ) : null}
        </div>
      </div>
    </div>
  );
}
