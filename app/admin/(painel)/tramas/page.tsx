import Link from "next/link";
import { getAdminContent } from "@/lib/content-store";
import { normalizarTramas } from "@/lib/tramas-painel";
import { GerenciarTramas } from "./gerenciar";

// "Traçados" (2026-11-16): every shape of Monte a sua trama, to take out the
// ones the admin doesn't like, bring back hidden ones and draw new ones.
// Saved in SiteContent.tramas (lib/tramas-painel.ts) in one commit.

export default async function Tramas() {
  const content = await getAdminContent();
  const tramas = normalizarTramas(content.tramas);
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-medium tracking-tight text-ink sm:text-4xl">Traçados</h1>
          <p className="mt-1.5 max-w-prose text-sm text-ink-soft sm:text-base">
            Todos os desenhos que o cliente escolhe no Monte a sua trama. Tire do site os que você não gostou, ponha de volta os que estão
            escondidos ou desenhe um traçado novo. Nada é apagado de verdade: um link antigo continua mostrando a cadeira certinha.
          </p>
        </div>
        <Link
          href="/personalizar"
          target="_blank"
          className="inline-flex items-center gap-1.5 rounded-full border border-line bg-paper px-4 py-2.5 text-sm font-medium text-ink hover:border-wood"
        >
          Ver o Monte a sua trama
        </Link>
      </div>
      <GerenciarTramas inicial={tramas} />
    </div>
  );
}
