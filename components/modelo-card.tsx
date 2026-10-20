"use client";

import { useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { AddToCartButton } from "@/components/add-to-cart-button";
import { BotaoFavorito } from "@/components/botao-favorito";
import { WeavePattern } from "@/components/weave-pattern";
import { ChevronDownIcon, WhatsAppIcon } from "@/components/icons";
import { formatBRL, PARCELAS_MAX, precoPix, PRECO_CADEIRA_COM_NOME } from "@/lib/offer";
import { caminhoDoModelo } from "@/lib/produtos";
import { useEscolhaModelo } from "@/lib/use-escolha-modelo";
import { precoBlackFriday, useBlackFriday } from "@/lib/use-black-friday";
import { LogoBlackFriday } from "@/components/logo-black-friday";
import { SeloBlackFriday } from "@/components/selo-black-friday";
import { whatsappUrl } from "@/lib/urls";
import type { Modelo } from "@/lib/content-schema";
import { useCart } from "@/lib/cart-context";

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
  const nomeRef = useRef<HTMLInputElement>(null);
  const { addItem, comprarAgora } = useCart();
  const {
    ativo,
    fotos: fotosBase,
    fotoAtiva,
    varianteIndex,
    setVarianteIndex,
    mudarVariante,
    contagemFotos,
    wantsNome,
    escolherNome,
    nomeTexto,
    setNomeTexto,
    temPreco,
    podePersonalizar,
    preco,
    faltaNome,
    mensagemWhatsapp,
    itemDoCarrinho,
  } = useEscolhaModelo({ modelo, personalizado, categoria, categoriaSlug });
  const bf = useBlackFriday();
  const precoBf = precoBlackFriday(preco, bf);
  const temVariantes = fotosBase.length > 1;
  const pagina = caminhoDoModelo(modelo.nome, categoriaSlug);

  const pedirNome = () => {
    nomeRef.current?.focus();
    nomeRef.current?.scrollIntoView({ block: "center", behavior: "smooth" });
  };

  return (
    <div className="group flex flex-col border border-line bg-paper transition-all duration-300 hover:-translate-y-1 hover:border-ink hover:shadow-[6px_6px_0_0_var(--line)]">
      <div className="relative aspect-square overflow-hidden border-b border-line bg-canvas sm:aspect-[4/5]">
        {fotoAtiva ? (
          <Image
            key={fotoAtiva}
            src={fotoAtiva}
            alt={ativo.nome}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(min-width: 1024px) 360px, (min-width: 640px) 45vw, 100vw"
          />
        ) : (
          <WeavePattern colorA={ativo.corA} colorB={ativo.corB} cell={30} band={20} className="h-full w-full" />
        )}
        {/* The whole photo opens the chair's own page (user 2026-10-19; before it
            put the chair in the cart, and before that it was the WhatsApp link).
            Models without a page keep the cart behavior. The gallery arrows/
            thumbnails sit above it. */}
        {pagina ? (
          <Link
            href={pagina}
            data-rastro={`Foto da cadeira (página): ${modelo.nome}`}
            aria-label={`Ver a página de ${modelo.nome}`}
            className="absolute inset-0"
          />
        ) : (
          <button
            type="button"
            data-rastro={`Foto da cadeira (carrinho): ${ativo.nome}`}
            aria-label={`Colocar ${ativo.nome} no carrinho`}
            onClick={() => (faltaNome ? pedirNome() : addItem(itemDoCarrinho))}
            className="absolute inset-0 cursor-pointer"
          />
        )}
        {bf && temPreco ? <LogoBlackFriday className="w-[42%]" /> : null}
        {pagina ? (
          <BotaoFavorito slug={pagina.slice("/cadeira/".length)} nome={modelo.nome} className="absolute right-2 top-2" />
        ) : null}
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
              <span className="text-xs font-medium text-canvas [text-shadow:0_1px_6px_rgba(0,0,0,0.4)]">
                {contagemFotos}
              </span>
            </div>
          </>
        ) : null}
      </div>
      <div className="flex flex-1 flex-col p-5">
        {pagina ? (
          <Link href={pagina} className="font-serif text-lg font-medium text-ink underline-offset-4 hover:underline">
            {modelo.nome}
          </Link>
        ) : (
          <p className="font-serif text-lg font-medium text-ink">{modelo.nome}</p>
        )}
        {bf && temPreco && !precoBf ? <SeloBlackFriday cupom={bf.cupom} className="mt-1" /> : null}
        {temPreco ? (
          <p className="mt-1 text-sm text-ink">
            {precoBf ? <s className="mr-1.5 text-ink-soft">{formatBRL(preco)}</s> : null}
            <span className="font-medium">{formatBRL(precoBf ?? preco)}</span>
            <span className="text-ink-soft"> ou até {PARCELAS_MAX}x no cartão</span>
            <span className="block text-xs text-ink-soft">
              {formatBRL(precoPix(precoBf ?? preco))} no Pix
              {wantsNome || !podePersonalizar ? null : <>. Com nome: {formatBRL(precoBlackFriday(PRECO_CADEIRA_COM_NOME, bf) ?? PRECO_CADEIRA_COM_NOME)}</>}
            </span>
          </p>
        ) : null}

        {podePersonalizar ? (
          <div className="mt-2 inline-flex w-fit border border-line text-xs" role="group" aria-label="Personalização">
            <button
              type="button"
              onClick={() => escolherNome(false)}
              aria-pressed={!wantsNome}
              className={`px-3 py-2 transition-colors ${
                !wantsNome ? "bg-ink text-canvas" : "text-ink-soft hover:text-ink"
              }`}
            >
              Sem nome
            </button>
            <button
              type="button"
              onClick={() => escolherNome(true)}
              aria-pressed={wantsNome}
              className={`border-l border-line px-3 py-2 transition-colors ${
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
              ref={nomeRef}
              value={nomeTexto}
              onChange={(e) => setNomeTexto(e.target.value)}
              placeholder="Ex: João"
              maxLength={24}
              className="mt-1 w-full border border-line bg-canvas px-2.5 py-1.5 text-sm text-ink focus:border-ink focus:outline-none"
            />
          </label>
        ) : null}

        {/* phones: no description on the card (it's on the chair's page) — the cards were very long */}
        <p className="mt-2 line-clamp-3 flex-1 text-sm leading-relaxed text-ink-soft max-sm:hidden" title={ativo.descricao}>{ativo.descricao}</p>
        <span className="flex-1 sm:hidden" />
        {pagina ? (
          <Link href={pagina} data-rastro={`Ver detalhes: ${modelo.nome}`} className="mt-2 w-fit py-1 text-xs text-ink underline underline-offset-2 hover:text-ink-soft">
            Ver detalhes, medidas e frete
          </Link>
        ) : null}
        {/* phones: Comprar + a cart icon side by side; stacked from sm */}
        <div className="mt-4 grid grid-cols-[1fr_auto] gap-2 sm:grid-cols-1">
          <button
            type="button"
            disabled={faltaNome}
            data-rastro={`Comprar: ${ativo.nome}`}
            onClick={() => comprarAgora(itemDoCarrinho)}
            className="inline-flex items-center justify-center gap-2 border border-ink bg-ink px-4 py-2.5 text-sm font-medium text-canvas transition-all duration-200 hover:bg-transparent hover:text-ink active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-ink disabled:hover:text-canvas"
          >
            Comprar
          </button>
          <AddToCartButton item={itemDoCarrinho} disabled={faltaNome} contorno curtoNoCelular />
        </div>
        {faltaNome ? (
          <p className="mt-1.5 text-xs text-ink-soft">Escreva o nome para comprar ou adicionar ao carrinho.</p>
        ) : null}
        <a
          href={whatsappUrl(whatsappNumero, mensagemWhatsapp)}
          target="_blank"
          rel="noreferrer"
          className="mt-1 inline-flex items-center gap-2 py-2 text-xs text-ink-soft underline transition-colors hover:text-ink"
        >
          <WhatsAppIcon className="h-3.5 w-3.5" />
          Ou pedir direto pelo WhatsApp
        </a>
      </div>
    </div>
  );
}
