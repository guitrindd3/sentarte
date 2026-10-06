import "server-only";
import type { EnvioME, PedidoCliente } from "./clientes";
import { caixasPorTipo, type ChairsPorTipo } from "./frete-servidor";
import { SITE_URL } from "./nav";
import { codigoDoPedido } from "./pedido";
import { redis } from "./redis";

// Shipping labels through Melhor Envio (2026-10-06, admin order page).
// Flow: quote the paid order's address → put one shipment per chair in the
// atelier's Melhor Envio cart → (optional) pay it with the Melhor Envio
// balance, generate and print the label here → read tracking codes back.
// The atelier can also stop after the cart step and pay/print on
// melhorenvio.com.br. Needs MELHORENVIO_TOKEN with the cart/checkout/
// generate/print/tracking permissions, and the sender data saved in
// /admin/avisos ("Remetente").

const API = "https://melhorenvio.com.br/api/v2";
const K_REMETENTE = "envio:remetente";

export type Remetente = {
  nome: string;
  telefone: string;
  email: string;
  cpf: string;
  cep: string;
  endereco: string;
  numero: string;
  complemento: string;
  bairro: string;
  cidade: string;
  uf: string;
};

export type OpcaoEnvio = { id: number; nome: string; preco: number; prazo?: number };

/** A Melhor Envio answer turned into words for the admin. */
export class ErroEnvio extends Error {}

async function me<T>(caminho: string, init?: { method?: string; body?: unknown }): Promise<T> {
  const token = process.env.MELHORENVIO_TOKEN;
  if (!token) throw new ErroEnvio("O Melhor Envio não está ligado no site (falta o token).");
  const res = await fetch(`${API}${caminho}`, {
    method: init?.method ?? "GET",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      "User-Agent": `SentArte (${process.env.MELHORENVIO_EMAIL ?? "ateliesentarte@gmail.com"})`,
    },
    body: init?.body ? JSON.stringify(init.body) : undefined,
    cache: "no-store",
  });
  const texto = await res.text();
  let j: unknown = null;
  try {
    j = texto ? JSON.parse(texto) : null;
  } catch {}
  if (res.status === 401 || res.status === 403) {
    throw new ErroEnvio(
      "O Melhor Envio recusou: o token do site não tem permissão para isso. Crie um token novo no Melhor Envio marcando todas as permissões de envio (carrinho, compra, gerar e imprimir etiqueta, rastreio) e troque o MELHORENVIO_TOKEN na Vercel."
    );
  }
  if (!res.ok) {
    console.error("melhor envio", caminho, res.status, texto.slice(0, 600));
    throw new ErroEnvio(`Melhor Envio: ${mensagemDeErro(j) ?? `erro ${res.status}`}`);
  }
  return j as T;
}

function mensagemDeErro(j: unknown): string | null {
  if (!j || typeof j !== "object") return null;
  const o = j as { message?: string; error?: string; errors?: Record<string, string[] | string> };
  const detalhes = o.errors ? Object.values(o.errors).flat().join(" ") : "";
  const m = [o.message ?? o.error, detalhes].filter(Boolean).join(" ");
  return m ? m.slice(0, 300) : null;
}

// --- sender ------------------------------------------------------------------------

export async function lerRemetente(): Promise<Remetente | null> {
  const [r] = (await redis([["GET", K_REMETENTE]])) as (string | null)[];
  try {
    return r ? (JSON.parse(r) as Remetente) : null;
  } catch {
    return null;
  }
}

export async function salvarRemetente(r: Remetente) {
  await redis([["SET", K_REMETENTE, JSON.stringify(r)]]);
}

/** Fills the sender form from the Melhor Envio account, when the token can read it. */
export async function remetenteDaConta(): Promise<Partial<Remetente>> {
  try {
    const u = await me<{ firstname?: string; lastname?: string; email?: string; document?: string; phone?: { phone?: string } }>("/me");
    return {
      nome: [u.firstname, u.lastname].filter(Boolean).join(" "),
      email: u.email ?? "",
      cpf: u.document ?? "",
      telefone: u.phone?.phone ?? "",
      cep: (process.env.FRETE_CEP_ORIGEM ?? "").replace(/\D/g, ""),
    };
  } catch {
    return { cep: (process.env.FRETE_CEP_ORIGEM ?? "").replace(/\D/g, "") };
  }
}

export function remetenteCompleto(r: Remetente | null): r is Remetente {
  return Boolean(
    r && r.nome && r.telefone.replace(/\D/g, "").length >= 10 && r.cpf.replace(/\D/g, "").length === 11 && r.cep.replace(/\D/g, "").length === 8 && r.endereco && r.numero && r.bairro && r.cidade && r.uf.length === 2
  );
}

// --- per order ----------------------------------------------------------------------

/** One package per chair, in a fixed order (normal, infantil, reclinável). */
function volumes(porTipo: ChairsPorTipo) {
  const caixas = caixasPorTipo();
  const lista: { tipo: keyof ChairsPorTipo; altura: number; largura: number; comprimento: number; peso: number }[] = [];
  for (const tipo of ["normal", "infantil", "reclinavel"] as const) {
    const c = caixas[tipo];
    if (!c) throw new ErroEnvio("Falta o tamanho da caixa da cadeira (FRETE_CAIXA na Vercel).");
    for (let i = 0; i < porTipo[tipo]; i++) lista.push({ tipo, altura: c[0], largura: c[1], comprimento: c[2], peso: c[3] });
  }
  return lista;
}

const NOME_TIPO = { normal: "Cadeira de praia", infantil: "Cadeira de praia infantil", reclinavel: "Cadeira de praia reclinável" };

function conferirPedido(p: PedidoCliente) {
  if (!p.entrega?.cpf || !p.entrega.cep || !p.porTipo) {
    throw new ErroEnvio("Esse pedido é de antes da etiqueta automática (não tem o endereço completo e o CPF guardados). Faça a etiqueta direto no Melhor Envio.");
  }
  const vols = volumes(p.porTipo);
  if (!vols.length) throw new ErroEnvio("Esse pedido não tem cadeiras para enviar.");
  return { entrega: p.entrega, vols, valorPorCadeira: Math.round(((p.valor - (p.frete?.valor ?? 0)) / vols.length) * 100) / 100 };
}

/** Carrier options for ONE package of this order (the label is made per chair). */
export async function cotarEnvio(p: PedidoCliente): Promise<OpcaoEnvio[]> {
  const { entrega, vols, valorPorCadeira } = conferirPedido(p);
  const origem = (process.env.FRETE_CEP_ORIGEM ?? "").replace(/\D/g, "");
  const v = vols[0];
  const lista = await me<{ id: number; name?: string; price?: string; custom_price?: string; delivery_time?: number; custom_delivery_time?: number; error?: string; company?: { name?: string } }[]>(
    "/me/shipment/calculate",
    {
      method: "POST",
      body: {
        from: { postal_code: origem },
        to: { postal_code: entrega.cep },
        package: { height: v.altura, width: v.largura, length: v.comprimento, weight: v.peso },
        options: { insurance_value: valorPorCadeira, receipt: false, own_hand: false },
      },
    }
  );
  return lista
    .filter((s) => !s.error && Number(s.custom_price ?? s.price) > 0)
    .map((s) => ({
      id: s.id,
      nome: [s.company?.name, s.name].filter(Boolean).join(" "),
      preco: Math.round(Number(s.custom_price ?? s.price) * 100) / 100,
      prazo: s.custom_delivery_time ?? s.delivery_time,
    }))
    .sort((a, b) => a.preco - b.preco);
}

/** Puts one shipment per chair in the Melhor Envio cart. */
export async function colocarNoCarrinho(p: PedidoCliente, servico: OpcaoEnvio): Promise<EnvioME[]> {
  const { entrega, vols, valorPorCadeira } = conferirPedido(p);
  const r = await lerRemetente();
  if (!remetenteCompleto(r)) throw new ErroEnvio("Preencha os dados do remetente em Avisos e envio antes de gerar etiquetas.");
  const so = (s: string) => s.replace(/\D/g, "");
  const envios: EnvioME[] = [];
  for (const [i, v] of vols.entries()) {
    const criado = await me<{ id?: string; protocol?: string }>("/me/cart", {
      method: "POST",
      body: {
        service: servico.id,
        from: {
          name: r.nome,
          phone: so(r.telefone),
          email: r.email,
          document: so(r.cpf),
          address: r.endereco,
          complement: r.complemento,
          number: r.numero,
          district: r.bairro,
          city: r.cidade,
          state_abbr: r.uf.toUpperCase(),
          country_id: "BR",
          postal_code: so(r.cep),
        },
        to: {
          name: entrega.nome,
          phone: so(entrega.telefone),
          email: entrega.email || r.email,
          document: so(entrega.cpf ?? ""),
          address: entrega.endereco,
          complement: entrega.complemento,
          number: entrega.numero,
          district: entrega.bairro || "Centro",
          city: entrega.cidade,
          state_abbr: entrega.uf.toUpperCase(),
          country_id: "BR",
          postal_code: so(entrega.cep),
        },
        products: [{ name: NOME_TIPO[v.tipo], quantity: 1, unitary_value: valorPorCadeira }],
        volumes: [{ height: v.altura, width: v.largura, length: v.comprimento, weight: v.peso }],
        options: {
          insurance_value: valorPorCadeira,
          receipt: false,
          own_hand: false,
          reverse: false,
          non_commercial: true,
          platform: "SentArte",
          tags: [{ tag: `Pedido ${codigoDoPedido(p.ref)}${vols.length > 1 ? ` (${i + 1}/${vols.length})` : ""}`, url: `${SITE_URL}/admin/clientes/${p.ref}` }],
        },
      },
    });
    if (!criado.id) throw new ErroEnvio("O Melhor Envio não devolveu o envio criado. Confira o carrinho no site do Melhor Envio.");
    envios.push({ id: criado.id, servico: servico.nome, status: "pending" });
  }
  return envios;
}

/** Pays the cart items with the Melhor Envio balance, generates and returns the label PDF link. */
export async function pagarEImprimir(envios: EnvioME[]): Promise<string> {
  const ids = envios.map((e) => e.id);
  await me("/me/shipment/checkout", { method: "POST", body: { orders: ids } });
  await me("/me/shipment/generate", { method: "POST", body: { orders: ids } });
  const r = await me<{ url?: string }>("/me/shipment/print", { method: "POST", body: { mode: "public", orders: ids } });
  if (!r.url) throw new ErroEnvio("A etiqueta foi gerada, mas o link de impressão não veio. Imprima pelo site do Melhor Envio.");
  return r.url;
}

/** Re-reads each shipment (status + tracking code). */
export async function atualizarEnvios(envios: EnvioME[]): Promise<EnvioME[]> {
  return Promise.all(
    envios.map(async (e) => {
      const o = await me<{ status?: string; tracking?: string | null; self_tracking?: string | null }>(`/me/orders/${e.id}`);
      return { ...e, status: o.status ?? e.status, rastreio: o.tracking || o.self_tracking || e.rastreio };
    })
  );
}

/** Removes not-yet-paid shipments from the Melhor Envio cart. */
export async function tirarDoCarrinho(envios: EnvioME[]) {
  for (const e of envios) await me(`/me/cart/${e.id}`, { method: "DELETE" });
}
