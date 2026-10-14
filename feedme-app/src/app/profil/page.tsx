"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { LogOut, User as UserIcon } from "lucide-react";
import { useAuth } from "../../components/auth/AuthProvider";

export default function ProfilPage() {
  const router = useRouter();
  const { user, loading, logout } = useAuth();

  useEffect(() => {
    if (!loading && !user) router.replace("/connexion");
  }, [loading, user, router]);

  if (loading || !user) {
    return <div className="mx-auto h-64 max-w-2xl animate-pulse rounded-[24px] bg-surface-container-high" />;
  }

  const handleLogout = async () => {
    await logout();
    router.push("/");
  };

  return (
    <section className="w-full px-6 py-12 lg:px-12">
      <div className="mx-auto flex max-w-2xl flex-col gap-8 rounded-[24px] bg-surface-container-lowest p-8 shadow-[0_4px_30px_rgba(58,48,42,0.06)] sm:p-10">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-on-primary">
            <UserIcon size={30} />
          </div>
          <div>
            <h1 className="font-headline text-3xl font-bold">{user.name}</h1>
            <p className="text-sm text-on-surface-variant">{user.email}</p>
          </div>
        </div>

        <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="rounded-xl bg-surface-container-low p-4">
            <dt className="text-xs font-semibold uppercase tracking-wider text-secondary">Campus</dt>
            <dd className="mt-1 font-medium">{user.campus}</dd>
          </div>
        </dl>

        <button
          type="button"
          onClick={handleLogout}
          className="inline-flex w-fit items-center gap-2 rounded-xl bg-surface-container px-5 py-3 text-sm font-semibold transition-colors hover:bg-surface-container-high"
        >
          <LogOut size={18} />
          Me déconnecter
        </button>
      </div>
    </section>
  );
}