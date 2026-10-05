import "server-only";
import { redis, redisAtivo, type Cmd } from "./redis";

// Customers who identified themselves (2026-10-05, admin "Clientes"):
// - orders started with "Pagar agora" (name, WhatsApp, items) — so the
//   atelier can follow up on carts that never got paid;
// - the "novidades e cupons" WhatsApp list (explicit opt-in checkbox).
// Both are disclosed in the privacy policy and kept 180 days / until removed.

const PEDIDO_S = 180 * 24 * 3600;
const kp = (ref: string) => `pedido:${ref}`;

export type StatusPedido = "aguardando" | "pago" | "pendente" | "recusado";

export type PedidoCliente = {
  ref: string;
  em: number;
  nome: string;
  whatsapp: string;
  cidade: string;
  forma: "pix" | "cartao";
  itens: string[];
  valor: number;
  status: StatusPedido;
  vid?: string;
};

export async function salvarPedidoIniciado(p: Omit<PedidoCliente, "em" | "status">) {
  if (!redisAtivo()) return;
  const em = Date.now();
  const dados: PedidoCliente = { ...p, em, status: "aguardando" };
  try {
    await redis([
      ["SET", kp(p.ref), JSON.stringify(dados), "EX", PEDIDO_S],
      ["ZADD", "pedidos", em, p.ref],
      ["ZREMRANGEBYRANK", "pedidos", 0, -501],
    ]);
  } catch (err) {
    console.error("salvarPedidoIniciado", err);
  }
}

/** Updates an order's status; returns the order (for the visit journey), or null. */
export async function marcarPedido(ref: string, status: StatusPedido): Promise<PedidoCliente | null> {
  if (!redisAtivo() || !/^[a-z0-9-]{6,40}$/i.test(ref)) return null;
  try {
    const [bruto] = (await redis([["GET", kp(ref)]])) as (string | null)[];
    if (!bruto) return null;
    const p = JSON.parse(bruto) as PedidoCliente;
    if (p.status === status || p.status === "pago") return p;
    p.status = status;
    await redis([["SET", kp(ref), JSON.stringify(p), "KEEPTTL"]]);
    return p;
  } catch (err) {
    console.error("marcarPedido", err);
    return null;
  }
}

export async function pedidosRecentes(limite = 80): Promise<PedidoCliente[]> {
  const [refs] = (await redis([["ZREVRANGE", "pedidos", 0, limite - 1]])) as string[][];
  if (!refs?.length) return [];
  const brutos = (await redis(refs.map((r): Cmd => ["GET", kp(r)]))) as (string | null)[];
  return brutos.flatMap((b) => {
    if (!b) return [];
    try {
      return [JSON.parse(b) as PedidoCliente];
    } catch {
      return [];
    }
  });
}

export async function excluirPedido(ref: string) {
  await redis([["DEL", kp(ref)], ["ZREM", "pedidos", ref]]);
}

/**
 * Orders still "aguardando" (buyer may have paid later without coming back
 * to the site): asks Mercado Pago, by order reference, what happened.
 */
export async function atualizarComMercadoPago(pedidos: PedidoCliente[]) {
  const token = process.env.MERCADOPAGO_ACCESS_TOKEN;
  if (!token) return pedidos;
  const semana = Date.now() - 14 * 86400000;
  const abertos = pedidos.filter((p) => (p.status === "aguardando" || p.status === "pendente") && p.em > semana).slice(0, 15);
  await Promise.all(
    abertos.map(async (p) => {
      try {
        const res = await fetch(`https://api.mercadopago.com/v1/payments/search?external_reference=${encodeURIComponent(p.ref)}&sort=date_created&criteria=desc`, {
          headers: { Authorization: `Bearer ${token}` },
          cache: "no-store",
        });
        if (!res.ok) return;
        const j = (await res.json()) as { results?: { status?: string }[] };
        const st = j.results?.map((r) => r.status) ?? [];
        const novo: StatusPedido | null = st.includes("approved")
          ? "pago"
          : st.some((s) => s === "pending" || s === "in_process" || s === "authorized")
            ? "pendente"
            : st.length && st.every((s) => s === "rejected" || s === "cancelled")
              ? "recusado"
              : null;
        if (novo && novo !== p.status) {
          p.status = novo;
          await marcarPedido(p.ref, novo);
        }
      } catch {}
    })
  );
  return pedidos;
}

// --- novidades list ------------------------------------------------------------------

export type Interessado = { id: string; em: number; nome: string; whatsapp: string; vid?: string };

export function normalizarWhatsapp(bruto: string) {
  let n = bruto.replace(/\D/g, "");
  if (n.length === 10 || n.length === 11) n = `55${n}`;
  return /^55\d{10,11}$/.test(n) ? n : null;
}

/** Adds (or refreshes) someone on the list, keyed by number so repeats don't duplicate. */
export async function salvarInteressado(i: Omit<Interessado, "id" | "em">) {
  const em = Date.now();
  const id = i.whatsapp;
  await redis([
    ["HSET", "interessados", id, JSON.stringify({ ...i, id, em })],
    ["ZADD", "interessados:ordem", em, id],
  ]);
}

export async function listarInteressados(): Promise<Interessado[]> {
  const [ids] = (await redis([["ZREVRANGE", "interessados:ordem", 0, 999]])) as string[][];
  if (!ids?.length) return [];
  const brutos = (await redis([["HMGET", "interessados", ...ids]]))[0] as (string | null)[];
  return brutos.flatMap((b) => {
    if (!b) return [];
    try {
      return [JSON.parse(b) as Interessado];
    } catch {
      return [];
    }
  });
}

export async function excluirInteressado(id: string) {
  await redis([["HDEL", "interessados", id], ["ZREM", "interessados:ordem", id]]);
}

/** Abuse brake for public sign-ups: max 5 per IP per hour. */
export async function limiteDeCadastro(ip: string) {
  const k = `interessados:ip:${ip}`;
  const [n] = await redis([["INCR", k]]);
  if (Number(n) === 1) await redis([["EXPIRE", k, 3600]]);
  return Number(n) > 5;
}
