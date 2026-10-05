// Client side of the anonymous statistics (see lib/estatisticas.ts).
export type EventoCliente =
  | { t: "v"; p: string; r?: string; q?: string }
  | { t: "c"; l: string }
  | { t: "b"; q: string; onde?: string }
  | { t: "a"; m: string };

const CHAVE_VISITA = "sentarte-visita";

/** Random id for this tab's visit (sessionStorage: gone when the tab closes). */
export function idDaVisita(): string | undefined {
  try {
    let id = sessionStorage.getItem(CHAVE_VISITA);
    if (!id) {
      id = Array.from(crypto.getRandomValues(new Uint8Array(9)), (b) => b.toString(36).padStart(2, "0")).join("").slice(0, 16);
      sessionStorage.setItem(CHAVE_VISITA, id);
    }
    return id;
  } catch {
    return undefined;
  }
}

export function rastrear(ev: EventoCliente) {
  if (typeof window === "undefined" || location.pathname.startsWith("/admin")) return;
  const corpo = JSON.stringify({ ...ev, vid: idDaVisita() });
  try {
    if (navigator.sendBeacon?.("/api/e", new Blob([corpo], { type: "text/plain" }))) return;
  } catch {}
  fetch("/api/e", { method: "POST", body: corpo, keepalive: true }).catch(() => {});
}
