"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { formatBRL, PARCELAS_MAX } from "@/lib/offer";

// Card paid inside the site (2026-10-06) with Mercado Pago's Card Payment
// Brick: the card fields are Mercado Pago's own (secure iframes), the brick
// hands back a one-time token, and /api/cartao charges it.

export const PUBLIC_KEY_MP = process.env.NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY ?? "";

type BrickController = { unmount: () => void };
type MercadoPagoSDK = new (
  key: string,
  opts: { locale: string },
) => {
  bricks: () => {
    create: (tipo: string, id: string, settings: unknown) => Promise<BrickController>;
  };
};
declare global {
  interface Window {
    MercadoPago?: MercadoPagoSDK;
    /** Device fingerprint set by Mercado Pago's scripts (SDK / security.js); sent with the payment. */
    MP_DEVICE_SESSION_ID?: string;
  }
}

/** Mercado Pago's device fingerprint script: fills window.MP_DEVICE_SESSION_ID for its anti-fraud. */
function carregarIdDoAparelho() {
  if (window.MP_DEVICE_SESSION_ID || document.getElementById("mp-security")) return;
  const s = document.createElement("script");
  s.id = "mp-security";
  s.src = "https://www.mercadopago.com/v2/security.js";
  s.setAttribute("view", "checkout");
  s.async = true;
  document.head.appendChild(s);
}

function carregarSdk(): Promise<MercadoPagoSDK> {
  carregarIdDoAparelho();
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
  onPix,
  onPaginaMercadoPago,
}: {
  valor: number;
  email: string;
  /** Order payload sent with the card token (items, delivery, reference, coupon…). */
  corpoPedido: Record<string, unknown>;
  onVoltar: () => void;
  /** Same order, straight to the Pix QR code (offered after a refusal). */
  onPix: () => void;
  onPaginaMercadoPago: () => void;
}) {
  const router = useRouter();
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [falhou, setFalhou] = useState(false);
  /** Bank confirmation (3DS) in progress: the payment it belongs to. */
  const [desafio, setDesafio] = useState<{
    id: string;
    ref: string;
    url: string;
    creq: string;
  } | null>(null);
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
            visual: {
              style: {
                theme: "default",
                customVariables: {
                  baseColor: "#241f1a",
                  borderRadiusLarge: "0px",
                  borderRadiusMedium: "0px",
                  borderRadiusSmall: "0px",
                },
              },
            },
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
                  body: JSON.stringify({
                    ...corpoRef.current,
                    cartao: dados,
                    deviceId: window.MP_DEVICE_SESSION_ID,
                  }),
                })
                  .then((r) => r.json())
                  .then((j: { id?: string; referencia?: string; status?: string; motivo?: string; erro?: string; desafio?: { url: string; creq: string } }) => {
                    if (j.id && j.desafio) {
                      resolve();
                      setDesafio({
                        id: j.id,
                        ref: j.referencia ?? "",
                        ...j.desafio,
                      });
                      return;
                    }
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

  // The card form stays mounted (only hidden) under the bank screen, so "try
  // again" goes back to the same Mercado Pago form.
  return (
    <>
      {desafio ? (
        <ConfirmacaoDoBanco
          {...desafio}
          onDeNovo={() => {
            setDesafio(null);
            setErro("O banco não confirmou o pagamento. Tente de novo, use outro cartão ou pague no Pix.");
          }}
        />
      ) : null}
      <div className={`h-full flex-col overflow-y-auto px-6 py-5 ${desafio ? "hidden" : "flex"}`}>
        <p className="font-serif text-xl font-medium text-ink">Pagar com cartão</p>
        <p className="mt-1 text-sm text-ink-soft">
          Total: <strong className="text-ink">{formatBRL(valor)}</strong>, em até {PARCELAS_MAX}x (com a taxa do cartão).
        </p>
        {erro ? (
          <div className="mt-3 border border-clay/40 bg-clay/5 px-3 py-2 text-sm text-clay-dark">
            <p>{erro}</p>
            {/* a refused card rarely passes on the next try: hand over the Pix right there */}
            <button
              type="button"
              onClick={onPix}
              className="mt-2 inline-flex items-center justify-center border border-ink bg-ink px-4 py-2 text-sm font-medium text-canvas hover:bg-transparent hover:text-ink"
            >
              Pagar no Pix (sai mais barato)
            </button>
          </div>
        ) : null}
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
    </>
  );
}

/**
 * 3DS: the card's bank asks the buyer to confirm (app notification, SMS code…).
 * Mercado Pago gives the bank's page URL + a "creq"; it opens in an iframe via a
 * form POST. Meanwhile the payment is polled until it's approved or refused
 * (the bank gives about 5 minutes).
 */
function ConfirmacaoDoBanco({ id, ref, url, creq, onDeNovo }: { id: string; ref: string; url: string; creq: string; onDeNovo: () => void }) {
  const router = useRouter();
  const form = useRef<HTMLFormElement>(null);
  const deNovo = useRef(onDeNovo);
  const [expirou, setExpirou] = useState(false);
  useEffect(() => {
    deNovo.current = onDeNovo;
  }, [onDeNovo]);
  useEffect(() => {
    form.current?.submit();
  }, []);
  useEffect(() => {
    let vivo = true;
    let t: ReturnType<typeof setTimeout>;
    const inicio = Date.now();
    const olhar = async () => {
      if (!vivo) return;
      const j = (await fetch(`/api/pix/status?id=${id}&ref=${encodeURIComponent(ref)}`, { cache: "no-store" })
        .then((r) => r.json())
        .catch(() => ({}))) as { status?: string };
      if (!vivo) return;
      if (j.status === "approved" || j.status === "in_process") {
        router.push(`/pedido?payment_id=${id}&external_reference=${encodeURIComponent(ref)}&status=${j.status}`);
        return;
      }
      if (j.status === "rejected" || j.status === "cancelled") return deNovo.current();
      if (Date.now() - inicio > 7 * 60_000) return setExpirou(true);
      t = setTimeout(olhar, 3000);
    };
    t = setTimeout(olhar, 4000);
    return () => {
      vivo = false;
      clearTimeout(t);
    };
  }, [id, ref, router]);

  return (
    <div className="flex h-full flex-col overflow-y-auto px-4 py-5 sm:px-6">
      <p className="font-serif text-xl font-medium text-ink">Confirme no seu banco</p>
      <p className="mt-1 text-sm text-ink-soft">
        O seu banco pediu uma confirmação de segurança. Siga o que aparece abaixo (pode chegar um aviso no app do banco ou um código por SMS). Não feche esta
        janela.
      </p>
      <form ref={form} method="post" action={url} target="confirmacao-banco" className="hidden">
        <input type="hidden" name="creq" value={creq} />
      </form>
      <iframe name="confirmacao-banco" title="Confirmação do banco" className="mt-4 h-[440px] w-full shrink-0 border border-line bg-white sm:h-[600px]" />
      {expirou ? (
        <p className="mt-3 text-sm text-ink">
          Demorou mais do que o normal. Se você já confirmou, aguarde o e-mail do Mercado Pago.{" "}
          <button type="button" onClick={() => deNovo.current()} className="font-medium underline">
            Tentar de novo
          </button>
        </p>
      ) : (
        <p className="mt-3 text-center text-xs text-ink-soft">Assim que o banco confirmar, a página segue sozinha.</p>
      )}
    </div>
  );
}
