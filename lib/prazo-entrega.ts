import { pascoa } from "./faixas-calendario";
import { PRAZO_PRODUCAO_DIAS_UTEIS } from "./offer";

// "Pedindo hoje, chega até dia X" (2026-11-05, user picked it from the sales
// ideas list). The date the customer sees = production (up to
// PRAZO_PRODUCAO_DIAS_UTEIS business days, starting next Monday when this
// week's production slots are full — lib/vagas.ts) + 1 business day to post
// + the carrier's own delivery time from the Melhor Envio quote. Business
// days skip weekends and national holidays. Shown as "até" on purpose: it's
// the latest expected day, not a promise of that exact day.

/** Free shipping inside Espírito Santo has no carrier quote: a safe estimate. */
export const PRAZO_ENVIO_ES_DIAS_UTEIS = 3;
const POSTAGEM_DIAS_UTEIS = 1;

const DIA = 86_400_000;
const utc = (a: number, m: number, d: number) => Date.UTC(a, m - 1, d);

const feriadosPorAno = new Map<number, Set<number>>();
/** National holidays (plus Carnaval Monday/Tuesday, when the carriers barely work). */
function feriados(ano: number) {
  let s = feriadosPorAno.get(ano);
  if (!s) {
    const p = pascoa(ano).getTime();
    s = new Set([
      utc(ano, 1, 1),
      p - 48 * DIA, // Carnaval Monday
      p - 47 * DIA, // Carnaval Tuesday
      p - 2 * DIA, // Good Friday
      utc(ano, 4, 21),
      utc(ano, 5, 1),
      p + 60 * DIA, // Corpus Christi
      utc(ano, 9, 7),
      utc(ano, 10, 12),
      utc(ano, 11, 2),
      utc(ano, 11, 15),
      utc(ano, 11, 20),
      utc(ano, 12, 25),
    ]);
    feriadosPorAno.set(ano, s);
  }
  return s;
}

/** Today in Brasília, as a UTC midnight timestamp. */
export function hojeBR(agora = new Date()) {
  const [d, m, a] = new Intl.DateTimeFormat("pt-BR", { timeZone: "America/Sao_Paulo", day: "2-digit", month: "2-digit", year: "numeric" })
    .format(agora)
    .split("/")
    .map(Number);
  return utc(a, m, d);
}

export function diaUtil(t: number) {
  const d = new Date(t);
  const sem = d.getUTCDay();
  return sem !== 0 && sem !== 6 && !feriados(d.getUTCFullYear()).has(t);
}

export function somarDiasUteis(t: number, n: number) {
  let r = t;
  for (let i = 0; i < n; ) {
    r += DIA;
    if (diaUtil(r)) i++;
  }
  return r;
}

export type Previsao = { pronta: number; chega?: number };

/**
 * When an order made today is ready and (with the carrier's time) arrives.
 * `semVaga` = this week's slots are full → production starts next Monday.
 */
export function previsaoEntrega({ prazoFrete, semVaga = false, agora = new Date() }: { prazoFrete?: number; semVaga?: boolean; agora?: Date }): Previsao {
  let inicio = hojeBR(agora);
  if (semVaga) {
    // weeks run Monday–Sunday (lib/vagas.ts), so on a Sunday next week starts tomorrow
    const sem = new Date(inicio).getUTCDay(); // 0 = Sunday
    const proximaSegunda = inicio + ((8 - sem) % 7 || 7) * DIA;
    inicio = proximaSegunda - DIA; // counting starts the day before, so Monday is day 1
  }
  const pronta = somarDiasUteis(inicio, PRAZO_PRODUCAO_DIAS_UTEIS);
  const chega = prazoFrete === undefined ? undefined : somarDiasUteis(pronta, POSTAGEM_DIAS_UTEIS + prazoFrete);
  return { pronta, chega };
}

/** "qui., 19/11" */
export function diaCurto(t: number) {
  return new Intl.DateTimeFormat("pt-BR", { timeZone: "UTC", weekday: "short", day: "2-digit", month: "2-digit" }).format(new Date(t));
}
