import { lerCartoes } from "@/lib/cartoes";
import { modelosProntos } from "@/lib/cartoes-modelo";
import { getAdminContent } from "@/lib/content-store";
import { redisAtivo } from "@/lib/redis";
import { EditorCartoes } from "./editor";

// Printable cards (lib/cartoes-modelo.ts): ready models with the atelier's
// contact filled in + the ones the atelier saved.

export default async function Cartoes() {
  const [content, salvos] = await Promise.all([getAdminContent(), redisAtivo() ? lerCartoes().catch(() => []) : Promise.resolve([])]);
  const prontos = modelosProntos({ whatsapp: content.site.whatsappNumero, instagram: content.site.instagramHandle, site: "sentarte.com.br" });
  return <EditorCartoes prontos={prontos} salvosIniciais={salvos} />;
}
