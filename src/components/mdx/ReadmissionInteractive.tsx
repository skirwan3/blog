"use client";

import { useState } from "react";
import { RiskBands } from "./ReadmissionMethods";
import {
  groups,
  historyFlags,
  MAX_POINTS,
  readmissionRates,
  riskGroup,
  scorecard,
  scoreBreakdown,
  totalScore,
  type PatientProfile,
  type RiskGroup,
} from "./readmissionData";

const examples: { name: string; summary: string; profile: PatientProfile }[] = [
  {
    name: "Patient A",
    summary: "87-year-old male, medically complex, low self-care score, renal failure",
    profile: {
      levels: { age: "85+", gender: "Male", dx: "Medically Complex", selfCare: "Low (7–13)", prealb: "Normal" },
      flags: ["renal"],
    },
  },
  {
    name: "Patient B",
    summary: "45-year-old female, brain injury, medium self-care score, low prealbumin",
    profile: {
      levels: { age: "45–64", gender: "Female", dx: "Brain Injury", selfCare: "Medium (14–20)", prealb: "Low" },
      flags: [],
    },
  },
];

export function GroupBadge({ group }: { group: RiskGroup }) {
  const g = groups.find((x) => x.group === group)!;
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide"
      style={{ color: g.color, borderColor: `${g.color}66`, background: `${g.color}1a` }}
    >
      <span className="size-1.5 shrink-0 rounded-full" style={{ background: g.color }} />
      {group}
    </span>
  );
}

/** Interactive scorecard: pick a patient's characteristics and watch the score and risk group update. */
export function RiskCalculator() {
  const [active, setActive] = useState(0);
  const [profile, setProfile] = useState<PatientProfile>(examples[0].profile);
  const parts = scoreBreakdown(profile);
  const score = totalScore(profile);
  const group = riskGroup(score);

  function load(i: number) {
    setActive(i);
    setProfile(examples[i].profile);
  }
  function setLevel(key: string, value: string) {
    setActive(-1);
    setProfile((p) => ({ ...p, levels: { ...p.levels, [key]: value } }));
  }
  function toggleFlag(key: string) {
    setActive(-1);
    setProfile((p) => ({
      ...p,
      flags: p.flags.includes(key) ? p.flags.filter((f) => f !== key) : [...p.flags, key],
    }));
  }

  return (
    <figure className="not-prose my-10">
      <div className="rounded-xl border border-border bg-surface p-4 sm:p-5">
        <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Example patients">
          {examples.map((ex, i) => (
            <button
              key={ex.name}
              type="button"
              aria-pressed={active === i}
              onClick={() => load(i)}
              className={`rounded-lg border px-3 py-1.5 text-xs transition-colors ${
                active === i
                  ? "border-accent-2/40 bg-accent-2/10 text-accent-2"
                  : "border-border text-muted hover:text-foreground"
              }`}
            >
              {ex.name}
            </button>
          ))}
          <span className="text-xs text-muted">{active === -1 ? "Custom patient" : examples[active].summary}</span>
        </div>

        <div className="mt-4 grid gap-5 sm:grid-cols-2">
          <div className="space-y-3">
            {scorecard.map((f) => (
              <label key={f.key} className="block">
                <span className="mb-1 block text-xs text-muted">{f.label}</span>
                <select
                  value={profile.levels[f.key]}
                  onChange={(e) => setLevel(f.key, e.target.value)}
                  className="w-full rounded-lg border border-border bg-background px-3 py-1.5 text-sm text-foreground outline-none focus:border-accent"
                >
                  {f.options.map((o) => (
                    <option key={o.label} value={o.label}>
                      {o.label} ({o.points} pts)
                    </option>
                  ))}
                </select>
              </label>
            ))}
            <div>
              <span className="mb-1.5 block text-xs text-muted">History of</span>
              <div className="flex flex-wrap gap-1.5">
                {historyFlags.map((h) => {
                  const on = profile.flags.includes(h.key);
                  return (
                    <button
                      key={h.key}
                      type="button"
                      aria-pressed={on}
                      onClick={() => toggleFlag(h.key)}
                      className={`rounded-md border px-2 py-1 text-xs transition-colors ${
                        on
                          ? "border-accent-2/40 bg-accent-2/10 text-accent-2"
                          : "border-border text-muted hover:text-foreground"
                      }`}
                    >
                      {h.label} <span className="tabular-nums opacity-70">+{h.points}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="flex flex-col rounded-lg border border-border bg-background/60 p-4" aria-live="polite">
            <p className="text-xs text-muted">Points by factor</p>
            <ul className="mt-2 list-none! space-y-1.5 pl-0! text-sm">
              {parts.length === 0 && <li className="text-muted">No risk points</li>}
              {parts.map((p) => (
                <li key={p.factor} className="flex items-baseline justify-between gap-3">
                  <span className="text-foreground/85">
                    {p.factor} <span className="text-xs text-muted">{p.detail !== "History" && `· ${p.detail}`}</span>
                  </span>
                  <span className="font-semibold tabular-nums text-foreground">+{p.points}</span>
                </li>
              ))}
            </ul>
            <div className="mt-auto pt-5">
              <div className="flex items-end justify-between gap-3 border-t border-border pt-3">
                <p className="text-sm text-muted">
                  Total{" "}
                  <span className="text-2xl font-semibold tabular-nums text-foreground">{score}</span>
                  <span className="tabular-nums"> / {MAX_POINTS}</span>
                </p>
                <GroupBadge group={group.group} />
              </div>
              <div className="mt-5">
                <RiskBands score={score} compact />
              </div>
            </div>
          </div>
        </div>
      </div>
      <figcaption className="mt-3 text-center text-sm italic text-muted">
        The two example patients from the scorecard. Change any characteristic to see how the total score and risk
        group respond.
      </figcaption>
    </figure>
  );
}

const periods = ["Overall", "2019", "2020", "2021", "2022"];
const order: RiskGroup[] = ["High", "Medium", "Low"];

/** Readmission rate by risk group, overall or for a single year. */
export function ReadmissionRates() {
  const [period, setPeriod] = useState("Overall");
  const data = readmissionRates[period];
  const maxRate = 40;
  const ratio = data.High.rate / data.Low.rate;

  return (
    <figure className="not-prose my-10">
      <div className="rounded-xl border border-border bg-surface p-4 sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <p className="text-[0.95rem] font-semibold leading-snug text-foreground">
            Readmission rate by risk group
            <span className="block text-sm font-normal text-muted">
              Past patients, scored retrospectively{period === "2022" && " · 2022 as of Sep 21"}
            </span>
          </p>
          <div className="flex flex-wrap rounded-lg border border-border p-0.5 text-xs" role="group" aria-label="Period">
            {periods.map((p) => (
              <button
                key={p}
                type="button"
                aria-pressed={period === p}
                onClick={() => setPeriod(p)}
                className={`rounded-md px-2.5 py-1 transition-colors ${
                  period === p ? "bg-foreground/10 text-foreground" : "text-muted hover:text-foreground"
                }`}
              >
                {p === "2022" ? "2022*" : p}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-6 space-y-4">
          {order.map((g) => {
            const d = data[g];
            const color = groups.find((x) => x.group === g)!.color;
            return (
              <div key={g} className="grid grid-cols-[4.5rem_1fr_auto] items-center gap-3">
                <span className="text-sm text-foreground">{g}</span>
                <div className="h-6 rounded-md bg-foreground/5">
                  <div
                    className="h-full rounded-md transition-[width] duration-500 ease-out"
                    style={{ width: `${(d.rate / maxRate) * 100}%`, background: color, opacity: 0.85 }}
                  />
                </div>
                <span className="w-28 text-right text-sm tabular-nums">
                  <span className="font-semibold text-foreground">{d.rate.toFixed(2)}%</span>
                  <span className="ml-1.5 text-xs text-muted">n={d.n.toLocaleString("en-US")}</span>
                </span>
              </div>
            );
          })}
        </div>

        <p className="mt-5 rounded-lg border border-border bg-background/60 px-4 py-3 text-sm text-muted">
          High-risk patients were readmitted{" "}
          <span className="font-semibold text-accent-2">{ratio.toFixed(1)}×</span> as often as low-risk patients
          {period === "Overall" ? " overall" : ` in ${period}`}.
        </p>
      </div>
      <figcaption className="mt-3 text-center text-sm italic text-muted">
        Readmission rates rise steadily from the low to the high risk group, overall and in every year.
      </figcaption>
    </figure>
  );
}
