"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Mail } from "lucide-react";
import { loginSchema, LoginInput } from "@/lib/auth";
import { useAuth } from "./AuthProvider";
import Field, { IconInput, PasswordInput } from "./Field";

export default function LoginForm() {
  const router = useRouter();
  const { login } = useAuth();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({ resolver: zodResolver(loginSchema) });

  const onSubmit = async (values: LoginInput) => {
    setServerError(null);
    try {
      await login(values);
      router.push("/profil");
    } catch (e) {
      setServerError(e instanceof Error ? e.message : "Une erreur est survenue");
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
      <Field label="Email" htmlFor="email" error={errors.email?.message}>
        <IconInput
          id="email"
          icon={Mail}
          type="email"
          autoComplete="email"
          placeholder="toi@etudiant.fr"
          aria-invalid={!!errors.email}
          aria-describedby={errors.email ? "email-error" : undefined}
          {...register("email")}
        />
      </Field>

      <Field label="Mot de passe" htmlFor="password" error={errors.password?.message}>
        <PasswordInput
          id="password"
          autoComplete="current-password"
          placeholder="Ton mot de passe"
          aria-invalid={!!errors.password}
          aria-describedby={errors.password ? "password-error" : undefined}
          {...register("password")}
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
        {isSubmitting ? "Connexion…" : "Me connecter"}
      </button>

      <p className="text-center text-sm text-on-surface-variant">
        Pas encore de compte ?{" "}
        <Link href="/inscription" className="font-semibold text-primary hover:underline">
          Crée le tien
        </Link>
      </p>
    </form>
  );
}