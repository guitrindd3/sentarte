export type WeaveShape = "lisa" | "diamante" | "ziguezague" | "espiral" | "sol";

type WeavePatternProps = {
  colorA: string;
  colorB: string;
  cell?: number;
  band?: number;
  className?: string;
  animated?: boolean;
  shape?: WeaveShape;
};

/**
 * Renders a basket-weave lattice as SVG: vertical bands of colorA run full
 * height, and horizontal bands of colorB alternate in front of / behind them
 * on a checkerboard so the strands read as interlaced, the way the studio's
 * rope is actually woven.
 */
export function WeavePattern({
  colorA,
  colorB,
  cell = 44,
  band = 30,
  className,
  animated = false,
  shape = "lisa",
}: WeavePatternProps) {
  const size = 480;

  if (shape !== "lisa") {
    return (
      <ShapeWeave colorA={colorA} colorB={colorB} shape={shape} size={size} className={className} animated={animated} />
    );
  }

  const cols = Math.ceil(size / cell) + 1;
  const rows = Math.ceil(size / cell) + 1;

  const verticals = Array.from({ length: cols }, (_, c) => c * cell);
  const horizontals = Array.from({ length: rows }, (_, r) => r * cell);

  return (
    <svg viewBox={`0 0 ${size} ${size}`} className={className} role="presentation" aria-hidden="true">
      <g className={animated ? "sentarte-weave-in" : undefined}>
        {verticals.map((x) => (
          <rect key={`v-${x}`} x={x} y={0} width={band} height={size} fill={colorA} />
        ))}
        {horizontals.map((y) => (
          <rect key={`h-${y}`} x={0} y={y} width={size} height={band} fill={colorB} />
        ))}
        {horizontals.map((y, r) =>
          verticals.map((x, c) => {
            if ((r + c) % 2 === 0) return null;
            return <rect key={`x-${r}-${c}`} x={x} y={y} width={band} height={band} fill={colorA} />;
          })
        )}
      </g>
    </svg>
  );
}

/**
 * Pixel-art style shapes (diamond, zigzag, triangle-spiral "totem", sunburst)
 * woven the same way the boho patterns are actually made: a grid of cells,
 * each one colorA or colorB, whose silhouette reads as the named shape —
 * not a literal render of any specific real pattern, just a live-preview
 * approximation a customer can pick before asking for the real thing.
 */
function ShapeWeave({
  colorA,
  colorB,
  shape,
  size,
  className,
  animated,
}: {
  colorA: string;
  colorB: string;
  shape: Exclude<WeaveShape, "lisa">;
  size: number;
  className?: string;
  animated?: boolean;
}) {
  const cols = 20;
  const rows = 24;
  const cellW = size / cols;
  const cellH = size / rows;
  const cx = (cols - 1) / 2;
  const cy = (rows - 1) / 2;
  // Normalized so u/v are in comparable units regardless of the grid's
  // aspect ratio — every distance-based mask below works off these, not
  // raw col/row deltas.
  const halfW = cols / 2;
  const halfH = rows / 2;
  const maxR = 1.05;

  function isForeground(col: number, row: number): boolean {
    const u = (col - cx) / halfW;
    const v = (row - cy) / halfH;
    switch (shape) {
      case "diamante": {
        const d = Math.abs(u) + Math.abs(v);
        return Math.floor(d * 4) % 2 === 0;
      }
      case "ziguezague": {
        const wave = Math.sin(u * Math.PI * 2.5) * 0.35;
        return Math.abs(v - wave) < 0.16;
      }
      case "espiral": {
        const r = Math.sqrt(u * u + v * v);
        if (r > maxR) return false;
        const theta01 = (Math.atan2(v, u) + Math.PI) / (Math.PI * 2);
        const coil = theta01 * 3 + r * 3.2;
        return Math.floor(coil) % 2 === 0;
      }
      case "sol": {
        const r = Math.sqrt(u * u + v * v);
        if (r > maxR) return false;
        const theta01 = (Math.atan2(v, u) + Math.PI) / (Math.PI * 2);
        const rays = 12;
        return Math.floor(theta01 * rays) % 2 === 0;
      }
    }
  }

  const cells: { x: number; y: number; fill: string }[] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      cells.push({
        x: c * cellW,
        y: r * cellH,
        fill: isForeground(c, r) ? colorA : colorB,
      });
    }
  }

  return (
    <svg viewBox={`0 0 ${size} ${size}`} className={className} role="presentation" aria-hidden="true">
      <g className={animated ? "sentarte-weave-in" : undefined}>
        <rect x={0} y={0} width={size} height={size} fill={colorB} />
        {cells.map((cell, i) => (
          <rect
            key={i}
            x={cell.x}
            y={cell.y}
            width={cellW + 0.5}
            height={cellH + 0.5}
            fill={cell.fill}
          />
        ))}
      </g>
    </svg>
  );
}
