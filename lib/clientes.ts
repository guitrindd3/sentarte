import "server-only";
import { avisarVenda } from "./avisos";
import { contarUsoDoCupom, criarCuponsDeVale } from "./cupons-store";
import { anotarNoCaminho, diaBR } from "./estatisticas";
import { novoCodigoVale, VALIDADE_VALE_DIAS } from "./vale";
import { codigoDoPedido, type DadosEntrega, type FormaPagamento } from "./pedido";
import { redis, redisAtivo, type Cmd } from "./redis";
import { usarVagas } from "./vagas";

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
  forma: FormaPagamento;
  itens: string[];
  valor: number;
  status: StatusPedido;
  vid?: string;
  /** Coupon code applied, if any (its paid uses are counted when this order is paid). */
  cupom?: string;
  /** Vale-presente code spent on this order (its single use is counted when paid). */
  valeUsado?: string;
  /** Vales-presente bought in this order; their codes are created when it's paid. */
  vales?: { valor: number; para?: string }[];
  codigosVale?: { codigo: string; valor: number; para?: string; validoAte: string }[];
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
  /** "painel" = a sale closed on WhatsApp and typed in the admin (2026-10-24); missing = paid on the site. */
  origem?: "painel";
  /** Details the atelier wrote about a sale typed in the admin. */
  obs?: string;
  /** The /eventos quote it came from (lib/orcamentos.ts), to show the customer's logo/pictures. */
  orcamento?: string;
  /** The cart as the browser had it (since 2026-11-05): refills it from the reminder e-mail (/retomar/<ref>). */
  carrinho?: ItemGuardado[];
  /** The coupon code the customer typed, to put it back too. */
  cupomDigitado?: string;
  /** Chairs of a numbered collection in this order (lib/colecoes.ts), checked at checkout, numbered on payment. */
  colecoes?: { id: string; nome: string; modeloNome: string; qtd: number }[];
  /** Passport numbers of its chairs (lib/passaporte.ts), given on payment. */
  passaportes?: number[];
  /** Automatic e-mails already sent to the customer (lib/lembretes.ts): when. */
  lembretes?: {
    pagar1?: number;
    pagar2?: number;
    avaliar?: number;
    confirmado?: number;
    enviado?: number;
    rastreio?: number;
    entregue?: number;
    /** The tracking code already mailed (cleaned), so a new one gets its own e-mail. */
    rastreioAvisado?: string;
  };
};

/** A cart line as kept on the order — same shape as lib/cart-context CartItem. */
export type ItemGuardado = {
  id: string;
  categoriaSlug: string;
  categoriaTitulo: string;
  modeloId: string;
  modeloNome: string;
  imagemUrl?: string;
  corA: string;
  corB: string;
  quantidade: number;
  nomePersonalizado?: string;
  personalizada?: boolean;
  variante?: string;
  tipoCadeira?: "normal" | "infantil" | "reclinavel";
  bracoMadeira?: boolean;
  tassel?: string;
  tasselQtd?: 1;
  tasselLado?: "esq" | "dir";
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

/**
 * A sale closed on WhatsApp, typed in the admin ("Lançar venda"): saved
 * already paid, in production, so it shows in Clientes, gets /acompanhar,
 * production photos and labels like a site order. Uses this week's
 * production slots; no sale alert (the atelier typed it herself).
 */
export async function registrarVendaDoPainel(p: Omit<PedidoCliente, "em" | "status" | "pagoEm" | "etapa" | "etapaEm" | "origem">) {
  const em = Date.now();
  const dados: PedidoCliente = { ...p, em, status: "pago", pagoEm: em, etapa: "producao", etapaEm: { producao: em }, origem: "painel" };
  await redis([
    ["SET", kp(p.ref), JSON.stringify(dados), "EX", PEDIDO_S],
    ["SET", kcod(codigoDoPedido(p.ref)), p.ref, "EX", PEDIDO_S],
    ["SET", `${kp(p.ref)}:pago`, 1, "EX", PEDIDO_S],
    ["ZADD", "pedidos", em, p.ref],
    ["ZREMRANGEBYRANK", "pedidos", 0, -501],
  ]);
  const cadeiras = p.porTipo ? p.porTipo.normal + p.porTipo.infantil + p.porTipo.reclinavel : 0;
  await usarVagas(cadeiras);
  await import("./passaporte").then((m) => m.gerarPassaportes(p.ref)).catch((err) => console.error("passaportes", err));
  return dados;
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
        if (p.valeUsado) await contarUsoDoCupom(p.valeUsado);
        if (p.vales?.length) await criarVales(p);
        const cadeiras = p.porTipo ? p.porTipo.normal + p.porTipo.infantil + p.porTipo.reclinavel : 1;
        await usarVagas(cadeiras);
        if (p.vid) await anotarNoCaminho(p.vid, { k: "p", x: p.valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }) });
        await avisarVenda(p).catch((err) => console.error("avisarVenda", err));
        // "Pedido confirmado" to the customer (lazy import: lib/lembretes.ts imports this file)
        await import("./lembretes").then((m) => m.avisarEtapaAgora(ref)).catch((err) => console.error("avisarEtapa", err));
        // chair passports + collection numbers (lazy import: lib/passaporte.ts imports this file)
        await import("./passaporte").then((m) => m.gerarPassaportes(ref)).catch((err) => console.error("passaportes", err));
      }
    }
    return p;
  } catch (err) {
    console.error("marcarPedido", err);
    return null;
  }
}

/** Creates the one-time coupons for the vales-presente bought in a paid order. */
async function criarVales(p: PedidoCliente) {
  try {
    const validoAte = diaBR(new Date(Date.now() + VALIDADE_VALE_DIAS * 86400000));
    const codigos = (p.vales ?? []).map((v) => ({ codigo: novoCodigoVale(), valor: v.valor, para: v.para, validoAte }));
    await criarCuponsDeVale(
      codigos.map((c) => ({
        ...c,
        descricao: `Vale-presente${c.para ? ` para ${c.para}` : ""}, comprado por ${p.nome} (pedido ${codigoDoPedido(p.ref)})`,
      }))
    );
    p.codigosVale = codigos;
    await gravarPedido(p);
  } catch (err) {
    console.error("criarVales", err);
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

// ---- Card refusals (2026-11-09) -------------------------------------------
// Each refused payment of an order, with Mercado Pago's status_detail, kept in
// its own list (the order itself is rewritten on every new attempt) so the
// admin can say why and how many times. Deduplicated by payment id: the card
// route and the webhook both report the same refusal.

export type Recusa = { em: number; id?: string; detalhe?: string };
const krec = (ref: string) => `${kp(ref)}:recusas`;

export async function anotarRecusa(ref: string, r: Omit<Recusa, "em">) {
  if (!redisAtivo() || !/^[a-z0-9-]{6,40}$/i.test(ref)) return;
  try {
    if (r.id) {
      const [lista] = (await redis([["LRANGE", krec(ref), 0, -1]])) as string[][];
      if (lista?.some((x) => (JSON.parse(x) as Recusa).id === r.id)) return;
    }
    await redis([
      ["RPUSH", krec(ref), JSON.stringify({ em: Date.now(), ...r })],
      ["LTRIM", krec(ref), -20, -1],
      ["EXPIRE", krec(ref), PEDIDO_S],
    ]);
  } catch (err) {
    console.error("anotarRecusa", err);
  }
}

/** Refusals of several orders (oldest first in each list). */
export async function recusasDosPedidos(refs: string[]): Promise<Map<string, Recusa[]>> {
  const mapa = new Map<string, Recusa[]>();
  if (!refs.length || !redisAtivo()) return mapa;
  try {
    const res = (await redis(refs.map((r): Cmd => ["LRANGE", krec(r), 0, -1]))) as (string[] | null)[];
    refs.forEach((r, i) => {
      const l = (res[i] ?? []).flatMap((x) => {
        try {
          return [JSON.parse(x) as Recusa];
        } catch {
          return [];
        }
      });
      if (l.length) mapa.set(r, l);
    });
  } catch (err) {
    console.error("recusasDosPedidos", err);
  }
  return mapa;
}
