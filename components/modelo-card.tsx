import Image from "next/image";
import { WeavePattern } from "@/components/weave-pattern";
import { WhatsAppIcon } from "@/components/icons";
import { whatsappUrl } from "@/lib/urls";
import type { Modelo } from "@/lib/content-schema";

export function ModeloCard({
  modelo,
  categoria,
  whatsappNumero,
}: {
  modelo: Modelo;
  categoria: string;
  whatsappNumero: string;
}) {
  return (
    <a
      href={whatsappUrl(
        whatsappNumero,
        `Oi! Quero pedir um orçamento de ${categoria} — modelo "${modelo.nome}".`
      )}
      target="_blank"
      rel="noreferrer"
      className="group flex flex-col border border-line bg-paper transition-all duration-300 hover:-translate-y-1 hover:border-rattan hover:shadow-[6px_6px_0_0_var(--rattan)] active:translate-y-0 active:shadow-[2px_2px_0_0_var(--rattan)] active:duration-75"
    >
      <div className="relative aspect-[5/3] overflow-hidden border-b border-line">
        {modelo.imagemUrl ? (
          <Image
            src={modelo.imagemUrl}
            alt={modelo.nome}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105 group-active:scale-100"
            sizes="(min-width: 1024px) 360px, (min-width: 640px) 45vw, 100vw"
          />
        ) : (
          <WeavePattern colorA={modelo.corA} colorB={modelo.corB} cell={30} band={20} className="h-full w-full" />
        )}
      </div>
      <div className="flex flex-1 flex-col p-5">
        <p className="font-serif text-lg font-medium text-ink">{modelo.nome}</p>
        <p className="mt-2 flex-1 text-sm leading-relaxed text-ink-soft">{modelo.descricao}</p>
        <span className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-wood transition-colors group-hover:underline">
          <WhatsAppIcon className="h-4 w-4" />
          Pedir orçamento
        </span>
      </div>
    </a>
  );
}
