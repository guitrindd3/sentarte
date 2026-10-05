import "server-only";
import type { Frete } from "./frete";

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

// Folded infantil/reclinável packages were never measured (2026-10-05): estimated
// from the open sizes in lib/medidas.ts until the user sends the real ones.
const ESTIMATIVAS: Record<"infantil" | "reclinavel", string> = { infantil: "8,42,50,1.2", reclinavel: "12,56,92,2.6" };
const lerCaixa = (v: string | undefined) => {
  const c = (v ?? "").split(",").map((x) => Number(x.trim()));
  return c.length === 4 && c.every((x) => x > 0) ? c : null;
};

export type ChairsPorTipo = { normal: number; infantil: number; reclinavel: number };

/** null = can't quote online (not configured, bad CEP, no carrier). */
export async function calcularFrete(cep: string, porTipo: ChairsPorTipo, valorDeclarado: number): Promise<Frete | null> {
  const destino = cep.replace(/\D/g, "");
  const qtdCadeiras = porTipo.normal + porTipo.infantil + porTipo.reclinavel;
  if (destino.length !== 8 || qtdCadeiras < 1) return null;
  if (ehCepES(destino)) return { valor: 0 };

  const token = process.env.MELHORENVIO_TOKEN;
  const origem = (process.env.FRETE_CEP_ORIGEM ?? "").replace(/\D/g, "");
  const caixas = {
    normal: lerCaixa(process.env.FRETE_CAIXA),
    infantil: lerCaixa(process.env.FRETE_CAIXA_INFANTIL) ?? lerCaixa(ESTIMATIVAS.infantil),
    reclinavel: lerCaixa(process.env.FRETE_CAIXA_RECLINAVEL) ?? lerCaixa(ESTIMATIVAS.reclinavel),
  };
  if (!token || origem.length !== 8 || !caixas.normal) return null;
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

  let frete: Frete | null = null;
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
    });
    if (!res.ok) {
      console.error("melhor envio calculate failed", res.status, (await res.text()).slice(0, 300));
    } else {
      const servicos = (await res.json()) as Servico[];
      const validos = servicos
        .filter((s) => !s.error && Number(s.custom_price ?? s.price) > 0)
        .sort((a, b) => Number(a.custom_price ?? a.price) - Number(b.custom_price ?? b.price));
      const melhor = validos[0];
      if (melhor) {
        frete = {
          valor: Math.round(Number(melhor.custom_price ?? melhor.price) * 100) / 100,
          prazoDias: melhor.custom_delivery_time ?? melhor.delivery_time,
          servico: [melhor.company?.name, melhor.name].filter(Boolean).join(" "),
        };
      }
    }
  } catch (e) {
    console.error("melhor envio calculate error", e);
  }
  if (cacheCotacoes.size > 2000) cacheCotacoes.clear();
  cacheCotacoes.set(chave, { em: Date.now(), frete });
  return frete;
}
