"use client";

import { useMemo, useState } from "react";
import {
  Axes,
  BLUE,
  ChartTitle,
  Figure,
  gaussian,
  LegendItem,
  linear,
  mulberry32,
  ORANGE,
  pathFrom,
  Segmented,
  usd,
  VIOLET,
} from "./deereChart";

/* ------------------------------------------------------------------ */
/* Data sources and features                                            */
/* ------------------------------------------------------------------ */

const features: { name: string; field: string; kind: "Number" | "Category"; plain: string; source: string }[] = [
  { name: "Part weight", field: "net_wght", kind: "Number", plain: "How heavy the finished part is (kg)", source: "Part weights" },
  {
    name: "Annual volume",
    field: "mth1_mth12_qty",
    kind: "Number",
    plain: "Expected annual usage (EAU): how many the factory expects to buy per year",
    source: "Schedule agreements",
  },
  {
    name: "Part age",
    field: "unit_cd_age_days_min",
    kind: "Number",
    plain: "Days since the part was first sourced",
    source: "Schedule agreements",
  },
  { name: "Supplier", field: "ord_frm_splr_cs_cd", kind: "Category", plain: "Which supplier the part is ordered from", source: "Schedule agreements" },
  { name: "Ordering factory", field: "unit_cd", kind: "Category", plain: "Which John Deere factory buys the part", source: "Schedule agreements" },
  { name: "Ship-from country", field: "shp_frm_cntry", kind: "Category", plain: "Country the part ships from", source: "Supplier metadata" },
  { name: "Quote type", field: "quote_type", kind: "Category", plain: "Production or service (spare-parts) quote", source: "Schedule agreements" },
];

const filters = [
  "European factories only",
  "Parts with active demand (annual volume > 0)",
  "Consistent units (priced per piece, weight in kg)",
  "Price-per-kg outliers removed (1.5 × IQR rule)",
];

/** The three data sources, the cleaning filters and the seven model features. */
export function PricingFeatures() {
  return (
    <Figure caption="Three internal datasets were joined at the part level, cleaned, and reduced to seven features. The target the model learns is each part's unit price in USD.">
      <div className="grid gap-3 sm:grid-cols-3">
        {[
          ["Schedule agreements", "Active purchase contracts: part, factory, supplier, price, volume, start date"],
          ["Supplier metadata", "Supplier names and the country each one operates from"],
          ["Part weights", "Net weight of each part and its unit of measure"],
        ].map(([title, body]) => (
          <div key={title} className="rounded-lg border border-border bg-background/40 p-3">
            <p className="text-xs font-medium text-accent-2">{title}</p>
            <p className="mt-1 text-xs leading-relaxed text-muted">{body}</p>
          </div>
        ))}
      </div>

      <div className="mt-3 rounded-lg border border-border bg-background/40 p-3">
        <p className="text-xs font-medium text-accent-2">Cleaning filters</p>
        <ul className="mt-2 grid list-none! gap-1.5 pl-0! text-xs text-foreground/85 sm:grid-cols-2">
          {filters.map((f) => (
            <li key={f} className="flex gap-2">
              <span className="text-muted">✓</span>
              {f}
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-sm">
          <caption className="sr-only">Model features</caption>
          <thead>
            <tr className="text-left text-xs text-muted">
              <th scope="col" className="pb-2 font-medium">Feature</th>
              <th scope="col" className="px-3 pb-2 font-medium">What it means</th>
              <th scope="col" className="pb-2 text-right font-medium">Type</th>
            </tr>
          </thead>
          <tbody>
            {features.map((f) => (
              <tr key={f.field} className="border-t border-border align-top">
                <th scope="row" className="py-2.5 pr-2 text-left font-normal">
                  <span className="block text-foreground">{f.name}</span>
                  <span className="font-mono text-[11px] text-muted">{f.field}</span>
                </th>
                <td className="px-3 py-2.5 text-foreground/80">{f.plain}</td>
                <td className="py-2.5 text-right">
                  <span
                    className={`inline-block rounded-full border px-2 py-0.5 text-[11px] ${
                      f.kind === "Number" ? "border-accent-2/30 bg-accent-2/10 text-accent-2" : "border-border text-muted"
                    }`}
                  >
                    {f.kind}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Figure>
  );
}

/* ------------------------------------------------------------------ */
/* Gradient boosting explainer                                          */
/* ------------------------------------------------------------------ */

type Part = { w: number; price: number; test: boolean };

const round2 = (v: number) => Math.round(v * 100) / 100;

/** Simulated parts: price rises with weight (a little less than proportionally) plus supplier-to-supplier noise. */
const simParts: Part[] = (() => {
  const rand = mulberry32(11);
  return Array.from({ length: 44 }, (_, i) => {
    const w = 0.4 + 11.2 * Math.pow(rand(), 1.15);
    const price = (3 + 5.4 * w - 0.13 * w * w) * Math.exp(0.2 * gaussian(rand));
    // Rounded so server and browser render identical coordinates
    return { w: round2(w), price: round2(price), test: i % 4 === 3 };
  });
})();

type Stump = { split: number; left: number; right: number };

/** Fit a one-split tree (stump) to the residuals: pick the split that best separates over- and under-priced parts. */
function fitStump(xs: number[], rs: number[]): Stump {
  const order = xs.map((_, i) => i).sort((a, b) => xs[a] - xs[b]);
  let best: Stump & { sse: number } = { split: 0, left: 0, right: 0, sse: Infinity };
  for (let k = 1; k < order.length; k++) {
    const l = order.slice(0, k).map((i) => rs[i]);
    const r = order.slice(k).map((i) => rs[i]);
    const ml = l.reduce((a, b) => a + b, 0) / l.length;
    const mr = r.reduce((a, b) => a + b, 0) / r.length;
    const sse = l.reduce((a, v) => a + (v - ml) ** 2, 0) + r.reduce((a, v) => a + (v - mr) ** 2, 0);
    if (sse < best.sse) best = { split: (xs[order[k - 1]] + xs[order[k]]) / 2, left: ml, right: mr, sse };
  }
  return { split: best.split, left: best.left, right: best.right };
}

const MAX_TREES = 60;
const move = (v: number) => `${v >= 0 ? "up" : "down"} ${usd(Math.abs(v))}`;
const rates = ["0.1", "0.3", "1.0"] as const;
type Rate = (typeof rates)[number];

function boost(lr: number) {
  const train = simParts.filter((p) => !p.test);
  const test = simParts.filter((p) => p.test);
  const base = train.reduce((a, p) => a + p.price, 0) / train.length;
  const stumps: Stump[] = [];
  const predict = (w: number, m: number) =>
    stumps.slice(0, m).reduce((a, s) => a + lr * (w < s.split ? s.left : s.right), base);
  const mae = (set: Part[], m: number) => set.reduce((a, p) => a + Math.abs(p.price - predict(p.w, m)), 0) / set.length;
  const trainMae = [mae(train, 0)];
  const testMae = [mae(test, 0)];
  for (let m = 1; m <= MAX_TREES; m++) {
    const rs = train.map((p) => p.price - predict(p.w, m - 1));
    stumps.push(fitStump(train.map((p) => p.w), rs));
    trainMae.push(mae(train, m));
    testMae.push(mae(test, m));
  }
  return { base, stumps, predict, trainMae, testMae };
}

/** Step-by-step gradient boosting on one feature (weight), with a held-out test set. */
export function BoostingExplainer() {
  const [rate, setRate] = useState<Rate>("0.3");
  const [trees, setTrees] = useState(3);
  const lr = Number(rate);
  const model = useMemo(() => boost(lr), [lr]);

  const W = 520;
  const H = 280;
  const plot = { l: 44, r: W - 12, t: 12, b: H - 40 };
  const x = linear([0, 12], [plot.l, plot.r]);
  const y = linear([0, 60], [plot.b, plot.t]);
  const grid = Array.from({ length: 241 }, (_, i) => i * 0.05);
  const line = pathFrom(grid.map((w) => [x(w), y(Math.max(0, Math.min(60, model.predict(w, trees))))]));

  const last = trees > 0 ? model.stumps[trees - 1] : null;
  const trainMae = model.trainMae[trees];
  const testMae = model.testMae[trees];

  // Mini error curve
  const mW = 220;
  const mH = 120;
  const mp = { l: 30, r: mW - 6, t: 8, b: mH - 22 };
  const mx = linear([0, MAX_TREES], [mp.l, mp.r]);
  const maxErr = Math.max(...model.trainMae, ...model.testMae);
  const my = linear([0, maxErr * 1.05], [mp.b, mp.t]);
  const curve = (arr: number[]) => pathFrom(arr.map((v, i) => [mx(i), my(v)]));

  return (
    <Figure
      caption={
        <>
          Simulated parts, one feature. Each new tree is a single yes/no question about weight, fit to whatever error
          is left over. Hollow dots are held-out test parts the model never trains on. Try a learning rate of 1.0 with
          60 trees to see training error keep falling while test error stops improving.
        </>
      }
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <ChartTitle title="Gradient boosting, one tree at a time" subtitle="Predicting part price from weight" />
        <div className="flex items-center gap-2 text-xs text-muted">
          Learning rate
          <Segmented options={rates} value={rate} onChange={setRate} label="Learning rate" />
        </div>
      </div>

      <label className="mt-4 flex items-center gap-3 text-sm">
        <span className="w-24 shrink-0 text-muted">
          Trees: <span className="font-semibold tabular-nums text-foreground">{trees}</span>
        </span>
        <input
          type="range"
          min={0}
          max={MAX_TREES}
          value={trees}
          onChange={(e) => setTrees(Number(e.target.value))}
          className="w-full accent-[#3987e5]"
          aria-label="Number of trees"
        />
      </label>

      <div className="mt-3 grid gap-4">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label={`Boosted prediction line after ${trees} trees`}>
          <Axes
            x={x}
            y={y}
            xTicks={[0, 2, 4, 6, 8, 10, 12]}
            yTicks={[0, 20, 40, 60]}
            yFormat={(v) => `$${v}`}
            xLabel="Part weight (kg)"
            yLabel="Unit price"
            plot={plot}
          />
          {simParts.map((p, i) => {
            const pred = model.predict(p.w, trees);
            return (
              <line
                key={`r${i}`}
                x1={x(p.w)}
                x2={x(p.w)}
                y1={y(p.price)}
                y2={y(Math.max(0, Math.min(60, pred)))}
                stroke={p.test ? ORANGE : "var(--muted)"}
                strokeOpacity={p.test ? 0.5 : 0.35}
              />
            );
          })}
          <path d={line} fill="none" stroke={BLUE} strokeWidth="2.5" strokeLinejoin="round" />
          {simParts.map((p, i) => (
            <circle
              key={i}
              cx={x(p.w)}
              cy={y(p.price)}
              r={4}
              fill={p.test ? "var(--surface)" : VIOLET}
              stroke={p.test ? ORANGE : "var(--surface)"}
              strokeWidth={p.test ? 1.75 : 1.5}
            />
          ))}
          {last && (
            <line
              x1={x(last.split)}
              x2={x(last.split)}
              y1={plot.t}
              y2={plot.b}
              stroke={ORANGE}
              strokeDasharray="3 4"
              strokeOpacity="0.8"
            />
          )}
        </svg>

        <div className="grid items-start gap-3 text-sm sm:grid-cols-3" aria-live="polite">
          <div className="rounded-lg border border-border bg-background/60 p-3 text-xs leading-relaxed text-muted">
            {last ? (
              <>
                <span className="font-medium text-foreground">Tree {trees}</span> asks: is the part lighter than{" "}
                <span className="font-semibold text-foreground">{last.split.toFixed(1)} kg</span>? Lighter parts move{" "}
                <span className="font-semibold text-foreground">{move(lr * last.left)}</span>, heavier parts move{" "}
                <span className="font-semibold text-foreground">{move(lr * last.right)}</span> (the leftover error × {rate}).
              </>
            ) : (
              <>
                With no trees, the model guesses the average training price,{" "}
                <span className="font-semibold text-foreground">{usd(model.base)}</span>, for every part.
              </>
            )}
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-1">
            <div className="rounded-lg border border-border bg-background/60 p-2.5">
              <p className="text-[11px] text-muted">Train error (MAE)</p>
              <p className="text-lg font-semibold tabular-nums text-foreground">{usd(trainMae)}</p>
            </div>
            <div className="rounded-lg border border-border bg-background/60 p-2.5">
              <p className="text-[11px] text-muted">Test error (MAE)</p>
              <p className="text-lg font-semibold tabular-nums text-foreground">{usd(testMae)}</p>
            </div>
          </div>
          <svg viewBox={`0 0 ${mW} ${mH}`} className="w-full" role="img" aria-label="Training and test error by number of trees">
            <line x1={mp.l} x2={mp.r} y1={mp.b} y2={mp.b} stroke="var(--muted)" strokeOpacity="0.5" />
            <text x={mp.l - 4} y={my(0)} dy="0.32em" textAnchor="end" className="fill-muted text-[9px]">$0</text>
            <text x={mp.l - 4} y={my(maxErr)} dy="0.32em" textAnchor="end" className="fill-muted text-[9px]">
              ${Math.round(maxErr)}
            </text>
            <text x={mx(0)} y={mp.b + 12} textAnchor="middle" className="fill-muted text-[9px]">0</text>
            <text x={mx(MAX_TREES)} y={mp.b + 12} textAnchor="end" className="fill-muted text-[9px]">{MAX_TREES} trees</text>
            <path d={curve(model.trainMae)} fill="none" stroke={VIOLET} strokeWidth="2" />
            <path d={curve(model.testMae)} fill="none" stroke={ORANGE} strokeWidth="2" />
            <line x1={mx(trees)} x2={mx(trees)} y1={mp.t} y2={mp.b} stroke="var(--foreground)" strokeOpacity="0.5" />
          </svg>
          <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-muted order-first sm:col-span-full">
            <LegendItem color={VIOLET} label="Training parts" />
            <LegendItem color={ORANGE} label="Test parts" />
            <LegendItem color={BLUE} label="Prediction" kind="line" />
          </div>
        </div>
      </div>
    </Figure>
  );
}

/* ------------------------------------------------------------------ */
/* Quantile regression: price ranges instead of a single price          */
/* ------------------------------------------------------------------ */

const intervals = ["50%", "80%", "90%", "95%"] as const;
type Interval = (typeof intervals)[number];
/** Standard normal quantile for the upper edge of each central interval. */
const zFor: Record<Interval, number> = { "50%": 0.674, "80%": 1.282, "90%": 1.645, "95%": 1.96 };

const SIGMA = 0.38;
const RATE = 5.5;
const bandParts = (() => {
  const rand = mulberry32(23);
  return Array.from({ length: 90 }, () => {
    const w = 0.5 + 19.5 * Math.pow(rand(), 1.4);
    return { w: round2(w), price: round2(RATE * w * Math.exp(SIGMA * gaussian(rand))) };
  });
})();

/** Lower, median and upper quantile lines on simulated parts, with an adjustable interval width. */
export function QuantileBands() {
  const [interval, setWidth] = useState<Interval>("80%");
  const z = zFor[interval];
  const p = Number(interval.replace("%", "")) / 100;
  const qHi = 1 - (1 - p) / 2;
  const qLo = (1 - p) / 2;
  const spread = round2(Math.exp(SIGMA * z));
  const hi = (w: number) => RATE * w * spread;
  const lo = (w: number) => (RATE * w) / spread;
  const mid = (w: number) => RATE * w;
  const inside = bandParts.filter((b) => b.price >= lo(b.w) && b.price <= hi(b.w)).length;

  const W = 520;
  const H = 280;
  const plot = { l: 44, r: W - 12, t: 12, b: H - 40 };
  const x = linear([0, 20], [plot.l, plot.r]);
  const yMax = 200;
  const y = linear([0, yMax], [plot.b, plot.t]);
  const clampY = (v: number) => y(Math.min(v, yMax));
  const ws = Array.from({ length: 81 }, (_, i) => i * 0.25);
  const band = `${pathFrom(ws.map((w) => [x(w), clampY(hi(w))]))}${ws
    .slice()
    .reverse()
    .map((w) => `L${x(w).toFixed(1)},${clampY(lo(w)).toFixed(1)}`)
    .join("")}Z`;
  const ratio = qHi / (1 - qHi);

  return (
    <Figure caption="Simulated parts. Instead of one best-guess price, three models trace the lower edge, middle and upper edge of the prices seen for similar parts. Widening the interval trades precision for coverage.">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <ChartTitle title="From a single price to a price range" subtitle="Quantile regression on part weight" />
        <div className="flex items-center gap-2 text-xs text-muted">
          Interval
          <Segmented options={intervals} value={interval} onChange={setWidth} label="Prediction interval" />
        </div>
      </div>

      <div className="mt-4 grid gap-4">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label={`${interval} prediction band`}>
          <defs>
            <clipPath id="qb-clip">
              <rect x={plot.l} y={plot.t} width={plot.r - plot.l} height={plot.b - plot.t} />
            </clipPath>
          </defs>
          <Axes
            x={x}
            y={y}
            xTicks={[0, 5, 10, 15, 20]}
            yTicks={[0, 50, 100, 150, 200]}
            yFormat={(v) => `$${v}`}
            xLabel="Part weight (kg)"
            yLabel="Unit price"
            plot={plot}
          />
          <g clipPath="url(#qb-clip)">
            <path d={band} fill={BLUE} fillOpacity="0.16" className="transition-all duration-300" />
            <path d={pathFrom(ws.map((w) => [x(w), clampY(hi(w))]))} fill="none" stroke={BLUE} strokeOpacity="0.6" strokeDasharray="5 4" strokeWidth="1.5" />
            <path d={pathFrom(ws.map((w) => [x(w), clampY(lo(w))]))} fill="none" stroke={BLUE} strokeOpacity="0.6" strokeDasharray="5 4" strokeWidth="1.5" />
            <path d={pathFrom(ws.map((w) => [x(w), clampY(mid(w))]))} fill="none" stroke={BLUE} strokeWidth="2.5" />
          </g>
          {bandParts.map((b, i) => {
            const out = b.price < lo(b.w) || b.price > hi(b.w);
            return (
              <circle
                key={i}
                cx={x(b.w)}
                cy={clampY(b.price)}
                r={3.5}
                fill={out ? ORANGE : VIOLET}
                stroke="var(--surface)"
                strokeWidth="1.25"
                className="transition-colors duration-300"
              />
            );
          })}
        </svg>

        <div className="grid items-start gap-3 text-sm sm:grid-cols-[10rem_1fr]" aria-live="polite">
          <div className="rounded-lg border border-border bg-background/60 p-3">
            <p className="text-[11px] text-muted">Parts inside the band</p>
            <p className="text-2xl font-semibold tabular-nums text-foreground">
              {inside}
              <span className="text-sm font-normal text-muted"> / {bandParts.length}</span>
            </p>
            <p className="text-xs text-muted">≈ {Math.round((inside / bandParts.length) * 100)}% coverage</p>
          </div>
          <div className="rounded-lg border border-border bg-background/60 p-3 text-xs leading-relaxed text-muted">
            The upper line is the <span className="text-foreground">{Math.round(qHi * 100)}th percentile</span>. It is
            trained so that pricing a part <span className="text-foreground">too low</span> costs{" "}
            <span className="font-semibold text-foreground">{ratio.toFixed(ratio < 10 ? 1 : 0)}×</span> more than
            pricing it too high, so it settles above about {Math.round(qHi * 100)}% of parts. The lower line mirrors this
            at the {Math.round(qLo * 100)}th percentile.
          </div>
          <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-muted order-first sm:col-span-full">
            <LegendItem color={BLUE} label="Median" kind="line" />
            <LegendItem color={BLUE} label="Range" kind="band" />
            <LegendItem color={ORANGE} label="Outside range" />
          </div>
        </div>
      </div>
    </Figure>
  );
}

/* ------------------------------------------------------------------ */
/* Pipeline                                                             */
/* ------------------------------------------------------------------ */

const pipeline = [
  { title: "Ingest", body: "Join schedule agreements, supplier metadata and part weights" },
  { title: "Clean", body: "Europe-only, active parts, consistent units, outliers removed" },
  { title: "Train", body: "80/20 train/test split, 5-fold cross-validation, three quantile models" },
  { title: "Score", body: "Weekly inference job prices every part in Databricks" },
  { title: "Publish", body: "Price ranges land in the data lake for sourcing teams" },
];

/** Training and deployment pipeline. */
export function PricingPipeline() {
  return (
    <Figure caption="The pipeline built in Databricks. Once deployed through MLOps, the same code retrains the models and refreshes price ranges on a weekly schedule.">
      <ol className="grid list-none! gap-2 pl-0! sm:grid-cols-5">
        {pipeline.map((s, i) => (
          <li key={s.title} className="relative rounded-lg border border-border bg-background/40 p-3">
            <span className="font-mono text-[11px] text-muted">0{i + 1}</span>
            <p className="text-sm font-medium text-accent-2">{s.title}</p>
            <p className="mt-1 text-xs leading-relaxed text-muted">{s.body}</p>
          </li>
        ))}
      </ol>
    </Figure>
  );
}
