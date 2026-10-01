"use client";

import { useMemo, useState } from "react";
import { electrodes, landmarks, openPositions, regionPolygons, ringPaths, type RegionKey } from "./eegLayout";

const BLUE = "#3987e5";
const ORANGE = "#d95926";
const AQUA = "#199e70";

/* ------------------------------------------------------------------ */
/* ERP components                                                       */
/* ------------------------------------------------------------------ */

type Component = {
  key: string;
  kind: "Perceptual" | "Memory";
  latency: number;
  polarity: 1 | -1;
  reflects: string;
  location: string;
  color: string;
  regions: RegionKey[];
};

const occipital: RegionKey[] = ["occL", "occR", "occM"];

const components: Component[] = [
  {
    key: "P100",
    kind: "Perceptual",
    latency: 100,
    polarity: 1,
    reflects: "General visual perception",
    location: "Occipital",
    color: BLUE,
    regions: occipital,
  },
  {
    key: "N170",
    kind: "Perceptual",
    latency: 170,
    polarity: -1,
    reflects: "Face processing",
    location: "Occipital",
    color: BLUE,
    regions: occipital,
  },
  {
    key: "N250",
    kind: "Perceptual",
    latency: 250,
    polarity: -1,
    reflects: "Face familiarity",
    location: "Occipital",
    color: BLUE,
    regions: occipital,
  },
  {
    key: "FN400",
    kind: "Memory",
    latency: 400,
    polarity: -1,
    reflects: "Familiarity — a fast sense of “seen before” without detail",
    location: "Left/right anterior superior",
    color: AQUA,
    regions: ["fn400L", "fn400R"],
  },
  {
    key: "P600",
    kind: "Memory",
    latency: 600,
    polarity: 1,
    reflects: "Recollection — slower, detailed explicit memory",
    location: "Left/right posterior superior",
    color: ORANGE,
    regions: ["p600L", "p600R"],
  },
];

/* ------------------------------------------------------------------ */
/* Signal averaging explainer                                           */
/* ------------------------------------------------------------------ */

const T0 = -100;
const T1 = 400;
const DT = 4;
const times = Array.from({ length: (T1 - T0) / DT + 1 }, (_, i) => T0 + i * DT);

const g = (t: number, mu: number, sd: number, a: number) => a * Math.exp(-((t - mu) ** 2) / (2 * sd * sd));

/**
 * Illustrative right occipito-temporal waveform (µV), shaped after the P8 traces in Abreu et al. (2023):
 * P100 ≈ 120 ms, N170 ≈ 185 ms, and a larger N250 for personally familiar faces.
 */
const unfamiliarErp = (t: number) => g(t, 120, 22, 1.9) + g(t, 185, 18, -3.3) + g(t, 300, 70, 0.6);
const familiarErp = (t: number) => unfamiliarErp(t) + g(t, 290, 35, -2.1);

/** Small seeded PRNG so every visitor sees the same "random" trials. */
function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let r = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

const MAX_TRIALS = 100;

/** Single trials: the ERP buried in smooth background activity (a sum of random sinusoids). */
function makeTrials(erp: (t: number) => number, seed: number) {
  const rand = mulberry32(seed);
  return Array.from({ length: MAX_TRIALS }, () => {
    const waves = Array.from({ length: 6 }, () => ({
      amp: 0.8 + rand() * 1.6,
      freq: 4 + rand() * 14, // Hz
      phase: rand() * Math.PI * 2,
    }));
    return times.map(
      (t) => erp(t) + waves.reduce((s, w) => s + w.amp * Math.sin((2 * Math.PI * w.freq * t) / 1000 + w.phase), 0),
    );
  });
}

const conditions = [
  { key: "familiar", label: "Personally familiar", color: BLUE, trials: makeTrials(familiarErp, 7) },
  { key: "unfamiliar", label: "Unfamiliar", color: ORANGE, trials: makeTrials(unfamiliarErp, 11) },
];

const windows = [
  { key: "P100", from: 80, to: 150, dashed: false },
  { key: "N170", from: 150, to: 250, dashed: false },
  { key: "N250", from: 250, to: 350, dashed: true },
];

const steps = ["Show a face", "Record EEG", "Cut segment", "Average trials", "ERP"];

/** Shows how averaging many noisy single trials reveals the occipito-temporal ERP to faces. */
export function ErpAveraging() {
  const [n, setN] = useState(1);

  const averages = useMemo(
    () => conditions.map((c) => times.map((_, i) => c.trials.slice(0, n).reduce((s, tr) => s + tr[i], 0) / n)),
    [n],
  );

  const W = 600;
  const H = 270;
  const m = { l: 36, r: 16, t: 26, b: 28 };
  const iw = W - m.l - m.r;
  const ih = H - m.t - m.b;
  const yMax = 6;
  const x = (t: number) => m.l + ((t - T0) / (T1 - T0)) * iw;
  const y = (v: number) => m.t + ih / 2 - (Math.max(-yMax, Math.min(yMax, v)) / yMax) * (ih / 2);
  const path = (vals: number[]) => vals.map((v, i) => `${i ? "L" : "M"}${x(times[i]).toFixed(1)},${y(v).toFixed(1)}`).join("");
  const clear = n >= 30;

  return (
    <figure className="not-prose my-10 rounded-xl border border-border bg-surface p-4 sm:p-5">
      <ol className="flex list-none! flex-wrap items-center gap-x-1.5 gap-y-2 pl-0! text-[11px]" aria-label="Processing steps">
        {steps.map((s, i) => (
          <li key={s} className="flex items-center gap-1.5">
            <span
              className={`rounded-md border px-2 py-1 ${
                i === 3 ? "border-accent-2/40 bg-accent-2/10 text-accent-2" : "border-border bg-background/60 text-foreground/85"
              }`}
            >
              {s}
            </span>
            {i < steps.length - 1 && <span className="text-muted">→</span>}
          </li>
        ))}
      </ol>

      <div className="mt-5">
        <div className="flex items-baseline justify-between text-xs">
          <label htmlFor="erp-trials" className="text-muted">
            Trials averaged per condition
          </label>
          <span className="font-semibold tabular-nums text-foreground">
            {n} <span className="font-normal text-muted">of {MAX_TRIALS}</span>
          </span>
        </div>
        <input
          id="erp-trials"
          type="range"
          min={1}
          max={MAX_TRIALS}
          value={n}
          onChange={(e) => setN(Number(e.target.value))}
          className="mt-2 w-full accent-[#22d3ee]"
        />
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-xs">
        <span className="text-muted">Right occipito-temporal electrode (P8)</span>
        <span className="flex gap-4 text-foreground/85">
          {conditions.map((c) => (
            <span key={c.key} className="flex items-center gap-2">
              <svg width="16" height="8" aria-hidden>
                <line x1="0" x2="16" y1="4" y2="4" stroke={c.color} strokeWidth="2" />
              </svg>
              {c.label}
            </span>
          ))}
        </span>
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} className="mt-2 w-full" role="img" aria-label={`Average of ${n} trials per condition`}>
        {windows.map((w) => (
          <g key={w.key} opacity={clear ? 1 : 0.45}>
            <rect
              x={x(w.from)}
              y={m.t}
              width={x(w.to) - x(w.from)}
              height={ih}
              fill="var(--foreground)"
              fillOpacity={0.03}
              stroke="var(--muted)"
              strokeOpacity={0.6}
              strokeDasharray={w.dashed ? "4 4" : undefined}
            />
            <text x={(x(w.from) + x(w.to)) / 2} y={m.t - 8} textAnchor="middle" className="fill-foreground text-[11px] font-semibold">
              {w.key}
            </text>
          </g>
        ))}
        {[-4, -2, 0, 2, 4].map((v) => (
          <g key={v}>
            <line x1={m.l} x2={W - m.r} y1={y(v)} y2={y(v)} stroke={v === 0 ? "#2c3144" : "var(--border)"} strokeOpacity={v === 0 ? 1 : 0.6} />
            <text x={m.l - 6} y={y(v)} dy="0.32em" textAnchor="end" className="fill-muted text-[10px] tabular-nums">
              {v}
            </text>
          </g>
        ))}
        {[-100, 0, 100, 200, 300, 400].map((t) => (
          <text key={t} x={x(t)} y={H - 8} textAnchor={t === 400 ? "end" : "middle"} className="fill-muted text-[10px] tabular-nums">
            {t} ms
          </text>
        ))}
        <line x1={x(0)} x2={x(0)} y1={m.t} y2={m.t + ih} stroke="var(--accent)" strokeDasharray="3 4" />
        <text x={x(0) - 4} y={m.t + ih - 6} textAnchor="end" className="fill-accent text-[10px]">
          face appears
        </text>

        {conditions.map((c, k) => (
          <path key={c.key} d={path(averages[k])} fill="none" stroke={c.color} strokeWidth={2} strokeLinejoin="round" />
        ))}
        <text x={8} y={m.t + ih / 2} transform={`rotate(-90 8 ${m.t + ih / 2})`} textAnchor="middle" className="fill-muted text-[10px]">
          µV
        </text>
      </svg>

      <p className="mt-2 min-h-10 text-sm text-muted" aria-live="polite">
        {n === 1
          ? "One trial per condition is mostly background brain activity — the response to the face is buried in it. Drag the slider to average more trials."
          : !clear
            ? `Averaging ${n} trials: activity unrelated to the face starts to cancel out, while the time-locked response stays.`
            : "Now the P100, N170 and N250 stand out — and the N250 is more negative for personally familiar faces than for unfamiliar ones."}
      </p>
      <figcaption className="mt-1 text-xs italic leading-relaxed text-muted">
        Illustrative simulation, not study data: synthetic waveforms with randomly generated noise, shaped after the
        occipito-temporal ERPs reported by{" "}
        <a
          href="https://doi.org/10.1016/j.neuropsychologia.2023.108623"
          target="_blank"
          rel="noreferrer"
          className="text-accent-2 underline underline-offset-2"
        >
          Abreu et al. (2023)
        </a>
        . Boxes mark typical analysis windows for each component.
      </figcaption>
    </figure>
  );
}

/* ------------------------------------------------------------------ */
/* Electrode map                                                        */
/* ------------------------------------------------------------------ */

/** Interactive map of the 128-channel net, tracing the lab's electrode-region diagram. */
export function ElectrodeMap() {
  const [selected, setSelected] = useState<string>("all");
  const shown = selected === "all" ? components : components.filter((k) => k.key === selected);
  const regionColor = new Map<RegionKey, string>();
  shown.forEach((k) => k.regions.forEach((r) => regionColor.set(r, k.color)));
  const active = components.find((k) => k.key === selected);
  const landmarkAt = new Map(Object.entries(landmarks).map(([name, [lx, ly]]) => [`${lx},${ly}`, name]));

  return (
    <figure className="not-prose my-10 rounded-xl border border-border bg-surface p-4 sm:p-5">
      <div className="flex flex-wrap gap-1.5" role="group" aria-label="ERP component">
        {[{ key: "all" }, ...components].map((k) => (
          <button
            key={k.key}
            type="button"
            aria-pressed={selected === k.key}
            onClick={() => setSelected(k.key)}
            className={`rounded-lg border px-2.5 py-1 text-xs transition-colors ${
              selected === k.key
                ? "border-foreground/30 bg-foreground/10 text-foreground"
                : "border-border text-muted hover:text-foreground"
            }`}
          >
            {k.key === "all" ? "All" : k.key}
          </button>
        ))}
      </div>

      <div className="mt-4 grid items-center gap-5 sm:grid-cols-[minmax(0,22rem)_1fr]">
        <svg viewBox="60 0 680 680" className="mx-auto w-full max-w-[22rem]" role="img" aria-label="Map of the 128-channel electrode net with component regions highlighted">
          {ringPaths.map((d, i) => (
            <path key={i} d={d} fill="none" stroke="var(--muted)" strokeOpacity={0.35} strokeWidth={1.5} />
          ))}
          {(Object.keys(regionPolygons) as RegionKey[]).map((r) => {
            const col = regionColor.get(r);
            return (
              <polygon
                key={r}
                points={regionPolygons[r].map((p) => p.join(",")).join(" ")}
                fill={col ?? "var(--foreground)"}
                fillOpacity={col ? 0.2 : 0.03}
                stroke={col ?? "var(--muted)"}
                strokeOpacity={col ? 0.8 : 0.2}
                strokeWidth={2}
                strokeLinejoin="round"
                className="transition-[fill-opacity,stroke-opacity] duration-300"
              />
            );
          })}
          {openPositions.map(([ox, oy], i) => (
            <circle key={i} cx={ox} cy={oy} r={10} fill="none" stroke="var(--muted)" strokeOpacity={0.35} strokeWidth={1.5} />
          ))}
          {electrodes.map(([ex, ey, r], i) => {
            const col = r ? regionColor.get(r) : undefined;
            const name = landmarkAt.get(`${ex},${ey}`);
            return (
              <g key={i}>
                <circle
                  cx={ex}
                  cy={ey}
                  r={11}
                  fill={col ?? "var(--background)"}
                  fillOpacity={col ? 0.9 : 1}
                  stroke={col ?? "var(--muted)"}
                  strokeOpacity={col ? 1 : 0.55}
                  strokeWidth={2.5}
                  className="transition-[fill] duration-300"
                />
                {name && (
                  <text
                    x={ex}
                    y={ey}
                    dy="0.35em"
                    textAnchor="middle"
                    className={`text-[9px] font-semibold ${col ? "fill-white" : "fill-muted"}`}
                  >
                    {name}
                  </text>
                )}
              </g>
            );
          })}
        </svg>

        <div aria-live="polite">
          {active ? (
            <div>
              <p className="flex items-center gap-2">
                <span className="text-2xl font-semibold text-foreground">{active.key}</span>
                <span className="rounded-full border border-border px-2 py-0.5 text-[11px] text-muted">{active.kind}</span>
              </p>
              <dl className="mt-3 grid grid-cols-[6rem_1fr] gap-y-2 text-sm">
                <dt className="text-muted">Reflects</dt>
                <dd className="text-foreground/90">{active.reflects}</dd>
                <dt className="text-muted">Timing</dt>
                <dd className="text-foreground/90">~{active.latency} ms after the face</dd>
                <dt className="text-muted">Polarity</dt>
                <dd className="text-foreground/90">{active.polarity > 0 ? "Positive peak" : "Negative trough"}</dd>
                <dt className="text-muted">Region</dt>
                <dd className="flex items-center gap-2 text-foreground/90">
                  <span className="size-2 rounded-full" style={{ background: active.color }} />
                  {active.location}
                </dd>
              </dl>
            </div>
          ) : (
            <ul className="list-none! space-y-2.5 pl-0! text-sm">
              {[
                { color: BLUE, label: "P100 · N170 · N250", text: "Perception — occipital regions at the back of the head" },
                { color: AQUA, label: "FN400", text: "Familiarity — anterior superior regions" },
                { color: ORANGE, label: "P600", text: "Recollection — posterior superior regions" },
              ].map((c) => (
                <li key={c.label} className="flex gap-2.5">
                  <span className="mt-1.5 size-2.5 shrink-0 rounded-full" style={{ background: c.color }} />
                  <span>
                    <span className="font-semibold text-foreground">{c.label}</span>
                    <span className="block text-muted">{c.text}</span>
                  </span>
                </li>
              ))}
              <li className="pt-1 text-xs text-muted">Select a component for its timing and function.</li>
            </ul>
          )}
        </div>
      </div>
      <figcaption className="mt-4 text-xs italic text-muted">
        The 128-channel net seen from above (front of the head at top), traced from the lab&apos;s electrode diagram.
        Shaded regions are the electrode groups averaged for each component; standard 10–20 positions are labeled.
      </figcaption>
    </figure>
  );
}

/* ------------------------------------------------------------------ */
/* ERP results viewer                                                   */
/* ------------------------------------------------------------------ */

const results = [
  {
    key: "N170",
    src: "/projects/eeg-memory-thesis/N170.jpg",
    alt: "N170 waveforms: changed-context false alarms dip lower than same-context false alarms around 150 ms",
    p: "0.040",
    text: "Changed-context trials showed a greater mean amplitude than same-context trials on false alarms.",
  },
  {
    key: "N250",
    src: "/projects/eeg-memory-thesis/N250.jpg",
    alt: "N250 waveforms comparing changed- and same-context false alarms",
    p: "0.011",
    text: "The same changed- vs. same-context pattern held for false alarms.",
  },
  {
    key: "P600",
    src: "/projects/eeg-memory-thesis/P600.jpg",
    alt: "P600 waveforms comparing misses and false alarms under changed context",
    p: "0.005",
    text: "Misses yielded a greater amplitude than false alarms under changed-context conditions.",
  },
];

/** Tabbed viewer for the three ERP result plots (real study data, kept as images). */
export function ErpResults() {
  const [i, setI] = useState(0);
  const r = results[i];
  return (
    <figure className="not-prose my-10 rounded-xl border border-border bg-surface p-4 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex rounded-lg border border-border p-0.5 text-xs" role="tablist" aria-label="ERP component">
          {results.map((x, k) => (
            <button
              key={x.key}
              type="button"
              role="tab"
              aria-selected={k === i}
              onClick={() => setI(k)}
              className={`rounded-md px-3 py-1 transition-colors ${
                k === i ? "bg-foreground/10 text-foreground" : "text-muted hover:text-foreground"
              }`}
            >
              {x.key}
            </button>
          ))}
        </div>
        <span className="rounded-full border border-accent-2/30 bg-accent-2/10 px-2.5 py-1 text-xs tabular-nums text-accent-2">
          p = {r.p}
        </span>
      </div>
      <div className="mt-4 rounded-lg bg-white p-2 sm:p-3" role="tabpanel">
        {/* eslint-disable-next-line @next/next/no-img-element -- original analysis plots */}
        <img src={r.src} alt={r.alt} className="mx-auto max-h-96 w-full object-contain" />
      </div>
      <figcaption className="mt-3 text-sm text-foreground/85">
        <span className="font-semibold">{r.key}:</span> {r.text}
      </figcaption>
    </figure>
  );
}

/* ------------------------------------------------------------------ */
/* Correct rejection rate by race                                       */
/* ------------------------------------------------------------------ */

const crGroups = [
  { key: "own", label: "Own-race faces", m: 0.618, se: 0.014, color: BLUE },
  { key: "other", label: "Other-race faces", m: 0.584, se: 0.013, color: ORANGE },
];

/** Mean correct rejection rate (± SE) for own- vs other-race faces, with a zoomed / full-scale toggle. */
export function CorrectRejectionChart() {
  const [zoomed, setZoomed] = useState(true);
  const [hover, setHover] = useState<string | null>(null);
  const [lo, hi] = zoomed ? [0.55, 0.65] : [0, 1];
  const ticks = zoomed ? [0.55, 0.575, 0.6, 0.625, 0.65] : [0, 0.25, 0.5, 0.75, 1];

  const W = 560;
  const rowH = 54;
  const m = { l: 120, r: 24, t: 10, b: 30 };
  const H = m.t + rowH * crGroups.length + m.b;
  const x = (v: number) => m.l + ((v - lo) / (hi - lo)) * (W - m.l - m.r);

  return (
    <figure className="not-prose my-10 rounded-xl border border-border bg-surface p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <p className="text-[0.95rem] font-semibold leading-snug text-foreground">
          Correct rejection rate by race of face
          <span className="block text-sm font-normal text-muted">Mean ± standard error · higher is better</span>
        </p>
        <div className="flex rounded-lg border border-border p-0.5 text-xs" role="group" aria-label="Axis scale">
          {[
            { z: true, l: "Zoomed" },
            { z: false, l: "Full scale" },
          ].map((o) => (
            <button
              key={o.l}
              type="button"
              aria-pressed={zoomed === o.z}
              onClick={() => setZoomed(o.z)}
              className={`rounded-md px-2.5 py-1 transition-colors ${
                zoomed === o.z ? "bg-foreground/10 text-foreground" : "text-muted hover:text-foreground"
              }`}
            >
              {o.l}
            </button>
          ))}
        </div>
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} className="mt-4 w-full" role="img" aria-label="Own-race faces 0.618 plus or minus 0.014; other-race faces 0.584 plus or minus 0.013">
        {ticks.map((t) => (
          <g key={t}>
            <line x1={x(t)} x2={x(t)} y1={m.t} y2={H - m.b} stroke="var(--border)" />
            <text x={x(t)} y={H - 10} textAnchor="middle" className="fill-muted text-[11px] tabular-nums">
              {zoomed ? t.toFixed(3).replace(/0$/, "") : t.toFixed(2)}
            </text>
          </g>
        ))}
        {crGroups.map((g, i) => {
          const cy = m.t + rowH * i + rowH / 2;
          const on = hover === g.key;
          return (
            <g
              key={g.key}
              onPointerEnter={() => setHover(g.key)}
              onPointerLeave={() => setHover(null)}
              opacity={hover && !on ? 0.4 : 1}
            >
              <rect x={0} y={cy - rowH / 2} width={W} height={rowH} fill="transparent" />
              <text x={m.l - 14} y={cy} dy="0.32em" textAnchor="end" className="fill-foreground text-[12px]">
                {g.label}
              </text>
              {!zoomed && (
                <rect x={x(0)} y={cy - 10} width={x(g.m) - x(0)} height={20} rx={4} fill={g.color} fillOpacity={0.35} />
              )}
              <line x1={x(g.m - g.se)} x2={x(g.m + g.se)} y1={cy} y2={cy} stroke={g.color} strokeWidth={2} />
              <line x1={x(g.m - g.se)} x2={x(g.m - g.se)} y1={cy - 7} y2={cy + 7} stroke={g.color} strokeWidth={2} />
              <line x1={x(g.m + g.se)} x2={x(g.m + g.se)} y1={cy - 7} y2={cy + 7} stroke={g.color} strokeWidth={2} />
              <circle cx={x(g.m)} cy={cy} r={6} fill={g.color} stroke="var(--surface)" strokeWidth={2} />
              <text
                x={x(g.m + g.se) + 8}
                y={cy}
                dy="0.32em"
                className="fill-foreground text-[11px] font-semibold tabular-nums"
                opacity={on || zoomed ? 1 : 0}
              >
                {g.m.toFixed(3)}
                <tspan className="fill-muted font-normal"> ± {g.se.toFixed(3)}</tspan>
              </text>
            </g>
          );
        })}
      </svg>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border bg-background/60 px-4 py-3 text-sm">
        <span className="text-muted">
          Own-race faces were correctly rejected <span className="font-semibold text-foreground">3.4 percentage points</span> more
          often
        </span>
        <span className="rounded-full border border-accent-2/30 bg-accent-2/10 px-2.5 py-0.5 text-xs tabular-nums text-accent-2">
          p = 0.030
        </span>
      </div>
      <figcaption className="mt-3 text-xs italic text-muted">
        {zoomed
          ? "Zoomed axis to make the difference visible — switch to full scale to see it in context."
          : "Full 0–1 scale: both groups correctly rejected roughly 60% of new faces."}
      </figcaption>
    </figure>
  );
}
