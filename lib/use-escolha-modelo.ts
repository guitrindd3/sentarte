"use client";

import { useState } from "react";
import { CATEGORIA_COM_PRECO, formatBRL, precoCadeira } from "./offer";
import { grupoDoModelo } from "./grupos";
import type { Modelo } from "./content-schema";
import type { CartItem } from "./cart-context";

/**
 * The customer's choices on one chair (photo/color, with or without a woven
 * name) and everything derived from them: price, cart item, WhatsApp text.
 * Shared by the catalog card (ModeloCard) and the product page (/cadeira/…).
 */
export function useEscolhaModelo({
  modelo,
  personalizado,
  categoria,
  categoriaSlug,
}: {
  modelo: Modelo;
  personalizado?: Modelo;
  categoria: string;
  categoriaSlug: string;
}) {
  const [wantsNome, setWantsNome] = useState(false);
  const [varianteIndex, setVarianteIndex] = useState(0);
  const [nomeTexto, setNomeTexto] = useState("");
  // wooden armrests (user 2026-10-21), on every chair with a price
  const [madeira, setMadeira] = useState(false);

  const ativo = wantsNome && personalizado ? personalizado : modelo;
  // Color options (a real choice, sent with the order) come first, then
  // extra photos that are just for looking (angles, other customers' names).
  const cores = [modelo.imagemUrl, ...(modelo.variantes ?? [])].filter((f): f is string => Boolean(f));
  const usaFotosPersonalizado = wantsNome && Boolean(personalizado);
  const fotos = usaFotosPersonalizado && personalizado
    ? [personalizado.imagemUrl, ...(personalizado.fotosExtras ?? [])].filter((f): f is string => Boolean(f))
    : [...cores, ...(modelo.fotosExtras ?? [])];
  const fotoAtiva = fotos[varianteIndex] ?? fotos[0];
  const nomeFinal = wantsNome ? nomeTexto.trim() : "";
  // Without a dedicated personalizado photo the customer still picks a color
  // for the chair the name goes on.
  const escolheCor = !usaFotosPersonalizado && cores.length > 1;
  const varianteLabel = escolheCor && varianteIndex < cores.length ? `Opção ${varianteIndex + 1}` : "";
  const contagemFotos = escolheCor && fotos.length === cores.length ? `${cores.length} cores` : `${fotos.length} fotos`;
  const mudarVariante = (passo: number) => setVarianteIndex((i) => (i + passo + fotos.length) % fotos.length);

  const temPreco = categoriaSlug === CATEGORIA_COM_PRECO;
  // Every chair can take a woven name (user 2026-09-29), not only the ones
  // with a "<Nome> personalizado" photo.
  // Desenho/anime chairs are already a personalized design: fixed
  // personalized price, and no name on top (user 2026-09-29).
  const ehDesenho = grupoDoModelo(modelo) === "desenhos";
  const podePersonalizar = !ehDesenho && (temPreco || Boolean(personalizado));
  const preco = precoCadeira(wantsNome || ehDesenho, "normal", madeira);
  const faltaNome = wantsNome && !nomeFinal;
  const mensagemWhatsapp = `Oi! Quero pedir uma peça de ${categoria}, modelo "${ativo.nome}"${
    temPreco ? ` (${formatBRL(preco)})` : ""
  }.${varianteLabel ? ` Cor: ${varianteLabel}.` : ""}${madeira ? " Com braço de madeira." : ""}${nomeFinal ? ` Nome/apelido para trançar: "${nomeFinal}".` : ""}`;

  const itemDoCarrinho: Omit<CartItem, "quantidade"> = {
    id: `${categoriaSlug}:${ativo.id}${nomeFinal ? `:${nomeFinal}` : ""}${varianteLabel ? `:${varianteLabel}` : ""}${madeira ? ":madeira" : ""}`,
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
    bracoMadeira: madeira || undefined,
  };

  return {
    ativo,
    fotos,
    fotoAtiva,
    varianteIndex,
    setVarianteIndex,
    mudarVariante,
    contagemFotos,
    wantsNome,
    /** Switches between "Sem nome" and "Personalizado" (back to the first photo). */
    escolherNome: (sim: boolean) => {
      setWantsNome(sim);
      setVarianteIndex(0);
    },
    nomeTexto,
    setNomeTexto,
    temPreco,
    ehDesenho,
    podePersonalizar,
    preco,
    faltaNome,
    mensagemWhatsapp,
    itemDoCarrinho,
    madeira,
    setMadeira,
  };
}
