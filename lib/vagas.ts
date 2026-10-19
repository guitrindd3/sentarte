import "server-only";
import { redis, redisAtivo } from "./redis";

// Production slots of the week (2026-10-19, user: "Restam 4 vagas, com o
// número controlado por você no painel"). The admin sets how many chairs the
// atelier can make per week; every paid order uses its chairs; the count
// starts over by itself every Monday (Brasília). Shown on the product page
// and in the cart only while it's on — and never blocks a sale: when the
// week is full the site says new orders go into next week's production.

const K = "vagas";

type Salvo = { ligado: boolean; total: number; semana: string; usadas: number };
export type Vagas = { ligado: boolean; total: number; usadas: number; restantes: number };

/** Monday of the current week, YYYY-MM-DD in Brasília. */
function segundaBR(d = new Date()) {
  const br = new Date(d.toLocaleString("en-US", { timeZone: "America/Sao_Paulo" }));
  br.setDate(br.getDate() - ((br.getDay() + 6) % 7));
  return `${br.getFullYear()}-${String(br.getMonth() + 1).padStart(2, "0")}-${String(br.getDate()).padStart(2, "0")}`;
}

async function ler(): Promise<Salvo> {
  const [bruto] = (await redis([["GET", K]])) as (string | null)[];
  let s: Salvo = { ligado: false, total: 0, semana: segundaBR(), usadas: 0 };
  try {
    if (bruto) s = { ...s, ...(JSON.parse(bruto) as Partial<Salvo>) };
  } catch {}
  if (s.semana !== segundaBR()) s = { ...s, semana: segundaBR(), usadas: 0 };
  return s;
}

const publico = (s: Salvo): Vagas => ({ ligado: s.ligado && s.total > 0, total: s.total, usadas: s.usadas, restantes: Math.max(0, s.total - s.usadas) });

export async function estadoVagas(): Promise<Vagas> {
  if (!redisAtivo()) return { ligado: false, total: 0, usadas: 0, restantes: 0 };
  return publico(await ler());
}

/** Admin: on/off, chairs per week and (optionally) how many are still free this week. */
export async function salvarVagas(ligado: boolean, total: number, restantes?: number) {
  const s = await ler();
  const t = Math.max(0, Math.min(200, Math.floor(total)));
  const usadas = restantes === undefined ? Math.min(s.usadas, t) : Math.max(0, t - Math.max(0, Math.min(t, Math.floor(restantes))));
  await redis([["SET", K, JSON.stringify({ ...s, ligado, total: t, usadas })]]);
}

/** A paid order takes its chairs from this week's slots (called once per order). */
export async function usarVagas(cadeiras: number) {
  if (!redisAtivo() || cadeiras <= 0) return;
  try {
    const s = await ler();
    await redis([["SET", K, JSON.stringify({ ...s, usadas: s.usadas + cadeiras })]]);
  } catch (err) {
    console.error("usarVagas", err);
  }
}
