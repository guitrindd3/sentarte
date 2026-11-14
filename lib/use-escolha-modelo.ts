"use client";

import { useState } from "react";
import { CATEGORIA_COM_PRECO, formatBRL, precoCadeira, rotuloTassel, TIPOS_CADEIRA, type TipoCadeira } from "./offer";
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
  // What the chair in the photo comes with (admin, 2026-11-03): always in the price.
  const inclui = categoriaSlug === CATEGORIA_COM_PRECO ? modelo.inclui : undefined;
  const nomeIncluso = Boolean(inclui?.nome);
  const madeiraInclusa = Boolean(inclui?.bracoMadeira);
  const tasseis = inclui?.tasseis ?? 0;
  const [wantsNomeEscolha, setWantsNome] = useState(nomeIncluso);
  const wantsNome = wantsNomeEscolha || nomeIncluso;
  const [varianteIndex, setVarianteIndex] = useState(0);
  const [nomeTexto, setNomeTexto] = useState("");
  // wooden armrests (user 2026-10-21), on every chair with a price
  const [madeiraEscolha, setMadeiraEscolha] = useState(false);
  const madeira = madeiraEscolha || madeiraInclusa;
  const setMadeira = (m: boolean) => setMadeiraEscolha(m);
  // Chair size + tassels on every catalog chair (user 2026-11-14: "infantil, normal ou 8 posições… tassel, braço de madeira").
  const [tipo, setTipo] = useState<TipoCadeira>("normal");
  const [tasselQtd, setTasselQtd] = useState<0 | 1 | 2>(0);
  const [tasselLado, setTasselLado] = useState<"esq" | "dir">("dir");
  const [tasselCor, setTasselCor] = useState<"a" | "b">("b");

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
  // tassels the chair comes with (admin) win over the customer's choice
  const tasseisTotal = tasseis || (temPreco ? tasselQtd : 0);
  const preco = precoCadeira(wantsNome || ehDesenho, tipo, madeira, tasseisTotal);
  const precoComNome = precoCadeira(true, tipo, madeira, tasseisTotal);
  /** Price of the same chair in another size, with every other choice kept. */
  const precoNoTipo = (t: TipoCadeira) => precoCadeira(wantsNome || ehDesenho, t, madeira, tasseisTotal);
  const tassel = tasseis
    ? {
        tassel: inclui?.tasselCor?.trim() || "igual ao da foto",
        ...(tasseis === 1 ? { tasselQtd: 1 as const, tasselLado: inclui?.tasselLado === "esq" ? ("esq" as const) : ("dir" as const) } : {}),
      }
    : tasseisTotal
      ? {
          tassel: tasselCor === "a" ? "na cor principal" : "na cor do detalhe",
          ...(tasseisTotal === 1 ? { tasselQtd: 1 as const, tasselLado } : {}),
        }
      : null;
  const tipoNoPedido = temPreco && tipo !== "normal" ? tipo : undefined;
  const faltaNome = wantsNome && !nomeFinal;
  const mensagemWhatsapp = `Oi! Quero pedir uma peça de ${categoria}, modelo "${ativo.nome}"${
    temPreco ? ` (${formatBRL(preco)})` : ""
  }.${tipoNoPedido ? ` Tamanho: ${TIPOS_CADEIRA[tipoNoPedido].rotulo.toLowerCase()}.` : ""}${varianteLabel ? ` Cor: ${varianteLabel}.` : ""}${tassel ? ` Com ${rotuloTassel(tassel)}.` : ""}${madeira ? " Com braço de madeira." : ""}${nomeFinal ? ` Nome/apelido para trançar: "${nomeFinal}".` : ""}`;

  const itemDoCarrinho: Omit<CartItem, "quantidade"> = {
    id: `${categoriaSlug}:${ativo.id}${nomeFinal ? `:${nomeFinal}` : ""}${varianteLabel ? `:${varianteLabel}` : ""}${tipoNoPedido ? `:${tipoNoPedido}` : ""}${madeira ? ":madeira" : ""}${tassel ? `:tassel${tasseisTotal}${tassel.tasselLado ?? ""}${tassel.tassel}` : ""}`,
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
    tipoCadeira: tipoNoPedido,
    ...(tassel ?? {}),
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
      setWantsNome(sim || nomeIncluso);
      setVarianteIndex(0);
    },
    nomeTexto,
    setNomeTexto,
    temPreco,
    ehDesenho,
    podePersonalizar,
    preco,
    precoComNome,
    faltaNome,
    /** what the chair comes with (fixed, already in `preco`) */
    inclui,
    nomeIncluso,
    madeiraInclusa,
    mensagemWhatsapp,
    itemDoCarrinho,
    madeira,
    setMadeira,
    tipo,
    setTipo,
    precoNoTipo,
    /** the chair comes with tassels (admin): no tassel choice */
    tasselIncluso: tasseis > 0,
    tasselQtd,
    setTasselQtd,
    tasselLado,
    setTasselLado,
    tasselCor,
    setTasselCor,
  };
}
