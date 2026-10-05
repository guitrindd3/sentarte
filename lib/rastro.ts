// Client side of the anonymous statistics (see lib/estatisticas.ts).
export type EventoCliente =
  | { t: "v"; p: string; r?: string; q?: string }
  | { t: "c"; l: string }
  | { t: "b"; q: string; onde?: string }
  | { t: "a"; m: string };

export function rastrear(ev: EventoCliente) {
  if (typeof window === "undefined" || location.pathname.startsWith("/admin")) return;
  const corpo = JSON.stringify(ev);
  try {
    if (navigator.sendBeacon?.("/api/e", new Blob([corpo], { type: "text/plain" }))) return;
  } catch {}
  fetch("/api/e", { method: "POST", body: corpo, keepalive: true }).catch(() => {});
}
