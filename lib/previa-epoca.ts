// While the owner previews a season (`?natal=1` / `?anonovo=1`, kept for the tab in
// sessionStorage by components/natal.tsx and components/ano-novo.tsx), the page
// shows it exactly as in its own dates — so Black Friday (top strip, logo and
// prices on the cards) is hidden in that tab only. User 2026-11-12: "não
// funcionou o link do natal" (the live Black Friday strip covered it). Checkout
// prices are always computed on the server, so this only changes what that tab shows.
export function emPreviaDeEpoca() {
  try {
    const q = new URLSearchParams(window.location.search);
    for (const [param, chave] of [
      ["natal", "sentarte-natal-previa"],
      ["anonovo", "sentarte-anonovo-previa"],
    ]) {
      const v = q.get(param);
      if (v === "1") return true;
      if (v !== "0" && sessionStorage.getItem(chave) === "1") return true;
    }
  } catch {}
  return false;
}
