"use client";

// New Year decorations (user 2026-11-12, from the approved preview: night-blue
// top strip with a countdown to midnight, gold year beside the logo, fireworks
// and champagne bubbles on the hero, a gold "FELIZ {ano}" ribbon on chair
// photos, a midnight clock that strikes and rolls the year, a band with two
// clinking flutes and the vale buttons, and a white-and-gold footer band with
// falling streamers). Everything renders only while `useAnoNovo()` is non-zero:
// 26 December – 15 January in Brasília (lib/ano-novo.ts), or `?anonovo=1` to
// preview it on any day (kept for the tab; `?anonovo=0` ends it). Christmas
// wins if both are on. Pages are cached, so the date is checked in the browser.

import { useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import { useCart } from "@/lib/cart-context";
import { hojeBR } from "@/lib/black-friday";
import { anoQueVem, naEpocaDeAnoNovo, viradaMs } from "@/lib/ano-novo";
import { formatBRL } from "@/lib/offer";
import { CATEGORIA_VALE, nomeDoVale, VALORES_VALE } from "@/lib/vale";
import { Confetes, useConfete, useNatal } from "@/components/natal";

const PREVIA = "sentarte-anonovo-previa";

/** The year being celebrated, or 0 when it's not New Year. */
function anoNovoAgora() {
  const hoje = hojeBR();
  try {
    const busca = new URLSearchParams(window.location.search);
    const q = busca.get("anonovo");
    if (q === "1") {
      sessionStorage.setItem(PREVIA, "1");
      sessionStorage.removeItem("sentarte-natal-previa"); // one season preview per tab
    }
    if (q === "0" || busca.get("natal") === "1") sessionStorage.removeItem(PREVIA);
    // Previewing outside the dates (e.g. in November): show the coming turn of the year (2026 → 2027), with the countdown.
    if (sessionStorage.getItem(PREVIA) === "1") return naEpocaDeAnoNovo(hoje) ? anoQueVem(hoje) : Number(hoje.slice(0, 4)) + 1;
  } catch {}
  return naEpocaDeAnoNovo(hoje) ? anoQueVem(hoje) : 0;
}

/** The year being celebrated (e.g. 2027) while the New Year look is on, else 0. */
export function useAnoNovo() {
  const natal = useNatal();
  const ano = useSyncExternalStore(
    () => () => {},
    anoNovoAgora,
    () => 0,
  );
  return natal ? 0 : ano;
}

const r1 = (n: number) => Math.round(n * 10) / 10;
const reduzMovimento = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** Ticks every second until `alvo` (ms), then stops; null before mounting. */
function useAgora(alvo: number) {
  const [agora, setAgora] = useState<number | null>(null);
  useEffect(() => {
    const tique = () => setAgora(Date.now());
    tique();
    if (Date.now() >= alvo) return;
    const t = setInterval(tique, 1000);
    return () => clearInterval(t);
  }, [alvo]);
  return agora;
}

/** One boxed digit group; a new value remounts it, which replays the flip. */
function Digito({ valor, rotulo }: { valor: string; rotulo: string }) {
  return (
    <span className="anonovo-dig">
      <b key={valor}>{valor}</b>
      <small>{rotulo}</small>
    </span>
  );
}

/** Top strip from 26/12 to 15/01: countdown to midnight, then the wish; alternates with the calendar's strip. */
// Only the countdown / New Year wish — no alternating calendar strip (user 2026-11-12: "prefiro que fique a contagem do ano novo").
export function FaixaDeAnoNovo({ ano }: { ano: number }) {
  const alvo = viradaMs(ano);
  const agora = useAgora(alvo);
  const depois = agora !== null && agora >= alvo;
  let digitos: ReactNode = null;
  if (agora !== null && !depois) {
    let ms = alvo - agora;
    const d = Math.floor(ms / 864e5);
    ms -= d * 864e5;
    const h = Math.floor(ms / 36e5);
    ms -= h * 36e5;
    const m = Math.floor(ms / 6e4);
    const s = Math.floor((ms - m * 6e4) / 1e3);
    const p = (n: number) => String(n).padStart(2, "0");
    digitos = (
      <span className="inline-flex gap-1.5" role="timer" aria-label={`Faltam ${d} dias, ${h} horas e ${m} minutos para ${ano}`}>
        <Digito valor={String(d)} rotulo="dias" />
        <Digito valor={p(h)} rotulo="horas" />
        <Digito valor={p(m)} rotulo="min" />
        <Digito valor={p(s)} rotulo="seg" />
      </span>
    );
  }
  return (
    <div className="anonovo-faixa relative z-50 overflow-hidden px-4 py-2 text-center text-xs sm:text-sm [&_a]:inline-block [&_a]:py-1 [&_a]:font-semibold [&_a]:!text-[#fbf3e0] [&_a]:underline [&_a]:underline-offset-2">
      <span className="relative inline-flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5">
        <span className="inline-flex items-center gap-2 whitespace-nowrap">
          <em className="anonovo-ouro font-serif text-base italic sm:text-lg">{depois ? "Feliz Ano Novo!" : `Feliz ${ano}!`}</em>
          <span>{depois ? `Que ${ano} seja de muito sol.` : "A virada chega em"}</span>
        </span>
        {digitos}
      </span>
    </div>
  );
}

/** Small gold year beside the site name, with a twinkling star. Parent must be `relative`. */
export function AnoNoLogo() {
  const ano = useAnoNovo();
  if (!ano) return null;
  return (
    <span
      aria-hidden
      className="pointer-events-none absolute -top-2 left-full ml-1 inline-flex items-start whitespace-nowrap font-serif text-[13px] font-semibold italic"
    >
      <span className="anonovo-ouro-escuro">{ano}</span>
      <svg viewBox="0 0 20 20" className="ml-px h-2.5 w-2.5">
        <path className="anonovo-cintila" d="M10 0 L12.2 7.8 L20 10 L12.2 12.2 L10 20 L7.8 12.2 L0 10 L7.8 7.8 Z" fill="#c9a14a" />
      </svg>
    </span>
  );
}

/** Fireworks (rockets that rise and burst in gold/silver) + champagne bubbles and gold glints rising, over the hero photo. */
export function FogosNoTopo() {
  const ano = useAnoNovo();
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const cv = ref.current;
    const ctx = cv?.getContext("2d");
    if (!ano || !cv || !ctx) return;
    const reduzir = reduzMovimento();
    type Bolha = { x: number; y: number; v: number; r: number; f: number };
    type Faisca = { x: number; y: number; vx: number; vy: number; vida: number; cor: string };
    // Rockets rise on a clock (ease-out from the bottom to their burst height), so every one bursts — the old
    // per-frame slowdown (v *= 0.985) capped the climb at ~370 px and tall screens kept frozen streaks (user 2026-11-12).
    type Foguete = { x: number; y: number; y0: number; alvo: number; t0: number; dur: number; feito?: boolean };
    const CORES = ["255,236,190", "233,211,154", "255,252,240", "214,210,200"];
    let W = 1,
      H = 1,
      bolhas: Bolha[] = [],
      faiscas: Faisca[] = [],
      foguetes: Foguete[] = [],
      proxima = 900,
      antes = 0,
      raf = 0;
    const bolha = (qualquer: boolean): Bolha => ({
      x: Math.random() * W,
      y: qualquer ? H * (0.3 + Math.random() * 0.7) : H + 6,
      v: 0.3 + Math.random() * 0.5,
      r: 1.2 + Math.random() * 2.9,
      f: Math.random() * 6.3,
    });
    const estourar = (x: number, y: number) => {
      const n = W > 700 ? 46 : 30,
        cor = CORES[Math.floor(Math.random() * CORES.length)],
        vel = W > 700 ? 3 : 2.1;
      clarao = { x, y, vida: 1 };
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2 + Math.random() * 0.2,
          v = vel * (0.6 + Math.random() * 0.5);
        faiscas.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, vida: 1, cor });
      }
    };
    let agoraMs = 0,
      clarao: { x: number; y: number; vida: number } | null = null;
    const lancar = () => {
      const y0 = H * 0.95;
      // keep clear of the title in the middle: bursts go to the left or right third
      const lado = Math.random() < 0.5 ? 0.08 + Math.random() * 0.25 : 0.67 + Math.random() * 0.25;
      foguetes.push({ x: W * lado, y: y0, y0, alvo: H * (0.12 + Math.random() * 0.22), t0: agoraMs, dur: 1100 + Math.random() * 500 });
    };
    const medir = () => {
      const r = cv.getBoundingClientRect();
      W = Math.max(1, Math.round(r.width));
      H = Math.max(1, Math.round(r.height));
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      cv.width = W * dpr;
      cv.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      bolhas = Array.from({ length: W > 700 ? 22 : 12 }, () => bolha(true));
      faiscas = [];
      foguetes = [];
    };
    const desenhar = (t: number) => {
      ctx.clearRect(0, 0, W, H);
      for (const b of bolhas) {
        const x = b.x + Math.sin(t / 900 + b.f) * 3;
        if (b.r > 3) {
          // a gold glint, twinkling as it rises
          ctx.globalAlpha = 0.5 + 0.5 * Math.sin(t / 300 + b.f);
          ctx.fillStyle = "#ffe7a8";
          const r = 3.4;
          ctx.beginPath();
          ctx.moveTo(x, b.y - r);
          ctx.lineTo(x + r * 0.3, b.y - r * 0.3);
          ctx.lineTo(x + r, b.y);
          ctx.lineTo(x + r * 0.3, b.y + r * 0.3);
          ctx.lineTo(x, b.y + r);
          ctx.lineTo(x - r * 0.3, b.y + r * 0.3);
          ctx.lineTo(x - r, b.y);
          ctx.lineTo(x - r * 0.3, b.y - r * 0.3);
          ctx.closePath();
          ctx.fill();
        } else {
          ctx.globalAlpha = 0.6;
          ctx.strokeStyle = "rgba(255,240,200,.95)";
          ctx.lineWidth = 0.8;
          ctx.beginPath();
          ctx.arc(x, b.y, b.r, 0, 6.29);
          ctx.stroke();
        }
      }
      for (const f of foguetes) {
        const g = ctx.createLinearGradient(f.x, f.y, f.x, f.y + 26);
        g.addColorStop(0, "rgba(255,240,200,1)");
        g.addColorStop(1, "rgba(255,240,200,0)");
        ctx.globalAlpha = 0.9;
        ctx.strokeStyle = g;
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.moveTo(f.x, f.y);
        ctx.lineTo(f.x, f.y + 26);
        ctx.stroke();
      }
      if (clarao) {
        const g = ctx.createRadialGradient(clarao.x, clarao.y, 0, clarao.x, clarao.y, 46);
        g.addColorStop(0, "rgba(255,244,214,.9)");
        g.addColorStop(1, "rgba(255,244,214,0)");
        ctx.globalAlpha = clarao.vida;
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(clarao.x, clarao.y, 46, 0, 6.29);
        ctx.fill();
      }
      for (const p of faiscas) {
        ctx.globalAlpha = Math.max(0, p.vida);
        ctx.fillStyle = `rgb(${p.cor})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 1.7, 0, 6.29);
        ctx.fill();
        ctx.globalAlpha = Math.max(0, p.vida) * 0.35;
        ctx.strokeStyle = `rgb(${p.cor})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p.x - p.vx * 5, p.y - p.vy * 5);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
    };
    const avancar = (p: Faisca) => {
      p.x += p.vx;
      p.y += p.vy;
      p.vx *= 0.975;
      p.vy = p.vy * 0.975 + 0.025;
      p.vida -= 0.012;
    };
    const passo = (t: number) => {
      const dt = t - (antes || t);
      antes = t;
      agoraMs = t;
      if (!document.hidden) {
        for (const b of bolhas) {
          b.y -= b.v;
          if (b.y < H * 0.25) Object.assign(b, bolha(false));
        }
        for (const f of foguetes) {
          const p = Math.min(1, (t - f.t0) / f.dur);
          f.y = f.y0 + (f.alvo - f.y0) * (1 - (1 - p) * (1 - p));
          if (p >= 1) {
            estourar(f.x, f.y);
            f.feito = true;
          }
        }
        foguetes = foguetes.filter((f) => !f.feito);
        if (clarao && (clarao.vida -= 0.06) <= 0) clarao = null;
        faiscas.forEach(avancar);
        faiscas = faiscas.filter((p) => p.vida > 0);
        proxima -= dt;
        if (proxima <= 0) {
          lancar();
          proxima = 2600 + Math.random() * 1800;
        }
        desenhar(t);
      }
      raf = requestAnimationFrame(passo);
    };
    // reduced motion: one still burst over the bubbles
    const parado = () => {
      estourar(W * 0.78, H * 0.18);
      for (let i = 0; i < 30; i++) faiscas.forEach(avancar);
      desenhar(0);
    };
    medir();
    const ro = new ResizeObserver(() => {
      medir();
      if (reduzir) parado();
    });
    ro.observe(cv);
    if (reduzir) parado();
    else raf = requestAnimationFrame(passo);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [ano]);
  if (!ano) return null;
  return <canvas ref={ref} aria-hidden className="pointer-events-none absolute inset-0 h-full w-full" />;
}

/** Gold "FELIZ {ano}" ribbon across a chair photo's corner (the user's pick over the seal). Parent must be `relative`. */
export function FitaAnoNovo() {
  const ano = useAnoNovo();
  if (!ano) return null;
  return (
    <div className="anonovo-fita-area" aria-hidden>
      <span className="anonovo-fita">FELIZ {ano}</span>
    </div>
  );
}

/** Gold clock going to midnight: at 12 it shakes, confetti bursts and the year rolls (e.g. 2026 → 2027). Repeats every 9 s. */
function RelogioDaVirada({ ano }: { ano: number }) {
  const secao = useRef<HTMLElement>(null);
  const relogio = useRef<SVGSVGElement>(null);
  const hora = useRef<SVGLineElement>(null);
  const minuto = useRef<SVGLineElement>(null);
  const legenda = useRef<HTMLElement>(null);
  const tela = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const sec = secao.current,
      svg = relogio.current,
      cv = tela.current,
      leg = legenda.current;
    const ctx = cv?.getContext("2d");
    if (!sec || !svg || !cv || !ctx || !leg) return;
    const ponteiros = (k: number) => {
      minuto.current?.setAttribute("transform", `rotate(${r1(-30 + 30 * k)} 50 50)`);
      hora.current?.setAttribute("transform", `rotate(${r1(-2.5 + 2.5 * k)} 50 50)`);
    };
    if (reduzMovimento()) {
      ponteiros(1);
      sec.classList.add("anonovo-virou");
      leg.textContent = `Feliz ${ano}!`;
      return;
    }
    type Peca = { x: number; y: number; vx: number; vy: number; g: number; vg: number; w: number; h: number; cor: string; vida: number };
    const CORES = ["#c9a14a", "#e9d39a", "#f3dc9a", "#d6d2c8", "#8a6a22"];
    let pecas: Peca[] = [],
      ciclo = -1,
      estourou = false,
      antes = 0,
      raf = 0;
    const estourar = () => {
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      cv.width = sec.offsetWidth * dpr;
      cv.height = sec.offsetHeight * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const rs = sec.getBoundingClientRect(),
        rr = svg.getBoundingClientRect();
      const cx = rr.left - rs.left + rr.width / 2,
        cy = rr.top - rs.top + rr.height / 2;
      for (let i = 0; i < 60; i++) {
        const a = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 1.7,
          v = 2 + Math.random() * 3.5;
        pecas.push({
          x: cx,
          y: cy,
          vx: Math.cos(a) * v,
          vy: Math.sin(a) * v,
          g: Math.random() * 6.3,
          vg: (Math.random() - 0.5) * 0.4,
          w: 3 + Math.random() * 4,
          h: 1.5 + Math.random() * 2,
          cor: CORES[i % CORES.length],
          vida: 1,
        });
      }
    };
    const passo = (t: number) => {
      const dt = t - (antes || t);
      antes = t;
      if (!document.hidden) {
        const c = Math.floor(t / 9000),
          p = t % 9000;
        if (c !== ciclo) {
          ciclo = c;
          estourou = false;
          sec.classList.add("anonovo-sem-transicao");
          sec.classList.remove("anonovo-virou");
          void sec.offsetWidth;
          sec.classList.remove("anonovo-sem-transicao");
          leg.textContent = "Contando para a virada…";
        }
        const k = Math.min(1, p / 5000);
        ponteiros(1 - (1 - k) ** 2);
        if (p >= 5000 && !estourou) {
          estourou = true;
          sec.classList.add("anonovo-virou");
          svg.classList.remove("anonovo-bate");
          void svg.getBoundingClientRect();
          svg.classList.add("anonovo-bate");
          leg.textContent = `Feliz ${ano}!`;
          estourar();
        }
        if (pecas.length) {
          ctx.clearRect(0, 0, cv.width, cv.height);
          for (const q of pecas) {
            q.x += q.vx;
            q.y += q.vy;
            q.vx *= 0.985;
            q.vy = q.vy * 0.985 + 0.06;
            q.g += q.vg;
            q.vida -= dt / 2600;
            ctx.save();
            ctx.globalAlpha = Math.max(0, q.vida);
            ctx.translate(q.x, q.y);
            ctx.rotate(q.g);
            ctx.fillStyle = q.cor;
            ctx.fillRect(-q.w / 2, -q.h / 2, q.w, q.h);
            ctx.restore();
          }
          pecas = pecas.filter((q) => q.vida > 0);
          if (!pecas.length) ctx.clearRect(0, 0, cv.width, cv.height);
        }
      }
      raf = requestAnimationFrame(passo);
    };
    raf = requestAnimationFrame(passo);
    return () => cancelAnimationFrame(raf);
  }, [ano]);

  const antigo = String(ano - 1),
    novo = String(ano);
  // the common prefix stays still; only the digits that change roll (2026 → 2027 rolls just the last one)
  let comum = 0;
  while (comum < 3 && antigo[comum] === novo[comum]) comum++;
  const marcas: ReactNode[] = [];
  for (let i = 0; i < 12; i++) {
    const a = (i * 30 * Math.PI) / 180,
      g = i % 3 === 0;
    marcas.push(
      <line
        key={i}
        x1={r1(50 + Math.sin(a) * (g ? 33 : 36))}
        y1={r1(50 - Math.cos(a) * (g ? 33 : 36))}
        x2={r1(50 + Math.sin(a) * 40)}
        y2={r1(50 - Math.cos(a) * 40)}
        stroke="#8a6a22"
        strokeWidth={g ? 2 : 1}
        strokeLinecap="round"
      />,
    );
  }
  return (
    <section ref={secao} aria-hidden className="anonovo-virada">
      <canvas ref={tela} className="pointer-events-none absolute inset-0 h-full w-full" />
      <div className="relative flex items-center gap-5 md:gap-7">
        <svg ref={relogio} viewBox="0 0 100 100" className="anonovo-relogio">
          <defs>
            <linearGradient id="anonovo-aro" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#f3dc9a" />
              <stop offset=".5" stopColor="#c9a14a" />
              <stop offset="1" stopColor="#8a6a22" />
            </linearGradient>
          </defs>
          <circle cx="50" cy="50" r="47" fill="url(#anonovo-aro)" />
          <circle cx="50" cy="50" r="43" fill="#fffdf6" />
          {marcas}
          <text x="50" y="25" textAnchor="middle" fontSize="9" fontWeight={600} fill="#8a6a22" className="font-serif">
            XII
          </text>
          <line ref={hora} x1="50" y1="52" x2="50" y2="28" stroke="#241f1a" strokeWidth={3} strokeLinecap="round" transform="rotate(-2.5 50 50)" />
          <line ref={minuto} x1="50" y1="54" x2="50" y2="15" stroke="#241f1a" strokeWidth={1.8} strokeLinecap="round" transform="rotate(-30 50 50)" />
          <circle cx="50" cy="50" r="3" fill="#c9a14a" />
        </svg>
        <div className="grid gap-1">
          <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#8a6a22]">Réveillon na praia</span>
          <span className="anonovo-odometro font-serif font-semibold">
            <span>{novo.slice(0, comum)}</span>
            {novo
              .slice(comum)
              .split("")
              .map((dig, i) => (
                <span key={i} className="anonovo-janela">
                  <span className="anonovo-rolo">
                    <span>{antigo[comum + i]}</span>
                    <span>{dig}</span>
                  </span>
                </span>
              ))}
          </span>
          <small ref={legenda} className="min-h-[1.3em] font-serif text-base italic text-[#8a6a22]">
            Contando para a virada…
          </small>
        </div>
      </div>
    </section>
  );
}

/** Two champagne flutes that clink every few seconds (CSS keyframes), bubbles rising inside. */
function Tacas() {
  const taca = (x: number, lado: "e" | "d") => (
    <g className={`anonovo-taca anonovo-taca-${lado}`} style={{ transformOrigin: `${x}px 150px` }}>
      <path d={`M${x - 17} 30 L${x + 17} 30 L${x + 12} 92 Q${x} 104 ${x - 12} 92 Z`} fill="rgba(255,253,245,.14)" stroke="#e3c472" strokeWidth={1.5} />
      <path d={`M${x - 15} 48 L${x + 15} 48 L${x + 11.5} 90 Q${x} 101 ${x - 11.5} 90 Z`} fill="url(#anonovo-liquido)" />
      <path d={`M${x - 15} 48 L${x + 15} 48`} stroke="#fff3cf" strokeWidth={1} opacity={0.8} />
      <path d={`M${x - 11} 36 L${x - 8} 84`} stroke="#fff" strokeWidth={1.4} opacity={0.35} strokeLinecap="round" />
      <path d={`M${x} 102 V146 M${x - 17} 148 H${x + 17}`} stroke="#e3c472" strokeWidth={1.8} strokeLinecap="round" />
      {[0, 1, 2, 3, 4].map((k) => (
        <circle
          key={k}
          className="anonovo-bolha"
          style={{ animationDelay: `-${(k * 0.55 + (lado === "d" ? 0.3 : 0)).toFixed(2)}s` }}
          cx={x - 7 + k * 3.5}
          cy={93 - (k % 2) * 5}
          r={1.1 + (k % 3) * 0.45}
          fill="#fff8e1"
          stroke="#c9a14a"
          strokeWidth={0.4}
        />
      ))}
    </g>
  );
  const gotas = [
    [-14, -10],
    [-8, -18],
    [0, -22],
    [8, -18],
    [14, -10],
    [-18, 2],
    [18, 2],
  ];
  return (
    <svg viewBox="0 0 200 170" aria-hidden className="anonovo-tacas">
      <defs>
        <linearGradient id="anonovo-liquido" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#f6e2a6" />
          <stop offset="1" stopColor="#d9b45a" />
        </linearGradient>
      </defs>
      {taca(78, "e")}
      {taca(124, "d")}
      <g className="anonovo-tim" style={{ transformOrigin: "101px 27px" }}>
        <path d="M101 13 L104 24 L115 27 L104 30 L101 41 L98 30 L87 27 L98 24 Z" fill="#fff1c2" />
        <circle cx="101" cy="27" r="3" fill="#fff" />
      </g>
      {gotas.map(([x, y], i) => (
        <circle
          key={i}
          className="anonovo-gota"
          style={{ ["--x" as string]: `${x}px`, ["--y" as string]: `${y}px` }}
          cx="101"
          cy="28"
          r={i % 2 ? 1.2 : 1.6}
          fill="#fff3cf"
        />
      ))}
      <text x="101" y="6" textAnchor="middle" fontSize="11" fontStyle="italic" fill="#f3dc9a" className="anonovo-tim-txt font-serif">
        tim-tim!
      </text>
    </svg>
  );
}

const BOKEH = Array.from({ length: 12 }, (_, i) => ({
  left: `${(i * 53) % 100}%`,
  top: `${(i * 29) % 90}%`,
  t: 30 + ((i * 37) % 70),
  atraso: `-${(i * 0.9).toFixed(1)}s`,
  dur: `${8 + (i % 4) * 2}s`,
}));

/** Homepage New Year block: the midnight clock, then "Comece o ano com a sua cadeira" with the flutes and the vale buttons. */
export function BrindeDeAnoNovo() {
  const ano = useAnoNovo();
  return ano ? <Brinde ano={ano} /> : null;
}

const CONFETE_BRINDE = ["#c9a14a", "#e3c472", "#fff1c2", "#d6d2c8", "#f3dc9a", "#b8913c"];

/**
 * The toast band. When it scrolls into view the flutes throw gold and silver confetti
 * (user 2026-11-25, like the Christmas gift box), and again on hover / tap of the flutes.
 */
function Brinde({ ano }: { ano: number }) {
  const { addItem } = useCart();
  const [escolhido, setEscolhido] = useState<number | null>(null);
  const [confetes, soltar] = useConfete(CONFETE_BRINDE);
  const tacas = useRef<HTMLDivElement>(null);
  const brindar = (quantos = 50) => {
    const t = tacas.current;
    if (t) soltar(t.offsetLeft + t.offsetWidth / 2, t.offsetTop + t.offsetHeight * 0.2, quantos, 1.1);
  };
  const brindarRef = useRef(brindar);
  useEffect(() => {
    brindarRef.current = brindar;
  });
  useEffect(() => {
    const el = tacas.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return;
        obs.disconnect();
        setTimeout(() => brindarRef.current(), 500);
      },
      { threshold: 0.6 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return (
    <>
      <RelogioDaVirada ano={ano} />
      <section className="anonovo-banda relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0" aria-hidden>
          {BOKEH.map((b, i) => (
            <i
              key={i}
              className="anonovo-bokeh"
              style={{ left: b.left, top: b.top, width: b.t, height: b.t, animationDelay: b.atraso, animationDuration: b.dur }}
            />
          ))}
        </div>
        <div className="relative mx-auto grid max-w-6xl items-center gap-6 px-6 py-12 md:grid-cols-[1.3fr_1fr] md:py-16">
          <div className="grid gap-3">
            <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.08em] text-[#e3c472] before:h-px before:w-6 before:bg-[#e3c472]">
              Vale-presente de Ano Novo
            </span>
            <h2 className="font-serif text-3xl font-medium tracking-tight text-[#fbf3e0] md:text-5xl">
              Comece o ano com a <span className="anonovo-ouro italic">sua cadeira</span>
            </h2>
            <p className="max-w-[46ch] text-[#d6ccb8]">
              Ganhou dinheiro de presente ou quer dar um? Com o vale-presente a pessoa escolhe a cadeira dela. O código chega na hora, pronto para mandar no
              WhatsApp.
            </p>
            <div className="flex flex-wrap gap-2 pt-1">
              {VALORES_VALE.map((v, i) => (
                <button
                  key={v.valor}
                  type="button"
                  data-rastro={`Ano Novo: vale ${formatBRL(v.valor)}`}
                  aria-label={`Colocar o vale-presente de ${v.rotulo} no carrinho`}
                  aria-pressed={escolhido === i}
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
                  className="anonovo-vale"
                >
                  {v.rotulo.replace(/,00$/, "")}
                </button>
              ))}
            </div>
            <p className="min-h-[1.3em] text-xs text-[#d6ccb8]" aria-live="polite">
              {escolhido !== null
                ? `Vale de ${VALORES_VALE[escolhido].rotulo.toLowerCase()} foi para o carrinho.`
                : "Toque num valor e ele vai para o carrinho."}
            </p>
            <a href="/vale-presente" className="anonovo-botao justify-self-start px-5 py-3 text-sm font-medium">
              Ver o vale-presente
            </a>
          </div>
          <div
            ref={tacas}
            role="button"
            tabIndex={0}
            aria-label="Brindar"
            className="relative cursor-pointer justify-self-center"
            onMouseEnter={() => brindar(32)}
            onClick={() => brindar(40)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                brindar(40);
              }
            }}
          >
            <Tacas />
          </div>
        </div>
        <Confetes lista={confetes} />
      </section>
    </>
  );
}

const SERPENTINAS = Array.from({ length: 18 }, (_, i) => ({
  cor: ["#c9a14a", "#e9d39a", "#d6d2c8", "#b8913c", "#f3dc9a"][i % 5],
  left: `${(i * 57) % 100}%`,
  atraso: `-${((i * 0.83) % 7).toFixed(2)}s`,
  dur: `${6 + (i % 5)}s`,
  enrolada: i % 3 === 0,
}));

/** White-and-gold band at the end of the homepage, with streamers and confetti falling. */
export function RodapeDeAnoNovo() {
  const ano = useAnoNovo();
  if (!ano) return null;
  return (
    <section className="anonovo-rodape relative overflow-hidden">
      <div className="anonovo-onda" aria-hidden>
        <svg viewBox="0 0 800 26" preserveAspectRatio="none">
          <path
            d="M0 0 H800 V12 C750 24 700 4 650 12 C600 24 550 4 500 12 C450 24 400 4 350 12 C300 24 250 4 200 12 C150 24 100 4 50 12 C30 16 15 14 0 12 Z"
            fill="var(--canvas)"
          />
          <path
            d="M0 14 C50 4 100 24 150 14 C200 4 250 24 300 14 C350 4 400 24 450 14 C500 4 550 24 600 14 C650 4 700 24 750 14 C770 10 790 12 800 14"
            fill="none"
            stroke="#c9a14a"
            strokeWidth={1}
          />
        </svg>
      </div>
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        {SERPENTINAS.map((s, i) =>
          s.enrolada ? (
            <svg
              key={i}
              viewBox="0 0 10 30"
              className="anonovo-serpentina h-[26px] w-2"
              style={{ left: s.left, animationDelay: s.atraso, animationDuration: s.dur }}
            >
              <path d="M5 0 C9 5 1 10 5 15 C9 20 1 25 5 30" fill="none" stroke={s.cor} strokeWidth={1.6} />
            </svg>
          ) : (
            <span
              key={i}
              className="anonovo-serpentina h-[9px] w-[5px] rounded-[1px]"
              style={{ left: s.left, background: s.cor, animationDelay: s.atraso, animationDuration: s.dur }}
            />
          ),
        )}
      </div>
      <div className="relative mx-auto max-w-6xl px-6 pb-9 pt-12 text-center">
        <h2 className="font-serif text-3xl font-medium tracking-tight text-[#6b5420] md:text-4xl">Que {ano} seja de muito sol e mar</h2>
        <p className="mx-auto mt-2 max-w-[40ch] text-sm text-ink-soft">Obrigada por fazer parte do ateliê em {ano - 1}.</p>
      </div>
    </section>
  );
}

// ---------- 2026-11-25: New Year on the sections redesigned 11-23 + "Escolha a sua cadeira" ----------
// (user: "agora quero que vc faça melhor o do ano novo", same idea as the Christmas pass:
// gold where Christmas has holly, a gold-and-silver star garland where it has warm lights,
// a hanging star / mirror ball on each chair card, confetti when the flutes clink.)

const D_ESTRELA4 = "M10 0 L12.2 7.8 L20 10 L12.2 12.2 L10 20 L7.8 12.2 L0 10 L7.8 7.8 Z";

/** Gold four-point sparkle with a small companion — the New Year counterpart of the holly sprig. */
export function Cintilante({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 30 22" aria-hidden className={className}>
      <path className="anonovo-cintila" d="M11 1 L13.4 8.6 L21 11 L13.4 13.4 L11 21 L8.6 13.4 L1 11 L8.6 8.6 Z" fill="#c9a14a" />
      <path
        className="anonovo-cintila"
        style={{ animationDelay: "-1.4s" }}
        d="M24 2 L25.1 5.4 L28.5 6.5 L25.1 7.6 L24 11 L22.9 7.6 L19.5 6.5 L22.9 5.4 Z"
        fill="#e3c472"
      />
    </svg>
  );
}

/** `Cintilante` only while the New Year look is on. */
export function CintilanteAnoNovo({ className = "" }: { className?: string }) {
  return useAnoNovo() ? <Cintilante className={className} /> : null;
}

function useLarguraSvg() {
  const ref = useRef<SVGSVGElement>(null);
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

/**
 * Gold thread draped edge to edge across the top of a section with little gold and
 * silver foil stars hanging on short strings, twinkling out of step (New Year version
 * of the Christmas `LuzesTitulo`). Parent must be `relative`.
 */
export function GuirlandaDeEstrelas() {
  return useAnoNovo() ? <GuirlandaSvg /> : null;
}

function GuirlandaSvg() {
  const [ref, w] = useLarguraSvg();
  let conteudo: ReactNode = null;
  if (w) {
    const n = Math.max(2, Math.round(w / (w > 700 ? 280 : 170)));
    const passo = w / n,
      y0 = 5,
      flecha = w > 700 ? 22 : 15;
    const yEm = (x: number) => {
      const t = (x % passo) / passo;
      return y0 + 4 * flecha * t * (1 - t);
    };
    let fio = `M0 ${y0}`;
    for (let i = 0; i < n; i++) fio += ` Q${r1(passo * i + passo / 2)} ${y0 + flecha * 2} ${r1(passo * (i + 1))} ${y0}`;
    const pendentes: ReactNode[] = [];
    const espaco = w > 700 ? 34 : 26;
    let k = 0;
    for (let x = espaco / 2; x < w; x += espaco, k++) {
      const t = (x % passo) / passo;
      if (t < 0.08 || t > 0.92) continue;
      const y = yEm(x),
        corda = 5 + ((k * 7) % 3) * 4,
        prata = k % 3 === 1,
        tam = k % 2 ? 4.2 : 5.6;
      pendentes.push(
        <g key={k}>
          <line x1={r1(x)} y1={r1(y)} x2={r1(x)} y2={r1(y + corda)} stroke="#b8913c" strokeWidth={0.5} opacity={0.7} />
          <g className="anonovo-cintila" style={{ animationDelay: `-${((k * 0.61) % 3).toFixed(2)}s` }}>
            <path
              transform={`translate(${r1(x - tam)} ${r1(y + corda)}) scale(${r1(tam / 10)})`}
              d={D_ESTRELA4}
              fill={prata ? "#d6d2c8" : k % 2 ? "#e3c472" : "#c9a14a"}
            />
          </g>
        </g>,
      );
    }
    const pontas: ReactNode[] = [];
    for (let i = 0; i <= n; i++) pontas.push(<circle key={i} cx={r1(passo * i)} cy={y0} r={2.4} fill="#c9a14a" />);
    conteudo = (
      <>
        <path d={fio} fill="none" stroke="#c9a14a" strokeWidth={1.1} />
        <path d={fio} fill="none" stroke="#fff1c2" strokeWidth={0.5} strokeDasharray="1 5" />
        {pendentes}
        {pontas}
      </>
    );
  }
  const alto = (w > 700 ? 22 : 15) + 34;
  return (
    <svg
      ref={ref}
      aria-hidden
      className="pointer-events-none absolute inset-x-0 top-0 block w-full overflow-visible"
      height={alto}
      viewBox={`0 0 ${w || 1} ${alto}`}
    >
      {conteudo}
    </svg>
  );
}

/** Mirror ball (globo espelhado) hanging from (0,0). */
function Globo() {
  return (
    <>
      <rect x={-2.4} y={-1} width={4.8} height={3.4} rx={0.8} fill="#b8913c" />
      <circle cx={0} cy={10} r={8} fill="#cfcac0" stroke="#8f8a80" strokeWidth={0.6} />
      <path
        d="M-8 10 H8 M-7 6 H7 M-7 14 H7 M-4.5 3.2 H4.5 M-4.5 16.8 H4.5 M0 2 V18 M-4 2.6 Q-6 10 -4 17.4 M4 2.6 Q6 10 4 17.4"
        stroke="#9c978d"
        strokeWidth={0.45}
        fill="none"
      />
      <path className="anonovo-cintila" d="M-3.5 4.5 L-2.8 6.2 L-1.1 6.9 L-2.8 7.6 L-3.5 9.3 L-4.2 7.6 L-5.9 6.9 L-4.2 6.2 Z" fill="#fff" />
      <circle cx={3} cy={13} r={1} fill="#fff8e1" opacity={0.9} />
    </>
  );
}

/** A gold star or a mirror ball hanging on a thread over a chair card's top corner. Parent must be `relative`. */
export function EnfeiteAnoNovoCartao({ i }: { i: number }) {
  if (!useAnoNovo()) return null;
  const fio = 16 + (i % 2) * 12;
  return (
    <svg
      aria-hidden
      viewBox={`-12 0 24 ${fio + 22}`}
      className={`pointer-events-none absolute -top-1 z-10 w-7 sm:w-10 ${i % 2 ? "left-3 sm:left-5" : "right-3 sm:right-5"}`}
    >
      <g className="natal-pend" style={{ transformOrigin: "0 0", animationDelay: `-${(i * 0.9).toFixed(1)}s` }}>
        <line x1={0} y1={0} x2={0} y2={fio} stroke="#b8913c" strokeWidth={0.8} />
        <g transform={`translate(0 ${fio})`}>
          {i % 2 ? (
            <Globo />
          ) : (
            <g className="anonovo-cintila">
              <path transform="translate(-10 0)" d={D_ESTRELA4} fill="#c9a14a" stroke="#a7801f" strokeWidth={0.5} />
            </g>
          )}
        </g>
      </g>
    </svg>
  );
}

/** Line under the "Escolha a sua cadeira" title: "Cadeira nova para começar 2027". */
export function SubtituloEscolhaAnoNovo() {
  const ano = useAnoNovo();
  if (!ano) return null;
  return (
    <p className="mt-1 flex items-center gap-2 font-serif text-base italic">
      <Cintilante className="h-4 w-6 shrink-0" />
      <span className="anonovo-ouro-escuro">Cadeira nova para começar {ano}</span>
    </p>
  );
}

const CONFETE_QUEDA = ["#c9a14a", "#e3c472", "#d6d2c8", "#b8913c", "#1d2642"];

/** Gold, silver and night-blue confetti drifting down behind a section. Parent must be `relative`. */
export function ConfeteCaindo() {
  if (!useAnoNovo()) return null;
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      {Array.from({ length: 16 }, (_, k) => (
        <span
          key={k}
          className="anonovo-confete-cai"
          style={{
            left: `${(k * 6.7 + 2) % 100}%`,
            animationDelay: `-${((k * 1.3) % 10).toFixed(1)}s`,
            animationDuration: `${8 + (k % 4) * 2}s`,
            background: CONFETE_QUEDA[k % CONFETE_QUEDA.length],
            borderRadius: k % 4 === 0 ? "50%" : "1px",
          }}
        />
      ))}
    </div>
  );
}

/** Middle of the material block's divider: gold sparkle at New Year, else `senao`. */
export function MeioDoDivisorAnoNovo({ senao }: { senao: ReactNode }) {
  return useAnoNovo() ? <Cintilante className="h-5 w-7" /> : <>{senao}</>;
}

/** A small firework burst (gold rays + dots) that pops on a loop; `atraso` puts several out of step. */
export function Estouro({ className = "", atraso = 0, cor = "#c9a14a" }: { className?: string; atraso?: number; cor?: string }) {
  const raios = Array.from({ length: 12 }, (_, k) => {
    const a = (k * Math.PI) / 6,
      c = Math.cos(a),
      s = Math.sin(a);
    return { x1: r1(20 + c * 6), y1: r1(20 + s * 6), x2: r1(20 + c * 16), y2: r1(20 + s * 16), px: r1(20 + c * 18.5), py: r1(20 + s * 18.5) };
  });
  return (
    <svg viewBox="0 0 40 40" aria-hidden className={className}>
      <g className="anonovo-estouro" style={{ animationDelay: `-${atraso.toFixed(2)}s` }}>
        {raios.map((r, k) => (
          <g key={k}>
            <line x1={r.x1} y1={r.y1} x2={r.x2} y2={r.y2} stroke={k % 3 === 1 ? "#d6d2c8" : cor} strokeWidth={1.4} strokeLinecap="round" />
            <circle cx={r.px} cy={r.py} r={k % 2 ? 1 : 1.5} fill={k % 2 ? "#fff1c2" : cor} />
          </g>
        ))}
        <circle cx={20} cy={20} r={2.2} fill="#fff1c2" />
      </g>
    </svg>
  );
}

const CONFETE_CARTAO = ["#c9a14a", "#e3c472", "#d6d2c8", "#fff1c2", "#1d2642"];

/**
 * New Year on each "Escolha a sua cadeira" card's text area (user 2026-11-25: "faça alguma
 * coisa aqui também… inventa algo legal"): two little gold fireworks popping out of step in
 * the corner, a shimmering gold line along the bottom, and a confetti burst from the
 * corner when the mouse enters the card. Put it inside the card's `relative` wrapper.
 */
export function FogosDoCartao({ i }: { i: number }) {
  const ano = useAnoNovo();
  const raiz = useRef<HTMLDivElement>(null);
  const [confetes, soltar] = useConfete(CONFETE_CARTAO);
  const soltarRef = useRef(soltar);
  useEffect(() => {
    soltarRef.current = soltar;
  });
  useEffect(() => {
    const el = raiz.current,
      cartao = el?.parentElement;
    if (!el || !cartao || !window.matchMedia("(hover: hover)").matches) return;
    const entrar = () => soltarRef.current(el.offsetWidth - 30, el.offsetHeight - 26, 22, 0.45);
    cartao.addEventListener("mouseenter", entrar);
    return () => cartao.removeEventListener("mouseenter", entrar);
  }, [ano]);
  if (!ano) return null;
  return (
    <div ref={raiz} aria-hidden className="pointer-events-none absolute inset-0 z-10 transition-transform duration-300 group-hover/cartao:-translate-y-1">
      <Estouro className="absolute bottom-2 right-2 h-9 w-9 sm:bottom-3 sm:right-4 sm:h-11 sm:w-11" atraso={i * 0.8} />
      <Estouro className="absolute bottom-3 right-11 h-5 w-5 sm:bottom-5 sm:right-[4.25rem] sm:h-6 sm:w-6" atraso={i * 0.8 + 1.3} cor="#e3c472" />
      <span className="anonovo-linha-ouro absolute inset-x-px bottom-px h-[3px]" />
      <Confetes lista={confetes} />
    </div>
  );
}

/**
 * Full-width night-blue band between the "Novidades" title and the grid (user 2026-11-25:
 * the small card looked "amador… pode deixar pegando na horizontal inteira do site").
 */
export function FaixaNovidadesAnoNovo() {
  const ano = useAnoNovo();
  if (!ano) return null;
  return (
    <div className="anonovo-banda relative mt-8 overflow-hidden md:mt-10">
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        {BOKEH.slice(0, 8).map((b, i) => (
          <i key={i} className="anonovo-bokeh" style={{ left: b.left, top: b.top, width: b.t, height: b.t, animationDelay: b.atraso, animationDuration: b.dur }} />
        ))}
        <Estouro className="absolute left-[4%] top-2 hidden h-12 w-12 md:block" atraso={0.4} />
        <Estouro className="absolute left-[22%] bottom-1 hidden h-7 w-7 lg:block" atraso={1.9} cor="#e3c472" />
        <Estouro className="absolute right-[30%] top-1 hidden h-9 w-9 lg:block" atraso={1.1} />
        <Estouro className="absolute right-[3%] bottom-2 h-8 w-8 md:h-12 md:w-12" atraso={2.4} cor="#e3c472" />
      </div>
      <div className="relative flex flex-col items-start gap-4 px-4 py-6 sm:flex-row sm:items-center sm:justify-between md:px-[2cm] md:py-7">
        <div className="grid gap-1">
          <p className="flex items-center gap-3 font-serif text-3xl italic md:text-4xl">
            <Cintilante className="h-6 w-9 shrink-0" />
            <span className="anonovo-ouro">Feliz {ano}!</span>
          </p>
          <p className="text-sm text-[#d6ccb8] md:text-base">Comece o ano com uma cadeira feita à mão, do seu jeito.</p>
        </div>
        <a href="/personalizar" data-rastro="Ano Novo: monte a sua (Novidades)" className="anonovo-botao shrink-0 px-6 py-3 text-sm font-medium">
          Montar a minha
        </a>
      </div>
    </div>
  );
}
