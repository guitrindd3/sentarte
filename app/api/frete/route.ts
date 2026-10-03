import { NextResponse } from "next/server";
import type { RespostaFrete } from "@/lib/frete";
import { calcularFrete } from "@/lib/frete-servidor";
import { calcularPedido, type ItemDoPedido } from "@/lib/pedido";

// Shipping quote for the cart / checkout form. Same math as /api/checkout,
// which recomputes it before charging.
export async function POST(req: Request) {
  let corpo: { cep?: string; itens?: ItemDoPedido[] };
  try {
    corpo = (await req.json()) as typeof corpo;
  } catch {
    return NextResponse.json({ erro: "Pedido inválido." }, { status: 400 });
  }
  const itens = (Array.isArray(corpo.itens) ? corpo.itens : []).slice(0, 30).map((i) => ({
    categoriaSlug: String(i.categoriaSlug ?? ""),
    modeloNome: String(i.modeloNome ?? "").slice(0, 120),
    quantidade: Math.max(1, Math.min(20, Math.floor(Number(i.quantidade) || 1))),
    nomePersonalizado: i.nomePersonalizado ? String(i.nomePersonalizado).slice(0, 40) : undefined,
  }));
  const conta = calcularPedido(itens);
  const frete = await calcularFrete(String(corpo.cep ?? ""), conta.qtdCadeiras, conta.total);
  const resposta: RespostaFrete = frete ? { frete } : { indisponivel: true };
  return NextResponse.json(resposta);
}
