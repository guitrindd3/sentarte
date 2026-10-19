"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { AddToCartButton } from "@/components/add-to-cart-button";
import { BotaoFavorito } from "@/components/botao-favorito";
import { VagasSemana } from "@/components/vagas-semana";
import { WeavePattern } from "@/components/weave-pattern";
import { ChevronDownIcon, WhatsAppIcon } from "@/components/icons";
import { formatBRL, PARCELAS_MAX, precoPix, PRECO_CADEIRA_COM_NOME, PRAZO_PRODUCAO_DIAS_UTEIS } from "@/lib/offer";
import { useCart } from "@/lib/cart-context";
import { useEscolhaModelo } from "@/lib/use-escolha-modelo";
import { cepGuardado, guardarCep, textoFrete, useFrete } from "@/lib/use-frete";
import { whatsappUrl } from "@/lib/urls";
import type { Modelo } from "@/lib/content-schema";

// Top of the product page /cadeira/<slug>: big photo gallery (tap to zoom),
// the same choices as the catalog card, and the shipping quote by CEP before
// the chair goes to the cart.
export function ProdutoCompra({
  modelo,
  personalizado,
  categoria,
  categoriaSlug,
  whatsappNumero,
  slug,
}: {
  slug: string;
  modelo: Modelo;
  personalizado?: Modelo;
  categoria: string;
  categoriaSlug: string;
  whatsappNumero: string;
}) {
  const e = useEscolhaModelo({ modelo, personalizado, categoria, categoriaSlug });
  const { comprarAgora } = useCart();
  const [zoom, setZoom] = useState(false);
  const [cep, setCep] = useState("");
  useEffect(() => {
    // CEP typed last time (localStorage) — only after hydration, like the cart drawer
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCep(cepGuardado());
  }, []);
  const frete = useFrete(cep, [{ ...e.itemDoCarrinho, quantidade: 1 }]);

  const { mudarVariante } = e;
  useEffect(() => {
    if (!zoom) return;
    const tecla = (ev: KeyboardEvent) => {
      if (ev.key === "Escape") setZoom(false);
      if (ev.key === "ArrowRight") mudarVariante(1);
      if (ev.key === "ArrowLeft") mudarVariante(-1);
    };
    window.addEventListener("keydown", tecla);
    return () => window.removeEventListener("keydown", tecla);
  }, [zoom, mudarVariante]);

  const variasFotos = e.fotos.length > 1;
  const setas = (claro: boolean) =>
    variasFotos ? (
      <>
        <button
          type="button"
          onClick={() => e.mudarVariante(-1)}
          aria-label="Foto anterior"
          className={`absolute left-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border backdrop-blur transition-colors ${
            claro ? "border-canvas/40 bg-ink/40 text-canvas hover:bg-ink/60" : "border-line bg-paper/90 text-ink hover:border-ink"
          }`}
        >
          <ChevronDownIcon className="h-4 w-4 rotate-90" />
        </button>
        <button
          type="button"
          onClick={() => e.mudarVariante(1)}
          aria-label="Próxima foto"
          className={`absolute right-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border backdrop-blur transition-colors ${
            claro ? "border-canvas/40 bg-ink/40 text-canvas hover:bg-ink/60" : "border-line bg-paper/90 text-ink hover:border-ink"
          }`}
        >
          <ChevronDownIcon className="h-4 w-4 -rotate-90" />
        </button>
      </>
    ) : null;

  return (
    <div className="grid gap-8 md:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] md:gap-12">
      {/* Gallery */}
      <div className="md:sticky md:top-24 md:self-start">
        <div className="relative aspect-square overflow-hidden border border-line bg-canvas md:aspect-[4/5]">
          {e.fotoAtiva ? (
            <>
              <Image
                key={e.fotoAtiva}
                src={e.fotoAtiva}
                alt={e.ativo.nome}
                fill
                priority
                className="object-cover"
                sizes="(min-width: 768px) 55vw, 100vw"
              />
              <button
                type="button"
                onClick={() => setZoom(true)}
                aria-label="Ver a foto ampliada"
                data-rastro={`Ampliar foto: ${modelo.nome}`}
                className="absolute inset-0 cursor-zoom-in"
              />
            </>
          ) : (
            <WeavePattern colorA={e.ativo.corA} colorB={e.ativo.corB} cell={36} band={24} className="h-full w-full" />
          )}
          {setas(false)}
          {variasFotos ? (
            <span className="absolute bottom-3 right-3 bg-paper/90 px-2 py-1 text-xs text-ink">
              {e.varianteIndex + 1} de {e.fotos.length}
            </span>
          ) : null}
        </div>
        {variasFotos ? (
          <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label="Fotos">
            {e.fotos.map((foto, i) => (
              <button
                key={foto}
                type="button"
                onClick={() => e.setVarianteIndex(i)}
                aria-label={`Ver foto ${i + 1}`}
                aria-pressed={e.varianteIndex === i}
                className={`relative h-16 w-16 overflow-hidden border-2 transition-all sm:h-20 sm:w-20 ${
                  e.varianteIndex === i ? "border-ink" : "border-line opacity-70 hover:opacity-100"
                }`}
              >
                <Image src={foto} alt="" fill className="object-cover" sizes="80px" />
              </button>
            ))}
          </div>
        ) : null}
      </div>

      {/* Choices */}
      <div>
        <p className="text-sm text-ink-soft">{categoria}</p>
        <div className="mt-1 flex items-start justify-between gap-4">
          <h1 className="font-serif text-3xl font-medium tracking-tight text-ink md:text-4xl">{modelo.nome}</h1>
          <BotaoFavorito slug={slug} nome={modelo.nome} className="shrink-0" />
        </div>
        <p className="mt-3 max-w-[55ch] leading-relaxed text-ink-soft">{e.ativo.descricao}</p>

        {e.temPreco ? (
          <div className="mt-6 border-y border-line py-5">
            <p className="text-3xl font-medium text-ink">{formatBRL(e.preco)}</p>
            <p className="mt-1 text-sm text-ink">
              <strong className="font-semibold">{formatBRL(precoPix(e.preco))} no Pix</strong>
              <span className="text-ink-soft"> ou até {PARCELAS_MAX}x no cartão</span>
            </p>
            {!e.wantsNome && e.podePersonalizar ? (
              <p className="mt-1 text-xs text-ink-soft">Com o seu nome trançado: {formatBRL(PRECO_CADEIRA_COM_NOME)}</p>
            ) : null}
          </div>
        ) : null}

        {e.podePersonalizar ? (
          <div className="mt-6">
            <p className="text-sm font-medium text-ink">Personalização</p>
            <div className="mt-2 inline-flex border border-line text-sm" role="group" aria-label="Personalização">
              <button
                type="button"
                onClick={() => e.escolherNome(false)}
                aria-pressed={!e.wantsNome}
                className={`px-4 py-2 transition-colors ${!e.wantsNome ? "bg-ink text-canvas" : "text-ink-soft hover:text-ink"}`}
              >
                Sem nome
              </button>
              <button
                type="button"
                onClick={() => e.escolherNome(true)}
                aria-pressed={e.wantsNome}
                className={`border-l border-line px-4 py-2 transition-colors ${e.wantsNome ? "bg-ink text-canvas" : "text-ink-soft hover:text-ink"}`}
              >
                Personalizado
              </button>
            </div>
            {e.wantsNome ? (
              <label className="mt-3 block max-w-sm">
                <span className="text-sm text-ink-soft">Nome ou apelido para trançar</span>
                <input
                  type="text"
                  value={e.nomeTexto}
                  onChange={(ev) => e.setNomeTexto(ev.target.value)}
                  placeholder="Ex: João"
                  maxLength={24}
                  autoFocus
                  className="mt-1 w-full border border-line bg-paper px-3 py-2 text-ink focus:border-ink focus:outline-none"
                />
              </label>
            ) : null}
          </div>
        ) : null}

        <div className="mt-6 grid max-w-sm gap-2">
          <button
            type="button"
            disabled={e.faltaNome}
            data-rastro={`Comprar (página): ${e.ativo.nome}`}
            onClick={() => comprarAgora(e.itemDoCarrinho)}
            className="inline-flex items-center justify-center gap-2 border border-ink bg-ink px-4 py-3 font-medium text-canvas transition-all duration-200 hover:bg-transparent hover:text-ink active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-ink disabled:hover:text-canvas"
          >
            Comprar
          </button>
          <AddToCartButton item={e.itemDoCarrinho} disabled={e.faltaNome} contorno />
          {e.faltaNome ? <p className="text-xs text-ink-soft">Escreva o nome para comprar ou adicionar ao carrinho.</p> : null}
          {e.temPreco ? <VagasSemana className="mt-2" /> : null}
        </div>

        {e.temPreco ? (
          <div className="mt-6 max-w-sm border border-line bg-paper p-4">
            <label htmlFor="cep-produto" className="text-sm font-medium text-ink">
              Calcular o frete
            </label>
            <div className="mt-2 flex items-center gap-3">
              <input
                id="cep-produto"
                value={cep}
                onChange={(ev) => {
                  setCep(ev.target.value);
                  guardarCep(ev.target.value);
                }}
                inputMode="numeric"
                autoComplete="postal-code"
                placeholder="Seu CEP"
                maxLength={9}
                className="w-32 border border-line bg-canvas px-3 py-2 text-ink focus:border-ink focus:outline-none"
              />
              <span className="text-sm text-ink">
                {frete.tipo === "ok" && frete.frete.valor > 0 ? formatBRL(frete.frete.valor) : textoFrete(frete)}
              </span>
            </div>
            {frete.tipo === "ok" && frete.frete.prazoDias ? (
              <p className="mt-2 text-xs text-ink-soft">
                Fica pronta em até {PRAZO_PRODUCAO_DIAS_UTEIS} dias úteis e chega em até {frete.frete.prazoDias} dias úteis depois.
              </p>
            ) : (
              <p className="mt-2 text-xs text-ink-soft">Fica pronta em até {PRAZO_PRODUCAO_DIAS_UTEIS} dias úteis. Enviamos para todo o Brasil.</p>
            )}
          </div>
        ) : null}

        <a
          href={whatsappUrl(whatsappNumero, e.mensagemWhatsapp)}
          target="_blank"
          rel="noreferrer"
          className="mt-5 inline-flex items-center gap-2 py-2 text-sm text-ink-soft underline transition-colors hover:text-ink"
        >
          <WhatsAppIcon className="h-4 w-4" />
          Tirar uma dúvida ou pedir pelo WhatsApp
        </a>
      </div>

      {zoom && e.fotoAtiva ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`Foto ampliada de ${e.ativo.nome}`}
          className="fixed inset-0 z-50 bg-ink/90"
          onClick={() => setZoom(false)}
        >
          <div className="absolute inset-4 sm:inset-10" onClick={(ev) => ev.stopPropagation()}>
            <Image key={e.fotoAtiva} src={e.fotoAtiva} alt={e.ativo.nome} fill className="object-contain" sizes="100vw" />
            {setas(true)}
          </div>
          <button
            type="button"
            onClick={() => setZoom(false)}
            className="absolute right-3 top-[calc(env(safe-area-inset-top,0px)+0.75rem)] flex h-10 w-10 items-center justify-center rounded-full border border-canvas/40 text-2xl leading-none text-canvas"
            aria-label="Fechar"
          >
            ×
          </button>
        </div>
      ) : null}
    </div>
  );
}
