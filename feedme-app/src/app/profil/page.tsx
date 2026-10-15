"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Heart, LogOut, User as UserIcon } from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import FavoriteButton from "@/components/favorites/FavoriteButton";
import { useFavorites } from "@/components/favorites/FavoritesProvider";
import { formatPrice } from "@/lib/restaurant";
import { KIND_LABELS } from "@/lib/spots";

export default function ProfilPage() {
  const router = useRouter();
  const { user, loading, logout } = useAuth();
  const { favorites, loading: favoritesLoading, error } = useFavorites();

  useEffect(() => {
    if (!loading && !user) router.replace("/connexion");
  }, [loading, user, router]);

  if (loading || !user) {
    return <div className="mx-auto mt-12 h-64 max-w-2xl animate-pulse rounded-[24px] bg-surface-container-low" />;
  }

  const handleLogout = async () => {
    await logout();
    router.push("/");
  };

  return (
    <section className="w-full px-6 py-12 lg:px-12">
      <div className="mx-auto flex max-w-2xl flex-col gap-10">
        <div className="flex flex-col gap-8 rounded-[24px] bg-surface-container-lowest p-8 card-shadow">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-on-primary">
              <UserIcon size={30} aria-hidden="true" />
            </div>
            <div>
              <h1 className="font-headline text-3xl font-semibold">{user.name}</h1>
              <p className="text-sm text-on-surface-variant">{user.email}</p>
            </div>
          </div>

          <dl>
            <div className="rounded-xl bg-surface-container-low p-4">
              <dt className="text-xs font-bold uppercase tracking-[0.08em] text-secondary">Campus</dt>
              <dd className="mt-1 font-medium">{user.campus}</dd>
            </div>
          </dl>

          <button
            type="button"
            onClick={handleLogout}
            className="inline-flex w-fit items-center gap-2 rounded-xl border border-surface-container-high px-5 py-3 text-sm font-semibold transition-colors hover:bg-surface-container-low"
          >
            <LogOut size={18} aria-hidden="true" />
            Me déconnecter
          </button>
        </div>

        <div>
          <h2 className="flex items-center gap-2 font-headline text-3xl font-medium">
            <Heart size={24} aria-hidden="true" className="text-primary" />
            Mes favoris
          </h2>

          {error && (
            <p role="alert" className="mt-4 rounded-xl bg-tertiary-fixed px-4 py-3 text-sm text-on-tertiary-fixed">
              {error}
            </p>
          )}

          {favoritesLoading && <div className="mt-4 h-24 animate-pulse rounded-xl bg-surface-container-low" />}

          {!favoritesLoading && favorites.length === 0 && (
            <div className="mt-4 rounded-2xl border border-dashed border-surface-container-high p-8 text-center">
              <p className="font-bold">Aucun favori pour l’instant.</p>
              <p className="mt-1 text-sm text-on-surface-variant">
                Lance une recherche et clique sur le cœur d’un lieu pour le retrouver ici.
              </p>
              <Link
                href="/"
                className="mt-4 inline-flex h-11 items-center rounded-lg bg-primary px-5 text-sm font-bold text-on-primary transition-opacity hover:opacity-90"
              >
                Trouver à manger
              </Link>
            </div>
          )}

          {favorites.length > 0 && (
            <ul className="mt-4 flex flex-col gap-3">
              {favorites.map((spot) => (
                <li
                  key={spot.id}
                  className="flex items-center justify-between gap-4 rounded-xl border border-surface-container-high bg-surface-container-lowest p-4 card-shadow"
                >
                  <div className="min-w-0">
                    <p className="truncate font-bold">{spot.name}</p>
                    <p className="mt-0.5 truncate text-sm text-on-surface-variant">
                      {KIND_LABELS[spot.kind]} · {spot.description}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <span className="font-bold tabular-nums text-primary">
                      {spot.priceIsEstimate ? "~" : ""}
                      {formatPrice(spot.price)}
                    </span>
                    <FavoriteButton spot={spot} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}