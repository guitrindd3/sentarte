import { Archivo, Bodoni_Moda, Cormorant_Garamond, Dancing_Script, Great_Vibes, Montserrat, Parisienne, Playfair_Display } from "next/font/google";
import type { FonteCartao } from "@/lib/cartoes-modelo";

// Fonts offered in the card editor (/admin/cartoes). Self-hosted by next/font,
// so they load only on this page and print exactly as shown.

const bodoni = Bodoni_Moda({ subsets: ["latin"], weight: ["500", "600", "700"], style: ["normal", "italic"], display: "swap" });
const playfair = Playfair_Display({ subsets: ["latin"], display: "swap" });
const cormorant = Cormorant_Garamond({ subsets: ["latin"], weight: ["500", "600", "700"], display: "swap" });
const archivo = Archivo({ subsets: ["latin"], display: "swap" });
const montserrat = Montserrat({ subsets: ["latin"], display: "swap" });
const greatvibes = Great_Vibes({ subsets: ["latin"], weight: "400", display: "swap" });
const dancing = Dancing_Script({ subsets: ["latin"], display: "swap" });
const parisienne = Parisienne({ subsets: ["latin"], weight: "400", display: "swap" });

export const FAMILIA: Record<FonteCartao, string> = {
  bodoni: bodoni.style.fontFamily,
  playfair: playfair.style.fontFamily,
  cormorant: cormorant.style.fontFamily,
  archivo: archivo.style.fontFamily,
  montserrat: montserrat.style.fontFamily,
  greatvibes: greatvibes.style.fontFamily,
  dancing: dancing.style.fontFamily,
  parisienne: parisienne.style.fontFamily,
};
