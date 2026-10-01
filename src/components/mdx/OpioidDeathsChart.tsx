"use client";

import { useId, useLayoutEffect, useMemo, useRef, useState } from "react";
import { opioidDeaths, years, type OpioidSeriesKey } from "./opioidDeathsData";

type Metric = "rate" | "count";

const series: {
  key: OpioidSeriesKey;
  label: string;
  short: string;
  color: string;
  dash?: string;
}[] = [
  { key: "synthetic", label: "Synthetic opioids other than methadone", short: "Synthetic", color: "#3987e5" },
  { key: "heroin", label: "Heroin", short: "Heroin", color: "#d95926" },
  { key: "natural", label: "Natural and semisynthetic opioids", short: "Natural & semi.", color: "#199e70" },
  // Neutral + dashed: a fourth hue can't stay distinguishable where these lines cross.
  { key: "methadone", label: "Methadone", short: "Methadone", color: "#8b90a5", dash: "5 4" },
];

const metrics: Record<Metric, { label: string; axis: string; index: 0 | 1; format: (v: number) => string }> = {
  rate: {
    label: "Rate",
    axis: "Deaths per 100,000",
    index: 1,
    format: (v) => v.toFixed(1),
  },
  count: {
    label: "Deaths",
    axis: "Number of deaths",
    index: 0,
    format: (v) => v.toLocaleString("en-US"),
  },
};

const HEIGHT = 320;

function niceTicks(max: number, count = 4) {
  const raw = max / count;
  const mag = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * mag).find((s) => s >= raw)!;
  const top = Math.ceil(max / step) * step;
  return Array.from({ length: Math.round(top / step) + 1 }, (_, i) => i * step);
}

function tickLabel(v: number, metric: Metric) {
  if (metric === "count") return v === 0 ? "0" : `${v / 1000}k`;
  return String(v);
}

/** Spread end-of-line labels vertically so they never overlap. */
function spreadLabels(items: { key: string; y: number }[], gap: number, min: number, max: number) {
  const sorted = [...items].sort((a, b) => a.y - b.y).map((d) => ({ ...d }));
  for (let i = 1; i < sorted.length; i++) {
    sorted[i].y = Math.max(sorted[i].y, sorted[i - 1].y + gap);
  }
  const overflow = sorted.length ? sorted[sorted.length - 1].y - max : 0;
  if (overflow > 0) {
    sorted[sorted.length - 1].y -= overflow;
    for (let i = sorted.length - 2; i >= 0; i--) {
      sorted[i].y = Math.min(sorted[i].y, sorted[i + 1].y - gap);
    }
  }
  return Object.fromEntries(sorted.map((d) => [d.key, Math.max(d.y, min)]));
}

/** Interactive recreation of NCHS Data Brief 428, Figure 4. */
export function OpioidDeathsChart() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(640);
  const [metric, setMetric] = useState<Metric>("rate");
  const [hidden, setHidden] = useState<Set<OpioidSeriesKey>>(new Set());
  const [focusKey, setFocusKey] = useState<OpioidSeriesKey | null>(null);
  const [active, setActive] = useState<number | null>(null);
  const [showTable, setShowTable] = useState(false);
  const titleId = useId();

  useLayoutEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    setWidth(el.clientWidth);
    const ro = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const compact = width < 480;
  const m = { top: 12, right: compact ? 18 : 128, bottom: 28, left: compact ? 34 : 40 };
  const innerW = Math.max(width - m.left - m.right, 10);
  const innerH = HEIGHT - m.top - m.bottom;
  const { index, format, axis } = metrics[metric];
  const visible = series.filter((s) => !hidden.has(s.key));

  const ticks = useMemo(() => {
    const max = Math.max(...visible.flatMap((s) => opioidDeaths[s.key].map((d) => d[index])));
    return niceTicks(max);
  }, [visible, index]);
  const yMax = ticks[ticks.length - 1];

  const x = (i: number) => (i / (years.length - 1)) * innerW;
  const y = (v: number) => innerH - (v / yMax) * innerH;

  const paths = Object.fromEntries(
    series.map((s) => [
      s.key,
      opioidDeaths[s.key].map((d, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(d[index]).toFixed(1)}`).join(""),
    ]),
  ) as Record<OpioidSeriesKey, string>;

  const last = years.length - 1;
  const labelY = spreadLabels(
    visible.map((s) => ({ key: s.key, y: y(opioidDeaths[s.key][last][index]) })),
    15,
    0,
    innerH,
  );

  // Count back from the final year so 2020 always gets a tick without crowding.
  const xStep = compact ? 5 : 3;
  const xTicks = years.map((_, i) => i).filter((i) => (last - i) % xStep === 0);

  function toggle(key: OpioidSeriesKey) {
    setHidden((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else if (next.size < series.length - 1) next.add(key);
      return next;
    });
  }

  function onPointerMove(e: React.PointerEvent<SVGRectElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const px = ((e.clientX - rect.left) / rect.width) * innerW;
    setActive(Math.min(last, Math.max(0, Math.round((px / innerW) * last))));
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
      e.preventDefault();
      const delta = e.key === "ArrowRight" ? 1 : -1;
      setActive((a) => Math.min(last, Math.max(0, (a ?? (delta > 0 ? -1 : last + 1)) + delta)));
    } else if (e.key === "Home") setActive(0);
    else if (e.key === "End") setActive(last);
    else if (e.key === "Escape") setActive(null);
  }

  const tooltipRows =
    active === null
      ? []
      : visible
          .map((s) => ({ ...s, value: opioidDeaths[s.key][active][index] }))
          .sort((a, b) => b.value - a.value);
  const tipLeft = active !== null && x(active) > innerW * 0.55;

  return (
    <figure className="not-prose my-10 rounded-xl border border-border bg-surface p-4 sm:p-5">
      <figcaption id={titleId} className="text-[0.95rem] font-semibold leading-snug text-foreground">
        Overdose deaths involving opioids, by type of opioid
        <span className="block text-sm font-normal text-muted">United States, 1999–2020 · age-adjusted</span>
      </figcaption>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-x-1 gap-y-1" role="group" aria-label="Show or hide series">
          {series.map((s) => {
            const off = hidden.has(s.key);
            return (
              <button
                key={s.key}
                type="button"
                aria-pressed={!off}
                onClick={() => toggle(s.key)}
                onPointerEnter={() => setFocusKey(s.key)}
                onPointerLeave={() => setFocusKey(null)}
                onFocus={(e) => e.currentTarget.matches(":focus-visible") && setFocusKey(s.key)}
                onBlur={() => setFocusKey(null)}
                className={`flex items-center gap-2 rounded-md px-2 py-1 text-xs transition-colors hover:bg-foreground/5 ${
                  off ? "text-muted/60 line-through" : "text-foreground/85"
                }`}
              >
                <svg width="16" height="8" aria-hidden className={off ? "opacity-30" : ""}>
                  <line x1="0" x2="16" y1="4" y2="4" stroke={s.color} strokeWidth="2" strokeDasharray={s.dash} />
                </svg>
                {s.label}
              </button>
            );
          })}
        </div>
        <div className="flex rounded-lg border border-border p-0.5 text-xs" role="group" aria-label="Measure">
          {(Object.keys(metrics) as Metric[]).map((k) => (
            <button
              key={k}
              type="button"
              aria-pressed={metric === k}
              onClick={() => setMetric(k)}
              className={`rounded-md px-2.5 py-1 transition-colors ${
                metric === k ? "bg-foreground/10 text-foreground" : "text-muted hover:text-foreground"
              }`}
            >
              {metrics[k].label}
            </button>
          ))}
        </div>
      </div>

      <div ref={wrapRef} className="relative mt-3 min-w-0 overflow-hidden">
        <svg
          width={width}
          height={HEIGHT}
          className="block rounded-md outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent/60"
          tabIndex={0}
          role="group"
          aria-labelledby={titleId}
          aria-describedby={`${titleId}-hint`}
          onKeyDown={onKeyDown}
          onBlur={() => setActive(null)}
        >
          <g transform={`translate(${m.left},${m.top})`}>
            {ticks.map((t) => (
              <g key={t} transform={`translate(0,${y(t)})`}>
                <line x2={innerW} stroke={t === 0 ? "#2c3144" : "var(--border)"} strokeWidth="1" />
                <text x={-8} dy="0.32em" textAnchor="end" className="fill-muted text-[11px] tabular-nums">
                  {tickLabel(t, metric)}
                </text>
              </g>
            ))}
            {xTicks.map((i) => (
              <text key={i} x={x(i)} y={innerH + 18} textAnchor="middle" className="fill-muted text-[11px] tabular-nums">
                {years[i]}
              </text>
            ))}

            {visible.map((s) => (
              <path
                key={s.key}
                d={paths[s.key]}
                // CSS `d` lets the line morph between measures; browsers without it just snap.
                style={{ d: `path("${paths[s.key]}")` } as React.CSSProperties}
                fill="none"
                stroke={s.color}
                strokeWidth={s.key === focusKey ? 2.75 : 2}
                strokeDasharray={s.dash}
                strokeLinejoin="round"
                strokeLinecap="round"
                opacity={focusKey && focusKey !== s.key ? 0.2 : 1}
                className="motion-safe:[transition:d_450ms_ease-out,opacity_200ms]"
              />
            ))}

            {!compact &&
              visible.map((s) => {
                const v = opioidDeaths[s.key][last][index];
                return (
                  <text
                    key={s.key}
                    x={innerW + 8}
                    y={labelY[s.key]}
                    dy="0.32em"
                    className="text-[11px]"
                    opacity={focusKey && focusKey !== s.key ? 0.3 : 1}
                  >
                    <tspan className="fill-foreground font-semibold tabular-nums">{format(v)}</tspan>
                    <tspan className="fill-muted"> {s.short}</tspan>
                  </text>
                );
              })}

            {active !== null && (
              <g pointerEvents="none">
                <line x1={x(active)} x2={x(active)} y2={innerH} stroke="var(--muted)" strokeOpacity="0.5" />
                {tooltipRows.map((s) => (
                  <circle
                    key={s.key}
                    cx={x(active)}
                    cy={y(s.value)}
                    r={4}
                    fill={s.color}
                    stroke="var(--surface)"
                    strokeWidth={2}
                  />
                ))}
              </g>
            )}

            <rect
              width={innerW + 8}
              x={-4}
              height={innerH}
              fill="transparent"
              onPointerMove={onPointerMove}
              onPointerDown={onPointerMove}
              onPointerLeave={() => setActive(null)}
            />
          </g>
        </svg>

        {active !== null && (
          <div
            className="pointer-events-none absolute top-2 z-10 min-w-44 rounded-lg border border-border bg-background/95 px-3 py-2 text-xs shadow-xl backdrop-blur"
            style={
              tipLeft
                ? { right: width - (m.left + x(active)) + 12 }
                : { left: m.left + x(active) + 12 }
            }
          >
            <p className="mb-1.5 font-mono text-muted">{years[active]}</p>
            <ul className="space-y-1">
              {tooltipRows.map((s) => (
                <li key={s.key} className="flex items-center gap-2">
                  <svg width="12" height="6" aria-hidden className="shrink-0">
                    <line x1="0" x2="12" y1="3" y2="3" stroke={s.color} strokeWidth="2" strokeDasharray={s.dash ? "3 2" : undefined} />
                  </svg>
                  <span className="font-semibold tabular-nums text-foreground">{format(s.value)}</span>
                  <span className="text-muted">{s.short}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <p id={`${titleId}-hint`} className="sr-only">
        {axis}. Use the left and right arrow keys to step through years.
      </p>
      <p className="sr-only" aria-live="polite">
        {active !== null &&
          `${years[active]}: ${tooltipRows.map((s) => `${s.label} ${format(s.value)}`).join(", ")}`}
      </p>

      <div className="mt-3 flex flex-wrap items-baseline justify-between gap-2 text-xs text-muted">
        <p>
          {axis}. Source:{" "}
          <a
            href="https://www.cdc.gov/nchs/products/databriefs/db428.htm"
            target="_blank"
            rel="noreferrer"
            className="text-accent-2 underline underline-offset-2"
          >
            NCHS Data Brief No. 428
          </a>
        </p>
        <button
          type="button"
          aria-expanded={showTable}
          onClick={() => setShowTable((v) => !v)}
          className="rounded-md px-2 py-1 transition-colors hover:bg-foreground/5 hover:text-foreground"
        >
          {showTable ? "Hide data table" : "Show data table"}
        </button>
      </div>

      {showTable && (
        <div className="mt-3 max-h-80 overflow-auto rounded-lg border border-border">
          <table className="w-full text-right text-xs tabular-nums">
            <caption className="sr-only">{axis} by type of opioid, 1999–2020</caption>
            <thead className="sticky top-0 bg-surface text-muted">
              <tr>
                <th scope="col" className="px-3 py-2 text-left font-medium">Year</th>
                {series.map((s) => (
                  <th key={s.key} scope="col" className="px-3 py-2 font-medium">
                    {s.short}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {years.map((yr, i) => (
                <tr key={yr} className="border-t border-border text-foreground/85">
                  <th scope="row" className="px-3 py-1.5 text-left font-mono font-normal text-muted">
                    {yr}
                  </th>
                  {series.map((s) => (
                    <td key={s.key} className="px-3 py-1.5">
                      {format(opioidDeaths[s.key][i][index])}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </figure>
  );
}
