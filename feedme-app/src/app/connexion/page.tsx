"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CAMPUSES, registerSchema, RegisterInput } from "@/lib/auth";
import { useAuth } from "../../components/auth/AuthProvider";
import Field, { inputClass } from "../../components/auth/Field";

export default function RegisterForm() {
  const router = useRouter();
  const { register: signUp } = useAuth();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: { campus: "" },
  });

  const onSubmit = async ({ confirm, ...data }: RegisterInput) => {
    void confirm; // la confirmation ne part jamais vers l'API
    setServerError(null);
    try {
      await signUp(data);
      router.push("/profil");
    } catch (e) {
      setServerError(e instanceof Error ? e.message : "Une erreur est survenue");
    }
  };

  const describe = (name: string, hasError: boolean) => ({
    "aria-invalid": hasError,
    "aria-describedby": hasError ? `${name}-error` : undefined,
  });

  return (
    <div className="mx-auto w-full max-w-[420px] rounded-[24px] bg-surface-container-lowest p-8 shadow-[0_4px_30px_rgba(58,48,42,0.06)]">
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-5">
      <Field label="Prénom ou pseudo" htmlFor="name" error={errors.name?.message}>
        <input id="name" type="text" autoComplete="nickname" className={inputClass} {...describe("name", !!errors.name)} {...register("name")} />
      </Field>

      <Field label="Email" htmlFor="email" error={errors.email?.message}>
        <input id="email" type="email" autoComplete="email" className={inputClass} {...describe("email", !!errors.email)} {...register("email")} />
      </Field>

      <Field label="Ton campus" htmlFor="campus" error={errors.campus?.message}>
        <select id="campus" className={inputClass} {...describe("campus", !!errors.campus)} {...register("campus")}>
          <option value="">Choisis ton campus</option>
          {CAMPUSES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Mot de passe" htmlFor="password" error={errors.password?.message}>
        <input id="password" type="password" autoComplete="new-password" className={inputClass} {...describe("password", !!errors.password)} {...register("password")} />
        <p className="text-xs text-on-surface-variant">8 caractères minimum, avec une lettre et un chiffre.</p>
      </Field>

      <Field label="Confirme le mot de passe" htmlFor="confirm" error={errors.confirm?.message}>
        <input id="confirm" type="password" autoComplete="new-password" className={inputClass} {...describe("confirm", !!errors.confirm)} {...register("confirm")} />
      </Field>

      {serverError && (
        <p role="alert" className="rounded-xl bg-tertiary-fixed px-4 py-3 text-sm text-on-tertiary-fixed">
          {serverError}
        </p>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className="rounded-xl bg-primary px-6 py-3.5 text-sm font-semibold text-on-primary shadow-md transition-all hover:opacity-90 disabled:opacity-60"
      >
        {isSubmitting ? "Création…" : "Créer mon compte"}
      </button>

      <p className="text-center text-sm text-on-surface-variant">
        Déjà un compte ?{" "}
        <Link href="/connexion" className="font-semibold text-primary hover:underline">
          Connecte-toi
        </Link>
      </p>
    </form>
    </div>
  );
}