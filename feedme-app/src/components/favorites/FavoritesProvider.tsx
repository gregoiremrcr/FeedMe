"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { favoritesApi } from "@/lib/favorites";
import { Spot } from "@/lib/spots";

type FavoritesContextValue = {
  favorites: Spot[];
  loading: boolean;
  error: string | null;
  isFavorite: (spotId: string) => boolean;
  toggle: (spot: Spot) => Promise<void>;
};

const FavoritesContext = createContext<FavoritesContextValue | null>(null);

export function FavoritesProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const userId = user?.id ?? null;

  const [store, setStore] = useState<{ userId: string | null; items: Spot[] }>({
    userId: null,
    items: [],
  });
  const [error, setError] = useState<string | null>(null);

  
  useEffect(() => {
    if (!userId) return;
    let cancelled = false;

    favoritesApi
      .list(userId)
      .then((items) => {
        if (!cancelled) setStore({ userId, items });
      })
      .catch(() => {
        if (!cancelled) {
          setStore({ userId, items: [] });
          setError("Impossible de charger tes favoris.");
        }
      });

    return () => {
      cancelled = true;
    };
  }, [userId]);

  
  const favorites = userId && store.userId === userId ? store.items : [];
  const loading = !!userId && store.userId !== userId;

  const isFavorite = useCallback(
    (spotId: string) => favorites.some((s) => s.id === spotId),
    [favorites]
  );

  const toggle = useCallback(
    async (spot: Spot) => {
      if (!userId) return;
      const exists = favorites.some((s) => s.id === spot.id);
      const next = exists ? favorites.filter((s) => s.id !== spot.id) : [spot, ...favorites];

      setStore({ userId, items: next }); 
      setError(null);

      try {
        if (exists) await favoritesApi.remove(userId, spot.id);
        else await favoritesApi.add(userId, spot);
      } catch {
        setStore({ userId, items: favorites }); 
        setError("Impossible de mettre à jour tes favoris. Réessaie.");
      }
    },
    [userId, favorites]
  );

  const value = useMemo(
    () => ({ favorites, loading, error, isFavorite, toggle }),
    [favorites, loading, error, isFavorite, toggle]
  );

  return <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>;
}

export function useFavorites() {
  const ctx = useContext(FavoritesContext);
  if (!ctx) throw new Error("useFavorites doit être utilisé dans <FavoritesProvider>");
  return ctx;
}