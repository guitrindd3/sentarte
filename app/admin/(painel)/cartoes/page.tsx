import { lerCartoes } from "@/lib/cartoes";
import { modelosProntos } from "@/lib/cartoes-modelo";
import { lerPedido } from "@/lib/clientes";
import { getAdminContent } from "@/lib/content-store";
import { TIPOS_CADEIRA } from "@/lib/offer";
import { codigoDoPedido } from "@/lib/pedido";
import { linkDoPassaporte, numeroBonito, passaportesRecentes } from "@/lib/passaporte";
import { redisAtivo } from "@/lib/redis";
import { EditorCartoes } from "./editor";
import type { Passaporte } from "./folha";

// Printable cards (lib/cartoes-modelo.ts): ready models with the atelier's
// contact filled in + the ones the atelier saved + the chairs' passports
// (their QR tags can go on the same sheet).

const dia = (t: number) =>
  new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", year: "2-digit", timeZone: "America/Sao_Paulo" }).format(new Date(t));

export default async function Cartoes() {
  const [content, salvos, recentes] = await Promise.all([
    getAdminContent(),
    redisAtivo() ? lerCartoes().catch(() => []) : Promise.resolve([]),
    redisAtivo() ? passaportesRecentes(40).catch(() => []) : Promise.resolve([]),
  ]);
  const prontos = modelosProntos({ whatsapp: content.site.whatsappNumero, instagram: content.site.instagramHandle, site: "sentarte.com.br" });
  // who bought each chair, so the atelier knows which tag goes on which chair
  const refs = [...new Set(recentes.map((p) => p.ref).filter(Boolean))];
  const pedidos = new Map(await Promise.all(refs.map(async (r) => [r, await lerPedido(r).catch(() => null)] as const)));
  const passaportes: Passaporte[] = recentes.map((p) => {
    const pedido = pedidos.get(p.ref);
    return {
      n: p.n,
      numero: numeroBonito(p.n),
      link: linkDoPassaporte(p.n),
      colecao: p.colecao ? `${p.colecao.nome} · ${String(p.colecao.numero).padStart(2, "0")}/${p.colecao.total}` : undefined,
      rotulo: `${p.modelo}${p.nome ? ` · “${p.nome}”` : ""}`,
      dia: dia(p.criadoEm),
      modelo: p.modelo,
      nomeTrancado: p.nome,
      tipo: TIPOS_CADEIRA[p.tipo]?.curto,
      imagem: p.imagem && p.imagem.startsWith("/") ? p.imagem : undefined,
      cores: [p.corA, p.corB].filter((x): x is string => !!x && /^#[0-9a-f]{3,8}$/i.test(x)),
      cliente: pedido ? [pedido.nome.trim().split(/\s+/)[0], pedido.cidade].filter(Boolean).join(" · ") : undefined,
      pedido: p.ref ? codigoDoPedido(p.ref) : undefined,
    };
  });
  return <EditorCartoes prontos={prontos} salvosIniciais={salvos} passaportes={passaportes} />;
}
