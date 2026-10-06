// Shipment tracking links (shared by /acompanhar and the admin). Melhor
// Rastreio follows Correios, Jadlog, J&T, Loggi… codes on one page.
export function linkRastreio(codigo: string) {
  return `https://www.melhorrastreio.com.br/rastreio/${encodeURIComponent(codigo.trim())}`;
}
