const testLabels = ["New", "New", "New", "Old", "New", "Old"];

function MusicTag({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-full border border-accent/40 bg-accent/10 px-2 py-0.5 text-[11px] text-accent">
      <span aria-hidden>♪</span>
      {children}
    </span>
  );
}

function PhaseHeader({ step, title, music, children }: { step: number; title: string; music: string; children: React.ReactNode }) {
  return (
    <div className="mb-3 flex items-start justify-between gap-3">
      <div className="min-w-0">
        <p className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <span className="grid size-5 place-items-center rounded-full bg-foreground/10 text-[11px] tabular-nums">{step}</span>
          {title}
        </p>
        <p className="mt-1 text-sm text-muted">{children}</p>
      </div>
      <MusicTag>{music}</MusicTag>
    </div>
  );
}

const outcomes = [
  { face: "Old", said: "Old", label: "Hit", good: true },
  { face: "Old", said: "New", label: "Miss", good: false },
  { face: "New", said: "Old", label: "False alarm", good: false },
  { face: "New", said: "New", label: "Correct rejection", good: true },
];

/** The old/new face memory task: study phase, test phase, context manipulation and response outcomes. */
export function FaceMemoryTask() {
  return (
    <figure className="not-prose my-10">
      <div className="rounded-xl border border-border bg-surface p-4 sm:p-5">
        <PhaseHeader step={1} title="Study phase" music="Major key">
          Memorize 16 faces, shown one at a time.
        </PhaseHeader>
        {/* eslint-disable-next-line @next/next/no-img-element -- small static stimuli strip */}
        <img
          src="/projects/eeg-memory-thesis/faces-study.png"
          alt="Six example study faces: grayscale, front-facing photos of young men"
          className="w-full rounded-lg"
        />

        <div className="my-5 border-t border-dashed border-border" />

        <PhaseHeader step={2} title="Test phase" music="Major or minor key">
          The 16 studied faces return, mixed with 16 new ones. Is each face old or new?
        </PhaseHeader>
        {/* eslint-disable-next-line @next/next/no-img-element -- small static stimuli strip */}
        <img
          src="/projects/eeg-memory-thesis/faces-test.png"
          alt="Six example test faces, two of which appeared in the study phase"
          className="w-full rounded-lg"
        />
        <div className="mt-2 grid grid-cols-6 gap-1 text-center text-[11px]">
          {testLabels.map((l, i) => (
            <span
              key={i}
              className={`rounded-md py-0.5 ${
                l === "Old" ? "bg-accent-2/15 font-semibold text-accent-2" : "bg-foreground/5 text-muted"
              }`}
            >
              {l}
            </span>
          ))}
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <div className="rounded-lg border border-border bg-background/60 p-3">
            <p className="text-xs font-medium text-accent-2">The context manipulation</p>
            <ul className="mt-2 list-none! space-y-1.5 pl-0! text-sm">
              <li className="flex items-center justify-between gap-2">
                <span className="text-foreground/85">Same context</span>
                <span className="text-xs text-muted">major → major</span>
              </li>
              <li className="flex items-center justify-between gap-2">
                <span className="text-foreground/85">Changed context</span>
                <span className="text-xs text-muted">major → minor</span>
              </li>
            </ul>
            <p className="mt-2 text-xs leading-relaxed text-muted">
              Music tonality during study and test either matched or didn&apos;t, and faces were either own- or
              other-race relative to the participant.
            </p>
          </div>
          <div className="rounded-lg border border-border bg-background/60 p-3">
            <p className="text-xs font-medium text-accent-2">Scoring each judgment</p>
            <div className="mt-2 grid grid-cols-2 gap-1.5 text-xs">
              {outcomes.map((o) => (
                <div
                  key={o.label}
                  className={`rounded-md border px-2 py-1.5 ${
                    o.good ? "border-[#0ca30c]/30 bg-[#0ca30c]/10" : "border-[#d03b3b]/30 bg-[#d03b3b]/10"
                  }`}
                >
                  <p className="font-semibold text-foreground">{o.label}</p>
                  <p className="text-muted">
                    {o.face} face, said &ldquo;{o.said.toLowerCase()}&rdquo;
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      <figcaption className="mt-3 text-center text-sm italic text-muted">
        Example stimuli from one block of the old/new face recognition task (6 of the 16 faces per phase shown).
      </figcaption>
    </figure>
  );
}

/** Photo of an EEG recording cap, with attribution. */
export function EegCapPhoto() {
  return (
    <figure className="not-prose my-10">
      <div className="overflow-hidden rounded-xl border border-border bg-surface">
        {/* eslint-disable-next-line @next/next/no-img-element -- static photo */}
        <img
          src="/projects/eeg-memory-thesis/eeg-cap.jpg"
          alt="A person wearing a white EEG cap fitted with dozens of wired electrodes across the scalp"
          className="aspect-[16/9] w-full object-cover object-[center_40%]"
        />
        <div className="grid gap-3 p-4 text-sm sm:grid-cols-3">
          {[
            { k: "What it measures", v: "Tiny voltage changes at the scalp produced by groups of neurons firing together" },
            { k: "Why EEG", v: "Millisecond timing, so it can track perception and memory as they unfold" },
            { k: "In this study", v: "A 128-channel cap recorded activity throughout the memory task" },
          ].map((x) => (
            <div key={x.k}>
              <p className="text-xs font-medium text-accent-2">{x.k}</p>
              <p className="mt-1 text-foreground/80">{x.v}</p>
            </div>
          ))}
        </div>
      </div>
      <figcaption className="mt-3 text-center text-sm italic text-muted">
        An EEG recording cap. Photo:{" "}
        <a
          href="https://commons.wikimedia.org/wiki/File:EEG_Recording_Cap.jpg"
          target="_blank"
          rel="noreferrer"
          className="text-accent-2 underline underline-offset-2"
        >
          Chris Hope
        </a>
        ,{" "}
        <a
          href="https://creativecommons.org/licenses/by/2.0/"
          target="_blank"
          rel="noreferrer"
          className="text-accent-2 underline underline-offset-2"
        >
          CC BY 2.0
        </a>
        .
      </figcaption>
    </figure>
  );
}

const pipeline = [
  { name: "Filtering", detail: "High- and low-pass filters remove drift and electrical noise" },
  { name: "Segmentation", detail: "Cut 900 ms windows around each face", key: true },
  { name: "Artifact detection", detail: "Flag blinks, eye movements and muscle noise" },
  { name: "Bad channel replacement", detail: "Interpolate faulty electrodes from neighbors" },
  { name: "Average specification", detail: "Average segments within each condition" },
  { name: "Average reference", detail: "Re-reference to the mean of all electrodes" },
  { name: "Baseline correction", detail: "Zero each segment to its pre-stimulus period" },
];

/** The seven-step Net Station preprocessing pipeline. */
export function EegPipeline() {
  return (
    <figure className="not-prose my-10">
      <ol className="relative list-none! space-y-0 rounded-xl border border-border bg-surface p-4 pl-4! sm:p-5">
        {pipeline.map((s, i) => (
          <li key={s.name} className="relative flex gap-3 pb-4 last:pb-0">
            {i < pipeline.length - 1 && (
              <span aria-hidden className="absolute left-[11px] top-7 h-[calc(100%-1.75rem)] w-px bg-border" />
            )}
            <span
              className={`relative grid size-6 shrink-0 place-items-center rounded-full text-[11px] font-semibold tabular-nums ${
                s.key ? "bg-accent-2 text-background" : "bg-foreground/10 text-foreground"
              }`}
            >
              {i + 1}
            </span>
            <div className="pt-0.5">
              <p className={`text-sm font-medium ${s.key ? "text-accent-2" : "text-foreground"}`}>{s.name}</p>
              <p className="text-sm text-muted">{s.detail}</p>
            </div>
          </li>
        ))}
      </ol>
      <figcaption className="mt-3 text-center text-sm italic text-muted">
        Preprocessing in Net Station. Segmentation (highlighted) defines the time windows the whole analysis is built
        on.
      </figcaption>
    </figure>
  );
}
