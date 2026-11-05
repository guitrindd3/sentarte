"use client";

import { useSyncExternalStore } from "react";
import { diaCurto, previsaoEntrega } from "@/lib/prazo-entrega";
import { useVagas } from "./vagas-semana";

// "Pedindo hoje, chega até dia X" (see lib/prazo-entrega.ts). Client-only:
// pages are cached for minutes, so "today" must be the visitor's today.
const semAssinatura = () => () => {};

export function PrevisaoEntrega({
  prazoFrete,
  semFrete = false,
  cadeiras = 1,
  pedirCep = true,
  className = "",
}: {
  /** No CEP typed yet: invite to type it (false = CEP typed but no online quote). */
  pedirCep?: boolean;
  /** Carrier business days from the quote (undefined = no CEP yet). */
  prazoFrete?: number;
  /** Nothing ships (vale-presente only). */
  semFrete?: boolean;
  cadeiras?: number;
  className?: string;
}) {
  const noNavegador = useSyncExternalStore(semAssinatura, () => true, () => false);
  const vagas = useVagas();
  if (!noNavegador || semFrete || !vagas) return null;
  const semVaga = vagas.ligado && (vagas.restantes ?? 0) < cadeiras;
  const { pronta, chega } = previsaoEntrega({ prazoFrete, semVaga });
  return (
    <p className={`flex items-start gap-2 text-sm text-ink ${className}`}>
      <svg viewBox="0 0 24 24" className="mt-0.5 h-4 w-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
        <path d="M3 7h11v9H3zM14 10h4l3 3v3h-7z" strokeLinejoin="round" />
        <circle cx="7" cy="17.5" r="1.6" fill="currentColor" stroke="none" />
        <circle cx="17.5" cy="17.5" r="1.6" fill="currentColor" stroke="none" />
      </svg>
      {chega !== undefined ? (
        <span>
          Pedindo hoje, chega até <strong className="font-semibold">{diaCurto(chega)}</strong>.
        </span>
      ) : (
        <span>
          Pedindo hoje, fica pronta até <strong className="font-semibold">{diaCurto(pronta)}</strong>.{pedirCep ? " Coloque o CEP para ver quando chega." : ""}
        </span>
      )}
    </p>
  );
}
