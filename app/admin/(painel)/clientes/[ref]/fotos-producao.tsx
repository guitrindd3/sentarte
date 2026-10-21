"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { adicionarFotoProducaoAction, tirarFotoProducaoAction } from "../../../actions";
import { btnSecondary, inputClass } from "../../../_ui";

const SUGESTOES = ["Começamos a trançar a sua!", "Já está na metade", "Quase pronta", "Pronta! Indo para o envio"];

/** Shrinks the photo in the browser to a ≤1200px JPEG data URL (same as the review photos). */
async function encolherFoto(arquivo: File): Promise<string> {
  const img = await createImageBitmap(arquivo);
  const escala = Math.min(1, 1200 / Math.max(img.width, img.height));
  const c = document.createElement("canvas");
  c.width = Math.round(img.width * escala);
  c.height = Math.round(img.height * escala);
  c.getContext("2d")!.drawImage(img, 0, 0, c.width, c.height);
  img.close();
  return c.toDataURL("image/jpeg", 0.82);
}

/**
 * Admin order page: photos of this chair being made (2026-10-21). They show
 * on the customer's Acompanhar pedido page right away.
 */
export function FotosProducao({
  pedidoRef,
  fotos,
  max,
  linkWhatsapp,
}: {
  pedidoRef: string;
  fotos: { id: string; legenda: string; quando: string }[];
  max: number;
  /** WhatsApp message to the customer with the order page link */
  linkWhatsapp: string;
}) {
  const [legenda, setLegenda] = useState(SUGESTOES[0]);
  const [aviso, setAviso] = useState<{ ok: boolean; t: string } | null>(null);
  const [pendente, iniciar] = useTransition();
  const arquivo = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const enviar = async (f: File | undefined) => {
    if (!f) return;
    setAviso(null);
    let dataUrl = "";
    try {
      dataUrl = await encolherFoto(f);
    } catch {
      setAviso({ ok: false, t: "Não deu para abrir essa foto. Tente outra (JPG ou PNG)." });
      return;
    }
    iniciar(async () => {
      const r = await adicionarFotoProducaoAction(pedidoRef, legenda, dataUrl);
      setAviso(r?.ok ? { ok: true, t: r.msg } : { ok: false, t: r?.erro ?? "Não deu para salvar." });
      if (r?.ok) router.refresh();
      if (arquivo.current) arquivo.current.value = "";
    });
  };

  return (
    <div className="space-y-4">
      {fotos.length ? (
        <ul className="grid grid-cols-[repeat(2,minmax(0,1fr))] gap-3 sm:grid-cols-[repeat(3,minmax(0,1fr))]">
          {fotos.map((f) => (
            <li key={f.id} className="space-y-1.5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={`/api/producao/${pedidoRef}/${f.id}`} alt={f.legenda} className="aspect-square w-full border border-line object-cover" />
              <p className="text-sm text-ink">{f.legenda}</p>
              <p className="text-xs text-ink-soft">{f.quando}</p>
              <button
                type="button"
                disabled={pendente}
                onClick={() =>
                  iniciar(async () => {
                    const r = await tirarFotoProducaoAction(pedidoRef, f.id);
                    setAviso(r?.ok ? { ok: true, t: r.msg } : { ok: false, t: r?.erro ?? "Não deu para apagar." });
                    if (r?.ok) router.refresh();
                  })
                }
                className="text-xs text-clay-dark underline underline-offset-2"
              >
                Apagar
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-ink-soft">Nenhuma foto ainda. Tire uma da cadeira começando e outra pronta: o cliente adora acompanhar.</p>
      )}

      {fotos.length < max ? (
        <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
          <label className="block text-sm">
            <span className="font-medium text-ink">Legenda</span>
            <input
              id="legenda-producao"
              list="legendas-producao"
              value={legenda}
              onChange={(e) => setLegenda(e.target.value)}
              maxLength={80}
              className={`mt-1 ${inputClass}`}
            />
            <datalist id="legendas-producao">
              {SUGESTOES.map((s) => (
                <option key={s} value={s} />
              ))}
            </datalist>
          </label>
          <input ref={arquivo} id="foto-producao" type="file" accept="image/*" className="sr-only" onChange={(e) => enviar(e.target.files?.[0])} />
          <button type="button" disabled={pendente} onClick={() => arquivo.current?.click()} className={btnSecondary}>
            {pendente ? "Enviando…" : "Tirar ou escolher foto"}
          </button>
        </div>
      ) : (
        <p className="text-sm text-ink-soft">Chegou no limite de {max} fotos. Apague uma para pôr outra.</p>
      )}
      {aviso ? <p className={`text-sm ${aviso.ok ? "text-verde-escuro" : "text-clay-dark"}`} role="status">{aviso.t}</p> : null}
      {fotos.length ? (
        <a href={linkWhatsapp} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-full bg-verde px-4 py-2 text-sm font-semibold text-paper hover:bg-verde-escuro">
          Avisar o cliente no WhatsApp
        </a>
      ) : null}
    </div>
  );
}
