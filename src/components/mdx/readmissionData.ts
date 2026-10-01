/** Readmission risk scorecard: points per factor level, from the final logistic regression (estimate × 10, rounded). */

export type RiskGroup = "Low" | "Medium" | "High";

export type Factor = {
  key: string;
  label: string;
  options: { label: string; points: number }[];
};

export const scorecard: Factor[] = [
  {
    key: "age",
    label: "Age",
    options: [
      { label: "18–44", points: 0 },
      { label: "45–64", points: 0 },
      { label: "65–84", points: 1 },
      { label: "85+", points: 2 },
    ],
  },
  {
    key: "gender",
    label: "Gender",
    options: [
      { label: "Female", points: 0 },
      { label: "Male", points: 2 },
    ],
  },
  {
    key: "dx",
    label: "Primary diagnosis",
    options: [
      { label: "Spinal Cord Injury", points: 0 },
      { label: "Orthopedic", points: 2 },
      { label: "Stroke", points: 4 },
      { label: "Nervous System", points: 4 },
      { label: "Brain Injury", points: 4 },
      { label: "Cardiac", points: 5 },
      { label: "Oncology", points: 6 },
      { label: "Medically Complex", points: 6 },
      { label: "Other", points: 7 },
      { label: "Digestive Diseases", points: 9 },
      { label: "Pulmonary Disorders", points: 11 },
    ],
  },
  {
    key: "selfCare",
    label: "Self-care score",
    options: [
      { label: "High (21+)", points: 0 },
      { label: "Medium (14–20)", points: 4 },
      { label: "Low (7–13)", points: 10 },
    ],
  },
  {
    key: "prealb",
    label: "Prealbumin lab",
    options: [
      { label: "Normal", points: 0 },
      { label: "Low", points: 4 },
    ],
  },
];

/** Yes/no history flags: points awarded when present. */
export const historyFlags: { key: string; label: string; points: number }[] = [
  { key: "renal", label: "Renal failure", points: 9 },
  { key: "gi", label: "GI bleed", points: 9 },
  { key: "liver", label: "Liver disease", points: 5 },
  { key: "sepsis", label: "Sepsis", points: 5 },
  { key: "cancer", label: "Cancer", points: 5 },
  { key: "tube", label: "Tube feeding", points: 5 },
  { key: "pneumonia", label: "Pneumonia", points: 4 },
  { key: "heart", label: "Heart failure", points: 2 },
  { key: "copd", label: "COPD", points: 2 },
];

export const MAX_POINTS = 75;

/** Score cutoffs set at the 75th and 90th percentiles of past patients. */
export const groups: { group: RiskGroup; min: number; max: number; percentile: string; color: string }[] = [
  { group: "Low", min: 0, max: 19, percentile: "0–75th", color: "#0ca30c" },
  { group: "Medium", min: 20, max: 23, percentile: "75th–90th", color: "#fab219" },
  { group: "High", min: 24, max: MAX_POINTS, percentile: "90th–100th", color: "#d03b3b" },
];

export function riskGroup(score: number) {
  return groups.find((g) => score >= g.min && score <= g.max)!;
}

export type PatientProfile = {
  /** Option label chosen for each scorecard factor. */
  levels: Record<string, string>;
  /** History flags present. */
  flags: string[];
};

/** Points contributed by each factor, largest first, zero-point factors dropped. */
export function scoreBreakdown(p: PatientProfile) {
  const parts = [
    ...scorecard.map((f) => {
      const opt = f.options.find((o) => o.label === p.levels[f.key]) ?? f.options[0];
      return { factor: f.label, detail: opt.label, points: opt.points };
    }),
    ...historyFlags
      .filter((h) => p.flags.includes(h.key))
      .map((h) => ({ factor: h.label, detail: "History", points: h.points })),
  ];
  return parts.filter((x) => x.points > 0).sort((a, b) => b.points - a.points);
}

export function totalScore(p: PatientProfile) {
  return scoreBreakdown(p).reduce((sum, x) => sum + x.points, 0);
}

/** Readmission rates by risk group, overall and by discharge year (2022 as of 09/21/22). */
export const readmissionRates: Record<string, Record<RiskGroup, { rate: number; n: number }>> = {
  Overall: { High: { rate: 28.24, n: 1335 }, Medium: { rate: 17.51, n: 1828 }, Low: { rate: 8.87, n: 7056 } },
  "2019": { High: { rate: 36.24, n: 526 }, Medium: { rate: 13.46, n: 654 }, Low: { rate: 8.36, n: 1663 } },
  "2020": { High: { rate: 26.15, n: 325 }, Medium: { rate: 19.24, n: 447 }, Low: { rate: 9.86, n: 1937 } },
  "2021": { High: { rate: 31.19, n: 295 }, Medium: { rate: 20.18, n: 436 }, Low: { rate: 8.31, n: 1842 } },
  "2022": { High: { rate: 32.8, n: 189 }, Medium: { rate: 19.93, n: 291 }, Low: { rate: 8.86, n: 1614 } },
};
