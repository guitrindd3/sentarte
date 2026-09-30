import { BOHO_NOME } from "./boho-model";
import { DESENHO_NOME } from "./desenho-model";
import { TIME_DO_CORACAO_NOME } from "./team-models";

/** The "cover" models that stand for a whole collection page (not a product
 * you can put in the cart), by exact name, and where they lead. */
export const CAPAS: Record<string, { href: string; linkLabel: string }> = {
  [TIME_DO_CORACAO_NOME]: { href: "/times", linkLabel: "Ver todos os times" },
  [BOHO_NOME]: { href: "/boho", linkLabel: "Ver todas as estampas" },
  [DESENHO_NOME]: { href: "/desenhos", linkLabel: "Ver todos os desenhos" },
  "Monte a sua trama": { href: "/personalizar", linkLabel: "Montar minha trama" },
};
