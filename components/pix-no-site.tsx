"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { formatBRL } from "@/lib/offer";

export type PixGerado = {
  id: string;
  referencia: string;
  valor: number;
  copiaECola: string;
  qrBase64: string | null;
  expiraEm: string;
};

/**
 * Pix paid inside the site: QR code + "copia e cola", then waits for Mercado
 * Pago to confirm (polls /api/pix/status) and goes to /pedido, which confirms
 * again, clears the cart and offers the WhatsApp summary.
 */
export function PixNoSite({ pix, onCancelar, onNovo }: { pix: PixGerado; onCancelar: () => void; onNovo: () => void }) {
  const router = useRouter();
  const [status, setStatus] = useState<string>("pending");
  const [copiado, setCopiado] = useState(false);
  const [agora, setAgora] = useState(() => Date.now());
  const expira = new Date(pix.expiraEm).getTime();
  const restante = Math.max(0, expira - agora);
  const vencido = restante === 0 || status === "cancelled" || status === "expired";

  useEffect(() => {
    const t = setInterval(() => setAgora(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (vencido || status === "approved") return;
    let vivo = true;
    const checar = async () => {
      try {
        const r = await fetch(`/api/pix/status?id=${pix.id}&ref=${encodeURIComponent(pix.referencia)}`, { cache: "no-store" });
        const j = (await r.json()) as { status?: string };
        if (!vivo || !j.status) return;
        setStatus(j.status);
        if (j.status === "approved") {
          router.push(`/pedido?payment_id=${pix.id}&external_reference=${encodeURIComponent(pix.referencia)}&status=approved`);
        }
      } catch {}
    };
    const t = setInterval(checar, 4000);
    return () => {
      vivo = false;
      clearInterval(t);
    };
  }, [pix, vencido, status, router]);

  const min = Math.floor(restante / 60000);
  const seg = Math.floor((restante % 60000) / 1000);

  if (status === "approved") {
    return (
      <div className="px-6 py-10 text-center" role="status">
        <p className="font-serif text-2xl text-ink">Pagamento aprovado! 🎉</p>
        <p className="mt-2 text-sm text-ink-soft">Abrindo o resumo do pedido…</p>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col overflow-y-auto px-6 py-5">
      <p className="font-serif text-xl font-medium text-ink">Pague com Pix</p>
      <p className="mt-1 text-sm text-ink-soft">
        Valor: <strong className="text-ink">{formatBRL(pix.valor)}</strong>
      </p>

      {vencido ? (
        <div className="mt-6 border border-line bg-canvas p-4 text-sm text-ink">
          <p>Esse Pix venceu.</p>
          <button type="button" onClick={onNovo} className="mt-3 rounded-full bg-verde px-5 py-2.5 text-sm font-semibold text-white hover:bg-verde-escuro">
            Gerar um Pix novo
          </button>
        </div>
      ) : (
        <>
          <ol className="mt-4 space-y-1 text-sm text-ink-soft">
            <li>1. Abra o app do seu banco e escolha <strong className="text-ink">Pix</strong>.</li>
            <li>2. Escaneie o QR code ou use o <strong className="text-ink">copia e cola</strong>.</li>
            <li>3. Confirme o pagamento. Esta tela atualiza sozinha.</li>
          </ol>
          {pix.qrBase64 ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={`data:image/png;base64,${pix.qrBase64}`} alt="QR code do Pix" className="mx-auto mt-4 h-52 w-52 border border-line bg-white p-2" />
          ) : null}
          <label className="mt-4 block text-sm">
            <span className="text-ink-soft">Pix copia e cola</span>
            <textarea readOnly value={pix.copiaECola} rows={3} onFocus={(e) => e.currentTarget.select()} className="mt-1 w-full resize-none border border-line bg-canvas px-3 py-2 font-mono text-xs text-ink" />
          </label>
          <button
            type="button"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(pix.copiaECola);
                setCopiado(true);
                setTimeout(() => setCopiado(false), 2500);
              } catch {}
            }}
            className="mt-2 w-full rounded-full bg-verde px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-verde-escuro"
          >
            {copiado ? "Código copiado ✓" : "Copiar código Pix"}
          </button>
          <p className="mt-4 flex items-center justify-center gap-2 text-sm text-ink-soft" aria-live="polite">
            <span className="h-2 w-2 animate-pulse rounded-full bg-verde" />
            Aguardando o pagamento… vence em {min}:{String(seg).padStart(2, "0")}
          </p>
        </>
      )}
      <button type="button" onClick={onCancelar} className="mt-auto pt-6 text-center text-xs text-ink-soft underline underline-offset-2 hover:text-ink">
        Voltar e escolher outra forma de pagamento
      </button>
    </div>
  );
}
