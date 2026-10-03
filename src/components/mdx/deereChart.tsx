/** Small shared pieces for the John Deere pricing model charts. */

export const BLUE = "#3987e5";
export const ORANGE = "#d95926";
export const AQUA = "#199e70";
export const VIOLET = "#9085e9";
export const GREEN = "#0ca30c";
export const YELLOW = "#fab219";
export const RED = "#d03b3b";

/** Linear map from a data domain to a pixel range. */
export function linear([d0, d1]: [number, number], [r0, r1]: [number, number]) {
  return (v: number) => r0 + ((v - d0) / (d1 - d0)) * (r1 - r0);
}

/** Interpolate y along a polyline of [x, y] knots (clamped at the ends). */
export function interp(knots: [number, number][], x: number) {
  if (x <= knots[0][0]) return knots[0][1];
  for (let i = 1; i < knots.length; i++) {
    const [x1, y1] = knots[i];
    if (x <= x1) {
      const [x0, y0] = knots[i - 1];
      return y0 + ((x - x0) / (x1 - x0)) * (y1 - y0);
    }
  }
  return knots[knots.length - 1][1];
}

export function pathFrom(points: [number, number][]) {
  return points.map(([px, py], i) => `${i ? "L" : "M"}${px.toFixed(1)},${py.toFixed(1)}`).join("");
}

export const usd = (v: number, digits = 2) =>
  `${v < 0 ? "−" : ""}$${Math.abs(v).toLocaleString("en-US", { minimumFractionDigits: digits, maximumFractionDigits: digits })}`;

/** Seeded PRNG so every visitor sees the same simulated parts. */
export function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let r = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

export function gaussian(rand: () => number) {
  return Math.sqrt(-2 * Math.log(1 - rand())) * Math.cos(2 * Math.PI * rand());
}

export function Figure({ caption, children }: { caption: React.ReactNode; children: React.ReactNode }) {
  return (
    <figure className="not-prose my-10">
      <div className="rounded-xl border border-border bg-surface p-4 sm:p-5">{children}</div>
      <figcaption className="mt-3 text-center text-sm italic text-muted">{caption}</figcaption>
    </figure>
  );
}

export function ChartTitle({ title, subtitle }: { title: string; subtitle?: React.ReactNode }) {
  return (
    <p className="text-[0.95rem] font-semibold leading-snug text-foreground">
      {title}
      {subtitle && <span className="block text-sm font-normal text-muted">{subtitle}</span>}
    </p>
  );
}

export function Segmented<T extends string>({
  options,
  value,
  onChange,
  label,
  render,
}: {
  options: readonly T[];
  value: T;
  onChange: (v: T) => void;
  label: string;
  render?: (v: T) => React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap rounded-lg border border-border p-0.5 text-xs" role="group" aria-label={label}>
      {options.map((o) => (
        <button
          key={o}
          type="button"
          aria-pressed={value === o}
          onClick={() => onChange(o)}
          className={`rounded-md px-2.5 py-1 transition-colors ${
            value === o ? "bg-foreground/10 text-foreground" : "text-muted hover:text-foreground"
          }`}
        >
          {render ? render(o) : o}
        </button>
      ))}
    </div>
  );
}

export function LegendItem({ color, label, kind = "dot" }: { color: string; label: string; kind?: "dot" | "line" | "band" | "dash" }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      {kind === "dot" && <span className="size-2 shrink-0 rounded-full" style={{ background: color }} />}
      {kind === "line" && <span className="h-0.5 w-4 shrink-0 rounded-full" style={{ background: color }} />}
      {kind === "band" && <span className="h-2.5 w-4 shrink-0 rounded-sm" style={{ background: color, opacity: 0.35 }} />}
      {kind === "dash" && <span className="w-4 shrink-0 border-t-2 border-dashed" style={{ borderColor: color }} />}
      {label}
    </span>
  );
}

/** Gridlines, tick labels and axis titles for a simple x/y chart. */
export function Axes({
  x,
  y,
  xTicks,
  yTicks,
  xFormat = String,
  yFormat = String,
  xLabel,
  yLabel,
  plot,
}: {
  x: (v: number) => number;
  y: (v: number) => number;
  xTicks: number[];
  yTicks: number[];
  xFormat?: (v: number) => string;
  yFormat?: (v: number) => string;
  xLabel: string;
  yLabel: string;
  plot: { l: number; r: number; t: number; b: number };
}) {
  return (
    <g>
      {yTicks.map((t) => (
        <g key={`y${t}`}>
          <line x1={plot.l} x2={plot.r} y1={y(t)} y2={y(t)} stroke="var(--border)" />
          <text x={plot.l - 6} y={y(t)} dy="0.32em" textAnchor="end" className="fill-muted text-[10px] tabular-nums">
            {yFormat(t)}
          </text>
        </g>
      ))}
      {xTicks.map((t) => (
        <text key={`x${t}`} x={x(t)} y={plot.b + 15} textAnchor="middle" className="fill-muted text-[10px] tabular-nums">
          {xFormat(t)}
        </text>
      ))}
      <line x1={plot.l} x2={plot.r} y1={plot.b} y2={plot.b} stroke="var(--muted)" strokeOpacity="0.5" />
      <text x={(plot.l + plot.r) / 2} y={plot.b + 32} textAnchor="middle" className="fill-muted text-[11px]">
        {xLabel}
      </text>
      <text
        x={11}
        y={(plot.t + plot.b) / 2}
        textAnchor="middle"
        className="fill-muted text-[11px]"
        transform={`rotate(-90 11 ${(plot.t + plot.b) / 2})`}
      >
        {yLabel}
      </text>
    </g>
  );
}
