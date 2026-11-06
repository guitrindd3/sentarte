"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useCart } from "@/lib/cart-context";
import { idDaVisita } from "@/lib/rastro";
import { EVENTO_CUPOM } from "@/lib/use-cupons";

// Welcome-coupon window (2026-11-05, user: "cupom para quem vai sair do
// site"). Shows ONCE per browser (again only after 14 days if just closed,
// never after signing up or when a coupon is already in the cart):
// - computer: the mouse leaves through the top of the page (going to the tabs
//   / address bar), after 10 s on the site;
// - phone (no mouse): a quick scroll back up after reading down the page, or
//   60 s on the site — there's no real "leaving" signal on phones.
// Never on admin/order pages, while the cart is open or while typing. The
// discount and on/off come from /api/boas-vindas (admin → Campanhas), asked
// only at the moment it would show. Off during Black Friday week.

const CHAVE = "sentarte-janela";
const SEM_ROTAS = ["/admin", "/pedido", "/acompanhar", "/retomar", "/sair-da-lista", "/p/", "/colecao/"];
const DIA = 86_400_000;

type Info = { rotulo: string; condicao: string; validade: string };
type Ganhou = { codigo: string; rotulo: string; condicao: string; validoAte?: string; porEmail: boolean; jaTinha: boolean };
const QUALQUER = "em qualquer cadeira do site";

function podeMostrar() {
  try {
    if (localStorage.getItem("sentarte-cupom")) return false;
    if (sessionStorage.getItem("sentarte-janela-off")) return false;
    const j = JSON.parse(localStorage.getItem(CHAVE) ?? "null") as { estado?: string; quando?: number } | null;
    if (j?.estado === "cadastrado") return false;
    if (j?.quando && Date.now() - j.quando < 14 * DIA) return false;
    return true;
  } catch {
    return false;
  }
}

function anotar(estado: "visto" | "cadastrado") {
  try {
    localStorage.setItem(CHAVE, JSON.stringify({ estado, quando: Date.now() }));
  } catch {}
}

function chegouEm() {
  try {
    const t = Number(sessionStorage.getItem("sentarte-chegou"));
    if (t) return t;
    sessionStorage.setItem("sentarte-chegou", String(Date.now()));
  } catch {}
  return Date.now();
}

const digitando = () => {
  const a = document.activeElement;
  return !!a && (a.tagName === "INPUT" || a.tagName === "TEXTAREA" || a.tagName === "SELECT");
};

export function JanelaCupom() {
  const pathname = usePathname();
  const { isOpen: carrinhoAberto } = useCart();
  const [info, setInfo] = useState<Info | null>(null);
  const [ganhou, setGanhou] = useState<Ganhou | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState("");
  const bloqueado = useRef(false);
  const carrinhoRef = useRef(carrinhoAberto);
  const primeiroCampo = useRef<HTMLInputElement>(null);
  useEffect(() => {
    carrinhoRef.current = carrinhoAberto;
  }, [carrinhoAberto]);

  const foraDaRota = SEM_ROTAS.some((r) => pathname.startsWith(r));

  useEffect(() => {
    if (foraDaRota || info || ganhou || !podeMostrar()) return;
    const chegou = chegouEm();
    let ativo = true;

    const tentar = async () => {
      if (!ativo || bloqueado.current || carrinhoRef.current || digitando() || !podeMostrar()) return;
      bloqueado.current = true;
      try {
        const r = await fetch("/api/boas-vindas", { cache: "no-store" });
        const j = (await r.json()) as { ligado?: boolean } & Partial<Info>;
        if (!ativo) return;
        if (!j.ligado || !j.rotulo) {
          try {
            sessionStorage.setItem("sentarte-janela-off", "1");
          } catch {}
          return;
        }
        anotar("visto");
        setInfo({ rotulo: j.rotulo, condicao: j.condicao ?? QUALQUER, validade: j.validade ?? "" });
      } catch {
        bloqueado.current = false;
      }
    };

    const temMouse = window.matchMedia("(pointer: fine)").matches;
    const limpar: (() => void)[] = [];
    if (temMouse) {
      const saiu = (e: MouseEvent) => {
        if (!e.relatedTarget && e.clientY <= 0 && Date.now() - chegou > 10_000) tentar();
      };
      document.addEventListener("mouseout", saiu);
      limpar.push(() => document.removeEventListener("mouseout", saiu));
    } else {
      let fundo = 0;
      let ultimo = { y: window.scrollY, t: Date.now() };
      const rolou = () => {
        const y = window.scrollY;
        const t = Date.now();
        fundo = Math.max(fundo, y);
        // read down at least ~2 screens, then flicked back up fast
        if (fundo > 1200 && ultimo.y - y > 300 && t - ultimo.t < 350 && t - chegou > 20_000) tentar();
        if (t - ultimo.t > 120) ultimo = { y, t };
      };
      window.addEventListener("scroll", rolou, { passive: true });
      limpar.push(() => window.removeEventListener("scroll", rolou));
    }
    const restante = Math.max(5_000, 60_000 - (Date.now() - chegou));
    const timer = window.setTimeout(tentar, restante);
    limpar.push(() => window.clearTimeout(timer));

    return () => {
      ativo = false;
      limpar.forEach((f) => f());
    };
  }, [foraDaRota, info, ganhou]);

  const aberta = !!info && !foraDaRota;

  useEffect(() => {
    if (!aberta) return;
    // phones: no automatic keyboard popping up over a window nobody asked for
    if (window.matchMedia("(pointer: fine)").matches) primeiroCampo.current?.focus();
    const esc = (e: KeyboardEvent) => e.key === "Escape" && fechar();
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, [aberta]);

  function fechar() {
    setInfo(null);
    setGanhou(null);
  }

  if (!aberta || !info) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center bg-ink/50 sm:items-center sm:p-6" onClick={fechar}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="janela-cupom-titulo"
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-md border border-line bg-paper px-6 pb-7 pt-8 shadow-2xl sm:px-8"
      >
        <button type="button" onClick={fechar} aria-label="Fechar" className="absolute right-3 top-3 grid h-10 w-10 place-items-center text-2xl leading-none text-ink-soft hover:text-ink">
          ×
        </button>

        {ganhou ? (
          <div role="status">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ink-soft">{ganhou.jaTinha ? "Seu cupom" : "Prontinho!"}</p>
            <h2 id="janela-cupom-titulo" className="mt-2 font-serif text-2xl font-medium tracking-tight text-ink">
              {ganhou.jaTinha ? "Esse e-mail já tinha um cupom" : "Seu cupom chegou"}
            </h2>
            <p className="mt-5 border-2 border-dashed border-ink/40 bg-canvas py-4 text-center font-mono text-2xl font-bold tracking-[0.2em] text-ink">{ganhou.codigo}</p>
            <p className="mt-4 text-sm leading-relaxed text-ink">
              {ganhou.rotulo} de desconto {ganhou.condicao}
              {ganhou.validoAte ? `, até ${ganhou.validoAte.split("-").reverse().join("/")}` : ""}. Já colocamos no seu carrinho
              {ganhou.porEmail ? " e mandamos para o seu e-mail" : ""}.
            </p>
            <button type="button" onClick={fechar} className="mt-6 w-full rounded-full bg-verde px-6 py-3.5 text-sm font-semibold text-white hover:bg-verde-escuro">
              Continuar escolhendo
            </button>
          </div>
        ) : (
          <form
            data-sem-rastro
            onSubmit={async (e) => {
              e.preventDefault();
              const f = new FormData(e.currentTarget);
              setErro("");
              setEnviando(true);
              try {
                const r = await fetch("/api/boas-vindas", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ nome: f.get("nome"), email: f.get("email"), aceito: f.get("aceito") === "on", site: f.get("site"), vid: idDaVisita() }),
                });
                const j = (await r.json()) as { ok?: boolean; erro?: string } & Partial<Ganhou>;
                if (!r.ok || !j.ok) throw new Error(j.erro || "Não deu agora. Tente de novo.");
                anotar("cadastrado");
                if (j.codigo) {
                  window.dispatchEvent(new CustomEvent(EVENTO_CUPOM, { detail: j.codigo }));
                  setGanhou({ codigo: j.codigo, rotulo: j.rotulo ?? info.rotulo, condicao: j.condicao ?? info.condicao, validoAte: j.validoAte, porEmail: !!j.porEmail, jaTinha: !!j.jaTinha });
                } else fechar();
              } catch (err) {
                setErro(err instanceof Error ? err.message : "Não deu agora. Tente de novo.");
              } finally {
                setEnviando(false);
              }
            }}
          >
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ink-soft">Antes de ir</p>
            <h2 id="janela-cupom-titulo" className="mt-2 font-serif text-[1.65rem] font-medium leading-tight tracking-tight text-ink">
              Ganhe {info.rotulo} de desconto {info.condicao === QUALQUER ? "na sua cadeira" : info.condicao}
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-ink-soft">
              Deixe seu e-mail e receba o cupom na hora.{info.validade ? ` ${info.validade}` : ""}{info.condicao === QUALQUER ? " Vale em qualquer cadeira do site." : ""}
            </p>
            <div className="mt-5 space-y-2.5">
              <label className="sr-only" htmlFor="jc-nome">Seu nome</label>
              <input id="jc-nome" ref={primeiroCampo} name="nome" autoComplete="given-name" maxLength={60} placeholder="Seu nome" className="w-full border border-line bg-canvas px-3.5 py-3 text-base text-ink placeholder:text-ink-soft focus:border-ink focus:outline-none" />
              <label className="sr-only" htmlFor="jc-email">Seu e-mail</label>
              <input id="jc-email" name="email" type="email" required inputMode="email" autoComplete="email" maxLength={120} placeholder="Seu e-mail" className="w-full border border-line bg-canvas px-3.5 py-3 text-base text-ink placeholder:text-ink-soft focus:border-ink focus:outline-none" />
              <input name="site" tabIndex={-1} autoComplete="off" aria-hidden className="hidden" />
            </div>
            <label className="mt-3 flex items-start gap-2.5 text-xs leading-relaxed text-ink-soft">
              <input type="checkbox" name="aceito" required className="mt-0.5 h-4 w-4 shrink-0 accent-[var(--ink)]" />
              <span>
                Aceito receber novidades e cupons do Ateliê SentArte por e-mail. Posso sair quando quiser.{" "}
                <Link href="/politica-de-privacidade" className="underline underline-offset-2">Privacidade</Link>
              </span>
            </label>
            {erro ? <p className="mt-3 text-sm text-clay-dark">{erro}</p> : null}
            <button type="submit" disabled={enviando} className="mt-5 w-full rounded-full bg-verde px-6 py-3.5 text-sm font-semibold text-white hover:bg-verde-escuro disabled:opacity-60">
              {enviando ? "Gerando seu cupom…" : "Quero meu cupom"}
            </button>
            <button type="button" onClick={fechar} className="mt-3 w-full py-2 text-sm text-ink-soft underline underline-offset-4 hover:text-ink">
              Agora não
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
