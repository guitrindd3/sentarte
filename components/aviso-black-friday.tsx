"use client";

import { rotuloDesconto } from "@/lib/cupom";
import { useBlackFriday } from "@/lib/use-black-friday";

const fimBR = (ms: number) =>
  new Intl.DateTimeFormat("pt-BR", { timeZone: "America/Sao_Paulo", weekday: "long", day: "2-digit", month: "2-digit" }).format(new Date(ms - 1000));

/** Monte a sua trama during Black Friday week: a notice instead of the logo on the chair (user 2026-10-20). */
export function AvisoBlackFriday() {
  const bf = useBlackFriday();
  if (!bf) return null;
  const { cupom } = bf;
  return (
    <p className="mb-6 rounded-2xl border-2 border-ink bg-paper px-5 py-4 text-sm text-ink" role="status">
      <strong className="font-semibold">Black Friday também aqui:</strong> a cadeira que você montar sai com{" "}
      <strong className="font-semibold">{rotuloDesconto(cupom)} de desconto</strong>
      {cupom.minCadeiras > 1 ? ` levando ${cupom.minCadeiras} ou mais` : ""}, que entra sozinho no carrinho. Vale até {fimBR(bf.fimMs)}.
    </p>
  );
}
