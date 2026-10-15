"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut, Save, User as UserIcon } from "lucide-react";
import { useAuth } from "../../components/auth/AuthProvider";
import { restaurantApi } from "@/lib/restaurants";

export default function ProfilPage() {
  const router = useRouter();
  const { user, loading, logout } = useAuth();
  const [radius, setRadius] = useState(1000);
  const [language, setLanguage] = useState("fr");
  const [saving, setSaving] = useState(false);
  const [settingsMessage, setSettingsMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) router.replace("/connexion");
  }, [loading, user, router]);

  useEffect(() => {
    if (user) restaurantApi.preferences().then((preferences) => {
      setRadius(preferences.radius_m);
      setLanguage(preferences.language);
    }).catch(() => {
      setSettingsMessage("Impossible de charger tes préférences pour le moment.");
    });
  }, [user]);

  if (loading || !user) {
    return <div className="mx-auto h-64 max-w-2xl animate-pulse rounded-[24px] bg-surface-container-high" />;
  }

  const handleLogout = async () => {
    await logout();
    router.push("/");
  };

  const saveRadius = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setSettingsMessage(null);
    try {
      const preferences = await restaurantApi.updatePreferences({ radius_m: radius, language });
      setRadius(preferences.radius_m);
      setLanguage(preferences.language);
      setSettingsMessage("Préférences enregistrées.");
    } catch (cause) {
      setSettingsMessage(cause instanceof Error ? cause.message : "Impossible d’enregistrer ce réglage.");
    } finally {
      setSaving(false);
    }
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

        <form onSubmit={saveRadius} className="flex flex-col gap-3 rounded-xl bg-surface-container-low p-4">
          <div>
            <label htmlFor="search-radius" className="text-xs font-semibold uppercase tracking-wider text-secondary">Rayon de recherche par défaut</label>
            <p className="mt-1 text-sm text-on-surface-variant">{radius >= 1000 ? `${(radius / 1000).toLocaleString("fr-FR")} km` : `${radius} m`}</p>
          </div>
          <input id="search-radius" type="range" min={100} max={10000} step={100} value={radius}
            onChange={(event) => setRadius(Number(event.target.value))} className="w-full accent-primary" />
          <div className="flex items-center justify-between text-xs text-on-surface-variant"><span>100 m</span><span>10 km</span></div>
          <div>
            <label htmlFor="assistant-language" className="text-xs font-semibold uppercase tracking-wider text-secondary">Langue des réponses de l’assistant</label>
            <select id="assistant-language" value={language} onChange={(event) => setLanguage(event.target.value)} className="mt-1 w-full rounded-xl bg-surface-container px-4 py-2.5 text-sm">
              <option value="fr">Français</option>
              <option value="en">English</option>
            </select>
          </div>
          <button type="submit" disabled={saving} className="inline-flex w-fit items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-on-primary disabled:opacity-60">
            <Save size={17} /> {saving ? "Enregistrement…" : "Enregistrer"}
          </button>
          {settingsMessage && <p role="status" className="text-sm text-on-surface-variant">{settingsMessage}</p>}
        </form>

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
