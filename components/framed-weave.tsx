import Image from "next/image";
import { WeavePattern } from "@/components/weave-pattern";

type FramedWeaveProps = {
  colorA?: string;
  colorB?: string;
  cell?: number;
  band?: number;
  animated?: boolean;
  aspect?: string;
  tone?: "paper" | "canvas";
  imagemUrl?: string;
  alt?: string;
};

/**
 * Presents a weave swatch — or a real photo, once one exists — the way the
 * atelier actually displays rope samples: matted and framed, like a
 * textile sample or a print pinned in a gallery, rather than a bare
 * full-bleed image.
 */
export function FramedWeave({
  colorA = "#15564C",
  colorB = "#BD502E",
  cell,
  band,
  animated,
  aspect = "aspect-square md:aspect-[4/5]",
  tone = "paper",
  imagemUrl,
  alt,
}: FramedWeaveProps) {
  return (
    <div
      className={`border border-rattan/60 p-3 md:p-4 ${tone === "paper" ? "bg-paper" : "bg-canvas"}`}
    >
      <div className={`relative overflow-hidden ${aspect} ${animated ? "sentarte-weave-in" : ""}`}>
        {imagemUrl ? (
          <Image
            src={imagemUrl}
            alt={alt ?? ""}
            fill
            className="object-cover"
            sizes="(min-width: 768px) 480px, 100vw"
          />
        ) : (
          <WeavePattern colorA={colorA} colorB={colorB} cell={cell} band={band} className="h-full w-full" />
        )}
      </div>
    </div>
  );
}
