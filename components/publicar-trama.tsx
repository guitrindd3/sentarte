"use client";

import { startTransition, useActionState, useState } from "react";
import { publicarTramaAction } from "@/app/admin/actions";

const COLECOES = [
  { valor: "times", rotulo: "Times", texto: "Aparece em /times" },
  { valor: "boho", rotulo: "Boho", texto: "Aparece em /boho" },
  { valor: "desenhos", rotulo: "Desenhos", texto: "Aparece em /desenhos (preço de personalizada)" },
  { valor: "eventos", rotulo: "Eventos", texto: "Aparece em /eventos (casamento, empresas, festas)" },
  { valor: "cadeiras", rotulo: "Cadeiras", texto: "Aparece na página Cadeiras" },
] as const;

/**
 * Admin only (/admin/montar, 2026-10-19): step 4 of the builder becomes
 * "Publicar no site" — name, description, collection; the picture of the
 * chair being built becomes its photo.
 */
export function PublicarTrama({
  codigo,
  gerarFoto,
  corA,
  corB,
}: {
  /** chair-link query string of the design */
  codigo: string;
  gerarFoto: () => Promise<File | null>;
  corA: string;
  corB: string;
}) {
  const [colecao, setColecao] = useState<(typeof COLECOES)[number]["valor"]>("boho");
  const [enviando, setEnviando] = useState(false);
  const [estado, enviar, pendente] = useActionState(publicarTramaAction, undefined);

  return (
    <form
      className="mt-6 space-y-4 rounded-2xl border-2 border-ink/80 bg-paper p-5"
      onSubmit={async (e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        setEnviando(true);
        const foto = await gerarFoto();
        if (foto) fd.set("foto", foto);
        fd.set("trama", codigo);
        fd.set("corA", corA);
        fd.set("corB", corB);
        setEnviando(false);
        startTransition(() => enviar(fd));
      }}
    >
      <p className="font-serif text-xl font-medium text-ink">Publicar no site</p>
      <label className="block text-sm">
        <span className="font-semibold text-ink">Nome da cadeira</span>
        <input name="nome" required maxLength={60} placeholder="Ex: Mandala terracota" className="mt-1 w-full rounded-lg border border-line bg-canvas px-3 py-2 text-ink" />
      </label>
      <label className="block text-sm">
        <span className="font-semibold text-ink">Descrição curta</span>
        <textarea name="descricao" required maxLength={240} rows={2} placeholder="Ex: Mandala em terracota sobre trama areia." className="mt-1 w-full rounded-lg border border-line bg-canvas px-3 py-2 text-ink" />
      </label>
      <fieldset>
        <legend className="text-sm font-semibold text-ink">Em qual coleção ela entra?</legend>
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          {COLECOES.map((c) => (
            <label key={c.valor} className={`flex cursor-pointer items-start gap-2 rounded-xl border p-3 text-sm ${colecao === c.valor ? "border-ink bg-canvas" : "border-line"}`}>
              <input type="radio" name="colecao" value={c.valor} checked={colecao === c.valor} onChange={() => setColecao(c.valor)} className="mt-1" />
              <span>
                <span className="block font-semibold text-ink">{c.rotulo}</span>
                <span className="block text-xs text-ink-soft">{c.texto}</span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>
      <p className="text-xs text-ink-soft">A foto será a imagem da cadeira montada aqui em cima. Depois dá para trocar por uma foto de verdade em Cadeiras.</p>
      {estado && !estado.ok ? <p className="text-sm text-clay">{estado.erro}</p> : null}
      {estado?.ok ? (
        <p className="rounded-lg bg-canvas px-3 py-2 text-sm text-ink" role="status">
          {estado.msg}
        </p>
      ) : null}
      <button type="submit" disabled={enviando || pendente} className="inline-flex items-center justify-center rounded-full bg-wood px-6 py-3 text-sm font-semibold text-paper transition hover:bg-wood-dark disabled:opacity-60">
        {enviando || pendente ? "Publicando…" : "Publicar no site"}
      </button>
    </form>
  );
}
