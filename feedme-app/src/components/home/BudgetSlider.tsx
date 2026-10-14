"use client";

type Props = {
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
  labelledBy: string;
  valueText: string;
};

export default function BudgetSlider({ value, min, max, step, onChange, labelledBy, valueText }: Props) {
  const fill = (value - min) / (max - min);
  const position = `calc(10px + (100% - 20px) * ${fill})`;

  return (
    <div className="relative mt-5 h-6 w-full rounded-full focus-within:ring-4 focus-within:ring-primary/20">
      {/* Piste grise */}
      <div className="pointer-events-none absolute inset-x-0 top-1/2 h-2 -translate-y-1/2 rounded-full bg-surface-container-high" />

      {/* Partie remplie */}
      <div
        className="pointer-events-none absolute left-0 top-1/2 h-2 -translate-y-1/2 rounded-full bg-primary"
        style={{ width: position }}
      />

      {/* Curseur */}
      <div
        className="pointer-events-none absolute top-1/2 h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-4 border-surface-container-lowest bg-primary ring-1 ring-primary"
        style={{ left: position }}
      />

      {/* Vrai champ, invisible : souris, tactile et clavier */}
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        aria-labelledby={labelledBy}
        aria-valuetext={valueText}
        className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
      />
    </div>
  );
}