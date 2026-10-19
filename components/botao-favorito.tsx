"use client";

import { CoracaoIcon } from "@/components/icons";
import { useFavoritos } from "@/lib/favoritos";
import { rastrear } from "@/lib/rastro";

/** Heart that saves/removes a chair from the visitor's favorites (/favoritos). */
export function BotaoFavorito({ slug, nome, className = "" }: { slug: string; nome: string; className?: string }) {
  const { ehFavorito, alternar } = useFavoritos();
  const salvo = ehFavorito(slug);
  return (
    <button
      type="button"
      onClick={() => {
        if (!salvo) rastrear({ t: "c", l: `Favoritou: ${nome}` });
        alternar(slug);
      }}
      aria-pressed={salvo}
      aria-label={salvo ? `Tirar ${nome} dos favoritos` : `Guardar ${nome} nos favoritos`}
      title={salvo ? "Tirar dos favoritos" : "Guardar nos favoritos"}
      className={`flex h-10 w-10 items-center justify-center rounded-full border border-line bg-paper/90 text-ink backdrop-blur transition-colors hover:border-ink ${className}`}
    >
      <CoracaoIcon cheio={salvo} className="h-5 w-5" />
    </button>
  );
}
