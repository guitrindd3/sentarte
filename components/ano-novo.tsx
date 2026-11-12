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
import { useNatal } from "@/components/natal";

const PREVIA = "sentarte-anonovo-previa";

/** The year being celebrated, or 0 when it's not New Year. */
function anoNovoAgora() {
  const hoje = hojeBR();
  try {
    const q = new URLSearchParams(window.location.search).get("anonovo");
    if (q === "1") sessionStorage.setItem(PREVIA, "1");
    if (q === "0") sessionStorage.removeItem(PREVIA);
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
export function FaixaDeAnoNovo({ ano, calendario }: { ano: number; calendario?: ReactNode }) {
  const alvo = viradaMs(ano);
  const agora = useAgora(alvo);
  const [vez, setVez] = useState(0);
  useEffect(() => {
    if (!calendario || reduzMovimento()) return;
    const t = setInterval(() => setVez((v) => v + 1), 7000);
    return () => clearInterval(t);
  }, [calendario]);
  const mostrarCalendario = !!calendario && vez % 2 === 1;
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
      {mostrarCalendario ? (
        <div className="relative py-1">{calendario}</div>
      ) : (
        <span className="relative inline-flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5">
          <span className="inline-flex items-center gap-2 whitespace-nowrap">
            <em className="anonovo-ouro font-serif text-base italic sm:text-lg">{depois ? "Feliz Ano Novo!" : `Feliz ${ano}!`}</em>
            <span>{depois ? `Que ${ano} seja de muito sol.` : "A virada chega em"}</span>
          </span>
          {digitos}
        </span>
      )}
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
  const { addItem } = useCart();
  const [escolhido, setEscolhido] = useState<number | null>(null);
  if (!ano) return null;
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
          <Tacas />
        </div>
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
