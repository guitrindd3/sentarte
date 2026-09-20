type WeavePatternProps = {
  colorA: string;
  colorB: string;
  cell?: number;
  band?: number;
  className?: string;
  animated?: boolean;
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
}: WeavePatternProps) {
  const size = 480;
  const cols = Math.ceil(size / cell) + 1;
  const rows = Math.ceil(size / cell) + 1;

  const verticals = Array.from({ length: cols }, (_, c) => c * cell);
  const horizontals = Array.from({ length: rows }, (_, r) => r * cell);

  return (
    <svg
      viewBox={`0 0 ${size} ${size}`}
      className={className}
      role="presentation"
      aria-hidden="true"
    >
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
