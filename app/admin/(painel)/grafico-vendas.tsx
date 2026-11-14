import type { PedidoCliente } from "@/lib/clientes";

// Admin home (2026-11-14): paid sales per week, last 8 weeks (Monday–Sunday,
// Brasília). Server-rendered SVG, one series: past weeks rattan, the current
// (still running) week wood + bold label, so it isn't told by color alone.
// Every value is also in the "Ver em números" table; each column has a <title>.

const DIA = 86_400_000;
const SEMANAS = 8;

/** Day number (days since 1970-01-01) of a moment, on the Brasília calendar. */
function diaBR(ms: number) {
  const [a, m, d] = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo", year: "numeric", month: "2-digit", day: "2-digit" })
    .format(new Date(ms))
    .split("-")
    .map(Number);
  return Date.UTC(a, m - 1, d) / DIA;
}
/** Monday of that day's week (day number). */
const segunda = (dia: number) => dia - ((new Date(dia * DIA).getUTCDay() + 6) % 7);
const ddmm = (dia: number) => new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", timeZone: "UTC" }).format(new Date(dia * DIA));

const reais = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: v >= 1000 ? 0 : 2 });
/** Axis tick: "R$ 0", "R$ 500", "R$ 1,5 mil". */
const tick = (v: number) => (v >= 1000 ? `R$ ${(v / 1000).toLocaleString("pt-BR", { maximumFractionDigits: 1 })} mil` : `R$ ${v}`);

/** A clean axis top (1, 2, 2.5 or 5 × 10^n) at or above the biggest week. */
function topoDoEixo(max: number) {
  if (max <= 0) return 500;
  const p = 10 ** Math.floor(Math.log10(max));
  return ([1, 2, 2.5, 5, 10].map((f) => f * p).find((v) => v >= max) ?? 10 * p);
}

type Semana = { inicio: number; total: number; vendas: number };

/** Weeks + the "last 28 days vs the 28 before" summary. `agora` comes from the caller (no Date.now() in render). */
export function resumoDeVendas(pagos: PedidoCliente[], agora: number) {
  const atual = segunda(diaBR(agora));
  const semanas: Semana[] = Array.from({ length: SEMANAS }, (_, i) => ({ inicio: atual - 7 * (SEMANAS - 1 - i), total: 0, vendas: 0 }));
  let ult28 = 0;
  let ant28 = 0;
  for (const p of pagos) {
    const t = p.pagoEm ?? p.em;
    const s = semanas.find((x) => x.inicio === segunda(diaBR(t)));
    if (s) {
      s.total += p.valor;
      s.vendas += 1;
    }
    const idade = agora - t;
    if (idade >= 0 && idade < 28 * DIA) ult28 += p.valor;
    else if (idade >= 28 * DIA && idade < 56 * DIA) ant28 += p.valor;
  }
  return { semanas, ult28, ant28 };
}

function frase(ult: number, ant: number) {
  const base = `${reais(ult)} nas últimas 4 semanas`;
  if (ant <= 0) return ult > 0 ? `${base}. Nas 4 semanas antes não teve venda paga.` : "Nenhuma venda paga nas últimas 8 semanas.";
  const pct = Math.round(((ult - ant) / ant) * 100);
  if (pct === 0) return `${base}, o mesmo que nas 4 anteriores.`;
  return `${base}, ${Math.abs(pct)}% ${pct > 0 ? "a mais" : "a menos"} que nas 4 anteriores (${reais(ant)}).`;
}

export function GraficoVendas({ pagos, agora, incompleto }: { pagos: PedidoCliente[]; agora: number; incompleto?: boolean }) {
  const { semanas, ult28, ant28 } = resumoDeVendas(pagos, agora);
  const texto = frase(ult28, ant28);

  // Geometry in viewBox units; the box is ~360 wide so text stays ~1:1 on a phone.
  const W = 360;
  const H = 188;
  const esq = 52; // y tick labels
  const dir = 6;
  const topo = 20; // room for the cap labels
  const base = H - 26; // x labels below
  const passo = (W - esq - dir) / SEMANAS;
  const larg = Math.min(24, passo - 10);
  const maxV = Math.max(...semanas.map((s) => s.total));
  const eixo = topoDoEixo(maxV);
  const y = (v: number) => base - (v / eixo) * (base - topo);
  const ticks = [0, eixo / 2, eixo];
  const iMax = maxV > 0 ? semanas.findIndex((s) => s.total === maxV) : -1;

  return (
    <figure className="rounded-2xl border border-line/70 bg-paper p-4 shadow-[0_1px_2px_rgba(36,31,26,0.05)] sm:p-5">
      <figcaption>
        <h2 className="text-sm font-semibold text-ink-soft">Vendas pagas por semana</h2>
        <p className="mt-1 text-[0.95rem] font-medium leading-snug text-ink">{texto}</p>
      </figcaption>

      <svg viewBox={`0 0 ${W} ${H}`} className="mt-3 h-auto w-full" role="img" aria-label={`Vendas pagas nas últimas ${SEMANAS} semanas. ${texto}`}>
        {ticks.map((t) => (
          <g key={t}>
            <line x1={esq} x2={W - dir} y1={y(t)} y2={y(t)} stroke="var(--canvas-deep)" strokeWidth={1} />
            <text x={esq - 6} y={y(t)} dy="0.32em" textAnchor="end" fontSize={10.5} fill="var(--ink-soft)" style={{ fontVariantNumeric: "tabular-nums" }}>
              {tick(t)}
            </text>
          </g>
        ))}
        {semanas.map((s, i) => {
          const atual = i === SEMANAS - 1;
          const cx = esq + passo * i + passo / 2;
          const h = base - y(s.total);
          const r = Math.min(4, h);
          const x0 = cx - larg / 2;
          // 4px rounded top, square at the baseline.
          const d = h > 0 ? `M${x0},${base} V${base - h + r} Q${x0},${base - h} ${x0 + r},${base - h} H${x0 + larg - r} Q${x0 + larg},${base - h} ${x0 + larg},${base - h + r} V${base} Z` : "";
          const rotulo = `Semana de ${ddmm(s.inicio)} a ${ddmm(s.inicio + 6)}${atual ? " (esta semana)" : ""}: ${reais(s.total)}, ${s.vendas} ${s.vendas === 1 ? "venda" : "vendas"}`;
          return (
            <g key={s.inicio}>
              <title>{rotulo}</title>
              {/* hit area: the whole column */}
              <rect x={cx - passo / 2} y={topo - 14} width={passo} height={base - topo + 14} fill="transparent" />
              {d ? <path d={d} fill={atual ? "var(--wood)" : "var(--rattan)"} /> : null}
              {(atual || i === iMax) && s.total > 0 ? (
                <text x={cx} y={base - h - 5} textAnchor="middle" fontSize={10.5} fontWeight={600} fill="var(--ink)">
                  {tick(Math.round(s.total))}
                </text>
              ) : null}
              <text
                x={cx}
                y={base + 15}
                textAnchor="middle"
                fontSize={10}
                fontWeight={atual ? 700 : 400}
                fill={atual ? "var(--ink)" : "var(--ink-soft)"}
              >
                {atual ? "Atual" : ddmm(s.inicio)}
              </text>
            </g>
          );
        })}
        <line x1={esq} x2={W - dir} y1={base} y2={base} stroke="var(--line)" strokeWidth={1} />
      </svg>

      <details className="mt-2 text-sm">
        <summary className="cursor-pointer text-xs font-semibold text-wood">Ver em números</summary>
        <table className="mt-2 w-full text-left text-xs">
          <thead className="text-ink-soft">
            <tr>
              <th className="py-1 font-medium">Semana (seg. a dom.)</th>
              <th className="py-1 text-right font-medium">Vendas</th>
              <th className="py-1 text-right font-medium">Valor</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line/50" style={{ fontVariantNumeric: "tabular-nums" }}>
            {[...semanas].reverse().map((s, i) => (
              <tr key={s.inicio}>
                <td className="py-1 text-ink">
                  {ddmm(s.inicio)} a {ddmm(s.inicio + 6)}
                  {i === 0 ? " (esta)" : ""}
                </td>
                <td className="py-1 text-right text-ink">{s.vendas}</td>
                <td className="py-1 text-right text-ink">{reais(s.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {incompleto ? <p className="mt-2 text-xs text-ink-soft">Conta só os pedidos mais recentes; semanas antigas podem estar incompletas.</p> : null}
      </details>
    </figure>
  );
}
