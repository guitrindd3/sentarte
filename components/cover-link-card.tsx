import Image from "next/image";
import Link from "next/link";
import { WeavePattern, type WeaveShape } from "@/components/weave-pattern";
import type { Modelo } from "@/lib/content-schema";

export const VIDEO_MONTE_SUA_CADEIRA = "/videos/monte-sua-cadeira.mp4";
// First frame of the clip, shown while it loads (it was a black box before, 2026-10-06).
export const POSTER_MONTE_SUA_CADEIRA = "/videos/monte-sua-cadeira.jpg";

export function CoverLinkCard({
  modelo,
  href,
  linkLabel,
  shape,
  videoUrl,
  compacto = false,
}: {
  modelo: Modelo;
  href: string;
  linkLabel: string;
  shape?: WeaveShape;
  /** Looping muted clip shown instead of the photo/pattern (e.g. "Monte a sua trama"). */
  videoUrl?: string;
  /** Two-per-row phone layout: smaller padding, no description on phones. */
  compacto?: boolean;
}) {
  return (
    <Link
      href={href}
      className="group flex flex-col border border-line bg-paper transition-all duration-300 hover:-translate-y-1 hover:border-ink hover:shadow-[6px_6px_0_0_var(--line)] active:translate-y-0 active:shadow-[2px_2px_0_0_var(--line)] active:duration-75"
    >
      <div className="relative aspect-square overflow-hidden border-b border-line">
        {videoUrl ? (
          <video
            src={videoUrl}
            poster={POSTER_MONTE_SUA_CADEIRA}
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
            aria-hidden="true"
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : modelo.imagemUrl ? (
          <Image
            src={modelo.imagemUrl}
            alt={modelo.nome}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105 group-active:scale-100"
            sizes="(min-width: 1024px) 360px, (min-width: 640px) 45vw, 100vw"
          />
        ) : (
          <WeavePattern
            colorA={modelo.corA}
            colorB={modelo.corB}
            cell={30}
            band={20}
            shape={shape}
            className="h-full w-full"
          />
        )}
      </div>
      <div className={`flex flex-1 flex-col ${compacto ? "p-3 sm:p-5" : "p-5"}`}>
        <p className={`font-serif font-medium text-ink ${compacto ? "text-base leading-tight sm:text-lg" : "text-lg"}`}>
          {modelo.nome}
        </p>
        <p
          className={`mt-2 flex-1 text-sm leading-relaxed text-ink-soft ${compacto ? "hidden sm:block" : ""}`}
        >
          {modelo.descricao}
        </p>
        <span
          className={`inline-block w-fit border-b border-current font-medium text-ink ${
            compacto ? "mt-2 text-xs sm:mt-4 sm:text-sm" : "mt-4 text-sm"
          }`}
        >
          {linkLabel}
        </span>
      </div>
    </Link>
  );
}
