"use client";

import { ComponentProps, useState } from "react";
import { Eye, EyeOff, Lock, LucideIcon } from "lucide-react";

export const inputClass =
  "h-12 w-full rounded-xl border border-surface-container-high bg-surface px-4 text-sm transition placeholder:text-secondary/60 focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/15 aria-[invalid=true]:border-tertiary aria-[invalid=true]:ring-tertiary/10";

type FieldProps = {
  label: string;
  htmlFor: string;
  error?: string;
  hint?: string;
  children: React.ReactNode;
};

export default function Field({ label, htmlFor, error, hint, children }: FieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={htmlFor} className="text-sm font-medium">
        {label}
      </label>
      {children}
      {error ? (
        <p id={`${htmlFor}-error`} role="alert" className="text-xs text-tertiary">
          {error}
        </p>
      ) : (
        hint && <p className="text-xs text-on-surface-variant">{hint}</p>
      )}
    </div>
  );
}

export function IconInput({
  icon: Icon,
  className = "",
  ...props
}: ComponentProps<"input"> & { icon: LucideIcon }) {
  return (
    <div className="relative">
      <Icon
        size={18}
        aria-hidden="true"
        className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-secondary"
      />
      <input className={`${inputClass} pl-11 ${className}`} {...props} />
    </div>
  );
}

export function PasswordInput(props: Omit<ComponentProps<"input">, "type">) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      <Lock
        size={18}
        aria-hidden="true"
        className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-secondary"
      />
      <input type={visible ? "text" : "password"} className={`${inputClass} pl-11 pr-12`} {...props} />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? "Masquer le mot de passe" : "Afficher le mot de passe"}
        className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-2 text-secondary transition-colors hover:text-on-surface"
      >
        {visible ? <EyeOff size={18} /> : <Eye size={18} />}
      </button>
    </div>
  );
}