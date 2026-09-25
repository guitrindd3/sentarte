import { WeavePattern, type WeaveShape } from "@/components/weave-pattern";

/**
 * A folding beach-chair silhouette with the weave preview clipped into its
 * backrest and seat panels, so changing the shape/colors in the
 * configurator visibly changes "the chair", not just a flat swatch. Legs
 * flare outward the way a real folding frame does, with a soft ground
 * shadow and a highlight stroke on the tube for a touch of depth — still a
 * flat illustration, not a 3D render, but reads as an actual beach chair
 * rather than a picture frame.
 */
export function ChairPreview({
  colorA,
  colorB,
  shape,
}: {
  colorA: string;
  colorB: string;
  shape: WeaveShape;
}) {
  const railTube =
    "M46 402 L74 254 V74 Q74 34 112 34 H188 Q226 34 226 74 V254 L254 402";

  return (
    <svg viewBox="0 0 300 430" role="img" aria-label="Prévia da cadeira" className="h-full w-full">
      <defs>
        <clipPath id="chair-preview-backrest">
          <rect x="84" y="46" width="132" height="150" rx="10" />
        </clipPath>
        <clipPath id="chair-preview-seat">
          <rect x="84" y="204" width="132" height="60" rx="6" />
        </clipPath>
      </defs>

      {/* ground shadow */}
      <ellipse cx="150" cy="412" rx="92" ry="9" fill="#00000012" />

      {/* rear stabilizer bar, low behind the seat */}
      <path d="M92 340 L208 340" stroke="#AEB6BC" strokeWidth="7" strokeLinecap="round" fill="none" />

      {/* frame tube: base stroke + a lighter offset highlight for a rounded look */}
      <path d={railTube} stroke="#B7BEC5" strokeWidth="13" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <path
        d={railTube}
        stroke="#E7EAEC"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        transform="translate(-2 -2)"
      />

      {/* backrest weave */}
      <g clipPath="url(#chair-preview-backrest)">
        <svg x={84} y={46} width={132} height={150}>
          <WeavePattern colorA={colorA} colorB={colorB} shape={shape} className="h-full w-full" />
        </svg>
      </g>

      {/* seat weave */}
      <g clipPath="url(#chair-preview-seat)">
        <svg x={84} y={204} width={132} height={60}>
          <WeavePattern colorA={colorA} colorB={colorB} shape={shape} className="h-full w-full" />
        </svg>
      </g>

      {/* fold hinge bar, where backrest meets seat */}
      <path d="M78 202 H222" stroke="#9CA4AB" strokeWidth="8" strokeLinecap="round" />

      {/* armrests, plastic pads at the fold */}
      <g>
        <rect x="26" y="222" width="58" height="17" rx="8.5" fill="#DAD4C6" />
        <rect x="26" y="234" width="58" height="6" rx="3" fill="#C7C0AE" />
        <rect x="216" y="222" width="58" height="17" rx="8.5" fill="#DAD4C6" />
        <rect x="216" y="234" width="58" height="6" rx="3" fill="#C7C0AE" />
      </g>
    </svg>
  );
}
