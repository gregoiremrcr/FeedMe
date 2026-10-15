const EXAMPLES = [
  { price: "5 €", label: "Un sandwich et une boisson", tilt: "-rotate-2" },
  { price: "6,50 €", label: "Un plat chaud", tilt: "rotate-2" },
  { price: "8,50 €", label: "Une formule complète", tilt: "-rotate-1" },
];

/** Bloc purement décoratif : exemples génériques, pas de vraies données. */
export default function BudgetExamples() {
  return (
    <aside aria-hidden="true" className="flex flex-col gap-5">
      <span className="w-fit -rotate-3 rounded-full bg-accent px-3.5 py-1.5 text-xs font-bold">
        Ce que ton budget te paie
      </span>

      {EXAMPLES.map(({ price, label, tilt }) => (
        <div
          key={price}
          className={`flex items-center justify-between gap-6 rounded-2xl border border-surface-container-high bg-surface-container-lowest px-6 py-5 card-shadow ${tilt}`}
        >
          <span className="text-[15px] font-bold leading-snug">{label}</span>
          <span className="font-headline text-4xl font-medium leading-none tabular-nums text-primary">
            {price}
          </span>
        </div>
      ))}

      <p className="text-xs text-on-surface-variant">
        Exemples indicatifs : les vrais prix dépendent de chaque lieu.
      </p>
    </aside>
  );
}