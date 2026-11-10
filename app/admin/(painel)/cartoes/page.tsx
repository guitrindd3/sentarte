import { lerCartoes } from "@/lib/cartoes";
import { modelosProntos } from "@/lib/cartoes-modelo";
import { getAdminContent } from "@/lib/content-store";
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
  const passaportes: Passaporte[] = recentes.map((p) => ({
    n: p.n,
    numero: numeroBonito(p.n),
    link: linkDoPassaporte(p.n),
    colecao: p.colecao ? `${p.colecao.nome} · ${String(p.colecao.numero).padStart(2, "0")}/${p.colecao.total}` : undefined,
    rotulo: `${p.modelo}${p.nome ? ` · “${p.nome}”` : ""}`,
    dia: dia(p.criadoEm),
  }));
  return <EditorCartoes prontos={prontos} salvosIniciais={salvos} passaportes={passaportes} />;
}
