"use client";

import { useEffect, useRef, useState } from "react";
import type { ModeloInclui } from "@/lib/content-schema";
import {
  BRACO_MADEIRA,
  formatBRL,
  PARCELAS_MAX,
  PRECO_CADEIRA,
  PRECO_CADEIRA_COM_NOME,
  precoCadeira,
  precoPix,
  rotulosInclui,
  TASSEL_PRECO,
} from "@/lib/offer";

type Estado = { nome: string; descricao: string; foto?: string; nova: boolean; inclui: ModeloInclui };

/**
 * Live "how it shows on the site" card beside the chair editor (user
 * 2026-11-03: "prévia ao lado"). Reads the surrounding form on every change —
 * text, the picked photo, and the "O que vem nesta cadeira" options — and
 * prices it exactly like the site (precoCadeira).
 */
export function PreviaCadeira({
  inicial,
  temPreco,
  desenho,
}: {
  inicial: { nome: string; descricao: string; foto?: string; inclui?: ModeloInclui };
  temPreco: boolean;
  /** desenho chairs are always at the named price */
  desenho: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [e, setE] = useState<Estado>({ nome: inicial.nome, descricao: inicial.descricao, foto: inicial.foto, nova: false, inclui: inicial.inclui ?? {} });

  useEffect(() => {
    const form = ref.current?.closest("form");
    if (!form) return;
    let url: string | null = null;
    const ler = () => {
      const fd = new FormData(form);
      const s = (k: string) => (typeof fd.get(k) === "string" ? String(fd.get(k)) : "");
      const arquivo = form.querySelector<HTMLInputElement>('input[type="file"][name="foto"]')?.files?.[0];
      if (url) URL.revokeObjectURL(url);
      url = arquivo ? URL.createObjectURL(arquivo) : null;
      const tem = fd.has("incluiCampos");
      const t = Number(s("incluiTasseis"));
      setE({
        nome: s("nome") || inicial.nome,
        descricao: fd.has("descricao") ? s("descricao") : inicial.descricao,
        foto: url ?? (fd.get("removerFoto") === "on" ? undefined : inicial.foto),
        nova: Boolean(url),
        inclui: tem
          ? {
              nome: fd.get("incluiNome") === "on",
              tasseis: t === 1 || t === 2 ? t : undefined,
              tasselCor: s("incluiTasselCor").trim() || undefined,
              tasselLado: s("incluiTasselLado") === "esq" ? "esq" : "dir",
              bracoMadeira: fd.get("incluiMadeira") === "on",
            }
          : {},
      });
    };
    // after the field's own handlers (photo slots set their inputs, then fire)
    const agendar = () => setTimeout(ler, 0);
    form.addEventListener("input", agendar);
    form.addEventListener("change", agendar);
    return () => {
      form.removeEventListener("input", agendar);
      form.removeEventListener("change", agendar);
      if (url) URL.revokeObjectURL(url);
    };
  }, [inicial]);

  const i = e.inclui;
  const comNome = desenho || Boolean(i.nome);
  const preco = precoCadeira(comNome, "normal", Boolean(i.bracoMadeira), i.tasseis ?? 0);
  const vemCom = rotulosInclui(i);
  const linhas = [
    { t: comNome ? "Cadeira com nome" : "Cadeira", v: comNome ? PRECO_CADEIRA_COM_NOME : PRECO_CADEIRA },
    ...(i.tasseis ? [{ t: `${i.tasseis} tassel${i.tasseis > 1 ? "s" : ""}`, v: i.tasseis * TASSEL_PRECO }] : []),
    ...(i.bracoMadeira ? [{ t: "Braço de madeira", v: BRACO_MADEIRA.normal }] : []),
  ];

  return (
    <div ref={ref} className="lg:sticky lg:top-20">
      {/* only so the "before publishing" summary lists the price change; the server ignores it */}
      {temPreco ? <input type="hidden" name="precoNoSite" value={formatBRL(preco)} data-rotulo="Preço no site" /> : null}
      <div className="mb-2 flex items-center justify-between">
        <p className="flex items-center gap-2 text-xs font-semibold text-ink-soft">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-verde opacity-60" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-verde" />
          </span>
          Prévia ao vivo: assim aparece no site
        </p>
      </div>

      <div className="overflow-hidden rounded-3xl border border-line/70 bg-paper shadow-[0_20px_50px_-28px_rgba(36,28,20,0.45)]">
        {/* phones: compact row; desktop: the full card */}
        <div className="flex gap-3 p-3 lg:block lg:p-0">
          <div className="relative aspect-square w-24 shrink-0 overflow-hidden rounded-2xl bg-canvas-deep lg:w-full lg:rounded-none">
            {e.foto ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={e.foto} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className="grid h-full w-full place-items-center p-3 text-center text-xs text-ink-soft">Sem foto: o site mostra o desenho das cores</div>
            )}
            {e.nova ? <span className="absolute left-2 top-2 rounded-full bg-verde px-2 py-0.5 text-[0.7rem] font-semibold text-paper shadow">Foto nova</span> : null}
          </div>
          <div className="min-w-0 flex-1 lg:p-5">
            <p className="truncate font-serif text-lg font-medium tracking-tight text-ink lg:text-xl">{e.nome || "Sem nome"}</p>
            {temPreco ? (
              <>
                <p className="mt-0.5 text-sm text-ink">
                  <span className="font-semibold">{formatBRL(preco)}</span>
                  <span className="text-ink-soft"> ou até {PARCELAS_MAX}x</span>
                </p>
                <p className="text-xs text-ink-soft">{formatBRL(precoPix(preco))} no Pix</p>
              </>
            ) : null}
            {vemCom.length ? (
              <p className="mt-1.5 text-xs text-ink">
                <span className="text-ink-soft">Vem com: </span>
                {vemCom.join(", ")}
              </p>
            ) : null}
            <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-ink-soft max-lg:hidden">{e.descricao || "Sem descrição ainda."}</p>
            {i.nome ? (
              <div className="mt-3 rounded-lg border border-dashed border-line px-3 py-2 text-xs text-ink-soft max-lg:hidden">Campo para o cliente: “Nome ou apelido para trançar”</div>
            ) : null}
            <div className="mt-4 grid grid-cols-2 gap-2 max-lg:hidden" aria-hidden>
              <span className="rounded-md bg-ink py-2 text-center text-xs font-medium text-canvas">Comprar</span>
              <span className="rounded-md border border-ink py-2 text-center text-xs font-medium text-ink">Carrinho</span>
            </div>
          </div>
        </div>

        {temPreco ? (
          <div className="border-t border-line/70 bg-canvas/60 px-5 py-4 max-lg:hidden">
            <p className="text-xs font-semibold text-ink-soft">Como o preço é montado</p>
            <ul className="mt-2 space-y-1 text-sm">
              {linhas.map((l) => (
                <li key={l.t} className="flex justify-between gap-3 text-ink-soft">
                  <span>{l.t}</span>
                  <span className="tabular-nums">{l === linhas[0] ? formatBRL(l.v) : `+ ${formatBRL(l.v)}`}</span>
                </li>
              ))}
              <li className="mt-1.5 flex justify-between gap-3 border-t border-line/70 pt-1.5 font-semibold text-ink">
                <span>Preço no site</span>
                <span className="tabular-nums">{formatBRL(preco)}</span>
              </li>
            </ul>
          </div>
        ) : null}
      </div>
    </div>
  );
}
