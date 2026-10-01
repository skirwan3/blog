"use client";

import { useId, useLayoutEffect, useRef, useState } from "react";

export type LineSeries = {
  key: string;
  label: string;
  color: string;
  values: number[];
};

type Props = {
  title: string;
  subtitle?: string;
  months: { long: string; short: string }[];
  series: LineSeries[];
  yTicks: number[];
  format: (v: number) => string;
  /** Axis tick format; defaults to `format`. */
  tickFormat?: (v: number) => string;
  /** Optional per-month counts drawn as a small bar strip under the chart (its own scale). */
  counts?: { label: string; values: number[] };
  /** Optional vertical marker, e.g. when an intervention started. */
  marker?: { index: number; label: string };
  /** Extra tooltip rows for a given month. */
  extra?: (i: number) => { label: string; value: string }[];
  caption?: React.ReactNode;
  children?: React.ReactNode;
};

const HEIGHT = 240;
const STRIP = 44;

/** Interactive line chart over months with a snapping crosshair, tooltip, and data table. */
export function MonthlyLineChart({
  title,
  subtitle,
  months,
  series,
  yTicks,
  format,
  tickFormat = format,
  counts,
  marker,
  extra,
  caption,
  children,
}: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(640);
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

  const n = months.length;
  const last = n - 1;
  const compact = width < 480;
  const endLabels = series.length > 1 && !compact;
  const m = { top: 14, right: endLabels ? 92 : 14, bottom: 26, left: 44 };
  const innerW = Math.max(width - m.left - m.right, 10);
  const plotH = HEIGHT - m.top - m.bottom;
  const totalH = HEIGHT + (counts ? STRIP + 8 : 0);
  const inset = Math.min(18, innerW / (n * 2));
  const yMin = yTicks[0];
  const yMax = yTicks[yTicks.length - 1];

  const x = (i: number) => inset + (n === 1 ? 0 : (i / last) * (innerW - inset * 2));
  const y = (v: number) => plotH - ((v - yMin) / (yMax - yMin)) * plotH;

  const step = compact ? Math.ceil(n / 4) : Math.ceil(n / 7);
  const xTicks = months.map((_, i) => i).filter((i) => i % step === 0);
  const tickLabel = (i: number) => (n > 8 ? months[i].short : months[i].long);

  const showDots = n <= 12;
  const countMax = counts ? Math.max(...counts.values) : 1;
  const barW = Math.max(3, Math.min(14, (innerW / n) * 0.45));

  function onPointerMove(e: React.PointerEvent<SVGRectElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const i = Math.round(((px - inset) / (innerW - inset * 2)) * last);
    setActive(Math.min(last, Math.max(0, i)));
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
      e.preventDefault();
      const d = e.key === "ArrowRight" ? 1 : -1;
      setActive((a) => Math.min(last, Math.max(0, (a ?? (d > 0 ? -1 : n)) + d)));
    } else if (e.key === "Escape") setActive(null);
  }

  const rows =
    active === null
      ? []
      : [
          ...series.map((s) => ({ key: s.key, color: s.color, label: s.label, value: format(s.values[active]) })),
          ...(extra?.(active) ?? []).map((r) => ({ key: r.label, color: undefined, ...r })),
          ...(counts ? [{ key: "count", color: undefined, label: counts.label, value: String(counts.values[active]) }] : []),
        ];
  const tipLeft = active !== null && x(active) > innerW * 0.55;

  // Spread end labels so they never collide.
  const endY = series
    .map((s) => ({ key: s.key, y: y(s.values[last]) }))
    .sort((a, b) => a.y - b.y);
  for (let i = 1; i < endY.length; i++) endY[i].y = Math.max(endY[i].y, endY[i - 1].y + 15);
  const endYByKey = Object.fromEntries(endY.map((d) => [d.key, d.y]));

  return (
    <figure className="not-prose my-10 rounded-xl border border-border bg-surface p-4 sm:p-5">
      <figcaption id={titleId} className="text-[0.95rem] font-semibold leading-snug text-foreground">
        {title}
        {subtitle && <span className="block text-sm font-normal text-muted">{subtitle}</span>}
      </figcaption>

      {series.length > 1 && (
        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-foreground/85">
          {series.map((s) => (
            <span key={s.key} className="flex items-center gap-2">
              <svg width="16" height="8" aria-hidden>
                <line x1="0" x2="16" y1="4" y2="4" stroke={s.color} strokeWidth="2" />
              </svg>
              {s.label}
            </span>
          ))}
        </div>
      )}

      {children}

      <div ref={wrapRef} className="relative mt-3 min-w-0 overflow-hidden">
        <svg
          width={width}
          height={totalH}
          className="block rounded-md outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent/60"
          tabIndex={0}
          role="group"
          aria-labelledby={titleId}
          aria-describedby={`${titleId}-hint`}
          onKeyDown={onKeyDown}
          onBlur={() => setActive(null)}
        >
          <g transform={`translate(${m.left},${m.top})`}>
            {yTicks.map((t) => (
              <g key={t} transform={`translate(0,${y(t)})`}>
                <line x2={innerW} stroke={t === 0 ? "#2c3144" : "var(--border)"} />
                <text x={-8} dy="0.32em" textAnchor="end" className="fill-muted text-[11px] tabular-nums">
                  {tickFormat(t)}
                </text>
              </g>
            ))}

            {marker && (
              <g transform={`translate(${x(marker.index)},0)`}>
                <line y1={-4} y2={plotH} stroke="var(--accent)" strokeDasharray="3 4" strokeOpacity="0.8" />
                <text
                  x={6}
                  y={6}
                  className="fill-accent text-[11px] font-medium"
                  textAnchor={x(marker.index) > innerW * 0.7 ? "end" : "start"}
                  dx={x(marker.index) > innerW * 0.7 ? -12 : 0}
                >
                  {marker.label}
                </text>
              </g>
            )}

            {series.map((s) => (
              <g key={s.key}>
                <path
                  d={s.values.map((v, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join("")}
                  fill="none"
                  stroke={s.color}
                  strokeWidth={2}
                  strokeLinejoin="round"
                  strokeLinecap="round"
                />
                {showDots &&
                  s.values.map((v, i) => (
                    <circle key={i} cx={x(i)} cy={y(v)} r={3.5} fill={s.color} stroke="var(--surface)" strokeWidth={2} />
                  ))}
                {endLabels && (
                  <text x={x(last) + 10} y={endYByKey[s.key]} dy="0.32em" className="text-[11px]">
                    <tspan className="fill-foreground font-semibold tabular-nums">{format(s.values[last])}</tspan>
                    <tspan className="fill-muted"> {s.label.split(" ").pop()}</tspan>
                  </text>
                )}
              </g>
            ))}

            {xTicks.map((i) => (
              <text key={i} x={x(i)} y={plotH + 18} textAnchor="middle" className="fill-muted text-[11px] tabular-nums">
                {tickLabel(i)}
              </text>
            ))}

            {counts && (
              <g transform={`translate(0,${plotH + m.bottom + 6})`}>
                <text x={-8} y={STRIP / 2} dy="0.32em" textAnchor="end" className="fill-muted text-[10px]">
                  n
                </text>
                {counts.values.map((c, i) => {
                  const h = (c / countMax) * (STRIP - 4);
                  return (
                    <rect
                      key={i}
                      x={x(i) - barW / 2}
                      y={STRIP - h}
                      width={barW}
                      height={h}
                      rx={Math.min(3, barW / 2)}
                      className={active === i ? "fill-foreground/45" : "fill-foreground/15"}
                    />
                  );
                })}
              </g>
            )}

            {active !== null && (
              <g pointerEvents="none">
                <line x1={x(active)} x2={x(active)} y2={plotH} stroke="var(--muted)" strokeOpacity="0.5" />
                {series.map((s) => (
                  <circle
                    key={s.key}
                    cx={x(active)}
                    cy={y(s.values[active])}
                    r={5}
                    fill={s.color}
                    stroke="var(--surface)"
                    strokeWidth={2}
                  />
                ))}
              </g>
            )}

            <rect
              width={innerW}
              height={totalH - m.top}
              fill="transparent"
              onPointerMove={onPointerMove}
              onPointerDown={onPointerMove}
              onPointerLeave={() => setActive(null)}
            />
          </g>
        </svg>

        {active !== null && (
          <div
            className="pointer-events-none absolute top-1 z-10 min-w-40 rounded-lg border border-border bg-background/95 px-3 py-2 text-xs shadow-xl backdrop-blur"
            style={tipLeft ? { right: width - (m.left + x(active)) + 12 } : { left: m.left + x(active) + 12 }}
          >
            <p className="mb-1.5 font-mono text-muted">{months[active].long}</p>
            <ul className="space-y-1">
              {rows.map((r) => (
                <li key={r.key} className="flex items-center gap-2">
                  {r.color ? (
                    <svg width="12" height="6" aria-hidden className="shrink-0">
                      <line x1="0" x2="12" y1="3" y2="3" stroke={r.color} strokeWidth="2" />
                    </svg>
                  ) : (
                    <span className="w-3 shrink-0" />
                  )}
                  <span className="font-semibold tabular-nums text-foreground">{r.value}</span>
                  <span className="text-muted">{r.label}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <p id={`${titleId}-hint`} className="sr-only">
        Use the left and right arrow keys to step through months.
      </p>
      <p className="sr-only" aria-live="polite">
        {active !== null && `${months[active].long}: ${rows.map((r) => `${r.label} ${r.value}`).join(", ")}`}
      </p>

      <div className="mt-2 flex flex-wrap items-baseline justify-between gap-2 text-xs text-muted">
        <p>{caption}</p>
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
        <div className="mt-3 max-h-72 overflow-auto rounded-lg border border-border">
          <table className="w-full text-right text-xs tabular-nums">
            <thead className="sticky top-0 bg-surface text-muted">
              <tr>
                <th scope="col" className="px-3 py-2 text-left font-medium">Month</th>
                {series.map((s) => (
                  <th key={s.key} scope="col" className="px-3 py-2 font-medium">
                    {s.label}
                  </th>
                ))}
                {counts && (
                  <th scope="col" className="px-3 py-2 font-medium">
                    {counts.label}
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              {months.map((mo, i) => (
                <tr key={mo.long} className="border-t border-border text-foreground/85">
                  <th scope="row" className="px-3 py-1.5 text-left font-mono font-normal text-muted">
                    {mo.long}
                  </th>
                  {series.map((s) => (
                    <td key={s.key} className="px-3 py-1.5">
                      {format(s.values[i])}
                    </td>
                  ))}
                  {counts && <td className="px-3 py-1.5">{counts.values[i]}</td>}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </figure>
  );
}
