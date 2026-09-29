"use client";

import { useState } from "react";
import Image from "next/image";
import { AddToCartButton } from "@/components/add-to-cart-button";
import { WeavePattern } from "@/components/weave-pattern";
import { ChevronDownIcon, WhatsAppIcon } from "@/components/icons";
import { CATEGORIA_COM_PRECO, formatBRL, PARCELAS_MAX, precoCadeira, precoPix, PRECO_CADEIRA_COM_NOME } from "@/lib/offer";
import { DESENHO_TEMAS } from "@/lib/desenho-model";
import { whatsappUrl } from "@/lib/urls";
import type { Modelo } from "@/lib/content-schema";

export function ModeloCard({
  modelo,
  personalizado,
  categoria,
  categoriaSlug,
  whatsappNumero,
}: {
  modelo: Modelo;
  personalizado?: Modelo;
  categoria: string;
  categoriaSlug: string;
  whatsappNumero: string;
}) {
  const [wantsNome, setWantsNome] = useState(false);
  const [varianteIndex, setVarianteIndex] = useState(0);
  const [nomeTexto, setNomeTexto] = useState("");

  const ativo = wantsNome && personalizado ? personalizado : modelo;
  // Color options (a real choice, sent with the order) come first, then
  // extra photos that are just for looking (angles, other customers' names).
  const cores = [modelo.imagemUrl, ...(modelo.variantes ?? [])].filter((f): f is string => Boolean(f));
  const usaFotosPersonalizado = wantsNome && Boolean(personalizado);
  const fotosBase = usaFotosPersonalizado && personalizado
    ? [personalizado.imagemUrl, ...(personalizado.fotosExtras ?? [])].filter((f): f is string => Boolean(f))
    : [...cores, ...(modelo.fotosExtras ?? [])];
  const fotoAtiva = fotosBase[varianteIndex] ?? fotosBase[0];
  const nomeFinal = wantsNome ? nomeTexto.trim() : "";
  const temVariantes = fotosBase.length > 1;
  // Without a dedicated personalizado photo the customer still picks a color
  // for the chair the name goes on.
  const escolheCor = !usaFotosPersonalizado && cores.length > 1;
  const varianteLabel = escolheCor && varianteIndex < cores.length ? `Opção ${varianteIndex + 1}` : "";
  const contagemFotos =
    escolheCor && fotosBase.length === cores.length ? `${cores.length} cores` : `${fotosBase.length} fotos`;
  const mudarVariante = (passo: number) =>
    setVarianteIndex((i) => (i + passo + fotosBase.length) % fotosBase.length);

  const temPreco = categoriaSlug === CATEGORIA_COM_PRECO;
  // Every chair can take a woven name (user 2026-09-29), not only the ones
  // with a "<Nome> personalizado" photo.
  // Desenho/anime chairs are already a personalized design: fixed
  // personalized price, and no name on top (user 2026-09-29).
  const ehDesenho = DESENHO_TEMAS.includes(modelo.nome);
  const podePersonalizar = !ehDesenho && (temPreco || Boolean(personalizado));
  const preco = precoCadeira(wantsNome || ehDesenho);
  const faltaNome = wantsNome && !nomeFinal;
  const mensagemWhatsapp = `Oi! Quero pedir uma peça de ${categoria}, modelo "${ativo.nome}"${
    temPreco ? ` (${formatBRL(preco)})` : ""
  }.${
    varianteLabel ? ` Cor: ${varianteLabel}.` : ""
  }${nomeFinal ? ` Nome/apelido para trançar: "${nomeFinal}".` : ""}`;

  return (
    <div className="group flex flex-col border border-line bg-paper transition-all duration-300 hover:-translate-y-1 hover:border-ink hover:shadow-[6px_6px_0_0_var(--line)]">
      <div className="relative aspect-[4/5] overflow-hidden border-b border-line bg-canvas">
        {fotoAtiva ? (
          <Image
            key={fotoAtiva}
            src={fotoAtiva}
            alt={ativo.nome}
            fill
            className="object-contain transition-transform duration-300 group-hover:scale-105"
            sizes="(min-width: 1024px) 360px, (min-width: 640px) 45vw, 100vw"
          />
        ) : (
          <WeavePattern colorA={ativo.corA} colorB={ativo.corB} cell={30} band={20} className="h-full w-full" />
        )}
        {temVariantes ? (
          <>
            <button
              type="button"
              onClick={() => mudarVariante(-1)}
              aria-label="Foto anterior"
              className="absolute left-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-line bg-paper/90 text-ink backdrop-blur transition-colors hover:border-ink"
            >
              <ChevronDownIcon className="h-4 w-4 rotate-90" />
            </button>
            <button
              type="button"
              onClick={() => mudarVariante(1)}
              aria-label="Próxima foto"
              className="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-line bg-paper/90 text-ink backdrop-blur transition-colors hover:border-ink"
            >
              <ChevronDownIcon className="h-4 w-4 -rotate-90" />
            </button>
            <div
              className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-2 bg-gradient-to-t from-ink/45 to-transparent px-3 pb-3 pt-8"
              role="group"
              aria-label="Fotos"
            >
              <div className="flex gap-1.5">
                {fotosBase.map((foto, i) => (
                  <button
                    key={foto}
                    type="button"
                    onClick={() => setVarianteIndex(i)}
                    onMouseEnter={() => setVarianteIndex(i)}
                    aria-label={`Ver foto ${i + 1}`}
                    aria-pressed={varianteIndex === i}
                    className={`relative h-11 w-11 overflow-hidden border-2 transition-all ${
                      varianteIndex === i ? "border-canvas" : "border-canvas/40 opacity-75 hover:opacity-100"
                    }`}
                  >
                    <Image src={foto} alt="" fill className="object-cover" sizes="44px" />
                  </button>
                ))}
              </div>
              <span className="text-[0.7rem] font-medium text-canvas [text-shadow:0_1px_6px_rgba(0,0,0,0.4)]">
                {contagemFotos}
              </span>
            </div>
          </>
        ) : null}
      </div>
      <div className="flex flex-1 flex-col p-5">
        <p className="font-serif text-lg font-medium text-ink">{modelo.nome}</p>
        {temPreco ? (
          <p className="mt-1 text-sm text-ink">
            <span className="font-medium">{formatBRL(preco)}</span>
            <span className="text-ink-soft"> ou até {PARCELAS_MAX}x no cartão</span>
            <span className="block text-xs text-ink-soft">
              {formatBRL(precoPix(preco))} no Pix
              {wantsNome || !podePersonalizar ? null : <>. Com nome: {formatBRL(PRECO_CADEIRA_COM_NOME)}</>}
            </span>
          </p>
        ) : null}

        {podePersonalizar ? (
          <div className="mt-2 inline-flex w-fit border border-line text-xs" role="group" aria-label="Personalização">
            <button
              type="button"
              onClick={() => { setWantsNome(false); setVarianteIndex(0); }}
              aria-pressed={!wantsNome}
              className={`px-3 py-1.5 transition-colors ${
                !wantsNome ? "bg-ink text-canvas" : "text-ink-soft hover:text-ink"
              }`}
            >
              Sem nome
            </button>
            <button
              type="button"
              onClick={() => { setWantsNome(true); setVarianteIndex(0); }}
              aria-pressed={wantsNome}
              className={`border-l border-line px-3 py-1.5 transition-colors ${
                wantsNome ? "bg-ink text-canvas" : "text-ink-soft hover:text-ink"
              }`}
            >
              Personalizado
            </button>
          </div>
        ) : null}


        {wantsNome ? (
          <label className="mt-2 block">
            <span className="text-xs text-ink-soft">Nome ou apelido para trançar</span>
            <input
              type="text"
              value={nomeTexto}
              onChange={(e) => setNomeTexto(e.target.value)}
              placeholder="Ex: João"
              maxLength={24}
              className="mt-1 w-full border border-line bg-canvas px-2.5 py-1.5 text-sm text-ink focus:border-ink focus:outline-none"
            />
          </label>
        ) : null}

        <p className="mt-2 flex-1 text-sm leading-relaxed text-ink-soft">{ativo.descricao}</p>
        <AddToCartButton
          item={{
            id: `${categoriaSlug}:${ativo.id}${nomeFinal ? `:${nomeFinal}` : ""}${
              varianteLabel ? `:${varianteLabel}` : ""
            }`,
            categoriaSlug,
            categoriaTitulo: categoria,
            modeloId: ativo.id,
            modeloNome: ativo.nome,
            imagemUrl: fotoAtiva,
            corA: ativo.corA,
            corB: ativo.corB,
            nomePersonalizado: nomeFinal || undefined,
            personalizada: ehDesenho || undefined,
            variante: varianteLabel || undefined,
          }}
          disabled={faltaNome}
        />
        {faltaNome ? (
          <p className="mt-1.5 text-xs text-ink-soft">Escreva o nome para adicionar ao carrinho.</p>
        ) : null}
        <a
          href={whatsappUrl(whatsappNumero, mensagemWhatsapp)}
          target="_blank"
          rel="noreferrer"
          className="mt-2 inline-flex items-center gap-2 text-xs text-ink-soft underline transition-colors hover:text-ink"
        >
          <WhatsAppIcon className="h-3.5 w-3.5" />
          Ou pedir direto pelo WhatsApp
        </a>
      </div>
    </div>
  );
}
