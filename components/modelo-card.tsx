import { WeavePattern } from "@/components/weave-pattern";
import { WhatsAppIcon } from "@/components/icons";
import { whatsappUrl } from "@/lib/site";
import type { Modelo } from "@/lib/categories";

export function ModeloCard({ modelo, categoria }: { modelo: Modelo; categoria: string }) {
  return (
    <div className="group flex flex-col border border-line bg-paper transition-all duration-300 hover:-translate-y-1 hover:border-rattan hover:shadow-[6px_6px_0_0_var(--rattan)]">
      <div className="relative aspect-[5/3] overflow-hidden border-b border-line">
        <WeavePattern
          colorA={modelo.cores[0]}
          colorB={modelo.cores[1]}
          cell={30}
          band={20}
          className="h-full w-full"
        />
      </div>
      <div className="flex flex-1 flex-col p-5">
        <p className="font-serif text-lg text-ink">{modelo.nome}</p>
        <p className="mt-2 flex-1 text-sm leading-relaxed text-ink-soft">{modelo.descricao}</p>
        <a
          href={whatsappUrl(`Oi! Quero pedir um orçamento de ${categoria} — modelo "${modelo.nome}".`)}
          target="_blank"
          rel="noreferrer"
          className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-marine hover:underline"
        >
          <WhatsAppIcon className="h-4 w-4" />
          Pedir orçamento
        </a>
      </div>
    </div>
  );
}
