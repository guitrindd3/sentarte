import "server-only";
import { normalizarWhatsapp, salvarPedidoIniciado } from "./clientes";
import { cuponsDoPedido } from "./cupons-store";
import { anotarNoCaminho, vidValido } from "./estatisticas";
import { inscreverEmail } from "./lista-email";
import { calcularFrete } from "./frete-servidor";
import { CATEGORIA_COM_PRECO, quantosTasseis, tipoValido } from "./offer";
import { valorDoVale } from "./vale";
import { codificarCadeira, decodificarCadeira } from "./chair-link";
import { SITE_URL } from "./nav";
import { getContent } from "./content-store";
import { nomesDesenho } from "./grupos";
import type { ItemGuardado } from "./clientes";
import { calcularPedido, descricaoItem, entregaCompleta, type DadosEntrega, type ItemDoPedido } from "./pedido";

// Shared by the card (Checkout Pro redirect, /api/checkout) and the in-site
// Pix (/api/pix) payments: everything charged is recomputed here — items,
// coupon, shipping — never taken from the browser.

export type CorpoPedido = {
  forma: "pix" | "cartao";
  itens: ItemDoPedido[];
  entrega: DadosEntrega;
  referencia: string;
  vid?: string;
  cupom?: string;
  /** The browser's cart as it was (lib/cart-context CartItem[]), kept only to refill it from the reminder e-mail. */
  carrinho?: unknown;
  /** Ticked "quero receber novidades e cupons por e-mail" (lib/lista-email.ts). */
  novidades?: unknown;
};

const texto = (v: unknown, max: number) => (typeof v === "string" && v.trim() ? v.trim().slice(0, max) : undefined);

/**
 * The cart items, cleaned: only known fields, short strings, local or https
 * pictures. Never used for prices (the checkout recomputes everything) — only
 * to put the same chairs back in the cart from /retomar/<ref>.
 */
export function carrinhoSeguro(bruto: unknown): ItemGuardado[] | undefined {
  if (!Array.isArray(bruto)) return undefined;
  const itens = bruto.slice(0, 30).flatMap((x): ItemGuardado[] => {
    if (!x || typeof x !== "object") return [];
    const i = x as Record<string, unknown>;
    const id = texto(i.id, 200);
    const categoriaSlug = texto(i.categoriaSlug, 60);
    const modeloNome = texto(i.modeloNome, 120);
    if (!id || !categoriaSlug || !modeloNome) return [];
    const img = texto(i.imagemUrl, 900);
    const cor = (c: unknown) => (typeof c === "string" && /^#[0-9a-f]{3,8}$/i.test(c) ? c : "#c9a77c");
    return [
      {
        id,
        categoriaSlug,
        categoriaTitulo: texto(i.categoriaTitulo, 60) ?? "",
        modeloId: texto(i.modeloId, 80) ?? "",
        modeloNome,
        imagemUrl: img && (/^\/(?!\/)/.test(img) || img.startsWith("https://")) ? img : undefined,
        corA: cor(i.corA),
        corB: cor(i.corB),
        quantidade: Math.max(1, Math.min(20, Math.floor(Number(i.quantidade) || 1))),
        nomePersonalizado: texto(i.nomePersonalizado, 64),
        personalizada: i.personalizada === true || undefined,
        variante: texto(i.variante, 40),
        tipoCadeira: tipoValido(i.tipoCadeira),
        bracoMadeira: i.bracoMadeira === true || undefined,
        tassel: texto(i.tassel, 40),
        tasselQtd: i.tasselQtd === 1 ? 1 : undefined,
        tasselLado: i.tasselLado === "esq" ? "esq" : i.tasselLado === "dir" ? "dir" : undefined,
      },
    ];
  });
  return itens.length ? itens : undefined;
}

export async function prepararPedido(corpo: CorpoPedido) {
  const { forma, entrega, referencia } = corpo;
  const itens = (Array.isArray(corpo.itens) ? corpo.itens : []).slice(0, 30).map((i) => ({
    categoriaSlug: String(i.categoriaSlug ?? ""),
    modeloNome: String(i.modeloNome ?? "").slice(0, 120),
    quantidade: Math.max(1, Math.min(20, Math.floor(Number(i.quantidade) || 1))),
    nomePersonalizado: i.nomePersonalizado ? String(i.nomePersonalizado).slice(0, 64) : undefined,
    tipoCadeira: tipoValido(i.tipoCadeira),
    variante: i.variante ? String(i.variante).slice(0, 40) : undefined,
    bracoMadeira: i.bracoMadeira === true || undefined,
    tassel: typeof i.tassel === "string" && i.tassel.trim() ? i.tassel.trim().slice(0, 40) : undefined,
    tasselQtd: i.tasselQtd === 1 ? (1 as const) : undefined,
    tasselLado: i.tasselQtd === 1 && i.tasselLado === "esq" ? ("esq" as const) : i.tasselQtd === 1 ? ("dir" as const) : undefined,
    // re-encoded from the parsed choices: only valid design params survive
    trama: typeof i.trama === "string" && i.trama ? codificarCadeira(decodificarCadeira(new URLSearchParams(i.trama.slice(0, 800)))) : undefined,
  }));

  // Coupons are looked up again here (the browser only sends the typed code).
  let cupons: Awaited<ReturnType<typeof cuponsDoPedido>> = [];
  try {
    cupons = await cuponsDoPedido(typeof corpo.cupom === "string" ? corpo.cupom.slice(0, 30) : undefined);
  } catch (err) {
    console.error("checkout cupons", err);
  }
  // Catalog chairs that come with extras (Modelo.inclui): priced with them no
  // matter what the browser sent.
  const content = await getContent();
  const comNome = nomesDesenho(content.categorias);
  const cadeirasDoSite = content.categorias.find((c) => c.slug === CATEGORIA_COM_PRECO)?.modelos ?? [];
  for (const item of itens) {
    if (item.categoriaSlug !== CATEGORIA_COM_PRECO || item.trama) continue;
    const inc = cadeirasDoSite.find((m) => m.nome === item.modeloNome)?.inclui;
    if (!inc) continue;
    if (inc.nome) comNome.add(item.modeloNome);
    if (inc.bracoMadeira) item.bracoMadeira = true;
    if (inc.tasseis && quantosTasseis(item) < inc.tasseis) {
      item.tassel = item.tassel ?? (inc.tasselCor?.trim() || "igual ao da foto");
      item.tasselQtd = inc.tasseis === 1 ? 1 : undefined;
      item.tasselLado = inc.tasseis === 1 ? (inc.tasselLado === "esq" ? "esq" : "dir") : undefined;
    }
  }
  const conta = calcularPedido(itens, cupons, comNome);
  if (!conta.pagavel || conta.total <= 0) return { ok: false, erro: "Esse carrinho só pode ser fechado pelo WhatsApp." } as const;
  if (forma !== "pix" && forma !== "cartao") return { ok: false, erro: "Forma de pagamento inválida." } as const;
  if (!entrega || !entregaCompleta(entrega, conta.soVale)) return { ok: false, erro: "Preencha os dados de entrega." } as const;
  const ref = /^[a-z0-9-]{6,40}$/i.test(String(referencia)) ? String(referencia) : crypto.randomUUID();
  // shipping is recomputed here too (Espírito Santo ships free, see lib/frete-servidor.ts)
  // a vale-presente only order ships nothing
  const frete = conta.soVale ? { valor: 0, servico: "Sem envio (vale-presente)" } : await calcularFrete(entrega.cep, conta.porTipo, conta.totalCadeiras);
  if (!frete) return { ok: false, erro: "Para esse CEP o frete é combinado pelo WhatsApp." } as const;
  const valorProdutos = forma === "pix" ? conta.totalPix : conta.total;
  const valor = Math.round((valorProdutos + frete.valor) * 100) / 100;
  const telefone = entrega.telefone.replace(/\D/g, "");
  const carrinho = carrinhoSeguro(corpo.carrinho);
  const cupomDigitado = typeof corpo.cupom === "string" && corpo.cupom.trim() ? corpo.cupom.trim().slice(0, 30) : undefined;
  return { ok: true, forma, ref, itens, conta, frete, valorProdutos, valor, entrega, telefone, carrinho, cupomDigitado, novidades: corpo.novidades === true } as const;
}

type Pronto = Extract<Awaited<ReturnType<typeof prepararPedido>>, { ok: true }>;

/** Saves the started order (admin "Clientes") and notes it on the visit journey. */
export async function registrarPedido(p: Pronto, vid?: string) {
  await salvarPedidoIniciado({
    ref: p.ref,
    nome: p.entrega.nome.trim().slice(0, 80),
    whatsapp: normalizarWhatsapp(p.telefone) ?? p.telefone,
    cidade: p.entrega.cidade.trim() ? `${p.entrega.cidade.trim()}/${p.entrega.uf.trim()}`.slice(0, 60) : "Vale-presente (sem envio)",
    forma: p.forma,
    // builder chairs carry their design link (its preview is the chair picture)
    itens: p.itens.map((i) => descricaoItem(i) + (i.trama ? ` — desenho: ${SITE_URL}/c?${i.trama}` : "")),
    valor: p.valor,
    vid: vidValido(vid) ? vid : undefined,
    cupom: p.conta.cupom?.codigo,
    valeUsado: p.conta.vale?.codigo,
    vales: p.itens.flatMap((i) => {
      const valor = valorDoVale(i);
      return valor === null ? [] : Array.from({ length: i.quantidade }, () => ({ valor, para: i.nomePersonalizado }));
    }),
    entrega: {
      nome: p.entrega.nome.trim().slice(0, 80),
      telefone: p.telefone,
      email: (p.entrega.email ?? "").trim().slice(0, 120) || undefined,
      cpf: (p.entrega.cpf ?? "").replace(/\D/g, ""),
      cep: p.entrega.cep.replace(/\D/g, ""),
      endereco: p.entrega.endereco.trim().slice(0, 120),
      numero: p.entrega.numero.trim().slice(0, 15),
      complemento: (p.entrega.complemento ?? "").trim().slice(0, 60),
      bairro: (p.entrega.bairro ?? "").trim().slice(0, 60),
      cidade: p.entrega.cidade.trim().slice(0, 60),
      uf: p.entrega.uf.trim().toUpperCase().slice(0, 2),
      ...(p.entrega.presente === true
        ? { presente: true, recado: String(p.entrega.recado ?? "").replace(/\s+/g, " ").trim().slice(0, 200) || undefined }
        : {}),
    },
    porTipo: p.conta.porTipo,
    frete: { valor: p.frete.valor, servico: p.frete.servico },
    carrinho: p.carrinho,
    cupomDigitado: p.cupomDigitado,
  });
  if (p.novidades && p.entrega.email) {
    await inscreverEmail({ email: p.entrega.email, nome: p.entrega.nome, origem: "compra" }).catch((err) => console.error("inscreverEmail", err));
  }
  await anotarNoCaminho(vid, {
    k: "$",
    x: `${p.forma === "pix" ? "Pix" : "cartão"}, ${p.valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}`,
  });
}
