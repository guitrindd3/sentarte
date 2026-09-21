"use client";

import { useState } from "react";
import Image from "next/image";
import { AddToCartButton } from "@/components/add-to-cart-button";
import { WeavePattern } from "@/components/weave-pattern";
import { WhatsAppIcon } from "@/components/icons";
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
  const fotosBase = [modelo.imagemUrl, ...(modelo.variantes ?? [])].filter(
    (f): f is string => Boolean(f)
  );
  const fotoAtiva =
    wantsNome && personalizado ? personalizado.imagemUrl : fotosBase[varianteIndex] ?? fotosBase[0];
  const nomeFinal = wantsNome ? nomeTexto.trim() : "";

  const mensagemWhatsapp = `Oi! Quero pedir um orçamento de ${categoria} — modelo "${ativo.nome}".${
    nomeFinal ? ` Nome/apelido para trançar: "${nomeFinal}".` : ""
  }`;

  return (
    <div className="group flex flex-col border border-line bg-paper transition-all duration-300 hover:-translate-y-1 hover:border-ink hover:shadow-[6px_6px_0_0_var(--line)]">
      <div className="relative aspect-[5/3] overflow-hidden border-b border-line">
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
      </div>
      <div className="flex flex-1 flex-col p-5">
        <p className="font-serif text-lg font-medium text-ink">{modelo.nome}</p>

        {personalizado ? (
          <div className="mt-2 inline-flex w-fit border border-line text-xs" role="group" aria-label="Personalização">
            <button
              type="button"
              onClick={() => setWantsNome(false)}
              aria-pressed={!wantsNome}
              className={`px-3 py-1.5 transition-colors ${
                !wantsNome ? "bg-ink text-canvas" : "text-ink-soft hover:text-ink"
              }`}
            >
              Sem nome
            </button>
            <button
              type="button"
              onClick={() => setWantsNome(true)}
              aria-pressed={wantsNome}
              className={`border-l border-line px-3 py-1.5 transition-colors ${
                wantsNome ? "bg-ink text-canvas" : "text-ink-soft hover:text-ink"
              }`}
            >
              Personalizado
            </button>
          </div>
        ) : null}

        {!wantsNome && fotosBase.length > 1 ? (
          <div className="mt-2 flex items-center gap-1.5" role="group" aria-label="Variação de cor">
            {fotosBase.map((foto, i) => (
              <button
                key={foto}
                type="button"
                onClick={() => setVarianteIndex(i)}
                aria-label={`Ver variação de cor ${i + 1}`}
                aria-pressed={varianteIndex === i}
                className={`relative h-9 w-9 overflow-hidden border transition-colors ${
                  varianteIndex === i ? "border-ink" : "border-line hover:border-ink"
                }`}
              >
                <Image src={foto} alt="" fill className="object-cover" sizes="36px" />
              </button>
            ))}
          </div>
        ) : null}

        {wantsNome && personalizado ? (
          <label className="mt-2 block">
            <span className="text-xs text-ink-soft">Nome ou apelido para trançar</span>
            <input
              type="text"
              value={nomeTexto}
              onChange={(e) => setNomeTexto(e.target.value)}
              placeholder="Ex: João"
              className="mt-1 w-full border border-line bg-canvas px-2.5 py-1.5 text-sm text-ink focus:border-ink focus:outline-none"
            />
          </label>
        ) : null}

        <p className="mt-2 flex-1 text-sm leading-relaxed text-ink-soft">{ativo.descricao}</p>
        <AddToCartButton
          item={{
            id: `${categoriaSlug}:${ativo.id}${nomeFinal ? `:${nomeFinal}` : ""}`,
            categoriaSlug,
            categoriaTitulo: categoria,
            modeloId: ativo.id,
            modeloNome: ativo.nome,
            imagemUrl: fotoAtiva,
            corA: ativo.corA,
            corB: ativo.corB,
            nomePersonalizado: nomeFinal || undefined,
          }}
        />
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
