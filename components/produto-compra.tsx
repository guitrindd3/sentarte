"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { AddToCartButton } from "@/components/add-to-cart-button";
import { BotaoFavorito } from "@/components/botao-favorito";
import { CompartilharCadeira } from "@/components/compartilhar-cadeira";
import { PreviaNome } from "@/components/previa-nome";
import { OpcaoBraco } from "@/components/opcao-braco";
import { VagasSemana } from "@/components/vagas-semana";
import { PrevisaoEntrega } from "@/components/previsao-entrega";
import { WeavePattern } from "@/components/weave-pattern";
import { ChevronDownIcon, WhatsAppIcon } from "@/components/icons";
import { formatBRL, PARCELAS_MAX, precoCadeira, rotulosInclui, precoPix, PRAZO_PRODUCAO_DIAS_UTEIS } from "@/lib/offer";
import { EscolhaTamanho, EscolhaTassel, Passo, ResumoCadeira } from "@/components/escolhas-cadeira";
import { useCart } from "@/lib/cart-context";
import { useEscolhaModelo } from "@/lib/use-escolha-modelo";
import { cepGuardado, guardarCep, textoFrete, useFrete } from "@/lib/use-frete";
import { whatsappUrl } from "@/lib/urls";
import { precoBlackFriday, useBlackFriday } from "@/lib/use-black-friday";
import { LogoBlackFriday } from "@/components/logo-black-friday";
import { LacoNatal, PrecoNatal } from "@/components/natal";
import { FitaAnoNovo } from "@/components/ano-novo";
import { SeloBlackFriday } from "@/components/selo-black-friday";
import { PortaoColecao, SeloColecao } from "@/components/colecao-compra";
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
  const bf = useBlackFriday();
  const precoBf = precoBlackFriday(e.preco, bf);
  const { comprarAgora } = useCart();
  const [zoom, setZoom] = useState(false);
  // "vem com nome" chairs: buying without the name jumps to the field (2026-11-05 —
  // greyed-out buttons made the user think "Sol e Lua" couldn't be bought)
  const nomeRef = useRef<HTMLInputElement>(null);
  const [avisoNome, setAvisoNome] = useState(false);
  const pedirNome = () => {
    setAvisoNome(true);
    nomeRef.current?.focus();
    nomeRef.current?.scrollIntoView({ block: "center", behavior: "smooth" });
  };
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

  let passo = 0;
  const botoesCompra = (
    <>
      <button
        type="button"
        data-rastro={`Comprar (página): ${e.ativo.nome}`}
        onClick={() => (e.faltaNome ? pedirNome() : comprarAgora(e.itemDoCarrinho))}
        className="inline-flex items-center justify-center gap-2 border border-ink bg-ink px-4 py-3.5 font-medium text-canvas transition-all duration-200 hover:bg-transparent hover:text-ink active:scale-[0.97]"
      >
        Comprar
      </button>
      <AddToCartButton item={e.itemDoCarrinho} semNome={e.faltaNome ? pedirNome : undefined} contorno />
      {e.faltaNome ? (
        <p className={`text-xs ${avisoNome ? "font-medium text-red-700" : "text-ink-soft"}`}>Escreva o nome que vai trançado na cadeira para comprar.</p>
      ) : null}
    </>
  );
  const tasseisAgora = e.itemDoCarrinho.tassel ? (e.itemDoCarrinho.tasselQtd === 1 ? 1 : 2) : 0;

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
              <Image key={e.fotoAtiva} src={e.fotoAtiva} alt={e.ativo.nome} fill priority className="object-cover" sizes="(min-width: 768px) 55vw, 100vw" />
              {bf && e.temPreco ? <LogoBlackFriday className="z-10 w-[34%]" /> : null}
              {e.temPreco && !bf ? <LacoNatal /> : null}
              {e.temPreco && !bf ? <FitaAnoNovo /> : null}
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
                <Image src={foto} alt="" width={80} height={80} className="h-full w-full object-cover" />
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
          <div className="flex shrink-0 gap-2">
            {e.fotoAtiva ? (
              <CompartilharCadeira
                slug={slug}
                foto={e.fotoAtiva}
                nome={e.ativo.nome}
                preco={precoBf ?? e.preco}
                precoAntes={precoBf ? e.preco : undefined}
                blackFriday={bf ? { percentual: bf.cupom.valor, fimMs: bf.fimMs } : null}
              />
            ) : null}
            <BotaoFavorito slug={slug} nome={modelo.nome} />
          </div>
        </div>
        <SeloColecao nome={modelo.nome} className="mt-3" />
        <p className="mt-3 max-w-[55ch] leading-relaxed text-ink-soft">{e.ativo.descricao}</p>

        {e.temPreco ? (
          <div className="mt-5">
            {bf ? <SeloBlackFriday cupom={bf.cupom} className="mb-2" /> : null}
            <p className="text-3xl font-medium text-ink">
              {precoBf ? <s className="mr-2 text-xl text-ink-soft">{formatBRL(e.preco)}</s> : null}
              {formatBRL(precoBf ?? e.preco)}
            </p>
            <p className="mt-1 text-sm text-ink">
              <strong className="font-semibold">{formatBRL(precoPix(precoBf ?? e.preco))} no Pix</strong>
              <span className="text-ink-soft"> ou até {PARCELAS_MAX}x no cartão</span>
            </p>
            {precoBf ? null : <PrecoNatal preco={e.preco} className="mt-1 text-sm" />}
            {rotulosInclui(e.inclui).length ? (
              <p className="mt-2 text-sm text-ink">
                <span className="text-ink-soft">Já vem com: </span>
                {rotulosInclui(e.inclui).join(", ")}
              </p>
            ) : null}
          </div>
        ) : null}

        {/* Step-by-step choices (2026-11-14): size, name, arms, tassel, then the summary. */}
        <div className="mt-6 space-y-5">
          {e.temPreco ? (
            <Passo n={++passo} titulo="Escolha o tamanho" extra="preço já com as suas escolhas">
              <EscolhaTamanho e={e} />
            </Passo>
          ) : null}

          {e.podePersonalizar ? (
            <Passo n={++passo} titulo={e.nomeIncluso ? "Nome trançado (vem com ela)" : "Nome trançado"}>
              {e.nomeIncluso ? null : (
                <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Nome trançado">
                  {[false, true].map((sim) => {
                    const on = e.wantsNome === sim;
                    return (
                      <button
                        key={String(sim)}
                        type="button"
                        role="radio"
                        aria-checked={on}
                        onClick={() => e.escolherNome(sim)}
                        className={`border px-3 py-2.5 text-left text-sm transition-colors ${on ? "border-ink bg-ink text-canvas" : "border-line text-ink hover:border-ink"}`}
                      >
                        <span className="block font-medium">{sim ? "Com o seu nome" : "Sem nome"}</span>
                        <span className={`block text-xs ${on ? "text-canvas/75" : "text-ink-soft"}`}>
                          {sim
                            ? `+${formatBRL(precoCadeira(true, e.tipo, e.madeira, tasseisAgora) - precoCadeira(false, e.tipo, e.madeira, tasseisAgora))}`
                            : "Igual à foto"}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
              {e.wantsNome ? (
                <label className="mt-3 block">
                  <span className="text-sm text-ink-soft">Nome ou apelido para trançar</span>
                  <input
                    type="text"
                    value={e.nomeTexto}
                    onChange={(ev) => e.setNomeTexto(ev.target.value)}
                    placeholder="Ex: João"
                    maxLength={24}
                    ref={nomeRef}
                    aria-invalid={avisoNome && e.faltaNome ? true : undefined}
                    className="mt-1 w-full border border-line bg-paper px-3 py-2.5 text-ink focus:border-ink focus:outline-none"
                  />
                </label>
              ) : null}
              {e.wantsNome ? <PreviaNome nome={e.nomeTexto} corA={e.ativo.corA} corB={e.ativo.corB} trama={modelo.trama} /> : null}
            </Passo>
          ) : null}

          {e.temPreco ? (
            <Passo n={++passo} titulo="Braço da cadeira">
              {e.madeiraInclusa ? (
                <p className="text-sm text-ink">Esta cadeira já vem com braço de madeira.</p>
              ) : (
                <OpcaoBraco madeira={e.madeira} onChange={e.setMadeira} tipo={e.tipo} semTitulo />
              )}
            </Passo>
          ) : null}

          {e.temPreco ? (
            <Passo n={++passo} titulo="Tassel nas laterais">
              {e.tasselIncluso ? (
                <p className="text-sm text-ink">Esta cadeira já vem com {rotulosInclui(e.inclui).find((r) => r.includes("tassel"))}.</p>
              ) : (
                <EscolhaTassel e={e} corA={e.ativo.corA} corB={e.ativo.corB} />
              )}
            </Passo>
          ) : null}
        </div>

        <div className="mt-6">
          <PortaoColecao nome={modelo.nome}>
            {e.temPreco ? (
              <ResumoCadeira e={e}>{botoesCompra}</ResumoCadeira>
            ) : (
              <div className="grid max-w-sm gap-2">{botoesCompra}</div>
            )}
          </PortaoColecao>
          {e.temPreco ? <VagasSemana className="mt-3" /> : null}
        </div>

        {e.temPreco ? (
          <div className="mt-4 border border-line bg-paper p-4">
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
              <span className="text-sm text-ink">{frete.tipo === "ok" && frete.frete.valor > 0 ? formatBRL(frete.frete.valor) : textoFrete(frete)}</span>
            </div>
            {frete.tipo === "ok" && frete.frete.prazoDias ? (
              <p className="mt-2 text-xs text-ink-soft">
                Fica pronta em até {PRAZO_PRODUCAO_DIAS_UTEIS} dias úteis e chega em até {frete.frete.prazoDias} dias úteis depois.
              </p>
            ) : (
              <p className="mt-2 text-xs text-ink-soft">Fica pronta em até {PRAZO_PRODUCAO_DIAS_UTEIS} dias úteis. Enviamos para todo o Brasil.</p>
            )}
            <PrevisaoEntrega className="mt-2" prazoFrete={frete.tipo === "ok" ? frete.frete.prazoDias : undefined} pedirCep={frete.tipo === "sem-cep"} />
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
