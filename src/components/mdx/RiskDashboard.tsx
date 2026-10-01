"use client";

import { Fragment, useState } from "react";
import { GroupBadge } from "./ReadmissionInteractive";
import { groups, riskGroup, scoreBreakdown, totalScore, type PatientProfile, type RiskGroup } from "./readmissionData";

/** Placeholder distribution of risk scores (bins of 2 points). */
const histogram: [number, number][] = [
  [0, 2], [2, 22], [4, 78], [6, 163], [8, 208], [10, 197], [12, 198], [14, 228], [16, 236], [18, 200], [20, 150],
  [22, 121], [24, 62], [26, 54], [28, 24], [30, 15], [32, 9], [34, 8], [36, 1], [38, 3], [40, 1],
];
const histMax = 250;

type Row = { id: string; admitted: string; readmitted: boolean; profile: PatientProfile };

const p = (
  age: string,
  gender: string,
  dx: string,
  selfCare: string,
  flags: string[] = [],
  prealb = "Normal",
): PatientProfile => ({ levels: { age, gender, dx, selfCare, prealb }, flags });

/** Placeholder patients — scores and factors are computed from the real scorecard. */
const patients: Row[] = [
  { id: "PT-1042", admitted: "Sep 1", readmitted: true, profile: p("85+", "Male", "Medically Complex", "Low (7–13)", ["renal"]) },
  { id: "PT-1041", admitted: "Sep 1", readmitted: false, profile: p("65–84", "Female", "Oncology", "Medium (14–20)", ["cancer", "tube"]) },
  { id: "PT-1040", admitted: "Sep 1", readmitted: false, profile: p("65–84", "Male", "Stroke", "Medium (14–20)") },
  { id: "PT-1039", admitted: "Sep 1", readmitted: false, profile: p("45–64", "Male", "Orthopedic", "Low (7–13)") },
  { id: "PT-1038", admitted: "Sep 1", readmitted: false, profile: p("85+", "Female", "Orthopedic", "Medium (14–20)") },
  { id: "PT-1037", admitted: "Aug 31", readmitted: false, profile: p("65–84", "Female", "Cardiac", "High (21+)", ["heart"]) },
  { id: "PT-1036", admitted: "Aug 31", readmitted: false, profile: p("65–84", "Male", "Pulmonary Disorders", "Medium (14–20)", ["copd"]) },
  { id: "PT-1035", admitted: "Aug 31", readmitted: true, profile: p("45–64", "Female", "Digestive Diseases", "Medium (14–20)", ["gi"], "Low") },
  { id: "PT-1034", admitted: "Aug 31", readmitted: false, profile: p("65–84", "Male", "Medically Complex", "Medium (14–20)", ["renal", "liver"]) },
  { id: "PT-1033", admitted: "Aug 31", readmitted: false, profile: p("18–44", "Male", "Spinal Cord Injury", "Low (7–13)") },
  { id: "PT-1032", admitted: "Aug 30", readmitted: false, profile: p("65–84", "Female", "Nervous System", "Medium (14–20)", ["pneumonia"], "Low") },
  { id: "PT-1031", admitted: "Aug 30", readmitted: true, profile: p("85+", "Male", "Other", "Medium (14–20)", ["sepsis"]) },
  { id: "PT-1030", admitted: "Aug 30", readmitted: false, profile: p("65–84", "Female", "Brain Injury", "Low (7–13)") },
  { id: "PT-1029", admitted: "Aug 30", readmitted: false, profile: p("45–64", "Male", "Cardiac", "Medium (14–20)", ["heart", "renal"]) },
];

const scored = patients.map((r) => {
  const score = totalScore(r.profile);
  return { ...r, score, group: riskGroup(score).group, factors: scoreBreakdown(r.profile) };
});

/** Placeholder recreation of the SAS VA dashboard: score distribution plus a filterable patient list. */
export function RiskDashboard() {
  const [filter, setFilter] = useState<RiskGroup | "All">("All");
  const [readmittedOnly, setReadmittedOnly] = useState(false);
  const [open, setOpen] = useState<string | null>(null);

  const rows = scored.filter(
    (r) => (filter === "All" || r.group === filter) && (!readmittedOnly || r.readmitted),
  );
  const histTotal = histogram.reduce((n, [, c]) => n + c, 0);
  const groupCount = (g: RiskGroup) => histogram.filter(([s]) => riskGroup(s).group === g).reduce((n, [, c]) => n + c, 0);

  return (
    <figure className="not-prose my-10 rounded-xl border border-border bg-surface p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <figcaption className="text-[0.95rem] font-semibold leading-snug text-foreground">
          Readmission risk dashboard
          <span className="block text-sm font-normal text-muted">Current admissions · predicted risk scores</span>
        </figcaption>
        <span className="rounded-full border border-amber-400/40 bg-amber-400/10 px-2.5 py-1 text-[11px] font-medium text-amber-300">
          Placeholder data
        </span>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2" role="group" aria-label="Filter by risk group">
        {(["All", "High", "Medium", "Low"] as const).map((g) => {
          const color = g === "All" ? undefined : groups.find((x) => x.group === g)!.color;
          const on = filter === g;
          return (
            <button
              key={g}
              type="button"
              aria-pressed={on}
              onClick={() => setFilter(g)}
              className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs transition-colors ${
                on ? "border-foreground/30 bg-foreground/10 text-foreground" : "border-border text-muted hover:text-foreground"
              }`}
            >
              {color && <span className="size-2 rounded-full" style={{ background: color }} />}
              {g}
              <span className="tabular-nums opacity-60">
                {g === "All" ? histTotal.toLocaleString("en-US") : groupCount(g).toLocaleString("en-US")}
              </span>
            </button>
          );
        })}
        <label className="ml-auto flex cursor-pointer items-center gap-2 text-xs text-muted">
          <input
            type="checkbox"
            checked={readmittedOnly}
            onChange={(e) => setReadmittedOnly(e.target.checked)}
            className="accent-[#22d3ee]"
          />
          Readmitted only
        </label>
      </div>

      {/* Score distribution */}
      <div className="mt-5 pl-8">
        <div className="relative h-36">
          {[0, 100, 200].map((t) => (
            <div
              key={t}
              className={`absolute inset-x-0 border-t ${t === 0 ? "border-foreground/20" : "border-border"}`}
              style={{ bottom: `${(t / histMax) * 100}%` }}
              aria-hidden
            >
              <span className="absolute -left-8 w-6 -translate-y-1/2 text-right text-[10px] tabular-nums text-muted">
                {t}
              </span>
            </div>
          ))}
          <div className="relative flex h-full items-end gap-[2px] sm:gap-1">
            {histogram.map(([s, c]) => {
              const g = riskGroup(s);
              const dim = filter !== "All" && filter !== g.group;
              return (
                <button
                  key={s}
                  type="button"
                  onClick={() => setFilter(filter === g.group ? "All" : g.group)}
                  aria-label={`Score ${s}–${s + 1}: ${c} patients, ${g.group} risk`}
                  title={`Score ${s}–${s + 1}: ${c} patients`}
                  className="group relative flex h-full flex-1 items-end"
                >
                  <span
                    className="w-full rounded-t-[3px] transition-opacity group-hover:opacity-100"
                    style={{
                      height: `${Math.max((c / histMax) * 100, 0.8)}%`,
                      background: g.color,
                      opacity: dim ? 0.15 : 0.8,
                    }}
                  />
                </button>
              );
            })}
          </div>
        </div>
        <div className="mt-1.5 flex gap-[2px] text-[10px] tabular-nums text-muted sm:gap-1" aria-hidden>
          {histogram.map(([s]) => (
            <span key={s} className="flex-1 text-center">
              {s % 8 === 0 ? s : ""}
            </span>
          ))}
        </div>
        <p className="mt-1 text-center text-[10px] text-muted">Risk score · click a bar to filter by its risk group</p>
      </div>

      {/* Patient list */}
      <div className="mt-5 overflow-x-auto rounded-lg border border-border bg-background/60">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-[11px] text-muted">
              <th scope="col" className="hidden px-3 pb-2 pt-3 font-medium sm:table-cell">Admitted</th>
              <th scope="col" className="px-3 pb-2 pt-3 font-medium">Patient</th>
              <th scope="col" className="px-3 pb-2 pt-3 font-medium">Risk</th>
              <th scope="col" className="px-3 pb-2 pt-3 text-right font-medium">Score</th>
              <th scope="col" className="hidden px-3 pb-2 pt-3 font-medium sm:table-cell">Top risk factors</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={5} className="px-3 py-5 text-center text-sm text-muted">
                  No sample patients match these filters.
                </td>
              </tr>
            )}
            {rows.map((r) => {
              const isOpen = open === r.id;
              return (
                <Fragment key={r.id}>
                  <tr
                    className={`cursor-pointer border-t border-border/60 transition-colors hover:bg-foreground/5 ${
                      r.readmitted ? "bg-[#d03b3b]/8" : ""
                    }`}
                    onClick={() => setOpen(isOpen ? null : r.id)}
                  >
                    <td className="hidden whitespace-nowrap px-3 py-2 text-muted sm:table-cell">{r.admitted}</td>
                    <td className="whitespace-nowrap px-3 py-2">
                      <button
                        type="button"
                        aria-expanded={isOpen}
                        className="font-mono text-xs text-foreground outline-none focus-visible:underline"
                      >
                        {isOpen ? "▾" : "▸"} {r.id}
                      </button>
                      {r.readmitted && <span className="block pl-3 text-[10px] text-[#e66767]">Readmitted</span>}
                    </td>
                    <td className="px-3 py-2">
                      <GroupBadge group={r.group} />
                    </td>
                    <td className="px-3 py-2 text-right font-semibold tabular-nums text-foreground">{r.score}</td>
                    <td className="hidden px-3 py-2 text-xs text-foreground/75 sm:table-cell">
                      {r.factors
                        .slice(0, 3)
                        .map((f) => f.factor)
                        .join(" · ")}
                    </td>
                  </tr>
                  {isOpen && (
                    <tr className="bg-foreground/[0.03]">
                      <td colSpan={5} className="px-3 pb-3 pt-1">
                        <p className="mb-1.5 text-[11px] text-muted">Points by factor</p>
                        <div className="flex flex-wrap gap-1.5">
                          {r.factors.map((f) => (
                            <span
                              key={f.factor}
                              className="rounded-md border border-border bg-surface px-2 py-1 text-xs text-foreground/85"
                            >
                              {f.factor}
                              {f.detail !== "History" && <span className="text-muted"> · {f.detail}</span>}
                              <span className="ml-1.5 font-semibold tabular-nums text-accent-2">+{f.points}</span>
                            </span>
                          ))}
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-center text-xs italic text-muted">
        Illustrative only: the score distribution and patients are placeholder data, not real patient records.
        Select a patient to see the factors behind their score.
      </p>
    </figure>
  );
}
