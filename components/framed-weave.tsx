import Image from "next/image";
import { WeavePattern } from "@/components/weave-pattern";

type FramedWeaveProps = {
  colorA: string;
  colorB: string;
  cell?: number;
  band?: number;
  animated?: boolean;
  aspect?: string;
  tone?: "paper" | "canvas";
  imagemUrl?: string;
  alt?: string;
};

/**
 * Presents a weave swatch the way the atelier actually displays rope
 * samples: matted and framed, like a textile sample pinned in a gallery,
 * rather than a bare full-bleed image. Shows a real photo instead of the
 * woven SVG once one has been uploaded through the admin panel.
 */
export function FramedWeave({
  colorA,
  colorB,
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
      <div className={`relative overflow-hidden ${aspect}`}>
        {imagemUrl ? (
          <Image
            src={imagemUrl}
            alt={alt ?? ""}
            fill
            className="object-cover"
            sizes="(min-width: 768px) 480px, 100vw"
          />
        ) : (
          <WeavePattern colorA={colorA} colorB={colorB} cell={cell} band={band} animated={animated} className="h-full w-full" />
        )}
      </div>
    </div>
  );
}
