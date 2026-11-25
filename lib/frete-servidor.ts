import "server-only";
import type { Frete } from "./frete";
import { PRAZO_ENVIO_ES_DIAS_UTEIS } from "./prazo-entrega";

// Shipping is quoted by Melhor Envio (Correios + carriers) from the atelier's
// CEP to the customer's. Espírito Santo CEPs (29000-000 to 29999-999) ship
// free — on purpose NOT announced anywhere on the site (user 2026-10-03):
// the customer only sees "Grátis" after typing an ES CEP.
//
// Env vars (Vercel, Production):
//   MELHORENVIO_TOKEN   — Melhor Envio API token (Integrações → Permissões de acesso)
//   FRETE_CEP_ORIGEM    — atelier CEP, 8 digits
//   FRETE_CAIXA         — one packed chair: "alturaCm,larguraCm,comprimentoCm,pesoKg"
//   FRETE_CAIXA_INFANTIL / FRETE_CAIXA_RECLINAVEL — same, for the other chair
//                         types (optional; estimates below until the real sizes come)
//   MELHORENVIO_EMAIL   — contact e-mail Melhor Envio asks for in the User-Agent
//   SUPERFRETE_TOKEN    — optional second platform; both are quoted, cheapest wins
// Without them, non-ES CEPs get "combinar pelo WhatsApp" and can't pay online.

function ehCepES(cep: string) {
  const n = Number(cep.replace(/\D/g, "").slice(0, 5));
  return n >= 29000 && n <= 29999;
}

type Servico = {
  name?: string;
  price?: string;
  custom_price?: string;
  delivery_time?: number;
  custom_delivery_time?: number;
  error?: string;
  company?: { name?: string };
};

const cacheCotacoes = new Map<string, { em: number; frete: Frete | null }>();
const DEZ_MIN = 10 * 60 * 1000;

// Folded infantil/reclinável packages (2026-10-06, user: "pesquise e se baseie"):
// from market aluminum frames of the same model (Mor 2121/2122 infantil
// 0,74-0,87 kg folded 39x7x52 cm; Mor reclinável 8 posições 1,8-1,9 kg folded
// 80x56x10 cm) + the rope (user: 200-400 g — 200 g infantil, 400 g reclinável)
// + 100 g plastic bag, like the fixed chair. Env vars override.
const ESTIMATIVAS: Record<"infantil" | "reclinavel", string> = { infantil: "8,42,53,1.2", reclinavel: "12,56,82,2.4" };
const lerCaixa = (v: string | undefined) => {
  const c = (v ?? "").split(",").map((x) => Number(x.trim()));
  return c.length === 4 && c.every((x) => x > 0) ? c : null;
};

/** Packed size per chair type: [alturaCm, larguraCm, comprimentoCm, pesoKg] (null = not configured). */
export function caixasPorTipo() {
  return {
    normal: lerCaixa(process.env.FRETE_CAIXA),
    infantil: lerCaixa(process.env.FRETE_CAIXA_INFANTIL) ?? lerCaixa(ESTIMATIVAS.infantil),
    reclinavel: lerCaixa(process.env.FRETE_CAIXA_RECLINAVEL) ?? lerCaixa(ESTIMATIVAS.reclinavel),
  };
}

export type ChairsPorTipo = { normal: number; infantil: number; reclinavel: number };

/** null = can't quote online (not configured, bad CEP, no carrier). */
export async function calcularFrete(cep: string, porTipo: ChairsPorTipo, valorDeclarado: number): Promise<Frete | null> {
  const destino = cep.replace(/\D/g, "");
  const qtdCadeiras = porTipo.normal + porTipo.infantil + porTipo.reclinavel;
  if (destino.length !== 8 || qtdCadeiras < 1) return null;
  if (ehCepES(destino)) return { valor: 0, prazoDias: PRAZO_ENVIO_ES_DIAS_UTEIS };

  const token = process.env.MELHORENVIO_TOKEN;
  const origem = (process.env.FRETE_CEP_ORIGEM ?? "").replace(/\D/g, "");
  const caixas = caixasPorTipo();
  if ((!token && !process.env.SUPERFRETE_TOKEN) || origem.length !== 8 || !caixas.normal) return null;
  const seguroPorCadeira = Math.round((valorDeclarado / qtdCadeiras) * 100) / 100;
  const produtos = (Object.keys(caixas) as (keyof ChairsPorTipo)[])
    .filter((t) => porTipo[t] > 0)
    .map((t) => {
      const [altura, largura, comprimento, peso] = caixas[t]!;
      return { id: `cadeira-${t}`, height: altura, width: largura, length: comprimento, weight: peso, insurance_value: seguroPorCadeira, quantity: porTipo[t] };
    });

  const chave = `${destino}:${porTipo.normal}:${porTipo.infantil}:${porTipo.reclinavel}`;
  const guardado = cacheCotacoes.get(chave);
  if (guardado && Date.now() - guardado.em < DEZ_MIN) return guardado.frete;

  // Both platforms in parallel; the cheapest answer wins, and if one is down
  // the other still quotes (user 2026-11-25: problems with Melhor Envio → add SuperFrete).
  const [me, sf] = await Promise.all([cotarMelhorEnvio(token, origem, destino, produtos), cotarSuperFrete(origem, destino, produtos)]);
  const frete = [me, sf].filter((f): f is Frete => !!f).sort((x, y) => x.valor - y.valor)[0] ?? null;
  if (cacheCotacoes.size > 2000) cacheCotacoes.clear();
  cacheCotacoes.set(chave, { em: Date.now(), frete });
  return frete;
}

type Produto = { id: string; height: number; width: number; length: number; weight: number; insurance_value: number; quantity: number };

async function cotarMelhorEnvio(token: string | undefined, origem: string, destino: string, produtos: Produto[]): Promise<Frete | null> {
  if (!token) return null;
  try {
    const res = await fetch("https://melhorenvio.com.br/api/v2/me/shipment/calculate", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        "User-Agent": `SentArte (${process.env.MELHORENVIO_EMAIL ?? "ateliesentarte@gmail.com"})`,
      },
      body: JSON.stringify({
        from: { postal_code: origem },
        to: { postal_code: destino },
        products: produtos,
        options: { receipt: false, own_hand: false },
      }),
      cache: "no-store",
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) {
      console.error("melhor envio calculate failed", res.status, (await res.text()).slice(0, 300));
      return null;
    }
    const servicos = (await res.json()) as Servico[];
    const melhor = servicos
      .filter((s) => !s.error && Number(s.custom_price ?? s.price) > 0)
      .sort((a, b) => Number(a.custom_price ?? a.price) - Number(b.custom_price ?? b.price))[0];
    if (!melhor) return null;
    return {
      valor: Math.round(Number(melhor.custom_price ?? melhor.price) * 100) / 100,
      prazoDias: melhor.custom_delivery_time ?? melhor.delivery_time,
      servico: [melhor.company?.name, melhor.name].filter(Boolean).join(" "),
    };
  } catch (e) {
    console.error("melhor envio calculate error", e);
    return null;
  }
}

// SuperFrete (superfrete.readme.io): token from web.superfrete.com → Integrações →
// "Integrar em Desenvolvedores". Env: SUPERFRETE_TOKEN (+ SUPERFRETE_SANDBOX=1 to
// test against sandbox.superfrete.com). Services: 1 PAC, 2 SEDEX, 17 Mini Envios,
// 3 Jadlog, 33 J&T (Loggi is switched on in the token's settings). The service
// name says "(SuperFrete)" so the admin knows where to buy the label.
type ServicoSF = { id?: number; name?: string; price?: number | string; delivery_time?: number; has_error?: boolean; error?: string; company?: { name?: string } };

async function cotarSuperFrete(origem: string, destino: string, produtos: Produto[]): Promise<Frete | null> {
  const token = process.env.SUPERFRETE_TOKEN;
  if (!token) return null;
  const base = process.env.SUPERFRETE_SANDBOX === "1" ? "https://sandbox.superfrete.com" : "https://api.superfrete.com";
  const seguro = Math.round(produtos.reduce((t, p) => t + p.insurance_value * p.quantity, 0) * 100) / 100;
  try {
    const res = await fetch(`${base}/api/v0/calculator`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        "User-Agent": `SentArte 1.0 (${process.env.MELHORENVIO_EMAIL ?? "ateliesentarte@gmail.com"})`,
      },
      body: JSON.stringify({
        from: { postal_code: origem },
        to: { postal_code: destino },
        services: "1,2,17,3,33",
        options: { own_hand: false, receipt: false, insurance_value: seguro, use_insurance_value: seguro > 0 },
        products: produtos.map((p) => ({ quantity: p.quantity, weight: p.weight, height: p.height, width: p.width, length: p.length })),
      }),
      cache: "no-store",
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) {
      console.error("superfrete calculator failed", res.status, (await res.text()).slice(0, 300));
      return null;
    }
    const servicos = (await res.json()) as ServicoSF[];
    const melhor = (Array.isArray(servicos) ? servicos : [])
      .filter((s) => !s.has_error && !s.error && Number(s.price) > 0)
      .sort((a, b) => Number(a.price) - Number(b.price))[0];
    if (!melhor) return null;
    const empresa = melhor.company?.name;
    const nome = melhor.name ?? "";
    return {
      valor: Math.round(Number(melhor.price) * 100) / 100,
      prazoDias: melhor.delivery_time,
      servico: `${empresa && !nome.toLowerCase().includes(empresa.toLowerCase()) ? `${empresa} ` : ""}${nome} (SuperFrete)`.trim(),
    };
  } catch (e) {
    console.error("superfrete calculator error", e);
    return null;
  }
}
