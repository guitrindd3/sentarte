import { WeavePattern, type WeaveShape } from "@/components/weave-pattern";

/**
 * A stylized folding beach-chair silhouette with the weave preview clipped
 * into the backrest and seat panels, so changing the shape/colors in the
 * configurator visibly changes "the chair", not just a flat swatch. The
 * frame is one continuous stroked path (legs -> rails -> top bar -> rails
 * -> legs), matching how the real aluminum tube actually runs.
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
  return (
    <svg viewBox="0 0 300 400" role="img" aria-label="Prévia da cadeira" className="h-full w-full">
      <defs>
        <clipPath id="chair-preview-backrest">
          <rect x="66" y="44" width="168" height="158" rx="6" />
        </clipPath>
        <clipPath id="chair-preview-seat">
          <rect x="66" y="212" width="168" height="66" rx="4" />
        </clipPath>
      </defs>

      {/* ground stabilizer bar */}
      <path d="M54 366 H246" stroke="#B9C0C6" strokeWidth="9" strokeLinecap="round" fill="none" />

      {/* backrest weave */}
      <g clipPath="url(#chair-preview-backrest)">
        <svg x={66} y={44} width={168} height={158}>
          <WeavePattern colorA={colorA} colorB={colorB} shape={shape} className="h-full w-full" />
        </svg>
      </g>

      {/* seat weave */}
      <g clipPath="url(#chair-preview-seat)">
        <svg x={66} y={212} width={168} height={66}>
          <WeavePattern colorA={colorA} colorB={colorB} shape={shape} className="h-full w-full" />
        </svg>
      </g>

      {/* continuous aluminum frame: leg -> rail -> top bar -> rail -> leg */}
      <path
        d="M54 366 V64 Q54 30 88 30 H212 Q246 30 246 64 V366"
        stroke="#C7CDD2"
        strokeWidth="15"
        strokeLinecap="round"
        fill="none"
      />

      {/* seat front rail, at the fold between backrest and seat */}
      <path d="M60 210 H240" stroke="#C7CDD2" strokeWidth="10" strokeLinecap="round" />

      {/* armrests */}
      <path d="M20 226 H70" stroke="#EDE9E1" strokeWidth="18" strokeLinecap="round" />
      <path d="M230 226 H280" stroke="#EDE9E1" strokeWidth="18" strokeLinecap="round" />
    </svg>
  );
}
