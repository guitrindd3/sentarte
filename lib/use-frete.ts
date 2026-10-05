"use client";

import { useEffect, useState } from "react";
import type { CartItem } from "./cart-context";
import { soDigitosCep, type Frete, type RespostaFrete } from "./frete";

export type EstadoFrete =
  | { tipo: "sem-cep" }
  | { tipo: "carregando" }
  | { tipo: "ok"; frete: Frete }
  | { tipo: "indisponivel" };

/** Asks /api/frete for the quote whenever the CEP (8 digits) or the cart changes. */
export function useFrete(cep: string, items: CartItem[]): EstadoFrete {
  const digitos = soDigitosCep(cep);
  const chaveItens = items.map((i) => `${i.categoriaSlug}|${i.modeloNome}|${i.quantidade}|${i.nomePersonalizado ?? ""}|${i.tipoCadeira ?? ""}`).join(";");
  const [resultado, setResultado] = useState<{ chave: string; estado: EstadoFrete } | null>(null);
  const chave = `${digitos}#${chaveItens}`;

  useEffect(() => {
    if (digitos.length !== 8 || !items.length) return;
    let cancelado = false;
    fetch("/api/frete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        cep: digitos,
        itens: items.map((i) => ({
          categoriaSlug: i.categoriaSlug,
          modeloNome: i.modeloNome,
          quantidade: i.quantidade,
          nomePersonalizado: i.nomePersonalizado,
          tipoCadeira: i.tipoCadeira,
        })),
      }),
    })
      .then((r) => r.json() as Promise<RespostaFrete>)
      .then((j) => {
        if (!cancelado) setResultado({ chave, estado: "frete" in j ? { tipo: "ok", frete: j.frete } : { tipo: "indisponivel" } });
      })
      .catch(() => {
        if (!cancelado) setResultado({ chave, estado: { tipo: "indisponivel" } });
      });
    return () => {
      cancelado = true;
    };
    // chave covers the CEP and every item field the quote depends on
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chave]);

  if (digitos.length !== 8 || !items.length) return { tipo: "sem-cep" };
  if (!resultado || resultado.chave !== chave) return { tipo: "carregando" };
  return resultado.estado;
}

const CEP_KEY = "sentarte-cep";
export function cepGuardado(): string {
  try {
    const cep = window.localStorage.getItem(CEP_KEY);
    if (cep) return cep;
    const entrega = window.localStorage.getItem("sentarte-entrega");
    return entrega ? String((JSON.parse(entrega) as { cep?: string }).cep ?? "") : "";
  } catch {
    return "";
  }
}
export function guardarCep(cep: string) {
  try {
    window.localStorage.setItem(CEP_KEY, cep);
  } catch {
    // only a convenience
  }
}

export function textoFrete(e: EstadoFrete) {
  if (e.tipo === "ok") return e.frete.valor === 0 ? "Grátis" : null;
  if (e.tipo === "carregando") return "Calculando…";
  if (e.tipo === "indisponivel") return "Combinado pelo WhatsApp";
  return "Informe o CEP";
}
