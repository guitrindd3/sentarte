"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { adicionarFotoProducaoAction, editarLegendaFotoAction, tirarFotoProducaoAction } from "../../../actions";
import { btnSecondary, inputClass } from "../../../_ui";

/** Same cap as MAX_LEGENDA in lib/fotos-producao.ts (server-only). */
const MAX_LEGENDA = 1000;
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
 * The text under one photo, editable after it's up (user 2026-11-13: "quero
 * poder escrever em cada foto que eu anexo para pessoa ver no passaporte").
 */
function TextoDaFoto({
  pedidoRef,
  id,
  inicial,
  onAviso,
}: {
  pedidoRef: string;
  id: string;
  inicial: string;
  onAviso: (a: { ok: boolean; t: string }) => void;
}) {
  const [texto, setTexto] = useState(inicial);
  const [salvo, setSalvo] = useState(inicial);
  const [pendente, iniciar] = useTransition();
  const mudou = texto.trim() !== salvo.trim();
  return (
    <div className="space-y-1">
      <label className="sr-only" htmlFor={`texto-${id}`}>
        Texto desta foto
      </label>
      <textarea
        id={`texto-${id}`}
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
        maxLength={MAX_LEGENDA}
        rows={3}
        placeholder="Escreva algo para a cliente sobre esta foto"
        className={`${inputClass} resize-y text-sm leading-snug`}
      />
      {mudou ? (
        <button
          type="button"
          disabled={pendente}
          onClick={() =>
            iniciar(async () => {
              const r = await editarLegendaFotoAction(pedidoRef, id, texto);
              if (r?.ok) setSalvo(texto);
              onAviso(r?.ok ? { ok: true, t: r.msg } : { ok: false, t: r?.erro ?? "Não deu para salvar." });
            })
          }
          className="rounded-full bg-wood px-3 py-1.5 text-xs font-semibold text-paper hover:bg-wood-dark disabled:opacity-60"
        >
          {pendente ? "Salvando…" : "Salvar texto"}
        </button>
      ) : null}
    </div>
  );
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
              <TextoDaFoto pedidoRef={pedidoRef} id={f.id} inicial={f.legenda} onAviso={setAviso} />
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
        <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-start">
          <label className="block text-sm">
            <span className="font-medium text-ink">Texto da próxima foto</span>
            <span className="mt-0.5 block text-xs text-ink-soft">Depois de pôr a foto, dá para mudar o texto embaixo dela.</span>
            <textarea
              id="legenda-producao"
              value={legenda}
              onChange={(e) => setLegenda(e.target.value)}
              maxLength={MAX_LEGENDA}
              rows={4}
              placeholder="Escreva o que quiser para a cliente ver junto com a foto"
              className={`mt-1 ${inputClass} resize-y leading-snug`}
            />
            <span className="mt-0.5 block text-right text-xs text-ink-soft tabular-nums">
              {legenda.length}/{MAX_LEGENDA}
            </span>
          </label>
          <div className="flex flex-wrap gap-1.5 sm:col-start-1">
            {SUGESTOES.map((t) => (
              <button key={t} type="button" onClick={() => setLegenda(t)} className="rounded-full border border-line px-2.5 py-1 text-xs text-ink-soft hover:border-wood hover:text-ink">
                {t}
              </button>
            ))}
          </div>
          <input ref={arquivo} id="foto-producao" type="file" accept="image/*" className="sr-only" onChange={(e) => enviar(e.target.files?.[0])} />
          <button type="button" disabled={pendente} onClick={() => arquivo.current?.click()} className={`${btnSecondary} sm:col-start-2 sm:row-start-1 sm:mt-11`}>
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
