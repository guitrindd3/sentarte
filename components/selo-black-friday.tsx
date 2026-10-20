import { rotuloDesconto, type CupomPublico } from "@/lib/cupom";

/** "Black Friday −12%" tag on chair photos/prices during Black Friday week (lib/black-friday.ts). */
export function SeloBlackFriday({ cupom, className = "" }: { cupom: CupomPublico; className?: string }) {
  return (
    <span className={`pointer-events-none inline-block w-fit bg-ink px-2 py-1 text-xs font-semibold text-canvas ${className}`}>
      Black Friday −{rotuloDesconto(cupom)}
      {cupom.minCadeiras > 1 ? ` levando ${cupom.minCadeiras}+` : ""}
    </span>
  );
}
