"use client";

import { useState } from "react";

type Administration = { medication: string; dose: string; times: number; mePerDose: number };

const meds = {
  ultram: { medication: "Ultram (tramadol)", dose: "50 mg tablet", mePerDose: 10 },
  lortab: { medication: "Lortab 5/325 (hydrocodone)", dose: "5 mg hydrocodone", mePerDose: 5 },
  oxycodone: { medication: "Oxycodone IR", dose: "10 mg tablet", mePerDose: 15 },
};

const give = (key: keyof typeof meds, times: number): Administration => ({ ...meds[key], times });

/** Placeholder patient: 17 days of administrations, tapering after admission. */
const days: { date: string; label: string; administrations: Administration[] }[] = [
  ["Sep 1", [give("ultram", 3), give("lortab", 5)]],
  ["Sep 2", [give("ultram", 1), give("lortab", 2)]],
  ["Sep 3", [give("ultram", 2)]],
  ["Sep 4", [give("ultram", 2), give("lortab", 1)]],
  ["Sep 5", [give("ultram", 1)]],
  ["Sep 6", [give("lortab", 1)]],
  ["Sep 7", [give("oxycodone", 1)]],
  ["Sep 8", [give("oxycodone", 1), give("ultram", 2)]],
  ["Sep 9", [give("ultram", 2)]],
  ["Sep 10", [give("ultram", 1), give("lortab", 2)]],
  ["Sep 11", []],
  ["Sep 12", []],
  ["Sep 13", [give("ultram", 2), give("lortab", 1)]],
  ["Sep 14", [give("ultram", 1)]],
  ["Sep 15", [give("ultram", 2)]],
  ["Sep 16", [give("lortab", 4)]],
  ["Sep 17", [give("ultram", 2)]],
].map(([label, administrations], i) => ({
  date: `2022-09-${String(i + 1).padStart(2, "0")}`,
  label: label as string,
  administrations: administrations as Administration[],
}));

const total = (a: Administration[]) => a.reduce((sum, x) => sum + x.times * x.mePerDose, 0);
const totals = days.map((d) => total(d.administrations));
const ticks = [0, 20, 40, 60];

/** Placeholder recreation of the patient-level view: daily ME with a per-day medication breakdown. */
export function PatientMeTracker() {
  const [selected, setSelected] = useState(0);
  const day = days[selected];
  const dayTotal = totals[selected];
  const first = totals[0];
  const latest = totals[totals.length - 1];
  const change = ((latest - first) / first) * 100;

  return (
    <figure className="not-prose my-10 rounded-xl border border-border bg-surface p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <figcaption className="text-[0.95rem] font-semibold leading-snug text-foreground">
          Patient-level daily morphine equivalents
          <span className="block text-sm font-normal text-muted">Patient #000000 · admitted Sep 1, 2022</span>
        </figcaption>
        <span className="rounded-full border border-amber-400/40 bg-amber-400/10 px-2.5 py-1 text-[11px] font-medium text-amber-300">
          Placeholder data
        </span>
      </div>

      <dl className="mt-4 grid grid-cols-3 gap-2 text-center">
        {[
          { label: "Admission day", value: `${first} mg` },
          { label: "Latest day", value: `${latest} mg` },
          { label: "Change", value: `${change < 0 ? "−" : "+"}${Math.abs(change).toFixed(0)}%`, accent: true },
        ].map((s) => (
          <div key={s.label} className="rounded-lg border border-border bg-background/60 px-2 py-2.5">
            <dt className="text-[11px] text-muted">{s.label}</dt>
            <dd className={`mt-0.5 text-lg font-semibold tabular-nums ${s.accent ? "text-accent-2" : "text-foreground"}`}>
              {s.value}
            </dd>
          </div>
        ))}
      </dl>

      <p className="mt-5 text-xs text-muted">Select a day to see the opioids administered</p>
      <div className="mt-3 pl-7">
        <div className="relative">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-35" aria-hidden>
            {ticks.map((t) => (
              <div
                key={t}
                className={`absolute inset-x-0 border-t ${t === 0 ? "border-foreground/20" : "border-border"}`}
                style={{ bottom: `${(t / 60) * 100}%` }}
              >
                <span className="absolute -left-7 w-5 -translate-y-1/2 text-right text-[10px] leading-none tabular-nums text-muted">
                  {t}
                </span>
              </div>
            ))}
          </div>
          <div className="relative flex h-40 items-end gap-[3px] sm:gap-1" role="listbox" aria-label="Days">
            {days.map((d, i) => {
              const v = totals[i];
              const isSel = i === selected;
              return (
                <button
                  key={d.date}
                  type="button"
                  role="option"
                  aria-selected={isSel}
                  aria-label={`${d.label}: ${v} mg morphine equivalents`}
                  onClick={() => setSelected(i)}
                  className="group flex h-full flex-1 flex-col items-center justify-end outline-none"
                >
                  <span className="relative flex h-35 w-full items-end justify-center">
                    {v === 0 ? (
                      <span className={`mb-0.5 size-1.5 rounded-full ${isSel ? "bg-accent-2" : "bg-muted/50"}`} />
                    ) : (
                      <span
                        className={`w-full max-w-5 rounded-t-[4px] transition-colors ${
                          isSel ? "bg-accent-2" : "bg-[#3987e5]/70 group-hover:bg-[#3987e5]"
                        } group-focus-visible:ring-2 group-focus-visible:ring-accent/70`}
                        style={{ height: `${(v / 60) * 100}%` }}
                      />
                    )}
                  </span>
                  <span
                    className={`mt-1.5 h-3.5 text-[10px] tabular-nums ${isSel ? "text-foreground" : "text-muted"} ${
                      i % 2 === 0 || isSel ? "" : "invisible sm:visible"
                    }`}
                  >
                    {d.label.split(" ")[1]}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
      <p className="mt-1 text-center text-[10px] text-muted">September 2022 · morphine equivalents (mg) per day</p>

      <div className="mt-5 rounded-lg border border-border bg-background/60" aria-live="polite">
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b border-border px-4 py-3">
          <p className="text-sm font-semibold text-foreground">Opioids administered · {day.label}, 2022</p>
          <p className="whitespace-nowrap text-sm tabular-nums text-muted">
            Total <span className="font-semibold text-accent-2">{dayTotal} mg</span>
          </p>
        </div>
        {day.administrations.length === 0 ? (
          <p className="px-4 py-5 text-sm text-muted">No opioids administered on this day.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[11px] text-muted">
                  <th scope="col" className="px-4 pb-1 pt-3 font-medium">Medication</th>
                  <th scope="col" className="hidden px-2 pb-1 pt-3 text-right font-medium sm:table-cell">Times given</th>
                  <th scope="col" className="hidden whitespace-nowrap px-2 pb-1 pt-3 text-right font-medium sm:table-cell">ME per dose</th>
                  <th scope="col" className="whitespace-nowrap px-4 pb-1 pt-3 text-right font-medium">Total ME</th>
                </tr>
              </thead>
              <tbody>
                {day.administrations.map((a) => (
                  <tr key={a.medication} className="border-t border-border/60">
                    <td className="px-4 py-2.5">
                      <span className="block text-foreground">{a.medication}</span>
                      <span className="text-xs text-muted">{a.dose}</span>
                      <span className="block text-xs text-muted sm:hidden">
                        {a.times}× · {a.mePerDose} mg ME each
                      </span>
                    </td>
                    <td className="hidden px-2 py-2.5 text-right tabular-nums text-foreground/85 sm:table-cell">{a.times}×</td>
                    <td className="hidden px-2 py-2.5 text-right tabular-nums text-foreground/85 sm:table-cell">{a.mePerDose} mg</td>
                    <td className="whitespace-nowrap px-4 py-2.5 text-right font-semibold tabular-nums text-foreground">
                      {a.times * a.mePerDose} mg
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <p className="mt-3 text-center text-xs italic text-muted">
        Illustrative only: the patient, medications, and doses are placeholder data, not real patient records.
      </p>
    </figure>
  );
}
