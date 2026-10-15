const EXAMPLES = [
  { price: "5 €", label: "Un sandwich et une boisson" },
  { price: "6,50 €", label: "Un plat chaud" },
  { price: "8,50 €", label: "Une formule complète" },
];

export default function BudgetExamples() {
  return (
    <aside className="hidden w-full min-w-0 flex-col gap-4 lg:col-span-5 lg:flex" aria-label="Exemples de budget">
      <span className="w-fit rounded-full bg-primary-fixed px-3 py-1 text-xs font-bold">
        Ce que ton budget te paie
      </span>
      {EXAMPLES.map(({ price, label }) => (
        <div
          key={`${price}-${label}`}
          className="flex items-center justify-between rounded-2xl border border-surface-container-high bg-surface-container-lowest px-6 py-5 shadow-sm"
        >
          <b className="min-w-0 pr-3">{label}</b>
          <strong className="shrink-0 whitespace-nowrap font-headline text-3xl text-primary">{price}</strong>
        </div>
      ))}
    </aside>
  );
}
