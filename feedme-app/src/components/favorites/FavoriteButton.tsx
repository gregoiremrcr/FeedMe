"use client";

import { Heart } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/AuthProvider";
import { useFavorites } from "@/components/favorites/FavoritesProvider";
import { Spot } from "@/lib/spots";

export default function FavoriteButton({ spot }: { spot: Spot }) {
  const router = useRouter();
  const { user } = useAuth();
  const { isFavorite, toggle } = useFavorites();
  const active = isFavorite(spot.id);

  const handleClick = () => {
    if (!user) {
      router.push("/connexion");
      return;
    }
    toggle(spot);
  };

  return (
    <button
      type="button"
      aria-pressed={active}
      aria-label={active ? `Retirer ${spot.name} des favoris` : `Ajouter ${spot.name} aux favoris`}
      onClick={handleClick}
      className="flex h-10 w-10 items-center justify-center rounded-full text-primary transition-colors hover:bg-primary-fixed"
    >
      <Heart size={20} className={active ? "fill-primary" : ""} aria-hidden="true" />
    </button>
  );
}