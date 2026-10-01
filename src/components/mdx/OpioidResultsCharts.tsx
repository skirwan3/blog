"use client";

import { MonthlyLineChart } from "./MonthlyLineChart";
import { meAdmissionDischarge, mePercentChange } from "./opioidReductionData";

const BLUE = "#3987e5";
const ORANGE = "#d95926";

const mg = (v: number) => `${v.toFixed(1)} mg`;
const pct = (v: number) => `${v < 0 ? "−" : v > 0 ? "+" : ""}${Math.abs(v).toFixed(1)}%`;
const pctTick = (v: number) => `${v < 0 ? "−" : ""}${Math.abs(v)}%`;

/** Average ME at admission vs discharge, Jan–May 2021. */
export function MeAdmissionDischargeChart() {
  const { months, admission, discharge } = meAdmissionDischarge;
  return (
    <MonthlyLineChart
      title="Average morphine equivalents at admission and discharge"
      subtitle="Milligrams in the first vs. last 24 hours of the stay, by discharge month"
      months={months}
      series={[
        { key: "admission", label: "At admission", color: BLUE, values: admission },
        { key: "discharge", label: "At discharge", color: ORANGE, values: discharge },
      ]}
      yTicks={[0, 10, 20, 30, 40, 50]}
      format={mg}
      tickFormat={(v) => String(v)}
      extra={(i) => [{ label: "change", value: pct(mePercentChange.percentChange[i]) }]}
      caption="Morphine equivalents (mg)"
    />
  );
}

function PercentChangeFormula() {
  return (
    <div className="mt-4 flex flex-wrap items-center justify-center gap-x-3 gap-y-2 rounded-lg border border-border bg-background/60 px-4 py-4 text-sm text-foreground">
      <span className="font-medium">Percent change</span>
      <span className="text-muted">=</span>
      <span className="inline-flex flex-col items-center text-center leading-tight">
        <span className="px-1 pb-1">
          ME at discharge <span className="text-muted">−</span> ME at admission
        </span>
        <span className="w-full border-t border-foreground/40 px-1 pt-1">ME at admission</span>
      </span>
    </div>
  );
}

/** Percent change from admission to discharge, Jan–May 2021, with the formula. */
export function MePercentChangeChart() {
  const { months, percentChange, patients } = mePercentChange;
  const slice = 5;
  return (
    <MonthlyLineChart
      title="Percent change in morphine equivalents, admission to discharge"
      subtitle="Average per patient, by discharge month · lower means a bigger reduction"
      months={months.slice(0, slice)}
      series={[{ key: "pc", label: "Percent change", color: BLUE, values: percentChange.slice(0, slice) }]}
      yTicks={[-80, -60, -40, -20, 0]}
      format={pct}
      tickFormat={pctTick}
      counts={{ label: "patients", values: patients.slice(0, slice) }}
      caption="Bars show the number of patients discharged each month."
    >
      <PercentChangeFormula />
    </MonthlyLineChart>
  );
}

/** Full Jan 2021 – Sep 2022 series with the tool's launch marked. */
export function MeImplementationChart() {
  const { months, percentChange, patients, launchIndex } = mePercentChange;
  return (
    <MonthlyLineChart
      title="Percent change in morphine equivalents, before and after the tool"
      subtitle="Average per patient, admission to discharge, Jan 2021 – Sep 2022"
      months={months}
      series={[{ key: "pc", label: "Percent change", color: BLUE, values: percentChange }]}
      yTicks={[-80, -60, -40, -20, 0]}
      format={pct}
      tickFormat={pctTick}
      counts={{ label: "patients", values: patients }}
      marker={{ index: launchIndex, label: "Tool introduced" }}
      caption="Bars show the number of patients discharged each month."
    />
  );
}
