"use client";

import { useRouter } from "next/navigation";
import {
  createContext,
  startTransition,
  useContext,
  useActionState,
  useEffect,
  useId,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { Resultado } from "./actions";
import { AjustarFoto } from "./ajustar-foto";

export type FormatoFoto = "original" | "quadrada" | "empe" | "deitada" | "larga";

// ---------------------------------------------------------------------------
// Admin UI kit (redesigned 2026-10-05: the user found the old one-page panel
// "muito minimalista" and confusing — no feedback after saving, photos only
// as bare file inputs). Staff-only; uses the site's palette, softer shapes.
// ---------------------------------------------------------------------------

export const inputClass =
  "w-full rounded-lg border border-line bg-paper px-3.5 py-2.5 text-[0.95rem] text-ink shadow-[inset_0_1px_2px_rgba(36,31,26,0.04)] outline-none transition placeholder:text-ink-soft/60 focus:border-wood focus:ring-4 focus:ring-rattan/20";

export const btnPrimary =
  "inline-flex items-center justify-center gap-2 rounded-full bg-wood px-5 py-2.5 text-sm font-semibold text-paper shadow-sm transition hover:bg-wood-dark focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-rattan/40 disabled:cursor-not-allowed disabled:opacity-60 whitespace-nowrap";

export const btnSecondary =
  "inline-flex items-center justify-center gap-2 rounded-full border border-line bg-paper px-4 py-2 text-sm font-medium text-ink transition hover:border-wood hover:text-wood-dark whitespace-nowrap";

export function Field({ label, dica, children }: { label: string; dica?: ReactNode; children: ReactNode }) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-ink">{label}</span>
      {dica ? <span className="mt-0.5 block text-xs text-ink-soft">{dica}</span> : null}
      <div className="mt-1.5">{children}</div>
    </label>
  );
}

export function Card({
  titulo,
  descricao,
  acao,
  children,
  className = "",
}: {
  titulo?: ReactNode;
  descricao?: ReactNode;
  acao?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`rounded-2xl border border-line/70 bg-paper p-5 shadow-[0_1px_3px_rgba(36,31,26,0.06)] sm:p-7 ${className}`}>
      {titulo || acao ? (
        <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
          <div>
            {titulo ? <h2 className="font-serif text-xl font-medium tracking-tight text-ink sm:text-2xl">{titulo}</h2> : null}
            {descricao ? <p className="mt-1 max-w-prose text-sm text-ink-soft">{descricao}</p> : null}
          </div>
          {acao}
        </div>
      ) : null}
      {children}
    </section>
  );
}

// --- toasts -----------------------------------------------------------------

type Toast = { id: number; tipo: "ok" | "erro" | "info"; texto: string };

export function avisar(tipo: Toast["tipo"], texto: string) {
  window.dispatchEvent(new CustomEvent("admin-toast", { detail: { tipo, texto } }));
}

export function Toaster() {
  const [lista, setLista] = useState<Toast[]>([]);
  useEffect(() => {
    let n = 0;
    const on = (e: Event) => {
      const { tipo, texto } = (e as CustomEvent).detail as Omit<Toast, "id">;
      const id = ++n;
      setLista((l) => [...l.slice(-2), { id, tipo, texto }]);
      setTimeout(() => setLista((l) => l.filter((t) => t.id !== id)), tipo === "erro" ? 9000 : 5000);
    };
    window.addEventListener("admin-toast", on);
    return () => window.removeEventListener("admin-toast", on);
  }, []);
  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 top-0 z-[80] flex flex-col items-center gap-2 p-3 pt-[calc(0.75rem+env(safe-area-inset-top))] sm:items-end sm:p-5"
    >
      {lista.map((t) => (
        <div
          key={t.id}
          role={t.tipo === "erro" ? "alert" : "status"}
          className={`admin-toast pointer-events-auto flex max-w-sm items-start gap-3 rounded-xl px-4 py-3 text-sm shadow-lg ring-1 ${
            t.tipo === "erro"
              ? "bg-[#fbeee8] text-clay-dark ring-clay/30"
              : t.tipo === "ok"
                ? "bg-espresso text-paper ring-black/10"
                : "bg-paper text-ink ring-line"
          }`}
        >
          <span aria-hidden className="mt-0.5 text-base leading-none">
            {t.tipo === "erro" ? "⚠" : t.tipo === "ok" ? "✓" : "ℹ"}
          </span>
          <span>{t.texto}</span>
        </div>
      ))}
    </div>
  );
}

// --- "is it live yet?" chip --------------------------------------------------

export function StatusPublicacao() {
  const [estado, setEstado] = useState<"no-ar" | "publicando" | "desconhecido">("desconhecido");
  const anterior = useRef(estado);
  const rapidoAte = useRef(0);

  useEffect(() => {
    let parar = false;
    let timer: ReturnType<typeof setTimeout>;
    const checar = async () => {
      try {
        const r = await fetch("/api/admin/status", { cache: "no-store" });
        const j = (await r.json()) as { estado?: typeof estado };
        if (!parar && j.estado) {
          if (anterior.current === "publicando" && j.estado === "no-ar") {
            avisar("ok", "Pronto! Suas alterações já estão no site.");
          }
          anterior.current = j.estado;
          setEstado(j.estado);
        }
      } catch {}
      if (parar) return;
      const rapido = anterior.current === "publicando" || Date.now() < rapidoAte.current;
      timer = setTimeout(checar, rapido ? 5000 : 60000);
    };
    const aoSalvar = () => {
      rapidoAte.current = Date.now() + 4 * 60_000;
      clearTimeout(timer);
      timer = setTimeout(checar, 1500);
    };
    checar();
    window.addEventListener("admin-salvou", aoSalvar);
    return () => {
      parar = true;
      clearTimeout(timer);
      window.removeEventListener("admin-salvou", aoSalvar);
    };
  }, []);

  if (estado === "desconhecido") return null;
  const publicando = estado === "publicando";
  return (
    <span
      title={publicando ? "A alteração salva está sendo publicada. Leva 1 a 2 minutos." : "O site está com a última versão salva."}
      className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${
        publicando ? "bg-rattan/15 text-wood-dark" : "bg-verde/10 text-verde-escuro"
      }`}
    >
      <span className={`h-2 w-2 rounded-full ${publicando ? "animate-pulse bg-rattan" : "bg-verde"}`} />
      {publicando ? "Atualizando o site…" : "Site atualizado"}
    </span>
  );
}

// --- forms ------------------------------------------------------------------

let formsSujos = 0;
function marcarSujo(sujo: boolean, era: boolean) {
  if (sujo === era) return;
  formsSujos += sujo ? 1 : -1;
}
if (typeof window !== "undefined") {
  window.addEventListener("beforeunload", (e) => {
    if (formsSujos > 0) e.preventDefault();
  });
}

type Acao = (prev: Resultado, fd: FormData) => Promise<Resultado>;

/**
 * Form wired to a Server Action that returns a `Resultado`: shows a toast,
 * follows `ir`, pings the publish chip, and remounts its fields after a
 * SUCCESSFUL save (picking up the new saved values, clearing picked photos so
 * they aren't sent twice) — a failed save keeps everything that was typed.
 */
export function AdminForm({
  action,
  children,
  className,
}: {
  action: Acao;
  children: ReactNode | ((s: { sujo: boolean; pendente: boolean }) => ReactNode);
  className?: string;
}) {
  const [sujo, setSujo] = useState(false);
  const [versao, setVersao] = useState(0);
  const router = useRouter();
  const sujoRef = useRef(false);

  const definirSujo = (v: boolean) => {
    marcarSujo(v, sujoRef.current);
    sujoRef.current = v;
    setSujo(v);
  };
  useEffect(() => () => marcarSujo(false, sujoRef.current), []);

  const [, despachar, pendente] = useActionState(async (prev: Resultado, fd: FormData) => {
    const r = await action(prev, fd);
    if (r?.ok) {
      avisar("ok", r.msg);
      window.dispatchEvent(new Event("admin-salvou"));
      definirSujo(false);
      setVersao((v) => v + 1);
      if (r.ir) router.push(r.ir);
    } else if (r) {
      avisar("erro", r.erro);
    }
    return r;
  }, undefined);

  return (
    <form
      className={className}
      onInput={() => !sujoRef.current && definirSujo(true)}
      onChange={() => !sujoRef.current && definirSujo(true)}
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        startTransition(() => despachar(fd));
      }}
    >
      <PendenteCtx value={pendente}>
      <SujoCtx value={sujo}>
        <fieldset disabled={pendente} className="contents">
          <div key={versao} className="contents">
            {typeof children === "function" ? children({ sujo, pendente }) : children}
          </div>
        </fieldset>
      </SujoCtx>
      </PendenteCtx>
    </form>
  );
}

function Spinner() {
  return <span aria-hidden className="h-4 w-4 animate-spin rounded-full border-2 border-current border-r-transparent" />;
}

// Forms submit through useActionState by hand (so a failed save isn't
// auto-reset), which useFormStatus doesn't see — the pending flag comes from here.
const PendenteCtx = createContext(false);
const SujoCtx = createContext(false);

export function SaveButton({ children = "Salvar alterações", className = btnPrimary }: { children?: ReactNode; className?: string }) {
  const pending = useContext(PendenteCtx);
  return (
    <button type="submit" disabled={pending} className={className}>
      {pending ? (
        <>
          <Spinner /> Salvando…
        </>
      ) : (
        children
      )}
    </button>
  );
}

/** Sticky bottom bar for long forms: appears highlighted once something changed. */
export function BarraSalvar({ texto = "Salvar alterações" }: { texto?: string }) {
  const sujo = useContext(SujoCtx);
  const pendente = useContext(PendenteCtx);
  return (
    <div className="sticky bottom-[calc(3.6rem+env(safe-area-inset-bottom))] z-20 -mx-5 mt-8 lg:bottom-0 border-t border-line/70 bg-paper/95 px-5 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] backdrop-blur sm:-mx-7 sm:px-7">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className={`text-sm ${sujo ? "font-semibold text-wood-dark" : "text-ink-soft"}`}>
          {pendente ? "Enviando… pode levar alguns segundos se tiver foto." : sujo ? "● Você tem alterações não salvas" : "Tudo salvo"}
        </p>
        <SaveButton>{texto}</SaveButton>
      </div>
    </div>
  );
}

/** Delete button with an inline "are you sure?" step (no browser popup). */
export function BotaoExcluir({
  action,
  rotulo,
  pergunta,
  className = "",
}: {
  action: Acao;
  rotulo: string;
  pergunta: string;
  className?: string;
}) {
  const [confirmando, setConfirmando] = useState(false);
  return (
    <AdminForm action={action} className={className}>
      {({ pendente }) =>
        confirmando || pendente ? (
          <div className="flex flex-wrap items-center gap-2 rounded-xl bg-[#fbeee8] px-3 py-2 text-sm text-clay-dark">
            <span>{pergunta}</span>
            <button type="submit" className="rounded-full bg-clay px-3 py-1 font-semibold text-paper hover:bg-clay-dark">
              {pendente ? "Excluindo…" : "Sim, excluir"}
            </button>
            <button type="button" onClick={() => setConfirmando(false)} className="px-2 py-1 font-medium underline">
              Cancelar
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setConfirmando(true)}
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium text-clay transition hover:bg-clay/10"
          >
            <TrashIcon /> {rotulo}
          </button>
        )
      }
    </AdminForm>
  );
}

export function TrashIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className} aria-hidden>
      <path d="M4 7h16M9 7V4.5h6V7M6.5 7l1 13h9l1-13M10 11v6M14 11v6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// --- photos -----------------------------------------------------------------

const ACEITOS = ["image/jpeg", "image/png", "image/webp"];
const LADO_MAX = 2000;

/** Shrinks big phone photos in the browser before upload (faster saves,
 * stays under the 10 MB limit) and turns any image the browser can read
 * (e.g. HEIC on iPhone) into JPEG. */
async function prepararImagem(f: File): Promise<File | null> {
  const pequena = f.size < 1.2 * 1024 * 1024 && ACEITOS.includes(f.type);
  try {
    const bmp = await createImageBitmap(f);
    const escala = Math.min(1, LADO_MAX / Math.max(bmp.width, bmp.height));
    if (pequena && escala === 1) return f;
    const c = document.createElement("canvas");
    c.width = Math.round(bmp.width * escala);
    c.height = Math.round(bmp.height * escala);
    const ctx = c.getContext("2d");
    if (!ctx) return ACEITOS.includes(f.type) ? f : null;
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, c.width, c.height);
    ctx.drawImage(bmp, 0, 0, c.width, c.height);
    const blob = await new Promise<Blob | null>((r) => c.toBlob(r, "image/jpeg", 0.86));
    if (!blob) return ACEITOS.includes(f.type) ? f : null;
    return new File([blob], f.name.replace(/\.[^.]+$/, "") + ".jpg", { type: "image/jpeg" });
  } catch {
    return ACEITOS.includes(f.type) ? f : null;
  }
}

async function prepararVarias(arquivos: File[]) {
  const ok: File[] = [];
  for (const f of arquivos) {
    const p = await prepararImagem(f);
    if (p) ok.push(p);
    else avisar("erro", `"${f.name}" não é uma foto que o site aceite. Use JPG ou PNG.`);
  }
  return ok;
}

function definirArquivos(input: HTMLInputElement | null, arquivos: File[]) {
  if (!input) return;
  const dt = new DataTransfer();
  arquivos.forEach((f) => dt.items.add(f));
  input.files = dt.files;
  input.dispatchEvent(new Event("change", { bubbles: true }));
}

function useSoltar(aoSoltar: (f: File[]) => void) {
  const [sobre, setSobre] = useState(false);
  return {
    sobre,
    props: {
      onDragOver: (e: React.DragEvent) => {
        e.preventDefault();
        setSobre(true);
      },
      onDragLeave: () => setSobre(false),
      onDrop: (e: React.DragEvent) => {
        e.preventDefault();
        setSobre(false);
        aoSoltar(Array.from(e.dataTransfer.files).filter((f) => f.type.startsWith("image/") || /\.(heic|heif)$/i.test(f.name)));
      },
    },
  };
}

/**
 * One photo slot: shows the current photo, lets you swap it (click or drag a
 * file in) or mark it for removal. Sends `name` (file) and `removerName`
 * ("on") with the form, as the Server Actions expect.
 */
export function FotoSlot({
  name,
  removerName,
  atual,
  rotulo,
  vazio = "Adicionar foto",
  destaque = false,
  formato,
}: {
  name: string;
  removerName?: string;
  atual?: string;
  rotulo?: string;
  vazio?: string;
  destaque?: boolean;
  /** Shape the "Ajustar" window starts with. */
  formato?: FormatoFoto;
}) {
  const id = useId();
  const input = useRef<HTMLInputElement>(null);
  const [nova, setNova] = useState<string | null>(null);
  const [remover, setRemover] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const [ajustando, setAjustando] = useState<string | null>(null);

  useEffect(() => () => void (nova && URL.revokeObjectURL(nova)), [nova]);

  const escolher = async (fs: File[]) => {
    if (!fs[0]) return;
    setCarregando(true);
    const [f] = await prepararVarias([fs[0]]);
    setCarregando(false);
    if (!f) return;
    definirArquivos(input.current, [f]);
    setNova(URL.createObjectURL(f));
    setRemover(false);
  };
  const { sobre, props } = useSoltar(escolher);
  const mostrar = nova ?? (remover ? null : atual);

  return (
    <div className="min-w-0">
      {rotulo ? <p className="mb-1.5 text-sm font-semibold text-ink">{rotulo}</p> : null}
      <div
        {...props}
        className={`group relative overflow-hidden rounded-xl border-2 border-dashed transition ${
          destaque ? "aspect-[4/5]" : "aspect-square"
        } ${sobre ? "border-wood bg-rattan/10" : mostrar ? "border-transparent bg-canvas-deep" : "border-line bg-canvas hover:border-wood"}`}
      >
        {mostrar ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={mostrar} alt="" className="absolute inset-0 h-full w-full object-cover" />
        ) : null}
        <label
          htmlFor={id}
          className={`absolute inset-0 flex cursor-pointer flex-col items-center justify-center gap-1 p-2 text-center text-xs font-medium ${
            mostrar ? "bg-espresso/0 text-transparent transition group-hover:bg-espresso/45 group-hover:text-paper" : "text-ink-soft"
          }`}
        >
          {carregando ? (
            <Spinner />
          ) : (
            <>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-6 w-6" aria-hidden>
                <path d="M4 16.5V19a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-2.5M12 4v11M7.5 8.5 12 4l4.5 4.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              {mostrar ? "Trocar foto" : sobre ? "Solte aqui" : vazio}
            </>
          )}
        </label>
        {nova ? (
          <span className="absolute left-2 top-2 rounded-full bg-verde px-2 py-0.5 text-[0.7rem] font-semibold text-paper shadow">
            Nova
          </span>
        ) : null}
        {remover ? (
          <span className="absolute inset-x-2 top-2 rounded-full bg-clay px-2 py-0.5 text-center text-[0.7rem] font-semibold text-paper shadow">
            Será removida ao salvar
          </span>
        ) : null}
        <input id={id} ref={input} type="file" name={name} accept="image/*" className="sr-only" onChange={(e) => {
          // Files picked through the native dialog (not ones we set ourselves).
          if (e.isTrusted && e.target.files?.[0]) escolher(Array.from(e.target.files));
        }} />
        {removerName ? <input type="checkbox" name={removerName} checked={remover} readOnly hidden /> : null}
      </div>
      {ajustando ? (
        <AjustarFoto
          src={ajustando}
          formatoInicial={formato ?? (destaque ? "empe" : "original")}
          onCancelar={() => setAjustando(null)}
          onPronto={(f, previa) => {
            definirArquivos(input.current, [f]);
            setNova(previa);
            setRemover(false);
            setAjustando(null);
          }}
        />
      ) : null}
      {mostrar || nova || (atual && removerName) ? (
        <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1 text-xs font-medium">
          {mostrar ? (
            <button type="button" className="text-wood-dark hover:underline" onClick={() => setAjustando(mostrar)}>
              Ajustar
            </button>
          ) : null}
          {nova ? (
            <button
              type="button"
              className="text-ink-soft underline hover:text-ink"
              onClick={() => {
                definirArquivos(input.current, []);
                setNova(null);
              }}
            >
              Desfazer
            </button>
          ) : null}
          {atual && removerName && !nova ? (
            <button
              type="button"
              className={remover ? "text-ink-soft underline" : "text-clay hover:underline"}
              onClick={() => {
                setRemover((r) => !r);
                input.current?.form?.dispatchEvent(new Event("input", { bubbles: true }));
              }}
            >
              {remover ? "Manter foto" : "Remover"}
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

/** Gallery of extra photos: tick existing ones off, add several new at once. */
export function GaleriaFotos({
  existentes,
  max,
  name,
  removerName,
}: {
  existentes: string[];
  max: number;
  name: string;
  removerName: string;
}) {
  const id = useId();
  const input = useRef<HTMLInputElement>(null);
  const [remover, setRemover] = useState<Set<string>>(new Set());
  const [novas, setNovas] = useState<{ f: File; url: string }[]>([]);
  const [carregando, setCarregando] = useState(false);
  const [ajustando, setAjustando] = useState<{ src: string; url?: string; i?: number } | null>(null);
  const total = existentes.length - remover.size + novas.length;
  const botaoAjustar = "absolute bottom-1.5 left-1.5 rounded-full bg-paper/90 px-2 py-0.5 text-[0.7rem] font-semibold text-wood-dark shadow hover:bg-paper";

  const adicionar = async (fs: File[]) => {
    const espaco = max - total;
    if (espaco <= 0) return avisar("info", `O limite é ${max} fotos extras. Remova alguma antes.`);
    setCarregando(true);
    const ok = await prepararVarias(fs.slice(0, espaco));
    setCarregando(false);
    if (fs.length > espaco) avisar("info", `Só cabem mais ${espaco}; o resto foi ignorado.`);
    const lista = [...novas, ...ok.map((f) => ({ f, url: URL.createObjectURL(f) }))];
    setNovas(lista);
    definirArquivos(input.current, lista.map((n) => n.f));
  };
  const { sobre, props } = useSoltar(adicionar);

  return (
    <div {...props} className={`rounded-xl p-1 transition ${sobre ? "bg-rattan/10 ring-2 ring-wood" : ""}`}>
      {ajustando ? (
        <AjustarFoto
          src={ajustando.src}
          onCancelar={() => setAjustando(null)}
          onPronto={(f, previa) => {
            const alvo = ajustando;
            setAjustando(null);
            let lista: { f: File; url: string }[];
            if (alvo.i !== undefined) {
              // a new photo: swap it for the adjusted one
              lista = novas.map((n, j) => (j === alvo.i ? { f, url: previa } : n));
            } else {
              // a saved photo: it's removed and the adjusted copy is added
              setRemover((s) => new Set(s).add(alvo.url!));
              lista = [...novas, { f, url: previa }];
            }
            setNovas(lista);
            definirArquivos(input.current, lista.map((n) => n.f));
          }}
        />
      ) : null}
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-5">
        {existentes.map((url) => {
          const sai = remover.has(url);
          return (
            <div key={url} className="relative aspect-square overflow-hidden rounded-xl bg-canvas-deep">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt="" className={`h-full w-full object-cover transition ${sai ? "opacity-30 grayscale" : ""}`} />
              {sai ? <input type="hidden" name={removerName} value={url} /> : null}
              {!sai ? (
                <button type="button" onClick={() => setAjustando({ src: url, url })} className={botaoAjustar}>
                  Ajustar
                </button>
              ) : null}
              <button
                type="button"
                onClick={() => {
                  setRemover((s) => {
                    const n = new Set(s);
                    if (n.has(url)) n.delete(url);
                    else n.add(url);
                    return n;
                  });
                  input.current?.form?.dispatchEvent(new Event("input", { bubbles: true }));
                }}
                className={`absolute right-1.5 top-1.5 rounded-full px-2 py-0.5 text-[0.7rem] font-semibold shadow ${
                  sai ? "bg-paper text-ink" : "bg-paper/90 text-clay hover:bg-clay hover:text-paper"
                }`}
              >
                {sai ? "Manter" : "Remover"}
              </button>
            </div>
          );
        })}
        {novas.map((n, i) => (
          <div key={n.url} className="relative aspect-square overflow-hidden rounded-xl bg-canvas-deep ring-2 ring-verde/60">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={n.url} alt="" className="h-full w-full object-cover" />
            <span className="absolute left-1.5 top-1.5 rounded-full bg-verde px-2 py-0.5 text-[0.7rem] font-semibold text-paper">Nova</span>
            <button type="button" onClick={() => setAjustando({ src: n.url, i })} className={botaoAjustar}>
              Ajustar
            </button>
            <button
              type="button"
              onClick={() => {
                const lista = novas.filter((_, j) => j !== i);
                URL.revokeObjectURL(n.url);
                setNovas(lista);
                definirArquivos(input.current, lista.map((x) => x.f));
              }}
              className="absolute right-1.5 top-1.5 rounded-full bg-paper/90 px-2 py-0.5 text-[0.7rem] font-semibold text-ink shadow"
            >
              Tirar
            </button>
          </div>
        ))}
        {total < max ? (
          <label
            htmlFor={id}
            className="flex aspect-square cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-line bg-canvas p-2 text-center text-xs font-medium text-ink-soft transition hover:border-wood hover:text-wood-dark"
          >
            {carregando ? <Spinner /> : <span className="text-2xl leading-none">+</span>}
            {sobre ? "Solte aqui" : "Adicionar fotos"}
          </label>
        ) : null}
      </div>
      <p className="mt-2 text-xs text-ink-soft">
        {total} de {max} fotos. Pode escolher várias de uma vez ou arrastar para cá.
      </p>
      <input
        id={id}
        ref={input}
        type="file"
        name={name}
        accept="image/*"
        multiple
        className="sr-only"
        onChange={(e) => {
          if (e.isTrusted && e.target.files?.length) {
            const fs = Array.from(e.target.files);
            definirArquivos(input.current, novas.map((n) => n.f));
            adicionar(fs);
          }
        }}
      />
    </div>
  );
}

/** Text field with a live character counter. */
export function CampoTexto({
  name,
  defaultValue = "",
  max,
  linhas,
  placeholder,
  required,
}: {
  name: string;
  defaultValue?: string;
  max?: number;
  linhas?: number;
  placeholder?: string;
  required?: boolean;
}) {
  const [n, setN] = useState(defaultValue.length);
  const comum = {
    name,
    defaultValue,
    maxLength: max,
    placeholder,
    required,
    className: inputClass,
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setN(e.target.value.length),
  };
  return (
    <div>
      {linhas ? <textarea rows={linhas} {...comum} /> : <input {...comum} />}
      {max ? <p className="mt-1 text-right text-[0.7rem] text-ink-soft">{n}/{max}</p> : null}
    </div>
  );
}
