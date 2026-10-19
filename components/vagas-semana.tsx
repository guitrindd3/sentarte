"use client";

import { useEffect, useState } from "react";

// "Restam N vagas de produção nesta semana" (see lib/vagas.ts). Fetched once
// per page load and shared by every place that shows it.
type Estado = { ligado: boolean; restantes?: number };
let pedido: Promise<Estado> | null = null;
const buscar = () =>
  (pedido ??= fetch("/api/vagas")
    .then((r) => r.json() as Promise<Estado>)
    .catch(() => ({ ligado: false })));

export function VagasSemana({ className = "" }: { className?: string }) {
  const [v, setV] = useState<Estado | null>(null);
  useEffect(() => {
    let vivo = true;
    buscar().then((e) => vivo && setV(e));
    return () => {
      vivo = false;
    };
  }, []);
  if (!v?.ligado || v.restantes === undefined) return null;
  const n = v.restantes;
  return (
    <p className={`flex items-start gap-2 text-sm text-ink ${className}`} role="status">
      <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${n > 0 ? "bg-ink" : "bg-ink-soft"}`} aria-hidden="true" />
      {n > 0 ? (
        <span>
          {n === 1 ? (
            <>Resta <strong className="font-semibold">1 vaga</strong> de produção nesta semana.</>
          ) : (
            <>Restam <strong className="font-semibold">{n} vagas</strong> de produção nesta semana.</>
          )}
        </span>
      ) : (
        <span>As vagas desta semana acabaram: pedidos de hoje entram na produção da próxima semana.</span>
      )}
    </p>
  );
}
