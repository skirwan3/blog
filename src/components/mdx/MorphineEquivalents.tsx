const conversions = [
  { drug: "Hydromorphone", factor: 4 },
  { drug: "Methadone", factor: 3 },
  { drug: "Oxycodone", factor: 1.5 },
  { drug: "Morphine", factor: 1 },
  { drug: "Hydrocodone", factor: 1 },
];

const maxFactor = Math.max(...conversions.map((c) => c.factor));

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

/** Conversion factors from each opioid to morphine milligram equivalents. */
export function MorphineEquivalents() {
  return (
    <figure className="not-prose my-10">
      <div className="rounded-xl border border-border bg-surface p-4 sm:p-6">
        <div className="flex flex-wrap items-center justify-center gap-x-2.5 gap-y-2 text-sm font-medium">
          <Term label="Original dose" />
          <span className="text-muted">×</span>
          <Term label="Conversion factor" />
          <span className="text-muted">=</span>
          <Term label="Morphine equivalents" accent />
        </div>

        <table className="mt-6 w-full text-sm">
          <caption className="sr-only">Morphine equivalents per 1 mg of each opioid</caption>
          <thead>
            <tr className="text-left text-xs text-muted">
              <th scope="col" className="whitespace-nowrap pb-2 font-medium">1 mg of…</th>
              <th scope="col" className="pb-2 font-medium">
                <span className="sr-only">Relative potency</span>
              </th>
              <th scope="col" className="whitespace-nowrap pb-2 text-right font-medium">
                <span className="sm:hidden">Morphine eq.</span>
                <span className="hidden sm:inline">Morphine equivalent</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {conversions.map((c) => {
              const reference = c.drug === "Morphine";
              return (
                <tr key={c.drug} className="border-t border-border">
                  <th scope="row" className="whitespace-nowrap py-3 pr-3 text-left font-normal sm:pr-4">
                    <span className="text-foreground">{c.drug}</span>
                    {reference && (
                      <span className="ml-2 rounded-full border border-border px-1.5 py-0.5 text-[10px] text-muted">
                        reference
                      </span>
                    )}
                  </th>
                  <td className="w-full py-3 pr-3 sm:pr-4">
                    <div className="relative h-2 min-w-12 rounded-full bg-foreground/5">
                      <div
                        className={`h-full rounded-full ${reference ? "bg-foreground/35" : "bg-accent-2"}`}
                        style={{ width: `${(c.factor / maxFactor) * 100}%` }}
                      />
                      {/* morphine baseline */}
                      <div
                        aria-hidden
                        className="absolute -top-1 h-4 w-px bg-foreground/40"
                        style={{ left: `${(1 / maxFactor) * 100}%` }}
                      />
                    </div>
                  </td>
                  <td className="whitespace-nowrap py-3 text-right tabular-nums">
                    <span className="font-semibold text-foreground">{c.factor} mg</span>
                  </td>
                </tr>
              );
            })}
            <tr className="border-t border-border">
              <td colSpan={3} className="pt-3 text-xs text-muted">
                …plus every other opioid on formulary, each with its own factor.
              </td>
            </tr>
          </tbody>
        </table>

        <div className="mt-5 rounded-lg border border-border bg-background/60 px-4 py-3 text-sm text-muted">
          <span className="mr-2 font-mono text-[11px] uppercase tracking-wider text-muted/80">Example</span>
          The 10 mg of oxycodone in a Percocet 10/325 × 1.5 ={" "}
          <span className="font-semibold text-accent-2">15 mg morphine equivalents</span>
        </div>
      </div>
      <figcaption className="mt-3 text-center text-sm italic text-muted">
        Converting every dose to morphine equivalents puts opioids of very different strengths on one scale.
        The vertical tick marks morphine&apos;s 1× baseline.
      </figcaption>
    </figure>
  );
}
