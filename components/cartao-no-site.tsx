"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { formatBRL, PARCELAS_MAX } from "@/lib/offer";

// Card paid inside the site (2026-10-06) with Mercado Pago's Card Payment
// Brick: the card fields are Mercado Pago's own (secure iframes), the brick
// hands back a one-time token, and /api/cartao charges it.

export const PUBLIC_KEY_MP = process.env.NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY ?? "";

type BrickController = { unmount: () => void };
type MercadoPagoSDK = new (key: string, opts: { locale: string }) => {
  bricks: () => { create: (tipo: string, id: string, settings: unknown) => Promise<BrickController> };
};
declare global {
  interface Window {
    MercadoPago?: MercadoPagoSDK;
  }
}

function carregarSdk(): Promise<MercadoPagoSDK> {
  if (window.MercadoPago) return Promise.resolve(window.MercadoPago);
  return new Promise((ok, erro) => {
    const s = document.createElement("script");
    s.src = "https://sdk.mercadopago.com/js/v2";
    s.onload = () => (window.MercadoPago ? ok(window.MercadoPago) : erro(new Error("sdk")));
    s.onerror = erro;
    document.head.appendChild(s);
  });
}

export function CartaoNoSite({
  valor,
  email,
  corpoPedido,
  onVoltar,
  onPaginaMercadoPago,
}: {
  valor: number;
  email: string;
  /** Order payload sent with the card token (items, delivery, reference, coupon…). */
  corpoPedido: Record<string, unknown>;
  onVoltar: () => void;
  onPaginaMercadoPago: () => void;
}) {
  const router = useRouter();
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [falhou, setFalhou] = useState(false);
  const corpoRef = useRef(corpoPedido);
  useEffect(() => {
    corpoRef.current = corpoPedido;
  }, [corpoPedido]);

  useEffect(() => {
    let controle: BrickController | null = null;
    let vivo = true;
    carregarSdk()
      .then(async (MP) => {
        if (!vivo) return;
        const mp = new MP(PUBLIC_KEY_MP, { locale: "pt-BR" });
        controle = await mp.bricks().create("cardPayment", "brick-cartao", {
          initialization: { amount: valor, payer: { email } },
          customization: {
            paymentMethods: { maxInstallments: PARCELAS_MAX },
            visual: { style: { theme: "default", customVariables: { baseColor: "#241f1a", borderRadiusLarge: "0px", borderRadiusMedium: "0px", borderRadiusSmall: "0px" } } },
          },
          callbacks: {
            onReady: () => vivo && setCarregando(false),
            onError: (e: unknown) => console.error("brick", e),
            onSubmit: (dados: Record<string, unknown>) =>
              new Promise<void>((resolve, reject) => {
                setErro("");
                fetch("/api/cartao", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ ...corpoRef.current, cartao: dados }),
                })
                  .then((r) => r.json())
                  .then((j: { id?: string; referencia?: string; status?: string; motivo?: string; erro?: string }) => {
                    if (j.id && (j.status === "approved" || j.status === "in_process" || j.status === "pending")) {
                      resolve();
                      router.push(`/pedido?payment_id=${j.id}&external_reference=${encodeURIComponent(j.referencia ?? "")}&status=${j.status}`);
                      return;
                    }
                    setErro(j.motivo || j.erro || "O pagamento não foi aprovado. Tente outro cartão ou pague no Pix.");
                    reject();
                  })
                  .catch(() => {
                    setErro("Não deu para falar com o Mercado Pago agora. Tente de novo.");
                    reject();
                  });
              }),
          },
        });
      })
      .catch(() => {
        if (vivo) {
          setFalhou(true);
          setCarregando(false);
        }
      });
    return () => {
      vivo = false;
      controle?.unmount();
    };
  }, [valor, email, router]);

  return (
    <div className="flex h-full flex-col overflow-y-auto px-6 py-5">
      <p className="font-serif text-xl font-medium text-ink">Pagar com cartão</p>
      <p className="mt-1 text-sm text-ink-soft">
        Total: <strong className="text-ink">{formatBRL(valor)}</strong>, em até {PARCELAS_MAX}x (com a taxa do cartão).
      </p>
      {erro ? <p className="mt-3 border border-clay/40 bg-clay/5 px-3 py-2 text-sm text-clay-dark">{erro}</p> : null}
      {carregando ? <p className="mt-6 text-center text-sm text-ink-soft">Carregando o formulário seguro do Mercado Pago…</p> : null}
      {falhou ? (
        <p className="mt-6 text-sm text-ink">
          Não deu para abrir o formulário do cartão aqui.{" "}
          <button type="button" onClick={onPaginaMercadoPago} className="font-medium underline">
            Pagar na página do Mercado Pago
          </button>
        </p>
      ) : null}
      <div id="brick-cartao" className="mt-4" />
      <p className="mt-3 text-center text-[0.7rem] leading-snug text-ink-soft">
        Os dados do cartão vão direto para o Mercado Pago, com segurança. O site não vê nem guarda o número do cartão.
      </p>
      <div className="mt-auto flex flex-col items-center gap-2 pt-5 text-xs">
        <button type="button" onClick={onPaginaMercadoPago} className="text-ink-soft underline underline-offset-2 hover:text-ink">
          Prefere pagar na página do Mercado Pago?
        </button>
        <button type="button" onClick={onVoltar} className="text-ink-soft underline underline-offset-2 hover:text-ink">
          Voltar e escolher outra forma de pagamento
        </button>
      </div>
    </div>
  );
}
