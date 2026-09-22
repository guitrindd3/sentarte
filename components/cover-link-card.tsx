import Image from "next/image";
import Link from "next/link";
import { WeavePattern } from "@/components/weave-pattern";
import type { Modelo } from "@/lib/content-schema";

export function CoverLinkCard({
  modelo,
  href,
  linkLabel,
}: {
  modelo: Modelo;
  href: string;
  linkLabel: string;
}) {
  return (
    <Link
      href={href}
      className="group flex flex-col border border-line bg-paper transition-all duration-300 hover:-translate-y-1 hover:border-ink hover:shadow-[6px_6px_0_0_var(--line)] active:translate-y-0 active:shadow-[2px_2px_0_0_var(--line)] active:duration-75"
    >
      <div className="relative aspect-square overflow-hidden border-b border-line">
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
        <span className="mt-4 inline-block w-fit border-b border-current text-sm font-medium text-ink">
          {linkLabel}
        </span>
      </div>
    </Link>
  );
}
