"use client";

import { useMemo, useState } from "react";

const BLUE = "#3987e5";
const ORANGE = "#d95926";
const AQUA = "#199e70";

/* ------------------------------------------------------------------ */
/* ERP components                                                       */
/* ------------------------------------------------------------------ */

type Component = {
  key: string;
  name: string;
  kind: "Perceptual" | "Memory";
  latency: number;
  polarity: 1 | -1;
  reflects: string;
  location: string;
  color: string;
  /** Simplified scalp regions as annular sectors: [angleFrom, angleTo, rFrom, rTo]; 0° = nose, clockwise. */
  regions: [number, number, number, number][];
};

const occipital: [number, number, number, number][] = [
  [-150, -118, 0.62, 0.86],
  [118, 150, 0.62, 0.86],
  [160, 200, 0.66, 0.92],
];

const components: Component[] = [
  {
    key: "P100",
    name: "P100",
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
    name: "N170",
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
    name: "N250",
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
    name: "FN400",
    kind: "Memory",
    latency: 400,
    polarity: -1,
    reflects: "Familiarity — a fast sense of “seen before” without detail",
    location: "Left/right anterior superior",
    color: AQUA,
    regions: [
      [-58, -12, 0.2, 0.6],
      [12, 58, 0.2, 0.6],
    ],
  },
  {
    key: "P600",
    name: "P600",
    kind: "Memory",
    latency: 600,
    polarity: 1,
    reflects: "Recollection — slower, detailed explicit memory",
    location: "Left/right posterior superior",
    color: ORANGE,
    regions: [
      [-158, -112, 0.22, 0.56],
      [112, 158, 0.22, 0.56],
    ],
  },
];

/* ------------------------------------------------------------------ */
/* Signal averaging explainer                                           */
/* ------------------------------------------------------------------ */

const T0 = -100;
const T1 = 800;
const DT = 5;
const times = Array.from({ length: (T1 - T0) / DT + 1 }, (_, i) => T0 + i * DT);

/** Illustrative ERP shape: a sum of Gaussian bumps at typical component latencies (µV). */
function trueErp(t: number) {
  const g = (mu: number, sd: number, a: number) => a * Math.exp(-((t - mu) ** 2) / (2 * sd * sd));
  return g(100, 18, 3) + g(170, 16, -3.6) + g(250, 28, -1.6) + g(400, 55, -1.4) + g(600, 110, 2.6);
}
const clean = times.map(trueErp);

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

/** Single-trial EEG: the ERP buried in smooth background activity (sum of random sinusoids). */
function makeTrials() {
  const rand = mulberry32(7);
  return Array.from({ length: MAX_TRIALS }, () => {
    const waves = Array.from({ length: 6 }, () => ({
      amp: 1.5 + rand() * 3,
      freq: 4 + rand() * 14, // Hz
      phase: rand() * Math.PI * 2,
    }));
    return times.map(
      (t, i) =>
        clean[i] +
        waves.reduce((s, w) => s + w.amp * Math.sin((2 * Math.PI * w.freq * t) / 1000 + w.phase), 0) +
        (rand() - 0.5) * 2,
    );
  });
}

const trials = makeTrials();

const steps = ["Show a face", "Record EEG", "Cut 900 ms segment", "Average trials", "ERP"];

/** Shows how averaging many noisy single trials reveals the event-related potential. */
export function ErpAveraging() {
  const [n, setN] = useState(1);
  const [hover, setHover] = useState<string | null>(null);

  const avg = useMemo(
    () => times.map((_, i) => trials.slice(0, n).reduce((s, tr) => s + tr[i], 0) / n),
    [n],
  );

  const W = 600;
  const H = 260;
  const m = { l: 36, r: 24, t: 16, b: 28 };
  const iw = W - m.l - m.r;
  const ih = H - m.t - m.b;
  const yMax = 12;
  const x = (t: number) => m.l + ((t - T0) / (T1 - T0)) * iw;
  const y = (v: number) => m.t + ih / 2 - (Math.max(-yMax, Math.min(yMax, v)) / yMax) * (ih / 2);
  const path = (vals: number[]) => vals.map((v, i) => `${i ? "L" : "M"}${x(times[i]).toFixed(1)},${y(v).toFixed(1)}`).join("");
  const showLabels = n >= 30;

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
            Trials averaged
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

      <svg viewBox={`0 0 ${W} ${H}`} className="mt-3 w-full" role="img" aria-label={`Average of ${n} EEG trials`}>
        {[-10, -5, 0, 5, 10].map((v) => (
          <g key={v}>
            <line x1={m.l} x2={W - m.r} y1={y(v)} y2={y(v)} stroke={v === 0 ? "#2c3144" : "var(--border)"} />
            <text x={m.l - 6} y={y(v)} dy="0.32em" textAnchor="end" className="fill-muted text-[10px] tabular-nums">
              {v}
            </text>
          </g>
        ))}
        {[0, 200, 400, 600, 800].map((t) => (
          <text key={t} x={x(t)} y={H - 8} textAnchor="middle" className="fill-muted text-[10px] tabular-nums">
            {t} ms
          </text>
        ))}
        <line x1={x(0)} x2={x(0)} y1={m.t} y2={m.t + ih} stroke="var(--accent)" strokeDasharray="3 4" />
        <text x={x(0) + 4} y={m.t + 8} className="fill-accent text-[10px]">
          face appears
        </text>

        {/* a few faint single trials for texture */}
        {n > 1 &&
          trials
            .slice(0, Math.min(n, 4))
            .map((tr, i) => <path key={i} d={path(tr)} fill="none" stroke="var(--muted)" strokeOpacity={0.18} strokeWidth={1} />)}

        <path d={path(avg)} fill="none" stroke="#22d3ee" strokeWidth={2} strokeLinejoin="round" />

        {showLabels &&
          components.map((c) => {
            const i = times.indexOf(c.latency);
            const v = avg[i];
            const ly = y(v) + (c.polarity > 0 ? -12 : 16);
            const dim = hover && hover !== c.key;
            return (
              <g key={c.key} opacity={dim ? 0.3 : 1} onPointerEnter={() => setHover(c.key)} onPointerLeave={() => setHover(null)}>
                <circle cx={x(c.latency)} cy={y(v)} r={3.5} fill={c.color} stroke="var(--surface)" strokeWidth={1.5} />
                <text x={x(c.latency)} y={ly} textAnchor="middle" className="fill-foreground text-[10px] font-semibold">
                  {c.name}
                </text>
              </g>
            );
          })}
        <text x={8} y={m.t + ih / 2} transform={`rotate(-90 8 ${m.t + ih / 2})`} textAnchor="middle" className="fill-muted text-[10px]">
          µV
        </text>
      </svg>

      <p className="mt-2 min-h-10 text-sm text-muted" aria-live="polite">
        {n === 1
          ? "A single trial is mostly background brain activity — the response to the face is buried in it. Drag the slider to average more trials."
          : n < 30
            ? `Averaging ${n} trials: activity unrelated to the face starts to cancel out, while the time-locked response stays.`
            : `With ${n} trials the ERP is clear, and its components can be read off by latency and polarity (positive up).`}
      </p>
      <figcaption className="mt-1 text-xs italic text-muted">
        Illustrative simulation, not study data: the waveform shape is synthetic and the noise is randomly generated.
      </figcaption>
    </figure>
  );
}

/* ------------------------------------------------------------------ */
/* Electrode map                                                        */
/* ------------------------------------------------------------------ */

/** Approximate 128-channel layout: concentric rings of electrodes, 0° = nose, radius 1 = head edge. */
const rings: [number, number][] = [
  [0, 1],
  [0.14, 6],
  [0.28, 12],
  [0.42, 18],
  [0.56, 24],
  [0.7, 30],
  [0.84, 37],
];
const electrodes = rings.flatMap(([r, count], ri) =>
  Array.from({ length: count }, (_, i) => ({ r, a: (360 / count) * i + (ri % 2 ? 180 / count : 0) })),
);

const norm = (a: number) => ((((a + 180) % 360) + 360) % 360) - 180;
function inRegion(e: { r: number; a: number }, [a0, a1, r0, r1]: [number, number, number, number]) {
  if (e.r < r0 || e.r > r1) return false;
  const a = norm(e.a);
  if (a1 > 180) return a >= a0 || a <= norm(a1); // wraps around the back of the head
  return a >= a0 && a <= a1;
}

/** Interactive top-down head map of the electrode regions used for each ERP component. */
export function ElectrodeMap() {
  const [selected, setSelected] = useState<string>("all");
  const S = 300;
  const c = S / 2;
  const R = 120;
  const pt = (r: number, a: number) => {
    const rad = (a * Math.PI) / 180;
    return [c + r * R * Math.sin(rad), c - r * R * Math.cos(rad)];
  };
  const sector = ([a0, a1, r0, r1]: [number, number, number, number]) => {
    const [x0, y0] = pt(r1, a0);
    const [x1, y1] = pt(r1, a1);
    const [x2, y2] = pt(r0, a1);
    const [x3, y3] = pt(r0, a0);
    const large = a1 - a0 > 180 ? 1 : 0;
    return `M${x0},${y0} A${r1 * R},${r1 * R} 0 ${large} 1 ${x1},${y1} L${x2},${y2} A${r0 * R},${r0 * R} 0 ${large} 0 ${x3},${y3} Z`;
  };

  const shown = selected === "all" ? components : components.filter((k) => k.key === selected);
  // De-duplicate shared regions (P100/N170/N250 use the same electrodes).
  const regionSets = Array.from(new Map(shown.map((k) => [JSON.stringify(k.regions), k])).values());
  const active = components.find((k) => k.key === selected);

  const colorFor = (e: { r: number; a: number }) => {
    for (const k of regionSets) if (k.regions.some((reg) => inRegion(e, reg))) return k.color;
    return null;
  };

  return (
    <figure className="not-prose my-10 rounded-xl border border-border bg-surface p-4 sm:p-5">
      <div className="flex flex-wrap gap-1.5" role="group" aria-label="ERP component">
        {[{ key: "all", name: "All" }, ...components].map((k) => (
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
            {k.name}
          </button>
        ))}
      </div>

      <div className="mt-4 grid items-center gap-5 sm:grid-cols-[minmax(0,18rem)_1fr]">
        <svg viewBox={`0 0 ${S} ${S}`} className="mx-auto w-full max-w-72" role="img" aria-label="Top-down view of the head showing electrode regions">
          {/* nose and ears */}
          <path d={`M${c - 12},${c - R + 2} L${c},${c - R - 16} L${c + 12},${c - R + 2}`} fill="none" stroke="var(--muted)" strokeOpacity="0.6" />
          <ellipse cx={c - R - 4} cy={c} rx={7} ry={18} fill="none" stroke="var(--muted)" strokeOpacity="0.6" />
          <ellipse cx={c + R + 4} cy={c} rx={7} ry={18} fill="none" stroke="var(--muted)" strokeOpacity="0.6" />
          <circle cx={c} cy={c} r={R} fill="var(--background)" stroke="var(--muted)" strokeOpacity="0.6" />

          {regionSets.flatMap((k) =>
            k.regions.map((reg, i) => (
              <path
                key={`${k.key}-${i}`}
                d={sector(reg)}
                fill={k.color}
                fillOpacity={0.18}
                stroke={k.color}
                strokeOpacity={0.6}
              />
            )),
          )}

          {electrodes.map((e, i) => {
            const [ex, ey] = pt(e.r, e.a);
            const col = colorFor(e);
            return <circle key={i} cx={ex} cy={ey} r={col ? 3.4 : 2.4} fill={col ?? "var(--muted)"} fillOpacity={col ? 1 : 0.35} />;
          })}

          <text x={c} y={14} textAnchor="middle" className="fill-muted text-[9px] tracking-widest">
            FRONT
          </text>
          <text x={c} y={S - 4} textAnchor="middle" className="fill-muted text-[9px] tracking-widest">
            BACK
          </text>
        </svg>

        <div aria-live="polite">
          {active ? (
            <div>
              <p className="flex items-center gap-2">
                <span className="text-2xl font-semibold text-foreground">{active.name}</span>
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
              ].map((g) => (
                <li key={g.label} className="flex gap-2.5">
                  <span className="mt-1.5 size-2.5 shrink-0 rounded-full" style={{ background: g.color }} />
                  <span>
                    <span className="font-semibold text-foreground">{g.label}</span>
                    <span className="block text-muted">{g.text}</span>
                  </span>
                </li>
              ))}
              <li className="pt-1 text-xs text-muted">Select a component for its timing and function.</li>
            </ul>
          )}
        </div>
      </div>
      <figcaption className="mt-4 text-xs italic text-muted">
        Simplified, top-down view of the 128-electrode net (front of head at top). Shaded areas mark the electrode
        regions averaged for each component.
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
