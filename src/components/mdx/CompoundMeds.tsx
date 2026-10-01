type Ingredient = { name: string; mg: number; opioid: boolean };

const meds: {
  title: string;
  order: string;
  photo: string;
  alt: string;
  ingredients: Ingredient[];
}[] = [
  {
    title: "Percocet 10/325",
    order: "Percocet 10/325 Tablet",
    photo: "/projects/opioid-reduction-analytics/percocet.jpg",
    alt: "Two pale yellow oblong tablets, one imprinted PERCOCET and the other 10/325",
    ingredients: [
      { name: "Oxycodone", mg: 10, opioid: true },
      { name: "Acetaminophen", mg: 325, opioid: false },
    ],
  },
  {
    title: "Tylenol with Codeine #3",
    order: "Tylenol-Codeine 300-30 MG/12.5",
    photo: "/projects/opioid-reduction-analytics/tylenol-codeine.jpg",
    alt: "Front and back of a round white tablet, imprinted TV 150 on one side and 3 on the other",
    ingredients: [
      { name: "Codeine", mg: 30, opioid: true },
      { name: "Acetaminophen", mg: 300, opioid: false },
    ],
  },
];

/** Side-by-side breakdown of compound medications into their opioid and non-opioid parts. */
export function CompoundMeds() {
  return (
    <figure className="not-prose my-10">
      <div className="grid gap-4 sm:grid-cols-2">
        {meds.map((med) => {
          const total = med.ingredients.reduce((sum, i) => sum + i.mg, 0);
          const opioid = med.ingredients.find((i) => i.opioid)!;
          return (
            <div key={med.title} className="flex flex-col rounded-xl border border-border bg-surface p-3">
              {/* eslint-disable-next-line @next/next/no-img-element -- small static photos */}
              <img src={med.photo} alt={med.alt} className="aspect-[4/3] w-full object-cover" />

              <div className="flex flex-1 flex-col px-1 pb-1 pt-4">
                <p className="text-base font-semibold leading-snug text-foreground">{med.title}</p>
                <p className="mt-1 font-mono text-[11px] text-muted">EMR entry: “{med.order}”</p>

                <div
                  className="mt-4 flex h-2 gap-0.5 overflow-hidden rounded-full"
                  role="img"
                  aria-label={med.ingredients.map((i) => `${i.name} ${i.mg} mg`).join(", ")}
                >
                  {med.ingredients.map((i) => (
                    <span
                      key={i.name}
                      className={i.opioid ? "bg-accent-2" : "bg-foreground/15"}
                      style={{ width: `${(i.mg / total) * 100}%`, minWidth: 6 }}
                    />
                  ))}
                </div>

                <ul className="mt-3 list-none! space-y-1.5 pl-0! text-sm">
                  {med.ingredients.map((i) => (
                    <li key={i.name} className="flex items-baseline gap-2">
                      <span
                        aria-hidden
                        className={`size-2 shrink-0 translate-y-[-1px] rounded-full ${i.opioid ? "bg-accent-2" : "bg-foreground/25"}`}
                      />
                      <span className={i.opioid ? "text-foreground" : "text-muted"}>{i.name}</span>
                      <span className="text-xs text-muted">{i.opioid ? "opioid" : "non-opioid"}</span>
                      <span className={`ml-auto tabular-nums ${i.opioid ? "font-semibold text-foreground" : "text-muted"}`}>
                        {i.mg} mg
                      </span>
                    </li>
                  ))}
                </ul>

                <p className="mt-auto pt-4">
                  <span className="inline-flex items-center gap-1.5 rounded-md border border-accent-2/30 bg-accent-2/10 px-2 py-1 text-xs text-accent-2">
                    Recorded: {opioid.mg} mg {opioid.name.toLowerCase()}
                  </span>
                </p>
              </div>
            </div>
          );
        })}
      </div>
      <figcaption className="mt-3 text-center text-sm italic text-muted">
        Compound pain medications pair an opioid with a non-opioid like acetaminophen. Only the opioid
        component was carried forward into the analysis.
        <span className="mt-1 block text-xs not-italic text-muted/70">
          Codeine tablet shown is a generic equivalent. Photo: U.S. National Library of Medicine.
        </span>
      </figcaption>
    </figure>
  );
}
