import { WeavePattern, type WeaveShape } from "@/components/weave-pattern";

export type NomePosicao = "topo" | "meio" | "base";

const NOME_Y: Record<NomePosicao, number> = {
  topo: 88,
  meio: 120,
  base: 158,
};

const NOME_CENTER_X = 137;
const NOME_INNER_WIDTH = 90;

/**
 * A folding beach chair silhouette turned at a slight angle (near/left leg
 * wider and lower, far/right leg narrower and set back) so the illustration
 * reads as an actual object with depth, not a flat picture-frame swatch.
 * The backrest/seat weave panels are clipped to a leaning quadrilateral
 * (not a plain rect) for the same reason, with a thin darkened sliver along
 * their receding edge to hint at the frame's thickness.
 *
 * When `nome` is set, it's woven into the backrest in the same blocky pixel
 * face the real chairs use (--font-pixel, see app/layout.tsx): the patch
 * behind it is `colorB` (the horizontal thread) and the letters are
 * `colorA` (the vertical thread) acting as the contrasting highlight — so
 * picking new thread colors re-colors the name too, the way it would on a
 * real chair. `textLength`/`lengthAdjust` force the run to fit inside
 * `NOME_INNER_WIDTH` regardless of how wide the real font metrics turn out
 * to be, so long names never spill past the panel.
 */
export function ChairPreview({
  colorA,
  colorB,
  shape,
  nome,
  posicao = "meio",
}: {
  colorA: string;
  colorB: string;
  shape: WeaveShape;
  nome?: string;
  posicao?: NomePosicao;
}) {
  const railTube =
    "M40 402 L68 254 V74 Q68 34 104 34 H176 Q206 34 206 74 V254 L230 402";

  const texto = (nome ?? "").trim().toUpperCase().slice(0, 14);
  const charWidth = 0.62;
  const baseFontSize = 16;
  const minFontSize = 8;
  const fontSize = texto
    ? Math.max(minFontSize, Math.min(baseFontSize, NOME_INNER_WIDTH / (texto.length * charWidth)))
    : baseFontSize;
  const textWidth = texto ? Math.min(texto.length * charWidth * fontSize, NOME_INNER_WIDTH) : 0;
  const plateWidth = texto ? textWidth + 16 : 0;
  const plateY = NOME_Y[posicao];

  return (
    <svg viewBox="0 0 300 430" role="img" aria-label="Prévia da cadeira" className="h-full w-full">
      <defs>
        <clipPath id="chair-preview-backrest">
          <polygon points="80,52 194,40 188,188 86,198" />
        </clipPath>
        <clipPath id="chair-preview-seat">
          <polygon points="86,198 188,188 182,252 90,262" />
        </clipPath>
      </defs>

      {/* ground shadow */}
      <ellipse cx="135" cy="412" rx="92" ry="9" fill="#00000012" />

      {/* rear stabilizer bar, low behind the seat, tilted to match the turn */}
      <path d="M95 345 L200 328" stroke="#AEB6BC" strokeWidth="7" strokeLinecap="round" fill="none" />

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

      {/* backrest weave, clipped to a leaning quad so the panel reads as turned */}
      <g clipPath="url(#chair-preview-backrest)">
        <svg x={78} y={38} width={120} height={164}>
          <WeavePattern colorA={colorA} colorB={colorB} shape={shape} className="h-full w-full" />
        </svg>
        <polygon points="186,42 180,186 188,188 194,40" fill="#00000022" />
      </g>

      {/* seat weave */}
      <g clipPath="url(#chair-preview-seat)">
        <svg x={84} y={186} width={106} height={78}>
          <WeavePattern colorA={colorA} colorB={colorB} shape={shape} className="h-full w-full" />
        </svg>
        <polygon points="180,190 176,250 182,252 188,188" fill="#00000022" />
      </g>

      {/* fold hinge bar, where backrest meets seat */}
      <path d="M84 197 L190 187" stroke="#9CA4AB" strokeWidth="8" strokeLinecap="round" />

      {/* armrests: near (left) bigger, far (right) smaller — reinforces the turn */}
      <g>
        <rect x="20" y="222" width="58" height="17" rx="8.5" fill="#DAD4C6" />
        <rect x="20" y="234" width="58" height="6" rx="3" fill="#C7C0AE" />
        <rect x="196" y="222" width="50" height="15" rx="7.5" fill="#DAD4C6" />
        <rect x="196" y="233" width="50" height="5" rx="2.5" fill="#C7C0AE" />
      </g>

      {/* woven name/frase, clipped so it never spills past the backrest */}
      {texto ? (
        <g clipPath="url(#chair-preview-backrest)">
          <rect
            x={NOME_CENTER_X - plateWidth / 2}
            y={plateY - fontSize * 0.72}
            width={plateWidth}
            height={fontSize * 1.5}
            rx="3"
            fill={colorB}
            stroke={colorA}
            strokeWidth="2"
          />
          <text
            x={NOME_CENTER_X}
            y={plateY}
            textAnchor="middle"
            dominantBaseline="middle"
            fill={colorA}
            fontSize={fontSize}
            textLength={textWidth}
            lengthAdjust="spacingAndGlyphs"
            style={{ fontFamily: "var(--font-pixel)" }}
          >
            {texto}
          </text>
        </g>
      ) : null}
    </svg>
  );
}
