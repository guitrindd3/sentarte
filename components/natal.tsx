"use client";

// Christmas decorations (user 2026-11-12, from the approved preview: garland
// with hanging ornaments, gold sparkles + shooting star on the hero, ribbon
// bow on chair photos, gold star on the logo, lights under titles, a gift box
// whose vale tags fly out on hover/tap, a rope Christmas tree on sand, and the
// top strip with lights and the NATALNASENTARTE10 coupon). Everything renders
// only while `useNatal()` is true: 1–25 December in Brasília (lib/natal.ts),
// or `?natal=1` to preview it on any day (kept for the tab; `?natal=0` ends it).
// Pages are cached, so the date is checked in the browser.

import { useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import { useCart } from "@/lib/cart-context";
import { hojeBR } from "@/lib/black-friday";
import { CODIGO_NATAL, naEpocaDeNatal, PERCENTUAL_NATAL, precoNatal } from "@/lib/natal";
import { formatBRL } from "@/lib/offer";
import { EVENTO_CUPOM } from "@/lib/use-cupons";
import { CATEGORIA_VALE, nomeDoVale, VALORES_VALE } from "@/lib/vale";

const PREVIA = "sentarte-natal-previa";

function natalAgora() {
  try {
    const q = new URLSearchParams(window.location.search).get("natal");
    if (q === "1") sessionStorage.setItem(PREVIA, "1");
    if (q === "0") sessionStorage.removeItem(PREVIA);
    if (sessionStorage.getItem(PREVIA) === "1") return true;
  } catch {}
  return naEpocaDeNatal(hojeBR());
}

export function useNatal() {
  return useSyncExternalStore(
    () => () => {},
    natalAgora,
    () => false,
  );
}

const CORES = ["#d9473b", "#e7b84a", "#3f9a5a", "#fff1c9"];
const r1 = (n: number) => Math.round(n * 10) / 10;

function useLargura<T extends HTMLElement | SVGSVGElement>() {
  const ref = useRef<T>(null);
  const [w, setW] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setW(Math.round(el.getBoundingClientRect().width)));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, w] as const;
}

/** A rope sagging between hooks with little blinking bulbs. Fills its parent's width. */
export function Varal({
  className = "",
  vao,
  porVao,
  y0 = 4,
  corda = "#c9b48f",
  z = 1,
}: {
  className?: string;
  vao?: number;
  porVao?: number;
  y0?: number;
  corda?: string;
  z?: number;
}) {
  const [ref, w] = useLargura<SVGSVGElement>();
  let conteudo: ReactNode = null;
  if (w) {
    const v = vao ?? (w > 700 ? 150 : 96);
    const pv = porVao ?? (w > 700 ? 5 : 4);
    const n = Math.max(1, Math.round(w / v));
    const passo = w / n,
      flecha = 6;
    let d = `M0 ${y0}`;
    for (let i = 0; i < n; i++) d += ` Q${r1(passo * i + passo / 2)} ${y0 + flecha * 2} ${r1(passo * (i + 1))} ${y0}`;
    const lampadas: ReactNode[] = [];
    let k = 0;
    for (let i = 0; i < n; i++)
      for (let j = 1; j < pv; j++) {
        const t = j / pv,
          x = passo * i + passo * t,
          y = y0 + 4 * flecha * t * (1 - t);
        const cor = CORES[k % CORES.length],
          atraso = `-${((k * 0.37) % 2.6).toFixed(2)}s`;
        lampadas.push(
          <g key={k}>
            <rect x={r1(x - 1.4)} y={r1(y)} width={2.8} height={3} fill="#6b5a44" />
            <ellipse
              className="natal-lampada"
              style={{ animationDelay: atraso, filter: "blur(2px)" }}
              cx={r1(x)}
              cy={r1(y + 3 + 3.6 * z)}
              rx={r1(5 * z)}
              ry={r1(6 * z)}
              fill={cor}
              opacity={0.45}
            />
            <ellipse
              className="natal-lampada"
              style={{ animationDelay: atraso }}
              cx={r1(x)}
              cy={r1(y + 3 + 3.6 * z)}
              rx={r1(2.7 * z)}
              ry={r1(3.8 * z)}
              fill={cor}
              stroke="rgba(60,40,20,.35)"
              strokeWidth={0.5}
            />
          </g>,
        );
        k++;
      }
    conteudo = (
      <>
        <path d={d} fill="none" stroke={corda} strokeWidth={1.6} strokeDasharray="3 1.4" />
        {lampadas}
      </>
    );
  }
  return (
    <svg ref={ref} aria-hidden className={`pointer-events-none block w-full overflow-visible ${className}`} height={26} viewBox={`0 0 ${w || 1} 22`}>
      {conteudo}
    </svg>
  );
}

/** Top strip in December: lights along it, the coupon message alternating with the calendar's own strip. */
export function FaixaDeNatal({ calendario }: { calendario?: ReactNode }) {
  const [vez, setVez] = useState(0);
  const [copiado, setCopiado] = useState("");
  useEffect(() => {
    if (!calendario || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = setInterval(() => setVez((v) => v + 1), 7000);
    return () => clearInterval(t);
  }, [calendario]);
  const mostrarCalendario = !!calendario && vez % 2 === 1;
  return (
    <div className="relative z-50 bg-ink px-4 pb-5 pt-2 text-center text-xs text-canvas sm:text-sm [&_a]:inline-block [&_a]:py-1 [&_a]:font-semibold [&_a]:!text-canvas [&_a]:underline [&_a]:underline-offset-2">
      {mostrarCalendario ? (
        <div className="py-1">{calendario}</div>
      ) : (
        <span className="inline-flex flex-wrap items-center justify-center gap-x-2.5 gap-y-1">
          <em className="font-serif text-base italic text-[#fff1c9]">Feliz Natal!</em>
          <span>
            Use o cupom e ganhe <b>{PERCENTUAL_NATAL}% de desconto</b> nas cadeiras.
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-sm border border-dashed border-[#fff1c9] py-0.5 pl-2 pr-1 font-semibold tracking-wide text-[#fff1c9]">
            {CODIGO_NATAL}
            <button
              type="button"
              data-rastro="Natal: usar cupom"
              onClick={() => {
                window.dispatchEvent(new CustomEvent(EVENTO_CUPOM, { detail: CODIGO_NATAL }));
                navigator.clipboard?.writeText(CODIGO_NATAL).catch(() => {});
                setCopiado("Já está no carrinho!");
                setTimeout(() => setCopiado(""), 2500);
              }}
              className="min-w-24 rounded-sm bg-[#fff1c9] px-2 py-1 text-xs tracking-normal text-ink"
            >
              {copiado || "Usar o cupom"}
            </button>
          </span>
        </span>
      )}
      <div className="absolute inset-x-0 -bottom-2.5">
        <Varal />
      </div>
    </div>
  );
}

/** Twinkling gold star on the logo's corner. */
export function EstrelaLogo() {
  if (!useNatal()) return null;
  return (
    <svg aria-hidden viewBox="0 0 20 20" className="pointer-events-none absolute -right-2 -top-2 h-[18px] w-[18px]">
      <g className="natal-cintila">
        <path d="M10 0 L12.2 7.8 L20 10 L12.2 12.2 L10 20 L7.8 12.2 L0 10 L7.8 7.8 Z" fill="#d9a441" />
        <circle cx="10" cy="10" r="2.2" fill="#fff1c9" />
      </g>
    </svg>
  );
}

function bola(cor: string) {
  return (
    <>
      <rect x={-2.6} y={-2} width={5.2} height={4} rx={1} fill="#d9a441" />
      <circle cx={0} cy={8} r={7} fill={cor} />
      <ellipse cx={-2.6} cy={5.2} rx={2} ry={1.3} fill="#fff" opacity={0.55} />
    </>
  );
}
function estrela(cor: string, r = 9) {
  let d = "";
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 5,
      rr = i % 2 ? r * 0.45 : r;
    d += (i ? "L" : "M") + r1(Math.cos(a) * rr) + " " + r1(r + Math.sin(a) * rr);
  }
  return <path d={d + "Z"} fill={cor} />;
}
function estrelaMar() {
  let d = "";
  const pontos: ReactNode[] = [];
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 5,
      rr = i % 2 ? 4.2 : 11;
    d += (i ? "L" : "M") + r1(Math.cos(a) * rr) + " " + r1(11 + Math.sin(a) * rr);
    if (!(i % 2)) pontos.push(<circle key={i} cx={r1(Math.cos(a) * 6)} cy={r1(11 + Math.sin(a) * 6)} r={0.9} fill="#fff3dc" />);
  }
  return (
    <>
      <path d={d + "Z"} fill="#e08a5f" stroke="#c46a40" strokeWidth={0.8} strokeLinejoin="round" />
      {pontos}
    </>
  );
}

/** Eucalyptus garland across the top of the hero, ornaments hanging near the edges (the title stays clear). */
function Guirlanda() {
  const [ref, W] = useLargura<SVGSVGElement>();
  const largo = W > 700;
  const n = largo ? 4 : 2,
    passo = W / n,
    y0 = 2,
    flecha = largo ? 12 : 9,
    H = largo ? 230 : 190;
  const curva = (i: number, t: number) => {
    const x0 = passo * i,
      cx = x0 + passo / 2,
      x2 = x0 + passo;
    return { x: (1 - t) ** 2 * x0 + 2 * (1 - t) * t * cx + t * t * x2, y: (1 - t) ** 2 * y0 + 2 * (1 - t) * t * (y0 + flecha * 2) + t * t * y0 };
  };
  const partes: ReactNode[] = [];
  if (W) {
    const VERDES = ["#6f8f6a", "#8fa98a", "#4f6f52", "#7b9b7a"];
    const lugares: [number, number, "bola" | "estrela" | "mar", string?][] = largo
      ? [
          [0.035, 70, "bola", "#b8322b"],
          [0.085, 128, "mar"],
          [0.135, 46, "estrela", "#d9a441"],
          [0.865, 52, "bola", "#d9a441"],
          [0.915, 132, "estrela", "#d9a441"],
          [0.965, 84, "mar"],
        ]
      : [
          [0.06, 92, "estrela", "#d9a441"],
          [0.15, 40, "bola", "#b8322b"],
          [0.85, 46, "bola", "#d9a441"],
          [0.94, 102, "mar"],
        ];
    lugares.forEach(([fx, comp, tipo, cor], j) => {
      const x = fx * W,
        i = Math.min(n - 1, Math.floor(x / passo)),
        top = curva(i, (x - i * passo) / passo).y + 2;
      partes.push(
        <g
          key={`p${j}`}
          className="natal-pend"
          style={{
            transformOrigin: `${r1(x)}px ${r1(top)}px`,
            animationDuration: `${(3 + (j % 3) * 0.6).toFixed(1)}s`,
            animationDelay: `-${(j * 0.8).toFixed(1)}s`,
          }}
        >
          <line x1={r1(x)} y1={r1(top)} x2={r1(x)} y2={r1(top + comp)} stroke="#d9c9ac" strokeWidth={1} />
          <g transform={`translate(${r1(x)} ${r1(top + comp)})`}>{tipo === "bola" ? bola(cor!) : tipo === "estrela" ? estrela(cor!) : estrelaMar()}</g>
        </g>,
      );
    });
    let k = 0;
    for (let i = 0; i < n; i++)
      for (let t = 0; t <= 1; t += 6 / passo) {
        const p = curva(i, t),
          q = curva(i, Math.min(1, t + 0.01));
        const ang = (Math.atan2(q.y - p.y, q.x - p.x) * 180) / Math.PI;
        const lado = k % 2 ? 55 : -55;
        partes.push(
          <ellipse
            key={`f${k}`}
            cx={r1(p.x)}
            cy={r1(p.y + (k % 2 ? 3 : -1))}
            rx={5}
            ry={2.8}
            transform={`rotate(${r1(ang + lado)} ${r1(p.x)} ${r1(p.y)})`}
            fill={VERDES[k % 4]}
          />,
        );
        if (k % 3 === 0) {
          const rad = ((ang + 90) * Math.PI) / 180;
          partes.push(
            <path key={`r${k}`} d={`M${r1(p.x)} ${r1(p.y)} l${r1(Math.cos(rad) * 7)} ${r1(Math.sin(rad) * 7)}`} stroke="#2f5a3e" strokeWidth={1.2} />,
          );
        }
        k++;
      }
    for (let i = 0; i < n; i++)
      for (const t of [0.25, 0.5, 0.75]) {
        const p = curva(i, t);
        partes.push(
          <circle
            key={`m${i}${t}`}
            className="natal-lampada"
            style={{ animationDelay: `-${r1((i + t) * 1.3)}s` }}
            cx={r1(p.x)}
            cy={r1(p.y + 3)}
            r={2.6}
            fill={t === 0.5 ? "#b8322b" : "#d9a441"}
          />,
        );
      }
  }
  return (
    <svg
      ref={ref}
      aria-hidden
      className="pointer-events-none absolute inset-x-0 -top-1 z-[2] w-full overflow-visible"
      style={{ height: H }}
      viewBox={`0 0 ${W || 1} ${H}`}
    >
      {partes}
    </svg>
  );
}

/** Gold glints drifting down over the hero photo, plus a shooting star now and then. */
function Brilhos() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const cv = ref.current;
    const ctx = cv?.getContext("2d");
    if (!cv || !ctx) return;
    const reduzir = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    type P = { x: number; y: number; v: number; r: number; f: number; estrela: boolean };
    let W = 1,
      H = 1,
      pts: P[] = [],
      cadente: { t0: number; x: number; y: number } | null = null,
      proxima = 1800,
      antes = 0,
      raf = 0;
    const novo = (qualquer: boolean): P => ({
      x: Math.random() * W,
      y: qualquer ? Math.random() * H : -10,
      v: 0.18 + Math.random() * 0.35,
      r: 1.6 + Math.random() * 3.2,
      f: Math.random() * 6.28,
      estrela: Math.random() < 0.45,
    });
    const medir = () => {
      const r = cv.getBoundingClientRect();
      W = Math.max(1, Math.round(r.width));
      H = Math.max(1, Math.round(r.height));
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      cv.width = W * dpr;
      cv.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      pts = Array.from({ length: W > 700 ? 30 : 16 }, () => novo(true));
    };
    const desenhar = (t: number) => {
      ctx.clearRect(0, 0, W, H);
      for (const p of pts) {
        ctx.globalAlpha = 0.45 + 0.45 * Math.sin(t / 700 + p.f);
        ctx.fillStyle = p.estrela ? "#f3c867" : "#fff4d6";
        const x = p.x + Math.sin(t / 1600 + p.f) * 6;
        ctx.beginPath();
        if (p.estrela) {
          const r = p.r * 1.7;
          ctx.moveTo(x, p.y - r);
          ctx.lineTo(x + r * 0.28, p.y - r * 0.28);
          ctx.lineTo(x + r, p.y);
          ctx.lineTo(x + r * 0.28, p.y + r * 0.28);
          ctx.lineTo(x, p.y + r);
          ctx.lineTo(x - r * 0.28, p.y + r * 0.28);
          ctx.lineTo(x - r, p.y);
          ctx.lineTo(x - r * 0.28, p.y - r * 0.28);
          ctx.closePath();
        } else ctx.arc(x, p.y, p.r * 0.6, 0, 6.29);
        ctx.fill();
      }
      if (cadente) {
        const k = (t - cadente.t0) / 1100;
        if (k >= 1) cadente = null;
        else {
          const x = cadente.x - k * W * 0.45,
            y = cadente.y + k * H * 0.28;
          const cauda = Math.min(1, k * 3) * (W > 700 ? 170 : 90);
          const g = ctx.createLinearGradient(x, y, x + cauda, y - cauda * 0.62);
          g.addColorStop(0, "rgba(255,244,214,1)");
          g.addColorStop(1, "rgba(255,244,214,0)");
          ctx.globalAlpha = k < 0.8 ? 1 : (1 - k) * 5;
          ctx.strokeStyle = g;
          ctx.lineWidth = 2;
          ctx.lineCap = "round";
          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.lineTo(x + cauda, y - cauda * 0.62);
          ctx.stroke();
          ctx.fillStyle = "#fff8e6";
          ctx.beginPath();
          ctx.arc(x, y, 2.2, 0, 6.29);
          ctx.fill();
        }
      }
      ctx.globalAlpha = 1;
    };
    const passo = (t: number) => {
      if (!document.hidden) {
        for (const p of pts) {
          p.y += p.v;
          if (p.y > H + 10) Object.assign(p, novo(false));
        }
        proxima -= t - (antes || t);
        if (!cadente && proxima <= 0) {
          cadente = { t0: t, x: W * (0.55 + Math.random() * 0.4), y: H * (0.05 + Math.random() * 0.15) };
          proxima = 5000 + Math.random() * 4000;
        }
        desenhar(t);
      }
      antes = t;
      raf = requestAnimationFrame(passo);
    };
    medir();
    const ro = new ResizeObserver(() => {
      medir();
      if (reduzir) desenhar(0);
    });
    ro.observe(cv);
    if (reduzir) desenhar(0);
    else raf = requestAnimationFrame(passo);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, []);
  return <canvas ref={ref} aria-hidden className="pointer-events-none absolute inset-0 h-full w-full" />;
}

/** Garland + sparkles over the hero carousel photo. */
export function NatalNoTopo() {
  if (!useNatal()) return null;
  return (
    <>
      <Brilhos />
      <Guirlanda />
    </>
  );
}

/** Red-and-gold ribbon with a bow on a chair photo's corner (user's pick: "Laço"). Parent must be `relative`. */
export function LacoNatal() {
  if (!useNatal()) return null;
  return (
    <div className="natal-laco" aria-hidden>
      <span className="fita-h" />
      <span className="fita-v" />
      <svg viewBox="0 0 46 36">
        <path d="M23 18 C14 2 2 2 3 12 C4 20 16 20 23 18 Z" fill="#b8322b" stroke="#d9a441" strokeWidth={0.9} />
        <path d="M23 18 C32 2 44 2 43 12 C42 20 30 20 23 18 Z" fill="#b8322b" stroke="#d9a441" strokeWidth={0.9} />
        <path d="M23 18 L15 34 L19 33 L21 36 Z" fill="#9e2a24" />
        <path d="M23 18 L31 34 L27 33 L25 36 Z" fill="#9e2a24" />
        <circle cx="23" cy="18" r="4.2" fill="#9e2a24" stroke="#d9a441" strokeWidth={0.9} />
      </svg>
    </div>
  );
}

/** "R$ 404,91 no Natal, com o cupom NATALNASENTARTE10" under a chair price. */
export function PrecoNatal({ preco, className = "" }: { preco: number; className?: string }) {
  if (!useNatal()) return null;
  return (
    <span className={`block text-xs font-semibold leading-snug text-[#b8322b] ${className}`}>
      {formatBRL(precoNatal(preco))} no Natal <span className="font-normal text-ink-soft">com o cupom</span>{" "}
      <span className="whitespace-nowrap text-ink">{CODIGO_NATAL}</span>
    </span>
  );
}

/** Little string of lights under a section title. */
export function LuzesTitulo() {
  if (!useNatal()) return null;
  return (
    <div className="mt-1 w-48 md:w-72">
      <Varal y0={3} vao={1000} porVao={6} />
    </div>
  );
}

const GIROS = [-5, 3, -2, 4, -3];

/** Gift box: vale tags fly out on hover (mouse) or tap (touch); each tag puts that vale in the cart. */
function CaixaDeVales() {
  const { addItem } = useCart();
  const area = useRef<HTMLDivElement>(null);
  const caixa = useRef<HTMLButtonElement>(null);
  const lista = useRef<HTMLDivElement>(null);
  const [aberto, setAberto] = useState(false);
  const mouse = useSyncExternalStore(
    () => () => {},
    () => window.matchMedia("(hover: hover) and (pointer: fine)").matches,
    () => false,
  );
  const [escolhido, setEscolhido] = useState<number | null>(null);
  const fechar = useRef<ReturnType<typeof setTimeout>>(undefined);

  // each tag starts inside the box: offset from its place to the box's mouth
  const mirar = () => {
    const c = caixa.current,
      l = lista.current;
    if (!c || !l) return;
    const bx = c.offsetLeft + c.offsetWidth / 2,
      by = c.offsetTop + 60;
    for (const t of Array.from(l.children) as HTMLElement[]) {
      t.style.setProperty("--dx", Math.round(bx - (l.offsetLeft + t.offsetLeft + t.offsetWidth / 2)) + "px");
      t.style.setProperty("--dy", Math.round(by - (l.offsetTop + t.offsetTop + t.offsetHeight / 2)) + "px");
    }
  };
  useEffect(mirar, []);
  const definir = (abrir: boolean) => {
    if (abrir === aberto) return;
    mirar();
    const tags = Array.from(lista.current?.children ?? []) as HTMLElement[];
    tags.forEach((t, i) => t.style.setProperty("--atraso", (abrir ? 120 + i * 80 : (tags.length - 1 - i) * 45) + "ms"));
    setAberto(abrir);
    if (!abrir) setEscolhido(null);
  };
  const entrar = (daCaixa: boolean) => {
    clearTimeout(fechar.current);
    if (daCaixa || aberto) definir(true);
  };
  const sair = () => {
    clearTimeout(fechar.current);
    fechar.current = setTimeout(() => definir(false), 400);
  };

  return (
    <div ref={area} className={`relative grid justify-items-center gap-2 ${aberto ? "natal-aberto" : ""}`}>
      <div ref={lista} className="natal-vales" onMouseEnter={mouse ? () => entrar(false) : undefined} onMouseLeave={mouse ? sair : undefined}>
        {VALORES_VALE.map((v, i) => {
          const rotulo = v.rotulo.replace(/,00$/, "");
          const sub = v.rotulo !== formatBRL(v.valor) ? formatBRL(v.valor) : null;
          return (
            <button
              key={v.valor}
              type="button"
              tabIndex={aberto ? 0 : -1}
              className="natal-vale"
              style={{ ["--r" as string]: `${GIROS[i % GIROS.length]}deg` }}
              aria-label={`Dar o vale-presente de ${sub ? `${rotulo} (${sub})` : rotulo}`}
              data-rastro={`Natal: vale ${formatBRL(v.valor)}`}
              onClick={() => {
                setEscolhido(i);
                addItem({
                  id: `${CATEGORIA_VALE}:${v.valor}`,
                  categoriaSlug: CATEGORIA_VALE,
                  categoriaTitulo: "Vale-presente",
                  modeloId: `vale-${v.valor}`,
                  modeloNome: nomeDoVale(v.valor),
                  corA: "#241c14",
                  corB: "#e8dccb",
                });
              }}
            >
              <b className={rotulo.length > 8 ? "longo" : ""}>{rotulo}</b>
              {sub ? <i>{sub}</i> : null}
              <u>Dar este vale</u>
            </button>
          );
        })}
      </div>
      <button
        ref={caixa}
        type="button"
        className={`natal-caixa ${aberto ? "aberta" : ""}`}
        aria-label={aberto ? "Fechar a caixa de presente" : "Abrir a caixa de presente"}
        aria-expanded={aberto}
        onMouseEnter={mouse ? () => entrar(true) : undefined}
        onMouseLeave={mouse ? sair : undefined}
        onFocus={mouse ? () => definir(true) : undefined}
        onClick={() => (mouse ? definir(true) : definir(!aberto))}
      >
        <span className="tampa">
          <svg viewBox="0 0 64 38" aria-hidden>
            <path d="M32 30 C22 6 4 4 6 18 C8 28 24 30 32 30 Z" fill="#b8322b" />
            <path d="M32 30 C42 6 60 4 58 18 C56 28 40 30 32 30 Z" fill="#b8322b" />
            <path d="M32 30 C25 14 14 12 13 19" fill="none" stroke="#8e231e" strokeWidth={1.4} />
            <path d="M32 30 C39 14 50 12 51 19" fill="none" stroke="#8e231e" strokeWidth={1.4} />
            <circle cx="32" cy="30" r="5" fill="#9e2a24" />
          </svg>
        </span>
        <span className="base" />
      </button>
      <p className="min-h-[1.3em] text-center text-xs text-ink-soft" aria-live="polite">
        {escolhido !== null
          ? `Vale de ${VALORES_VALE[escolhido].rotulo.toLowerCase()} foi para o carrinho.`
          : aberto
            ? mouse
              ? "Escolha um vale"
              : "Escolha um vale · toque na caixa para fechar"
            : mouse
              ? "Passe o mouse na caixa"
              : "Toque na caixa para abrir"}
      </p>
    </div>
  );
}

/** Homepage band: "Presente que dura verões" + the gift box. */
export function PresenteDeNatal() {
  if (!useNatal()) return null;
  return (
    <section className="relative overflow-hidden border-y border-line bg-canvas-deep">
      <div className="absolute inset-x-0 top-0">
        <Varal y0={2} />
      </div>
      <div className="mx-auto grid max-w-6xl items-center gap-6 px-6 py-12 md:grid-cols-[1.3fr_1fr] md:py-16">
        <div className="grid gap-3 pt-2">
          <span className="text-xs font-semibold uppercase tracking-[0.08em] text-[#b8322b]">Vale-presente de Natal</span>
          <h2 className="font-serif text-3xl font-medium tracking-tight text-ink md:text-4xl">Presente que dura verões</h2>
          <p className="max-w-[44ch] text-ink-soft">
            Você escolhe o valor e a pessoa escolhe a cadeira dela. O código chega na hora, pronto para mandar no WhatsApp.
          </p>
          <a href="/vale-presente" className="justify-self-start bg-ink px-5 py-3 text-sm font-medium !text-canvas transition-opacity hover:opacity-90">
            Dar um vale-presente
          </a>
        </div>
        <CaixaDeVales />
      </div>
    </section>
  );
}

/** Rope Christmas tree on a little sand mound. */
function ArvoreDeCorda() {
  const pts: [number, number][] = [];
  for (let i = 0; i < 8; i++) {
    const y = 34 + i * 17,
      meia = 7 + i * 8.5;
    pts.push([i % 2 ? 75 + meia : 75 - meia, y]);
  }
  const linha = "M75 26 " + pts.map(([x, y]) => `L${r1(x)} ${y}`).join(" ");
  return (
    <svg viewBox="0 0 150 190" aria-hidden className="h-[190px] w-[150px] shrink-0 overflow-visible">
      <ellipse cx="75" cy="178" rx="62" ry="9" fill="#dcc596" />
      <rect x="70" y="158" width="10" height="18" fill="#8a6b45" />
      <path d={linha} fill="none" stroke="#b89a6a" strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" />
      <path d={linha} fill="none" stroke="#7d5f3b" strokeWidth={5} strokeDasharray="1.6 3.2" strokeLinejoin="round" />
      {pts.map(([x, y], i) => (
        <circle key={i} className="natal-lampada" style={{ animationDelay: `-${(i * 0.45).toFixed(2)}s` }} cx={r1(x)} cy={y + 4} r={3.6} fill={CORES[i % 3]} />
      ))}
      {[
        [60, 62],
        [90, 80],
        [70, 110],
        [100, 128],
        [52, 138],
      ].map(([x, y], i) => (
        <circle key={`l${i}`} className="natal-lampada" style={{ animationDelay: `-${(i * 0.7 + 0.3).toFixed(2)}s` }} cx={x} cy={y} r={2} fill="#fff1c9" />
      ))}
      <g className="natal-cintila">
        <path d="M75 6 L78.5 16.5 L89 20 L78.5 23.5 L75 34 L71.5 23.5 L61 20 L71.5 16.5 Z" fill="#d9a441" />
      </g>
      <path d="M128 170 l6 -9 l6 9 z" fill="#e08a5f" opacity={0.85} />
      <circle cx="22" cy="172" r="3.2" fill="#f6eee0" stroke="#d6c4a2" strokeWidth={0.8} />
    </svg>
  );
}

/** Sand-colored band with the rope tree, at the end of the homepage. */
export function PraiaDeNatal() {
  if (!useNatal()) return null;
  return (
    <section className="relative overflow-hidden bg-[#ecdcbc]">
      <svg className="absolute inset-x-0 -top-px block h-[22px] w-full" viewBox="0 0 400 22" preserveAspectRatio="none" aria-hidden>
        <path d="M0 0 H400 V10 C350 22 300 2 250 12 C200 22 150 2 100 12 C60 20 30 6 0 12 Z" fill="var(--canvas)" />
      </svg>
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 px-6 pb-8 pt-10 text-center md:flex-row md:gap-10 md:text-left">
        <ArvoreDeCorda />
        <div>
          <h2 className="font-serif text-3xl font-medium tracking-tight text-ink md:text-4xl">Boas festas e um verão inteiro de sol</h2>
          <p className="mt-2 max-w-[42ch] text-sm text-[#5a4a35]">
            Obrigada por fazer parte deste ano do ateliê. Cada cadeira é trançada à mão, com o mesmo carinho de um presente.
          </p>
        </div>
      </div>
    </section>
  );
}
