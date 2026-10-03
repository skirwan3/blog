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

const defaultPart = simParts.findIndex((p) => !p.test && p.w > 5 && p.w < 9 && p.price > 38);

function Step({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <li className="flex gap-2.5">
      <span className="mt-0.5 flex size-4.5 shrink-0 items-center justify-center rounded-full border border-border font-mono text-[10px] text-muted">
        {n}
      </span>
      <span>{children}</span>
    </li>
  );
}

const B = ({ children }: { children: React.ReactNode }) => (
  <span className="font-semibold tabular-nums text-foreground">{children}</span>
);

/** Step-by-step gradient boosting on one feature (weight), with a worked update for one selected part. */
export function BoostingExplainer() {
  const [rate, setRate] = useState<Rate>("0.3");
  const [trees, setTrees] = useState(1);
  const [sel, setSel] = useState(defaultPart);
  const lr = Number(rate);
  const model = useMemo(() => boost(lr), [lr]);

  const W = 520;
  const H = 280;
  const plot = { l: 44, r: W - 12, t: 12, b: H - 40 };
  const x = linear([0, 12], [plot.l, plot.r]);
  const y = linear([0, 60], [plot.b, plot.t]);
  const clampY = (v: number) => y(Math.max(0, Math.min(60, v)));
  const grid = Array.from({ length: 241 }, (_, i) => i * 0.05);
  const lineAt = (m: number) => pathFrom(grid.map((w) => [x(w), clampY(model.predict(w, m))]));

  // The error each tree is fit to is measured against the prediction *before* that tree.
  const before = Math.max(trees - 1, 0);
  const tree = trees > 0 ? model.stumps[trees - 1] : null;
  const part = simParts[sel];
  const prev = model.predict(part.w, before);
  const err = part.price - prev;
  const lighter = tree ? part.w < tree.split : false;
  const groupErr = tree ? (lighter ? tree.left : tree.right) : 0;
  const groupSize = tree
    ? simParts.filter((p) => !p.test && (p.w < tree.split) === lighter).length
    : 0;
  const next = model.predict(part.w, trees);

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
          Simulated parts, one feature. Click any filled dot to follow that part through the update. Hollow dots are
          held-out test parts the model never trains on. Try a learning rate of 1.0 with 60 trees to see training error
          keep falling while test error stops improving.
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
          {tree && (
            <>
              <rect
                x={lighter ? plot.l : x(tree.split)}
                y={plot.t}
                width={lighter ? x(tree.split) - plot.l : plot.r - x(tree.split)}
                height={plot.b - plot.t}
                fill={BLUE}
                fillOpacity="0.05"
              />
              <line x1={x(tree.split)} x2={x(tree.split)} y1={plot.t} y2={plot.b} stroke={ORANGE} strokeDasharray="3 4" />
              <text x={x(tree.split)} y={plot.t + 10} dx="5" className="fill-muted text-[10px]">
                split at {tree.split.toFixed(1)} kg
              </text>
            </>
          )}
          {/* Error each training part hands to the next tree: actual price minus the prediction so far */}
          {simParts.map((p, i) =>
            p.test ? null : (
              <line
                key={`r${i}`}
                x1={x(p.w)}
                x2={x(p.w)}
                y1={y(p.price)}
                y2={clampY(model.predict(p.w, before))}
                stroke={i === sel ? "var(--foreground)" : "var(--muted)"}
                strokeOpacity={i === sel ? 0.9 : 0.4}
                strokeWidth={i === sel ? 1.75 : 1}
              />
            ),
          )}
          {trees > 0 && (
            <path d={lineAt(before)} fill="none" stroke={BLUE} strokeOpacity="0.55" strokeWidth="1.5" strokeDasharray="5 4" />
          )}
          <path d={lineAt(trees)} fill="none" stroke={BLUE} strokeWidth="2.5" strokeLinejoin="round" />
          {simParts.map((p, i) => (
            <g key={i} onClick={() => !p.test && setSel(i)} className={p.test ? undefined : "cursor-pointer"}>
              {!p.test && <circle cx={x(p.w)} cy={y(p.price)} r={9} fill="transparent" />}
              <circle
                cx={x(p.w)}
                cy={y(p.price)}
                r={i === sel ? 5.5 : 4}
                fill={p.test ? "var(--surface)" : VIOLET}
                stroke={p.test ? ORANGE : i === sel ? "var(--foreground)" : "var(--surface)"}
                strokeWidth={p.test ? 1.75 : 1.5}
              />
            </g>
          ))}
        </svg>

        <div className="grid items-start gap-3 text-sm sm:grid-cols-[1fr_13rem]" aria-live="polite">
          <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-muted sm:col-span-full">
            <LegendItem color={VIOLET} label="Training parts" />
            <LegendItem color={ORANGE} label="Test parts" />
            <LegendItem color="var(--muted)" label="Error (actual − prediction so far)" kind="line" />
            {trees > 0 && <LegendItem color={BLUE} label="Before this tree" kind="dash" />}
            <LegendItem color={BLUE} label={trees > 0 ? "After this tree" : "Prediction"} kind="line" />
          </div>

          <div className="rounded-lg border border-border bg-background/60 p-3 text-xs leading-relaxed text-muted">
            <p className="mb-2 font-medium text-foreground">
              {tree ? `How tree ${trees} updates the selected part` : "Starting point"}
            </p>
            {tree ? (
              <ol className="list-none! space-y-1.5 pl-0!">
                <Step n={1}>
                  Prediction so far ({before} {before === 1 ? "tree" : "trees"}): <B>{usd(prev)}</B>
                </Step>
                <Step n={2}>
                  Error = actual <B>{usd(part.price)}</B> − <B>{usd(prev)}</B> = <B>{usd(err)}</B>{" "}
                  ({err >= 0 ? "under-priced" : "over-priced"})
                </Step>
                <Step n={3}>
                  Tree {trees} splits parts at <B>{tree.split.toFixed(1)} kg</B>. This part is in the{" "}
                  {lighter ? "lighter" : "heavier"} group of {groupSize} training parts, whose average error is{" "}
                  <B>{usd(groupErr)}</B>. That average is the tree&apos;s correction for the whole group.
                  {Math.sign(err) !== Math.sign(groupErr) && (
                    <> This part&apos;s own error points the other way, but it still gets the group&apos;s correction; later trees can split it off.</>
                  )}
                </Step>
                <Step n={4}>
                  New prediction = <B>{usd(prev)}</B> + {rate} × <B>{usd(groupErr)}</B> = <B>{usd(next)}</B>
                </Step>
              </ol>
            ) : (
              <p>
                With no trees, the model predicts the average training price, <B>{usd(model.base)}</B>, for every part.
                The grey lines show each part&apos;s error from that guess. The first tree will be fit to those errors.
              </p>
            )}
          </div>

          <div className="grid gap-2">
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-lg border border-border bg-background/60 p-2.5">
                <p className="text-[11px] text-muted">Train MAE</p>
                <p className="text-lg font-semibold tabular-nums text-foreground">{usd(model.trainMae[trees])}</p>
              </div>
              <div className="rounded-lg border border-border bg-background/60 p-2.5">
                <p className="text-[11px] text-muted">Test MAE</p>
                <p className="text-lg font-semibold tabular-nums text-foreground">{usd(model.testMae[trees])}</p>
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
          </div>
        </div>
      </div>
    </Figure>
  );
}

/* ------------------------------------------------------------------ */
/* Quantile regression: price ranges instead of a single price          */
/* ------------------------------------------------------------------ */

const round3 = (v: number) => Math.round(v * 1000) / 1000;
/** 0.975 -> "97.5", 0.9 -> "90" */
const ordinal = (q: number) => String(round3(q * 100));

/* Quantile (pinball) loss explainer ---------------------------------- */

/** Unit prices for a group of similar simulated parts (say, 2 kg steel brackets). */
const groupPrices = [8.4, 9.6, 10.2, 11, 11.5, 12.1, 12.6, 13, 13.8, 14.5, 15.3, 16.4, 17.9, 19.6, 22.8];
const lossQuantiles = ["10th", "50th", "90th"] as const;
type LossQuantile = (typeof lossQuantiles)[number];
const qValue: Record<LossQuantile, number> = { "10th": 0.1, "50th": 0.5, "90th": 0.9 };

function pinball(q: number, estimate: number) {
  return groupPrices.reduce((a, price) => a + (price > estimate ? q * (price - estimate) : (1 - q) * (estimate - price)), 0);
}

/** Drag a candidate estimate and watch the quantile loss; its minimum lands at the chosen percentile. */
export function QuantileLoss() {
  const [quantile, setQuantile] = useState<LossQuantile>("90th");
  const [estimate, setEstimate] = useState(13);
  const q = qValue[quantile];
  const lo = 6;
  const hi = 26;
  const xs = Array.from({ length: 201 }, (_, i) => lo + i * 0.1);
  const losses = xs.map((v) => pinball(q, v));
  const best = xs[losses.indexOf(Math.min(...losses))];
  const loss = pinball(q, estimate);
  const above = groupPrices.filter((price) => price > estimate).length;
  const underDollars = groupPrices.reduce((a, price) => a + Math.max(price - estimate, 0), 0);
  const overDollars = groupPrices.reduce((a, price) => a + Math.max(estimate - price, 0), 0);

  const W = 520;
  const plot = { l: 44, r: W - 12 };
  const x = linear([lo, hi], [plot.l, plot.r]);
  // Strip of prices
  const stripY = 30;
  // Loss curve
  const cTop = 70;
  const cBot = 190;
  const maxLoss = Math.max(...losses);
  const y = linear([0, maxLoss], [cBot, cTop]);

  return (
    <Figure caption="Fifteen simulated parts of the same kind. The quantile model looks for the single price that makes the weighted total penalty as small as possible. With weights of 0.9 and 0.1, that price sits above 90% of the parts.">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <ChartTitle title="How a quantile model picks its price" subtitle="Weighted penalty for one group of similar parts" />
        <div className="flex items-center gap-2 text-xs text-muted">
          Target
          <Segmented options={lossQuantiles} value={quantile} onChange={setQuantile} label="Target percentile" render={(v) => `${v} pct.`} />
        </div>
      </div>

      <label className="mt-4 flex items-center gap-3 text-sm">
        <span className="w-28 shrink-0 text-muted">
          Estimate: <B>{usd(estimate)}</B>
        </span>
        <input
          type="range"
          min={lo}
          max={hi}
          step={0.1}
          value={estimate}
          onChange={(e) => setEstimate(Number(e.target.value))}
          className="w-full accent-[#3987e5]"
          aria-label="Candidate price estimate"
        />
      </label>

      <svg viewBox={`0 0 ${W} 222`} className="mt-3 w-full" role="img" aria-label={`Quantile loss curve for the ${quantile} percentile`}>
        <line x1={plot.l} x2={plot.r} y1={stripY} y2={stripY} stroke="var(--border)" />
        {groupPrices.map((price, i) => (
          <circle
            key={i}
            cx={x(price)}
            cy={stripY}
            r={5}
            fill={price > estimate ? ORANGE : VIOLET}
            stroke="var(--surface)"
            strokeWidth="1.5"
          />
        ))}
        <text x={plot.l - 6} y={stripY} dy="0.32em" textAnchor="end" className="fill-muted text-[10px]">
          parts
        </text>

        <line x1={plot.l} x2={plot.r} y1={cBot} y2={cBot} stroke="var(--muted)" strokeOpacity="0.5" />
        <path d={pathFrom(xs.map((v, i) => [x(v), y(losses[i])]))} fill="none" stroke={BLUE} strokeWidth="2.5" />
        <line x1={x(best)} x2={x(best)} y1={cTop} y2={cBot} stroke={BLUE} strokeOpacity="0.5" strokeDasharray="3 4" />
        <text x={x(best)} y={cTop - 4} textAnchor="middle" className="fill-muted text-[10px]">
          lowest penalty {usd(best)}
        </text>
        <text x={plot.l - 6} y={(cTop + cBot) / 2} dy="0.32em" textAnchor="end" className="fill-muted text-[10px]">
          penalty
        </text>

        <line x1={x(estimate)} x2={x(estimate)} y1={stripY - 14} y2={cBot} stroke="var(--foreground)" strokeOpacity="0.6" />
        <circle cx={x(estimate)} cy={y(loss)} r={5} fill={BLUE} stroke="var(--surface)" strokeWidth="2" />
        {[8, 12, 16, 20, 24].map((t) => (
          <text key={t} x={x(t)} y={cBot + 15} textAnchor="middle" className="fill-muted text-[10px] tabular-nums">
            ${t}
          </text>
        ))}
        <text x={(plot.l + plot.r) / 2} y={cBot + 30} textAnchor="middle" className="fill-muted text-[11px]">
          Unit price
        </text>
      </svg>

      <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-muted">
        <LegendItem color={ORANGE} label="Priced above the estimate (estimate too low)" />
        <LegendItem color={VIOLET} label="Priced at or below it (estimate too high)" />
      </div>

      <div className="mt-3 rounded-lg border border-border bg-background/60 p-3 text-xs leading-relaxed text-muted" aria-live="polite">
        <p>
          <B>{above}</B> of {groupPrices.length} parts cost more than {usd(estimate)}, by <B>{usd(underDollars)}</B> in
          total. The rest cost less, by <B>{usd(overDollars)}</B> in total.
        </p>
        <p className="mt-1.5 font-mono text-[11px] text-foreground/85">
          penalty = {q} × {usd(underDollars)} + {round3(1 - q)} × {usd(overDollars)} = {usd(loss)}
        </p>
        <p className="mt-1.5">
          {Math.abs(estimate - best) < 0.15
            ? `This is the lowest possible penalty. About ${Math.round(q * 100)}% of parts are priced at or below it, which is exactly what the ${quantile} percentile means.`
            : `Slide toward ${usd(best)} to lower the penalty.`}
        </p>
      </div>
    </Figure>
  );
}

/* Prediction intervals ------------------------------------------------ */

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
            A {interval} range uses a <B>{ordinal(qLo)}th</B> percentile model for the low end and a{" "}
            <B>{ordinal(qHi)}th</B> percentile model for the high end. Wider ranges contain more parts but give a less
            precise estimate; narrower ranges are more precise but flag more parts as unusual.
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
