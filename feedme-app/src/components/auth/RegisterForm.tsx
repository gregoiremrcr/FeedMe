"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Mail, MapPin, User } from "lucide-react";
import { CAMPUSES, registerSchema, RegisterInput } from "@/lib/auth";
import { useAuth } from "@/components/auth/AuthProvider";
import Field, { IconInput, PasswordInput, inputClass } from "@/components/auth/Field";

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

  const aria = (name: string, hasError: boolean) => ({
    "aria-invalid": hasError,
    "aria-describedby": hasError ? `${name}-error` : undefined,
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
      <Field label="Prénom ou pseudo" htmlFor="name" error={errors.name?.message}>
        <IconInput
          id="name"
          icon={User}
          autoComplete="nickname"
          placeholder="Camille"
          {...aria("name", !!errors.name)}
          {...register("name")}
        />
      </Field>

      <Field label="Email" htmlFor="email" error={errors.email?.message}>
        <IconInput
          id="email"
          icon={Mail}
          type="email"
          autoComplete="email"
          placeholder="toi@etudiant.fr"
          {...aria("email", !!errors.email)}
          {...register("email")}
        />
      </Field>

      <Field label="Ton campus" htmlFor="campus" error={errors.campus?.message}>
        <div className="relative">
          <MapPin
            size={18}
            aria-hidden="true"
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-secondary"
          />
          <select id="campus" className={`${inputClass} pl-11`} {...aria("campus", !!errors.campus)} {...register("campus")}>
            <option value="">Choisis ton campus</option>
            {CAMPUSES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      </Field>

      <Field
        label="Mot de passe"
        htmlFor="password"
        error={errors.password?.message}
        hint="8 caractères minimum, avec une lettre et un chiffre."
      >
        <PasswordInput
          id="password"
          autoComplete="new-password"
          {...aria("password", !!errors.password)}
          {...register("password")}
        />
      </Field>

      <Field label="Confirme le mot de passe" htmlFor="confirm" error={errors.confirm?.message}>
        <PasswordInput
          id="confirm"
          autoComplete="new-password"
          {...aria("confirm", !!errors.confirm)}
          {...register("confirm")}
        />
      </Field>

      {serverError && (
        <p role="alert" className="rounded-xl bg-tertiary-fixed px-4 py-3 text-sm text-on-tertiary-fixed">
          {serverError}
        </p>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className="mt-2 h-12 rounded-xl bg-primary text-sm font-semibold text-on-primary shadow-md transition-all hover:opacity-90 active:scale-[0.99] disabled:opacity-60"
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
  );
}