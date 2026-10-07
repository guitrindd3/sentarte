import "server-only";
import { avisarVenda } from "./avisos";
import { contarUsoDoCupom } from "./cupons-store";
import { anotarNoCaminho } from "./estatisticas";
import { codigoDoPedido, type DadosEntrega } from "./pedido";
import { redis, redisAtivo, type Cmd } from "./redis";

// Customers who identified themselves (2026-10-05, admin "Clientes"):
// - orders started with "Pagar agora" (name, WhatsApp, items) — so the
//   atelier can follow up on carts that never got paid;
// - the "novidades e cupons" WhatsApp list (explicit opt-in checkbox).
// Both are disclosed in the privacy policy and kept 180 days / until removed.

const PEDIDO_S = 180 * 24 * 3600;
const kp = (ref: string) => `pedido:${ref}`;

export type StatusPedido = "aguardando" | "pago" | "pendente" | "recusado";
/** After payment (2026-10-06): set by the atelier in admin, shown on /acompanhar. */
export type EtapaPedido = "producao" | "enviado" | "entregue";

/** One Melhor Envio shipment (one label per chair) — see lib/melhor-envio.ts. */
export type EnvioME = { id: string; servico: string; status?: string; rastreio?: string };

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
  /** Coupon code applied, if any (its paid uses are counted when this order is paid). */
  cupom?: string;
  // Since 2026-10-06 (labels + order tracking): full delivery data, CPF and
  // chairs per type — needed to ship. Older orders don't have them.
  entrega?: DadosEntrega;
  porTipo?: { normal: number; infantil: number; reclinavel: number };
  frete?: { valor: number; servico?: string };
  pagoEm?: number;
  etapa?: EtapaPedido;
  /** When each step happened (shown on /acompanhar). */
  etapaEm?: Partial<Record<EtapaPedido, number>>;
  rastreio?: string;
  transportadora?: string;
  envios?: EnvioME[];
  etiquetaUrl?: string;
};

const kcod = (cod: string) => `pedido:cod:${cod}`;

export async function salvarPedidoIniciado(p: Omit<PedidoCliente, "em" | "status">) {
  if (!redisAtivo()) return;
  const em = Date.now();
  const dados: PedidoCliente = { ...p, em, status: "aguardando" };
  try {
    await redis([
      ["SET", kp(p.ref), JSON.stringify(dados), "EX", PEDIDO_S],
      ["SET", kcod(codigoDoPedido(p.ref)), p.ref, "EX", PEDIDO_S],
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
    const p = await lerPedido(ref);
    if (!p) return null;
    if (p.status === status || p.status === "pago") return p;
    p.status = status;
    if (status === "pago") {
      p.pagoEm = Date.now();
      p.etapa = "producao";
      p.etapaEm = { ...p.etapaEm, producao: p.pagoEm };
    }
    await gravarPedido(p);
    // Payment can be confirmed by several paths at once (webhook, Pix polling,
    // /pedido) — this flag makes the coupon count and the sale alert happen once.
    if (status === "pago") {
      const [primeira] = await redis([["SET", `${kp(ref)}:pago`, 1, "NX", "EX", PEDIDO_S]]);
      if (primeira === "OK") {
        if (p.cupom) await contarUsoDoCupom(p.cupom);
        if (p.vid) await anotarNoCaminho(p.vid, { k: "p", x: p.valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }) });
        await avisarVenda(p).catch((err) => console.error("avisarVenda", err));
      }
    }
    return p;
  } catch (err) {
    console.error("marcarPedido", err);
    return null;
  }
}

export async function lerPedido(ref: string): Promise<PedidoCliente | null> {
  if (!/^[a-z0-9-]{6,40}$/i.test(ref)) return null;
  const [bruto] = (await redis([["GET", kp(ref)]])) as (string | null)[];
  if (!bruto) return null;
  try {
    return JSON.parse(bruto) as PedidoCliente;
  } catch {
    return null;
  }
}

export async function gravarPedido(p: PedidoCliente) {
  await redis([["SET", kp(p.ref), JSON.stringify(p), "KEEPTTL"]]);
}

/** Finds an order by its short number (what the customer types on /acompanhar). */
export async function pedidoPeloCodigo(codigo: string): Promise<PedidoCliente | null> {
  const cod = codigo.replace(/[^a-z0-9]/gi, "").toUpperCase();
  if (cod.length !== 8) return null;
  const [ref] = (await redis([["GET", kcod(cod)]])) as (string | null)[];
  return ref ? lerPedido(ref) : null;
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
  await redis([["DEL", kp(ref)], ["DEL", `${kp(ref)}:pago`], ["DEL", kcod(codigoDoPedido(ref))], ["ZREM", "pedidos", ref]]);
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

/** Fixes a name/number typed at sign-up. The list is keyed by number, so a new number moves the entry. */
export async function editarInteressado(id: string, dados: { nome: string; whatsapp: string }) {
  const [bruto] = (await redis([["HGET", "interessados", id]])) as (string | null)[];
  if (!bruto) return "sumiu" as const;
  const atual = JSON.parse(bruto) as Interessado;
  const novo: Interessado = { ...atual, nome: dados.nome, whatsapp: dados.whatsapp, id: dados.whatsapp };
  if (novo.id === id) {
    await redis([["HSET", "interessados", id, JSON.stringify(novo)]]);
    return "ok" as const;
  }
  const [existe] = await redis([["HEXISTS", "interessados", novo.id]]);
  if (Number(existe)) return "repetido" as const;
  await redis([
    ["HDEL", "interessados", id],
    ["ZREM", "interessados:ordem", id],
    ["HSET", "interessados", novo.id, JSON.stringify(novo)],
    ["ZADD", "interessados:ordem", atual.em, novo.id],
  ]);
  return "ok" as const;
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
