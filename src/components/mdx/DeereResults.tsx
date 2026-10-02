"use client";

import { useState } from "react";
import {
  Axes,
  BLUE,
  ChartTitle,
  Figure,
  GREEN,
  interp,
  LegendItem,
  linear,
  ORANGE,
  pathFrom,
  RED,
  Segmented,
  usd,
  VIOLET,
  YELLOW,
} from "./deereChart";
import { fitLines, pdpAge, pdpCountry, pdpEau, pdpWeight, predictedVsActual } from "./deerePricingData";

/* ------------------------------------------------------------------ */
/* Predicted vs actual                                                  */
/* ------------------------------------------------------------------ */

const zooms = ["All parts", "Under $100"] as const;
type Zoom = (typeof zooms)[number];

/** Test-set parts against the model's median line and price range (traced from the report). */
export function PredictedVsActual() {
  const [zoom, setZoom] = useState<Zoom>("All parts");
  const [hover, setHover] = useState<number | null>(null);
  const xMax = zoom === "All parts" ? 260 : 100;
  const yMax = zoom === "All parts" ? 320 : 130;

  const W = 520;
  const H = 320;
  const plot = { l: 44, r: W - 12, t: 12, b: H - 40 };
  const x = linear([0, xMax], [plot.l, plot.r]);
  const y = linear([0, yMax], [plot.b, plot.t]);
  const xs = Array.from({ length: 101 }, (_, i) => (i / 100) * xMax);
  const lineOf = (knots: [number, number][]) => pathFrom(xs.map((v) => [x(v), y(interp(knots, v))]));
  const band = `${lineOf(fitLines.upper)}${xs
    .slice()
    .reverse()
    .map((v) => `L${x(v).toFixed(1)},${y(interp(fitLines.lower, v)).toFixed(1)}`)
    .join("")}Z`;

  const status = (a: number, p: number) =>
    p > interp(fitLines.upper, a) ? "above" : p < interp(fitLines.lower, a) ? "below" : "inside";
  const outside = predictedVsActual.filter(([a, p]) => status(a, p) !== "inside").length;
  const ticksX = zoom === "All parts" ? [0, 50, 100, 150, 200, 250] : [0, 25, 50, 75, 100];
  const ticksY = zoom === "All parts" ? [0, 100, 200, 300] : [0, 25, 50, 75, 100, 125];
  const h = hover !== null ? predictedVsActual[hover] : null;

  return (
    <Figure caption="Each dot is a test-set part the model had never seen. Points are traced from the original report figure, which has many more overlapping parts in the dense cluster below $50.">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <ChartTitle title="Predicted vs. actual price" subtitle="Test set, 20% of parts held out from training" />
        <Segmented options={zooms} value={zoom} onChange={setZoom} label="Zoom" />
      </div>

      <div className="mt-4 grid gap-4">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="w-full"
          role="img"
          aria-label="Scatter of predicted against actual part price with the model's price band"
          onMouseLeave={() => setHover(null)}
        >
          <defs>
            <clipPath id="pva-clip">
              <rect x={plot.l} y={plot.t} width={plot.r - plot.l} height={plot.b - plot.t} />
            </clipPath>
          </defs>
          <Axes
            x={x}
            y={y}
            xTicks={ticksX}
            yTicks={ticksY}
            xFormat={(v) => `$${v}`}
            yFormat={(v) => `$${v}`}
            xLabel="Actual price"
            yLabel="Predicted price"
            plot={plot}
          />
          <g clipPath="url(#pva-clip)">
            <path d={band} fill={BLUE} fillOpacity="0.14" />
            <line x1={x(0)} y1={y(0)} x2={x(xMax)} y2={y(xMax)} stroke="var(--muted)" strokeDasharray="4 4" />
            <path d={lineOf(fitLines.median)} fill="none" stroke={BLUE} strokeWidth="2.5" />
            {predictedVsActual.map(([a, p], i) => {
              const s = status(a, p);
              return (
                <g key={i} onMouseEnter={() => setHover(i)} onFocus={() => setHover(i)}>
                  <circle cx={x(a)} cy={y(p)} r={9} fill="transparent" />
                  <circle
                    cx={x(a)}
                    cy={y(p)}
                    r={hover === i ? 5.5 : 3.75}
                    fill={s === "inside" ? VIOLET : ORANGE}
                    stroke={hover === i ? "var(--foreground)" : "var(--surface)"}
                    strokeWidth="1.25"
                  />
                </g>
              );
            })}
          </g>
          <text x={x(xMax * 0.86)} y={y(xMax * 0.86)} dx="-4" dy="-8" textAnchor="end" className="fill-muted text-[10px]">
            perfect prediction
          </text>
        </svg>

        <div className="grid items-start gap-3 text-sm sm:grid-cols-[1fr_11rem]" aria-live="polite">
          <div className="min-h-[6.5rem] rounded-lg border border-border bg-background/60 p-3 text-xs">
            {h ? (
              <>
                <p className="text-muted">Hovered part</p>
                <dl className="mt-1.5 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 tabular-nums">
                  <dt className="text-muted">Actual</dt>
                  <dd className="text-right text-foreground">{usd(h[0])}</dd>
                  <dt className="text-muted">Predicted</dt>
                  <dd className="text-right text-foreground">{usd(h[1])}</dd>
                  <dt className="text-muted">Range</dt>
                  <dd className="text-right text-foreground">
                    {usd(interp(fitLines.lower, h[0]), 0)}–{usd(interp(fitLines.upper, h[0]), 0)}
                  </dd>
                </dl>
                <p className="mt-2 text-muted">
                  {status(h[0], h[1]) === "inside"
                    ? "Inside the 80% range."
                    : `Prediction falls ${status(h[0], h[1])} the range: an unusual part or a model miss.`}
                </p>
              </>
            ) : (
              <p className="leading-relaxed text-muted">
                Hover a dot to see a part&apos;s actual and predicted price. Dots on the dashed diagonal were priced
                exactly right.
              </p>
            )}
          </div>
          <div className="rounded-lg border border-border bg-background/60 p-3">
            <p className="text-[11px] text-muted">Traced parts outside the range</p>
            <p className="text-2xl font-semibold tabular-nums text-foreground">
              {outside}
              <span className="text-sm font-normal text-muted"> / {predictedVsActual.length}</span>
            </p>
          </div>
          <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-muted order-first sm:col-span-full">
            <LegendItem color={BLUE} label="Median model" kind="line" />
            <LegendItem color={BLUE} label="80% range" kind="band" />
            <LegendItem color={ORANGE} label="Outside range" />
          </div>
        </div>
      </div>
    </Figure>
  );
}

/* ------------------------------------------------------------------ */
/* Feature importance                                                   */
/* ------------------------------------------------------------------ */

const importanceModels = ["Lower", "Median", "Upper"] as const;
type ImportanceModel = (typeof importanceModels)[number];

/** Importance shares read from the report's bar charts (each model sums to ~100%). */
const importance: { name: string; plain: string; Lower: number; Median: number; Upper: number }[] = [
  { name: "Part weight", plain: "heavier parts use more material and machine time", Lower: 0.47, Median: 0.675, Upper: 0.615 },
  { name: "Annual volume", plain: "volume discounts for high-usage parts", Lower: 0.16, Median: 0.086, Upper: 0.152 },
  { name: "Part age", plain: "when the part was first sourced", Lower: 0.158, Median: 0.12, Upper: 0.14 },
  { name: "Supplier", plain: "supplier-specific pricing", Lower: 0.099, Median: 0.07, Upper: 0.035 },
  { name: "Ordering factory", plain: "which John Deere factory buys it", Lower: 0.075, Median: 0.021, Upper: 0.03 },
  { name: "Ship-from country", plain: "regional labor and logistics costs", Lower: 0.041, Median: 0.031, Upper: 0.029 },
  { name: "Quote type", plain: "production vs. service", Lower: 0, Median: 0, Upper: 0 },
];

/** Share of each model's predictive power attributed to each feature. */
export function FeatureImportance() {
  const [model, setModel] = useState<ImportanceModel>("Median");
  const max = 0.7;
  return (
    <Figure caption="Feature importance measures how much each feature reduces prediction error across all the trees, as a share of the total. Values are read from the report's charts.">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <ChartTitle title="What drives the price estimate?" subtitle="Share of total feature importance" />
        <Segmented
          options={importanceModels}
          value={model}
          onChange={setModel}
          label="Model"
          render={(m) => `${m} model`}
        />
      </div>
      <div className="mt-5 space-y-3">
        {importance.map((f) => {
          const v = f[model];
          return (
            <div key={f.name} className="grid grid-cols-[7.5rem_1fr_3rem] items-center gap-3 sm:grid-cols-[10rem_1fr_3rem]">
              <span className="text-sm leading-tight text-foreground">
                {f.name}
                <span className="hidden text-[11px] text-muted sm:block">{f.plain}</span>
              </span>
              <div className="h-5 rounded-md bg-foreground/5">
                <div
                  className="h-full rounded-md transition-[width] duration-500 ease-out"
                  style={{ width: `${(v / max) * 100}%`, background: BLUE, opacity: 0.85 }}
                />
              </div>
              <span className="text-right text-sm tabular-nums text-foreground">{v ? `${Math.round(v * 100)}%` : "~0%"}</span>
            </div>
          );
        })}
      </div>
    </Figure>
  );
}

/* ------------------------------------------------------------------ */
/* Feature effects (partial dependence)                                 */
/* ------------------------------------------------------------------ */

const effectTabs = ["Weight", "Annual volume", "Part age", "Country"] as const;
type EffectTab = (typeof effectTabs)[number];

type NumericEffect = {
  points: [number, number][];
  trend: [number, number][];
  xMax: number;
  yRange: [number, number];
  xTicks: number[];
  yTicks: number[];
  xLabel: string;
  xFormat: (v: number) => string;
  readout: (x: number, y: number) => string;
  note: string;
};

const k = (v: number) => (v >= 1000 ? `${v / 1000}k` : String(v));

const numericEffects: Record<Exclude<EffectTab, "Country">, NumericEffect> = {
  Weight: {
    points: pdpWeight,
    trend: [
      [0, 0],
      [70, 396],
    ],
    xMax: 70,
    yRange: [-20, 650],
    xTicks: [0, 10, 20, 30, 40, 50, 60, 70],
    yTicks: [0, 200, 400, 600],
    xLabel: "Part weight (kg)",
    xFormat: String,
    readout: (x, y) => `A ${x.toFixed(0)} kg part adds about ${usd(y, 0)} to its predicted price.`,
    note: "A straight line: each extra kilogram adds roughly $5.65. Two very heavy parts (~320 kg) sit off the chart, below the line, so the effect tapers for the largest parts.",
  },
  "Annual volume": {
    points: pdpEau,
    trend: [
      [0, 2.2],
      [250, 1],
      [500, 0],
      [1000, -1],
      [2000, -1.4],
      [4000, -1.6],
      [10000, -1.8],
      [25000, -1.8],
    ],
    xMax: 10000,
    yRange: [-11, 27],
    xTicks: [0, 2000, 4000, 6000, 8000, 10000],
    yTicks: [-10, 0, 10, 20],
    xLabel: "Annual volume (parts per year)",
    xFormat: k,
    readout: (x, y) =>
      `At ${Math.round(x).toLocaleString("en-US")} parts/yr, the price shifts ${y >= 0 ? "up" : "down"} by about ${usd(Math.abs(y))}.`,
    note: "Low-volume parts carry a premium; it disappears at about 1,000 parts a year, after which extra volume barely matters. Parts above 10k/yr (off the chart) stay flat at about −$1.80.",
  },
  "Part age": {
    points: pdpAge,
    trend: [
      [0, 1],
      [1000, 1],
      [1500, 0.6],
      [2000, 0.2],
      [2500, 0],
      [4000, -0.1],
      [4500, -0.6],
      [5000, -0.8],
      [5500, -0.8],
      [6000, -0.6],
      [9000, -0.5],
    ],
    xMax: 9000,
    yRange: [-7, 17],
    xTicks: [0, 2000, 4000, 6000, 8000],
    yTicks: [-5, 0, 5, 10, 15],
    xLabel: "Days since the part was first sourced",
    xFormat: k,
    readout: (x, y) =>
      `A part first sourced ${(x / 365).toFixed(1)} years ago shifts ${y >= 0 ? "up" : "down"} by about ${usd(Math.abs(y))}.`,
    note: "A small effect: parts sourced in the last few years price slightly higher than long-running parts, consistent with older contracts locked in at older price levels.",
  },
};

const countryMedians: Record<string, number> = {
  CZ: -0.15, DE: -0.05, ES: -0.05, FR: -0.1, IT: -0.25, NL: -0.1, Other: 0, SK: 0.1, TR: 0.4, US: 0.75,
};
const countryNames: Record<string, string> = {
  CZ: "Czechia", DE: "Germany", ES: "Spain", FR: "France", IT: "Italy", NL: "Netherlands", Other: "Other", SK: "Slovakia", TR: "Türkiye", US: "United States",
};

/** How each feature pushes the predicted price up or down (upper model), traced from the report. */
export function FeatureEffects() {
  const [tab, setTab] = useState<EffectTab>("Weight");
  const [hx, setHx] = useState<number | null>(null);

  const W = 520;
  const H = 280;
  const plot = { l: 58, r: W - 12, t: 12, b: H - 40 };

  let body: React.ReactNode;
  let note: string;
  let readout: string;

  if (tab === "Country") {
    const cats = Object.keys(countryMedians);
    const band = (plot.r - plot.l) / cats.length;
    const x = (i: number) => plot.l + band * (i + 0.5);
    const y = linear([-4, 5], [plot.b, plot.t]);
    note = "Most countries sit near zero. Parts shipped from Türkiye and the US price slightly higher, Czechia and Italy slightly lower — a modest effect next to weight and volume.";
    readout =
      hx !== null
        ? `${countryNames[cats[hx]]}: typical shift of ${usd(countryMedians[cats[hx]])} (${pdpCountry[cats[hx]].length} traced parts).`
        : "Hover a country to see its typical effect.";
    body = (
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="Price effect by ship-from country" onMouseLeave={() => setHx(null)}>
        {[-4, -2, 0, 2, 4].map((t) => (
          <g key={t}>
            <line x1={plot.l} x2={plot.r} y1={y(t)} y2={y(t)} stroke={t === 0 ? "var(--muted)" : "var(--border)"} strokeOpacity={t === 0 ? 0.6 : 1} />
            <text x={plot.l - 6} y={y(t)} dy="0.32em" textAnchor="end" className="fill-muted text-[10px] tabular-nums">
              {t > 0 ? `+$${t}` : t < 0 ? `−$${-t}` : "$0"}
            </text>
          </g>
        ))}
        {cats.map((c, i) => (
          <g key={c} onMouseEnter={() => setHx(i)}>
            <rect x={x(i) - band / 2} y={plot.t} width={band} height={plot.b - plot.t} fill={hx === i ? "var(--foreground)" : "transparent"} fillOpacity="0.04" />
            {pdpCountry[c].map((v, j) => (
              <circle key={j} cx={x(i) + ((j % 5) - 2) * 3} cy={y(v)} r={3} fill={VIOLET} fillOpacity="0.75" stroke="var(--surface)" strokeWidth="1" />
            ))}
            <line x1={x(i) - 14} x2={x(i) + 14} y1={y(countryMedians[c])} y2={y(countryMedians[c])} stroke={BLUE} strokeWidth="3" strokeLinecap="round" />
            <text x={x(i)} y={plot.b + 15} textAnchor="middle" className="fill-muted text-[10px]">
              {c}
            </text>
          </g>
        ))}
        <text x={(plot.l + plot.r) / 2} y={plot.b + 32} textAnchor="middle" className="fill-muted text-[11px]">
          Ship-from country
        </text>
        <text x={11} y={(plot.t + plot.b) / 2} textAnchor="middle" className="fill-muted text-[11px]" transform={`rotate(-90 11 ${(plot.t + plot.b) / 2})`}>
          Effect on price
        </text>
      </svg>
    );
  } else {
    const e = numericEffects[tab];
    const x = linear([0, e.xMax], [plot.l, plot.r]);
    const y = linear(e.yRange, [plot.b, plot.t]);
    const xs = Array.from({ length: 121 }, (_, i) => (i / 120) * e.xMax);
    note = e.note;
    readout = hx !== null ? e.readout(hx, interp(e.trend, hx)) : "Hover the chart to read the trend line at any value.";
    body = (
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full touch-none"
        role="img"
        aria-label={`Effect of ${tab.toLowerCase()} on predicted price`}
        onMouseLeave={() => setHx(null)}
        onPointerMove={(ev) => {
          const r = ev.currentTarget.getBoundingClientRect();
          const px = ((ev.clientX - r.left) / r.width) * W;
          if (px < plot.l || px > plot.r) return setHx(null);
          setHx(((px - plot.l) / (plot.r - plot.l)) * e.xMax);
        }}
      >
        <defs>
          <clipPath id="fe-clip">
            <rect x={plot.l} y={plot.t} width={plot.r - plot.l} height={plot.b - plot.t} />
          </clipPath>
        </defs>
        <Axes
          x={x}
          y={y}
          xTicks={e.xTicks}
          yTicks={e.yTicks}
          xFormat={e.xFormat}
          yFormat={(v) => (v > 0 ? `+$${v}` : v < 0 ? `−$${-v}` : "$0")}
          xLabel={e.xLabel}
          yLabel="Effect on price"
          plot={plot}
        />
        <line x1={plot.l} x2={plot.r} y1={y(0)} y2={y(0)} stroke="var(--muted)" strokeOpacity="0.6" />
        <g clipPath="url(#fe-clip)">
          {e.points.map(([px, py], i) => (
            <circle key={i} cx={x(px)} cy={y(py)} r={2.75} fill={VIOLET} fillOpacity="0.6" />
          ))}
          <path d={pathFrom(xs.map((v) => [x(v), y(interp(e.trend, v))]))} fill="none" stroke={BLUE} strokeWidth="2.5" />
          {hx !== null && (
            <g>
              <line x1={x(hx)} x2={x(hx)} y1={plot.t} y2={plot.b} stroke="var(--foreground)" strokeOpacity="0.4" />
              <circle cx={x(hx)} cy={y(interp(e.trend, hx))} r={5} fill={BLUE} stroke="var(--surface)" strokeWidth="2" />
            </g>
          )}
        </g>
      </svg>
    );
  }

  return (
    <Figure caption="Partial dependence for the upper model. Each dot is a part; its height is how many dollars that one feature added to or removed from the part's predicted price. Points are traced from the report's figures.">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <ChartTitle title="How each feature moves the price" subtitle="Dollars added to (or removed from) the prediction" />
        <Segmented
          options={effectTabs}
          value={tab}
          onChange={(t) => {
            setTab(t);
            setHx(null);
          }}
          label="Feature"
        />
      </div>
      <div className="mt-4">{body}</div>
      <p className="mt-2 min-h-[1.25rem] text-center text-xs tabular-nums text-foreground" aria-live="polite">
        {readout}
      </p>
      <p className="mt-3 rounded-lg border border-border bg-background/60 px-4 py-3 text-sm text-muted">{note}</p>
    </Figure>
  );
}

/* ------------------------------------------------------------------ */
/* Error metrics                                                        */
/* ------------------------------------------------------------------ */

const examples = [
  { part: "Small washer plate", actual: 2, predicted: 3 },
  { part: "Mounting bracket", actual: 20, predicted: 17 },
  { part: "Frame rail", actual: 120, predicted: 132 },
];

/** Worked example of MAE and MAPE, then the headline comparison against the $3/kg rule of thumb. */
export function ErrorMetrics() {
  const rows = examples.map((e) => ({
    ...e,
    abs: Math.abs(e.predicted - e.actual),
    pct: Math.abs(e.predicted - e.actual) / e.actual,
  }));
  const mae = rows.reduce((a, r) => a + r.abs, 0) / rows.length;
  const mape = rows.reduce((a, r) => a + r.pct, 0) / rows.length;

  return (
    <Figure caption="Top: a three-part worked example. MAE is driven by expensive parts, MAPE by cheap ones. Bottom: the median model against a simple $3-per-kg rule of thumb on the test data.">
      <ChartTitle title="Reading the error metrics" subtitle="Worked example with three hypothetical parts" />
      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-sm tabular-nums">
          <caption className="sr-only">MAE and MAPE worked example</caption>
          <thead>
            <tr className="text-right text-xs text-muted">
              <th scope="col" className="pb-2 text-left font-medium">Part</th>
              <th scope="col" className="px-2 pb-2 font-medium">Actual</th>
              <th scope="col" className="px-2 pb-2 font-medium">Predicted</th>
              <th scope="col" className="px-2 pb-2 font-medium">$ off</th>
              <th scope="col" className="pb-2 font-medium">% off</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.part} className="border-t border-border text-right">
                <th scope="row" className="py-2 pr-2 text-left font-normal text-foreground">{r.part}</th>
                <td className="px-2 py-2 text-muted">{usd(r.actual)}</td>
                <td className="px-2 py-2 text-muted">{usd(r.predicted)}</td>
                <td className="px-2 py-2 text-foreground">{usd(r.abs)}</td>
                <td className="py-2 text-foreground">{Math.round(r.pct * 100)}%</td>
              </tr>
            ))}
            <tr className="border-t border-border text-right">
              <th scope="row" className="py-2 pr-2 text-left font-medium text-accent-2">Average</th>
              <td colSpan={2} />
              <td className="px-2 py-2 font-semibold text-accent-2">MAE {usd(mae)}</td>
              <td className="py-2 font-semibold text-accent-2">MAPE {Math.round(mape * 100)}%</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-xs leading-relaxed text-muted">
        Being $1 off on a $2 washer plate is a 50% miss, while being $12 off on a $120 frame rail is only 10%. That is
        why MAPE looks harsh for inexpensive parts even when the dollar error is tiny.
      </p>

      <div className="mt-5 grid gap-3 border-t border-border pt-5 sm:grid-cols-2">
        {[
          { label: "Mean absolute % error (MAPE)", ml: 43.57, ref: 68.4, fmt: (v: number) => `${v.toFixed(1)}%` },
          { label: "Mean absolute error (MAE)", ml: 5.56, ref: 8.04, fmt: (v: number) => usd(v) },
        ].map((m) => (
          <div key={m.label} className="rounded-lg border border-border bg-background/60 p-3">
            <p className="text-xs text-muted">{m.label}</p>
            <div className="mt-2 space-y-2">
              {[
                { name: "ML median model", v: m.ml, color: BLUE },
                { name: "$3/kg rule", v: m.ref, color: ORANGE },
              ].map((b) => (
                <div key={b.name} className="grid grid-cols-[6.5rem_1fr_3.5rem] items-center gap-2 text-xs">
                  <span className="text-foreground/85">{b.name}</span>
                  <div className="h-3 rounded-sm bg-foreground/5">
                    <div className="h-full rounded-sm" style={{ width: `${(b.v / m.ref) * 100}%`, background: b.color, opacity: 0.85 }} />
                  </div>
                  <span className="text-right font-semibold tabular-nums text-foreground">{m.fmt(b.v)}</span>
                </div>
              ))}
            </div>
            <p className="mt-2 text-[11px] text-muted">
              {Math.round((1 - m.ml / m.ref) * 100)}% lower error than the rule of thumb
            </p>
          </div>
        ))}
      </div>
    </Figure>
  );
}

/* ------------------------------------------------------------------ */
/* Error by segment                                                     */
/* ------------------------------------------------------------------ */

type BinRow = { bin: string; mape: number; mae: number; refMape: number; refMae: number; n: number };

const bins: Record<string, BinRow[]> = {
  "Price ($)": [
    { bin: "$0–5", mape: 57.35, mae: 1.13, refMape: 71.77, refMae: 1.94, n: 1295 },
    { bin: "$5–25", mape: 31.79, mae: 3.47, refMape: 67.13, refMae: 6.8, n: 1446 },
    { bin: "$25–50", mape: 36.24, mae: 12.82, refMape: 56.79, refMae: 19.88, n: 203 },
    { bin: "$50–100", mape: 45.85, mae: 30.97, refMape: 68.69, refMae: 45.33, n: 94 },
    { bin: "$100+", mape: 57.07, mae: 149.21, refMape: 62.79, refMae: 119.2, n: 34 },
  ],
  "Weight (kg)": [
    { bin: "0–5 kg", mape: 43.06, mae: 4.01, refMape: 66.44, refMae: 6.44, n: 2852 },
    { bin: "5–10 kg", mape: 38.18, mae: 13.25, refMape: 47.14, refMae: 18.54, n: 121 },
    { bin: "10–20 kg", mape: 24.23, mae: 15.75, refMape: 38.12, refMae: 25.98, n: 71 },
    { bin: "20–30 kg", mape: 30.64, mae: 53.7, refMape: 38.15, refMae: 63.05, n: 12 },
    { bin: "30–40 kg", mape: 229.15, mae: 27.76, refMape: 278.64, refMae: 43.53, n: 8 },
    { bin: "40–50 kg", mape: 6.92, mae: 14.24, refMape: 41.5, refMae: 85.33, n: 1 },
    { bin: "50–100 kg", mape: 30.15, mae: 48.69, refMape: 26.3, refMae: 36.65, n: 3 },
    { bin: "100+ kg", mape: 598.93, mae: 470.78, refMape: 2355.96, refMae: 236.47, n: 4 },
  ],
  "Price per kg": [
    { bin: "$0–1/kg", mape: 706.49, mae: 17.4, refMape: 770.47, refMae: 35.68, n: 31 },
    { bin: "$1–2/kg", mape: 200.24, mae: 4.41, refMape: 99.07, refMae: 4.52, n: 54 },
    { bin: "$2–3/kg", mape: 67, mae: 8.98, refMape: 20.02, refMae: 2.68, n: 143 },
    { bin: "$3–4/kg", mape: 40.19, mae: 6.59, refMape: 13.85, refMae: 2.49, n: 231 },
    { bin: "$4–5/kg", mape: 33.39, mae: 2.13, refMape: 33.14, refMae: 3.98, n: 269 },
    { bin: "$5–6/kg", mape: 26.66, mae: 2.14, refMape: 45.5, refMae: 5.87, n: 256 },
    { bin: "$6–7/kg", mape: 21.82, mae: 2.31, refMape: 53.56, refMae: 6.26, n: 246 },
    { bin: "$7–8/kg", mape: 21.04, mae: 2.59, refMape: 59.89, refMae: 6.46, n: 223 },
    { bin: "$8–9/kg", mape: 19.42, mae: 2.97, refMape: 64.51, refMae: 6.96, n: 172 },
    { bin: "$9–10/kg", mape: 21.42, mae: 2.9, refMape: 68.36, refMae: 6.25, n: 161 },
  ],
};
const binTabs = Object.keys(bins) as (keyof typeof bins)[];
const metrics = ["MAPE", "MAE"] as const;
type Metric = (typeof metrics)[number];
const SMALL_N = 15;

const binNotes: Record<string, string> = {
  "Price ($)": "The model has lower percentage error than the rule of thumb in every price band. The one miss is dollar error for the 34 parts over $100, which are hard to price from weight alone.",
  "Weight (kg)": "Over 90% of parts weigh under 5 kg. Heavier bands hold only a handful of parts each, so their errors swing widely.",
  "Price per kg":
    "When a part really does cost about $2–4 per kg, the $3/kg rule is nearly right by definition. For everything else — especially pricier-per-kg parts — the model is far closer.",
};

/** Error for the ML model vs. the $3/kg rule within segments of the inference data. */
export function ErrorByBin() {
  const [tab, setTab] = useState<string>("Price ($)");
  const [metric, setMetric] = useState<Metric>("MAPE");
  const rows = bins[tab];
  const cap = metric === "MAPE" ? 150 : 160;
  const fmt = (v: number) => (metric === "MAPE" ? `${v >= 100 ? Math.round(v) : v.toFixed(1)}%` : usd(v, v >= 100 ? 0 : 2));

  return (
    <Figure caption="Error by segment on the larger inference dataset (3,072 parts). Lower is better. Bars beyond the axis are cut off and marked with an arrow; faded rows have fewer than 15 parts.">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <ChartTitle title="Where the model does well, and where it struggles" subtitle="ML median model vs. $3/kg rule" />
        <div className="flex flex-wrap gap-2">
          <Segmented options={binTabs} value={tab} onChange={setTab} label="Segment by" />
          <Segmented options={metrics} value={metric} onChange={setMetric} label="Metric" />
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
        <LegendItem color={BLUE} label="ML median model" />
        <LegendItem color={ORANGE} label="$3/kg rule" />
      </div>
      <div className="mt-4 space-y-3">
        {rows.map((r) => {
          const vals = metric === "MAPE" ? [r.mape, r.refMape] : [r.mae, r.refMae];
          const small = r.n < SMALL_N;
          const better = vals[0] <= vals[1];
          return (
            <div
              key={r.bin}
              className={`grid grid-cols-[5.5rem_1fr] items-center gap-3 sm:grid-cols-[6.5rem_1fr] ${small ? "opacity-45" : ""}`}
            >
              <span className="text-sm leading-tight text-foreground">
                {r.bin}
                <span className="block text-[11px] tabular-nums text-muted">n={r.n.toLocaleString("en-US")}</span>
              </span>
              <div className="space-y-0.5">
                {vals.map((v, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <div className="relative h-2.5 flex-1 rounded-sm bg-foreground/5">
                      <div
                        className="h-full rounded-sm transition-[width] duration-500 ease-out"
                        style={{ width: `${(Math.min(v, cap) / cap) * 100}%`, background: i ? ORANGE : BLUE, opacity: 0.85 }}
                      />
                      {v > cap && <span className="absolute -right-1 top-1/2 -translate-y-1/2 text-[10px] text-foreground">▸</span>}
                    </div>
                    <span
                      className={`w-14 text-right text-xs tabular-nums ${i === 0 && better ? "font-semibold text-foreground" : "text-muted"}`}
                    >
                      {fmt(v)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
      <p className="mt-5 rounded-lg border border-border bg-background/60 px-4 py-3 text-sm text-muted">{binNotes[tab]}</p>
    </Figure>
  );
}

/* ------------------------------------------------------------------ */
/* Savings calculator                                                   */
/* ------------------------------------------------------------------ */

const examplePart = { name: "Welded steel bracket", weight: 2.4, eau: 1500, low: 9.1, median: 13.4, upper: 18.2 };

/** Compare a hypothetical part's actual price to its estimated range and size the negotiation opportunity. */
export function SavingsCalculator() {
  const [actual, setActual] = useState(21.5);
  const p = examplePart;
  const min = 5;
  const max = 30;
  const pos = (v: number) => `${((v - min) / (max - min)) * 100}%`;

  const zone =
    actual > p.upper
      ? { label: "Above range", color: RED, text: "Priced above the upper estimate. A strong candidate to renegotiate or re-quote." }
      : actual > p.median
        ? { label: "Above median", color: YELLOW, text: "Within range, but above the typical price. Worth a conversation, lower priority." }
        : actual >= p.low
          ? { label: "In range", color: GREEN, text: "Priced at or below what similar parts typically cost. No action needed." }
          : { label: "Below range", color: BLUE, text: "Unusually cheap. Worth checking the part data, or a sign of a very competitive supplier." };

  const perPartHi = Math.max(0, actual - p.median);
  const perPartLo = Math.max(0, actual - p.upper);

  return (
    <Figure caption="A hypothetical part for illustration. Savings are sized conservatively (down to the upper estimate) and optimistically (down to the median), then multiplied by annual volume.">
      <ChartTitle
        title="Is this part overpriced?"
        subtitle={`${p.name} · ${p.weight} kg · ${p.eau.toLocaleString("en-US")} parts/yr`}
      />

      <label className="mt-4 flex items-center gap-3 text-sm">
        <span className="w-32 shrink-0 text-muted">
          Price paid: <span className="font-semibold tabular-nums text-foreground">{usd(actual)}</span>
        </span>
        <input
          type="range"
          min={min}
          max={max}
          step={0.1}
          value={actual}
          onChange={(e) => setActual(Number(e.target.value))}
          className="w-full accent-[#3987e5]"
          aria-label="Price currently paid per part"
        />
      </label>

      <div className="mt-6 px-1">
        <div className="relative h-8 rounded-md bg-foreground/5">
          <div className="absolute inset-y-0 rounded-md" style={{ left: pos(p.low), width: `calc(${pos(p.upper)} - ${pos(p.low)})`, background: BLUE, opacity: 0.22 }} />
          <div className="absolute inset-y-0 w-0.5 bg-[#3987e5]" style={{ left: pos(p.median) }} />
          <div
            className="absolute -inset-y-1.5 w-1 -translate-x-1/2 rounded-full shadow transition-[left] duration-150"
            style={{ left: pos(actual), background: zone.color }}
          />
        </div>
        <div className="relative mt-1.5 h-8 text-[11px] tabular-nums text-muted">
          {[
            ["Low", p.low],
            ["Median", p.median],
            ["Upper", p.upper],
          ].map(([l, v]) => (
            <span key={l as string} className="absolute -translate-x-1/2 text-center leading-tight" style={{ left: pos(v as number) }}>
              {l}
              <span className="block text-foreground">{usd(v as number)}</span>
            </span>
          ))}
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_1fr]" aria-live="polite">
        <div className="rounded-lg border border-border bg-background/60 p-3">
          <span
            className="inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide"
            style={{ color: zone.color, borderColor: `${zone.color}66`, background: `${zone.color}1a` }}
          >
            <span className="size-1.5 rounded-full" style={{ background: zone.color }} />
            {zone.label}
          </span>
          <p className="mt-2 text-xs leading-relaxed text-muted">{zone.text}</p>
        </div>
        <div className="rounded-lg border border-border bg-background/60 p-3">
          <p className="text-[11px] text-muted">Potential annual savings</p>
          <p className="text-2xl font-semibold tabular-nums text-foreground">
            {perPartHi === 0 ? "$0" : `${usd(perPartLo * p.eau, 0)} – ${usd(perPartHi * p.eau, 0)}`}
          </p>
          <p className="text-[11px] tabular-nums text-muted">
            {perPartHi === 0
              ? "Price is at or below the median estimate"
              : `${usd(perPartLo)}–${usd(perPartHi)} per part × ${p.eau.toLocaleString("en-US")} parts/yr`}
          </p>
        </div>
      </div>
    </Figure>
  );
}
