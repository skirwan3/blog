import { groups, historyFlags, MAX_POINTS, scorecard } from "./readmissionData";

const elementGroups: { title: string; items: (string | [string, string[]])[] }[] = [
  { title: "Patient information", items: ["Age", "Sex", "Discharge year", "Insurance type", "Referral source"] },
  {
    title: "Individual diagnoses",
    items: [
      "Rehabilitation Impairment Group (RIC)",
      "Primary diagnosis category",
      "CVA",
      "COPD",
      "Sepsis",
      "GI bleed",
      ["Heart failure", ["Acute heart failure"]],
      "Renal failure",
      "CABG",
      "Pneumonia",
      "MI",
      "Cancer",
      "Edema",
    ],
  },
  {
    title: "Other conditions",
    items: [
      ["Organ transplant", ["Heart", "Kidney", "Liver", "Lung", "Other"]],
      "Tube feeding",
      "Tracheotomy",
      "Blood product administration",
      "Complex wound",
    ],
  },
  { title: "Medication administrations", items: ["Antibiotics", "Diuretics"] },
  { title: "Caretool scores", items: ["Mobility", "Self care", "Walk", "Wheel"] },
  { title: "Vitals", items: ["Heart rate", "Respiratory rate", "Blood pressure", "Temperature"] },
  { title: "Other", items: ["Count of high-risk conditions", "Hospital length of stay"] },
];

const labs = [
  "Alb", "HCT", "HGB", "RBC", "BUN", "NA", "Creat", "K", "WBC", "AST", "Abs_Neut_Count", "Alk_Phos", "Alt",
  "Band_Neut", "CA", "CL", "CO2", "EOS", "Eosinophils_Num", "Gap", "MAG", "MCH", "Neut_Percent", "Plt", "Prealb",
  "Total_Bili", "Phos", "BNP_NT_PRO", "Chol", "HDL", "LDL_Calc", "Dilantin", "SED_Rate", "Dig", "Phenobarb",
  "Bili_Direct", "Carb", "CK", "Amy", "Lip", "Tacrolimus", "Theo", "Fesat", "Ferritin", "Iron", "TIBC",
  "CA_Ionized", "Valproic Acid", "T4", "Tobramycin", "GGT", "CKMB", "VITD25", "T4C", "Monocytes", "Mono_Num",
  "Mono_Percent", "MCHC", "Lymph_Num", "Baso", "Baso_Num",
];

function Chip({ children, muted }: { children: React.ReactNode; muted?: boolean }) {
  return (
    <span
      className={`inline-block rounded-md border px-2 py-0.5 text-xs ${
        muted ? "border-border/70 text-muted" : "border-border bg-background/60 text-foreground/85"
      }`}
    >
      {children}
    </span>
  );
}

/** Candidate data elements, grouped by source. */
export function DataElements() {
  const total = elementGroups.reduce((n, g) => n + g.items.length, 0) + labs.length;
  return (
    <figure className="not-prose my-10">
      <div className="rounded-xl border border-border bg-surface p-4 sm:p-5">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <p className="text-[0.95rem] font-semibold text-foreground">Candidate data elements</p>
          <p className="text-xs text-muted">
            <span className="font-semibold tabular-nums text-foreground">{total}</span> considered
          </p>
        </div>
        <div className="mt-4 columns-1 gap-3 sm:columns-2">
          {elementGroups.map((g) => (
            <div key={g.title} className="mb-3 break-inside-avoid rounded-lg border border-border bg-background/40 p-3">
              <p className="mb-2 flex items-baseline justify-between text-xs font-medium text-accent-2">
                {g.title}
                <span className="font-normal tabular-nums text-muted">{g.items.length}</span>
              </p>
              <div className="flex flex-wrap gap-1.5">
                {g.items.map((item) =>
                  typeof item === "string" ? (
                    <Chip key={item}>{item}</Chip>
                  ) : (
                    <Chip key={item[0]}>
                      {item[0]}
                      <span className="ml-1 text-muted">({item[1].join(", ")})</span>
                    </Chip>
                  ),
                )}
              </div>
            </div>
          ))}
        </div>
        <div className="rounded-lg border border-border bg-background/40 p-3">
          <p className="mb-2 flex items-baseline justify-between text-xs font-medium text-accent-2">
            Labs
            <span className="font-normal tabular-nums text-muted">{labs.length}</span>
          </p>
          <div className="flex flex-wrap gap-1">
            {labs.map((l) => (
              <Chip key={l} muted>
                <span className="font-mono text-[11px]">{l}</span>
              </Chip>
            ))}
          </div>
        </div>
      </div>
      <figcaption className="mt-3 text-center text-sm italic text-muted">
        Factors clinicians flagged as likely predictors of readmission, before variable selection.
      </figcaption>
    </figure>
  );
}

const dxEstimates: { category: string; estimate: number; reference?: boolean }[] = [
  { category: "Pulmonary Disorders", estimate: 1.0817 },
  { category: "Digestive Diseases", estimate: 0.9205 },
  { category: "Other", estimate: 0.6811 },
  { category: "Oncology", estimate: 0.6421 },
  { category: "Medically Complex", estimate: 0.5927 },
  { category: "Cardiac", estimate: 0.507 },
  { category: "Stroke", estimate: 0.4497 },
  { category: "Nervous System", estimate: 0.432 },
  { category: "Brain Injury", estimate: 0.3674 },
  { category: "Orthopedic", estimate: 0.2177 },
  { category: "Spinal Cord Injury", estimate: 0, reference: true },
];

function Term({ label, accent }: { label: string; accent?: boolean }) {
  return (
    <span
      className={`rounded-md border px-2.5 py-1 ${
        accent ? "border-accent-2/30 bg-accent-2/10 text-accent-2" : "border-border bg-background/60 text-foreground"
      }`}
    >
      {label}
    </span>
  );
}

/** How model estimates become integer risk points, using primary diagnosis as the example. */
export function ScoreCalculation() {
  return (
    <figure className="not-prose my-10">
      <div className="rounded-xl border border-border bg-surface p-4 sm:p-6">
        <div className="flex flex-wrap items-center justify-center gap-x-2.5 gap-y-2 text-sm font-medium">
          <Term label="Model estimate" />
          <span className="text-muted">× 10</span>
          <span className="text-muted">→</span>
          <span className="text-muted">round</span>
          <span className="text-muted">=</span>
          <Term label="Risk points" accent />
        </div>

        <div className="mt-6 overflow-x-auto">
          <table className="w-full text-sm tabular-nums">
            <caption className="sr-only">Primary diagnosis category estimates converted to risk points</caption>
            <thead>
              <tr className="text-right text-xs text-muted">
                <th scope="col" className="whitespace-nowrap pb-2 text-left font-medium">Primary diagnosis</th>
                <th scope="col" className="whitespace-nowrap px-2 pb-2 font-medium sm:px-3">Estimate</th>
                <th scope="col" className="whitespace-nowrap px-2 pb-2 font-medium sm:px-3">× 10</th>
                <th scope="col" className="whitespace-nowrap pb-2 font-medium">Points</th>
              </tr>
            </thead>
            <tbody>
              {dxEstimates.map((d) => (
                <tr key={d.category} className="border-t border-border">
                  <th scope="row" className="py-2.5 pr-2 text-left font-normal text-foreground sm:whitespace-nowrap">
                    {d.category}
                    {d.reference && (
                      <span className="ml-2 rounded-full border border-border px-1.5 py-0.5 text-[10px] text-muted">
                        reference
                      </span>
                    )}
                  </th>
                  <td className="px-2 py-2.5 text-right text-muted sm:px-3">{d.estimate.toFixed(4)}</td>
                  <td className="px-2 py-2.5 text-right text-muted sm:px-3">{(d.estimate * 10).toFixed(3)}</td>
                  <td className="py-2.5 text-right">
                    <span className="inline-block min-w-8 rounded-md border border-accent-2/30 bg-accent-2/10 px-2 py-0.5 text-center font-semibold text-accent-2">
                      {Math.round(d.estimate * 10)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <figcaption className="mt-3 text-center text-sm italic text-muted">
        Each estimate is scaled by 10 and rounded to a whole-number score. Spinal cord injury is the reference
        group, so its estimate is 0.
      </figcaption>
    </figure>
  );
}

function PointsRow({ label, points }: { label: string; points: number }) {
  return (
    <li className="flex items-baseline justify-between gap-3 py-1 text-sm">
      <span className="text-foreground/85">{label}</span>
      <span className={`tabular-nums ${points ? "font-semibold text-foreground" : "text-muted"}`}>{points}</span>
    </li>
  );
}

/** The full scorecard: points per factor plus the risk group cutoffs. */
export function RiskScorecard() {
  return (
    <figure className="not-prose my-10">
      <div className="rounded-xl border border-border bg-surface p-4 sm:p-5">
        <div className="columns-1 gap-3 sm:columns-2">
          {scorecard.map((f) => (
            <div key={f.key} className="mb-3 break-inside-avoid rounded-lg border border-border bg-background/40 px-3 py-2.5">
              <p className="mb-1 flex items-baseline justify-between text-xs font-medium text-accent-2">
                {f.label}
                <span className="font-normal text-muted">max {Math.max(...f.options.map((o) => o.points))}</span>
              </p>
              <ul className="list-none! pl-0!">
                {f.options.map((o) => (
                  <PointsRow key={o.label} label={o.label} points={o.points} />
                ))}
              </ul>
            </div>
          ))}
          <div className="mb-3 break-inside-avoid rounded-lg border border-border bg-background/40 px-3 py-2.5">
            <p className="mb-1 flex items-baseline justify-between text-xs font-medium text-accent-2">
              History of…
              <span className="font-normal text-muted">if present</span>
            </p>
            <ul className="list-none! pl-0!">
              {historyFlags.map((h) => (
                <PointsRow key={h.key} label={h.label} points={h.points} />
              ))}
            </ul>
          </div>
        </div>

        <RiskBands />
      </div>
      <figcaption className="mt-3 text-center text-sm italic text-muted">
        Points for each factor are summed into a total score out of {MAX_POINTS}. Group cutoffs sit at the 75th and
        90th percentiles of past patients&apos; scores.
      </figcaption>
    </figure>
  );
}

/** Horizontal band showing the three risk groups; the axis is capped at 40 points since higher scores are rare. */
export function RiskBands({ score, compact }: { score?: number; compact?: boolean }) {
  const scaleMax = 40; // scores above 40 are vanishingly rare; keep the bands readable
  const pos = (v: number) => `${(Math.min(v, scaleMax) / scaleMax) * 100}%`;
  return (
    <div className="mt-2">
      <div className="relative flex h-3 gap-0.5 overflow-hidden rounded-full">
        {groups.map((g) => (
          <div
            key={g.group}
            style={{
              width: `${((Math.min(g.max, scaleMax) - g.min + (g.group === "High" ? 0 : 1)) / scaleMax) * 100}%`,
              background: g.color,
              opacity: score === undefined ? 0.7 : 0.35,
            }}
          />
        ))}
      </div>
      {score !== undefined && (
        <div className="relative h-0">
          <div
            className="absolute -top-4.5 h-6 w-1 -translate-x-1/2 rounded-full bg-foreground shadow"
            style={{ left: pos(score) }}
          />
        </div>
      )}
      <div className="mt-2 grid grid-cols-3 gap-2 text-xs">
        {groups.map((g) => (
          <div key={g.group}>
            <p className="flex items-center gap-1.5 font-medium text-foreground">
              <span className="size-2 shrink-0 rounded-full" style={{ background: g.color }} />
              {g.group}
            </p>
            <p className="tabular-nums text-muted">
              {g.group === "High" ? `${g.min}+` : `${g.min}–${g.max}`} pts
              {!compact && <span className="hidden sm:inline"> · {g.percentile} pct.</span>}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Points along a binormal ROC curve whose area equals the reported AUC (0.6956). */
const rocPoints: [number, number][] = [
  [0, 0], [0.002, 0.0156], [0.005, 0.032], [0.01, 0.0545], [0.02, 0.0918], [0.03, 0.1236], [0.05, 0.1785],
  [0.075, 0.2371], [0.1, 0.2885], [0.15, 0.3773], [0.2, 0.4531], [0.25, 0.5197], [0.3, 0.579], [0.35, 0.6325],
  [0.4, 0.681], [0.45, 0.7251], [0.5, 0.7654], [0.55, 0.8022], [0.6, 0.8357], [0.65, 0.8663], [0.7, 0.894],
  [0.75, 0.919], [0.8, 0.9413], [0.85, 0.9608], [0.9, 0.9775], [0.95, 0.9911], [0.975, 0.9964], [0.99, 0.9989],
  [0.998, 0.9998], [1, 1],
];

/** Approximate recreation of the model's ROC curve. */
export function RocCurve() {
  const S = 300;
  const pad = { l: 44, b: 40, t: 12, r: 12 };
  const x = (v: number) => pad.l + v * S;
  const y = (v: number) => pad.t + (1 - v) * S;
  const line = rocPoints.map(([fx, ty], i) => `${i ? "L" : "M"}${x(fx).toFixed(1)},${y(ty).toFixed(1)}`).join("");
  const ticks = [0, 0.25, 0.5, 0.75, 1];

  return (
    <figure className="not-prose my-10">
      <div className="rounded-xl border border-border bg-surface p-4 sm:p-5">
        <div className="grid items-center gap-6 sm:grid-cols-[1fr_11rem]">
          <svg
            viewBox={`0 0 ${pad.l + S + pad.r} ${pad.t + S + pad.b}`}
            className="mx-auto w-full max-w-sm"
            role="img"
            aria-label="ROC curve bowing above the diagonal chance line, area under the curve 0.6956"
          >
            {ticks.map((t) => (
              <g key={t}>
                <line x1={x(0)} x2={x(1)} y1={y(t)} y2={y(t)} stroke="var(--border)" />
                <line x1={x(t)} x2={x(t)} y1={y(0)} y2={y(1)} stroke="var(--border)" />
                <text x={x(0) - 8} y={y(t)} dy="0.32em" textAnchor="end" className="fill-muted text-[10px] tabular-nums">
                  {t.toFixed(2)}
                </text>
                <text x={x(t)} y={y(0) + 16} textAnchor="middle" className="fill-muted text-[10px] tabular-nums">
                  {t.toFixed(2)}
                </text>
              </g>
            ))}
            <path d={`${line}L${x(1)},${y(0)}L${x(0)},${y(0)}Z`} fill="#3987e5" fillOpacity="0.14" />
            <line
              x1={x(0)}
              y1={y(0)}
              x2={x(1)}
              y2={y(1)}
              stroke="var(--muted)"
              strokeDasharray="4 4"
              strokeOpacity="0.7"
            />
            <path d={line} fill="none" stroke="#3987e5" strokeWidth="2.5" strokeLinejoin="round" />
            <text
              x={x(0.62)}
              y={y(0.5)}
              className="fill-muted text-[10px]"
              transform={`rotate(-45 ${x(0.62)} ${y(0.5)})`}
              textAnchor="middle"
              dy="-6"
            >
              chance (AUC 0.5)
            </text>
            <text x={x(0.5)} y={y(0) + 34} textAnchor="middle" className="fill-muted text-[11px]">
              1 − Specificity (false positive rate)
            </text>
            <text
              x={12}
              y={y(0.5)}
              textAnchor="middle"
              className="fill-muted text-[11px]"
              transform={`rotate(-90 12 ${y(0.5)})`}
            >
              Sensitivity
            </text>
          </svg>

          <div className="text-center sm:text-left">
            <p className="text-xs text-muted">Area under the curve</p>
            <p className="mt-1 text-4xl font-semibold tabular-nums text-foreground">0.6956</p>
            <p className="mt-3 text-xs leading-relaxed text-muted">
              The dashed diagonal is a model with no predictive power (AUC 0.5).
            </p>
          </div>
        </div>
      </div>
      <figcaption className="mt-3 text-center text-sm italic text-muted">
        ROC curve for the final logistic regression. This is a smoothed recreation drawn to match the reported AUC,
        not a re-plot of the original model output.
      </figcaption>
    </figure>
  );
}
