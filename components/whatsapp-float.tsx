import { WhatsAppIcon } from "@/components/icons";
import { whatsappUrl } from "@/lib/urls";

// Always-visible contact button (bottom-right). Kept in the site's
// monochrome ink/canvas palette rather than WhatsApp green, per the design
// notes in CLAUDE.md.
export function WhatsAppFloat({ whatsappNumero }: { whatsappNumero: string }) {
  return (
    <a
      href={whatsappUrl(whatsappNumero, "Oi! Vim pelo site e queria saber mais sobre as cadeiras.")}
      target="_blank"
      rel="noreferrer"
      aria-label="Falar no WhatsApp"
      className="fixed bottom-[calc(1.25rem+env(safe-area-inset-bottom,0px))] right-5 z-40 inline-flex items-center gap-2 rounded-full border border-ink bg-ink p-3.5 text-canvas shadow-[4px_4px_0_0_var(--line)] transition-colors hover:bg-canvas hover:text-ink md:px-5 md:py-3"
    >
      <WhatsAppIcon className="h-6 w-6 md:h-5 md:w-5" />
      <span className="hidden text-sm font-medium md:inline">Fale com a gente</span>
    </a>
  );
}
