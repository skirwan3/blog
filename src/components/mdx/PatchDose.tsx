"use client";

import { useId, useState } from "react";

const RATE_MCG_PER_HR = 100;
const MAX_HOURS = 72; // a fentanyl patch is worn for up to 72 hours

function Fraction({ top, bottom }: { top: React.ReactNode; bottom: React.ReactNode }) {
  return (
    <span className="inline-flex flex-col items-center text-center leading-tight">
      <span className="px-1 pb-1">{top}</span>
      <span className="w-full border-t border-foreground/40 px-1 pt-1">{bottom}</span>
    </span>
  );
}

function PatchIllustration({ hours }: { hours: number }) {
  const dots = Math.max(1, Math.round((hours / MAX_HOURS) * 18));
  return (
    <svg viewBox="0 0 220 180" className="h-auto w-full max-w-56" aria-hidden>
      <defs>
        <linearGradient id="patch-fill" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#e8eaf2" stopOpacity="0.16" />
          <stop offset="1" stopColor="#e8eaf2" stopOpacity="0.05" />
        </linearGradient>
      </defs>
      {/* skin */}
      <path d="M0 140 Q55 132 110 140 T220 140 V180 H0 Z" fill="#22d3ee" fillOpacity="0.06" />
      <path d="M0 140 Q55 132 110 140 T220 140" fill="none" stroke="#22d3ee" strokeOpacity="0.35" />
      {/* drug diffusing into skin */}
      {Array.from({ length: dots }, (_, i) => (
        <circle
          key={i}
          cx={62 + ((i * 37) % 96)}
          cy={150 + ((i * 13) % 24)}
          r={2}
          fill="#22d3ee"
          fillOpacity={0.35 + ((i * 7) % 5) / 10}
        />
      ))}
      {/* patch */}
      <g transform="translate(110 78) rotate(-4)">
        <rect x="-66" y="-58" width="132" height="116" rx="18" fill="url(#patch-fill)" stroke="#e8eaf2" strokeOpacity="0.35" />
        <rect x="-50" y="-42" width="100" height="84" rx="10" fill="none" stroke="#e8eaf2" strokeOpacity="0.18" strokeDasharray="3 4" />
        <text y="-8" textAnchor="middle" className="fill-foreground text-[19px] font-semibold">100 µg/h</text>
        <text y="14" textAnchor="middle" className="fill-muted text-[9px] tracking-[0.2em]">FENTANYL</text>
        <text y="27" textAnchor="middle" className="fill-muted text-[7.5px] tracking-[0.12em]">TRANSDERMAL SYSTEM</text>
      </g>
    </svg>
  );
}

/** Explains how a transdermal patch dose is derived from its delivery rate and wear time. */
export function PatchDose({ initialHours = 10 }: { initialHours?: number }) {
  const [hours, setHours] = useState(initialHours);
  const sliderId = useId();
  const totalMg = (RATE_MCG_PER_HR * hours) / 1000;
  const mg = totalMg.toLocaleString("en-US", { maximumFractionDigits: 1 });

  return (
    <figure className="not-prose my-10">
      <div className="rounded-xl border border-border bg-surface p-5 sm:p-6">
        <div className="grid items-center gap-6 sm:grid-cols-[minmax(0,13rem)_1fr]">
          <div className="flex justify-center rounded-lg bg-background/60 p-4">
            <PatchIllustration hours={hours} />
          </div>

          <div>
            <p className="text-base font-semibold leading-snug text-foreground">Duragesic 100 mcg/hr</p>
            <p className="mt-1 font-mono text-[11px] text-muted">
              Fentanyl transdermal patch · releases a steady 100 mcg every hour
            </p>

            <div className="mt-5">
              <div className="flex items-baseline justify-between text-xs">
                <label htmlFor={sliderId} className="text-muted">
                  Hours worn
                </label>
                <span className="font-semibold tabular-nums text-foreground">
                  {hours} h <span className="font-normal text-muted">of {MAX_HOURS}</span>
                </span>
              </div>
              <input
                id={sliderId}
                type="range"
                min={1}
                max={MAX_HOURS}
                value={hours}
                onChange={(e) => setHours(Number(e.target.value))}
                className="mt-2 w-full accent-[#22d3ee]"
              />
              <div className="mt-1 flex justify-between font-mono text-[10px] text-muted/70" aria-hidden>
                <span>0 h</span>
                <span>24 h</span>
                <span>48 h</span>
                <span>72 h</span>
              </div>
            </div>
          </div>
        </div>

        <div
          className="mt-6 flex flex-wrap items-center justify-center gap-x-3 gap-y-4 rounded-lg border border-border bg-background/60 px-4 py-6 text-lg tabular-nums sm:text-xl text-foreground"
          aria-live="polite"
        >
          <Fraction top="100 mcg" bottom="1 hr" />
          <span className="text-muted">×</span>
          <Fraction top="1 mg" bottom="1,000 mcg" />
          <span className="text-muted">×</span>
          <span>{hours} hr</span>
          <span className="text-muted">=</span>
          <span className="rounded-md border border-accent-2/30 bg-accent-2/10 px-2.5 py-1 font-semibold text-accent-2">
            {mg} mg fentanyl
          </span>
        </div>
      </div>

      <figcaption className="mt-3 text-center text-sm italic text-muted">
        A patch releases its dose at a steady hourly rate, so the amount a patient actually received is
        dosage rate × time worn. Drag the slider to see how wear time changes the recorded dose.
      </figcaption>
    </figure>
  );
}
