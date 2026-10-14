"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, User, Utensils, X } from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";

const links = [
  { href: "/", label: "Accueil" },
  { href: "/carte", label: "Carte" },
  { href: "/assistant", label: "Assistant" },
  { href: "/profil", label: "Profil" },
];

export default function Header() {
  const pathname = usePathname();
  const { user, loading } = useAuth();
  const [open, setOpen] = useState(false);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-surface-container-high bg-surface/90 backdrop-blur-xl">
      <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between gap-6 px-6 lg:px-12">
        <Link href="/" className="flex shrink-0 items-center gap-2.5" onClick={() => setOpen(false)}>
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-on-primary">
            <Utensils size={18} aria-hidden="true" />
          </span>
          <span className="font-headline text-2xl font-semibold leading-none">FeedMe</span>
        </Link>

        <nav aria-label="Navigation principale" className="hidden items-center gap-8 md:flex">
          {links.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              aria-current={isActive(href) ? "page" : undefined}
              className={`border-b-2 py-1 text-sm transition-colors ${
                isActive(href)
                  ? "border-primary font-bold text-on-surface"
                  : "border-transparent font-medium text-on-surface-variant hover:text-on-surface"
              }`}
            >
              {label}
            </Link>
          ))}
        </nav>

        <div className="flex shrink-0 items-center gap-3">
          {loading && <div className="h-10 w-28 rounded-lg bg-surface-container" aria-hidden="true" />}

          {!loading && user && (
            <Link href="/profil" className="flex items-center gap-2.5">
              <span className="hidden text-right lg:block">
                <span className="block text-xs font-bold leading-tight">{user.name}</span>
                <span className="text-[11px] leading-none text-on-surface-variant">{user.campus}</span>
              </span>
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-on-primary">
                <User size={18} aria-hidden="true" />
              </span>
              <span className="sr-only lg:hidden">Mon profil</span>
            </Link>
          )}

          {!loading && !user && (
            <Link
              href="/connexion"
              className="hidden h-10 items-center rounded-lg border border-surface-container-high bg-surface-container-lowest px-5 text-sm font-semibold transition-colors hover:border-on-surface sm:inline-flex"
            >
              Connexion
            </Link>
          )}

          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label={open ? "Fermer le menu" : "Ouvrir le menu"}
            className="flex h-10 w-10 items-center justify-center rounded-lg border border-surface-container-high md:hidden"
          >
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {open && (
        <nav
          id="mobile-menu"
          aria-label="Navigation mobile"
          className="border-t border-surface-container-high bg-surface px-6 py-4 md:hidden"
        >
          <ul className="flex flex-col">
            {links.map(({ href, label }) => (
              <li key={href}>
                <Link
                  href={href}
                  onClick={() => setOpen(false)}
                  aria-current={isActive(href) ? "page" : undefined}
                  className={`block border-b border-surface-container-high py-3.5 text-base ${
                    isActive(href) ? "font-bold text-primary" : "font-medium"
                  }`}
                >
                  {label}
                </Link>
              </li>
            ))}
            {!loading && !user && (
              <li>
                <Link
                  href="/connexion"
                  onClick={() => setOpen(false)}
                  className="mt-4 flex h-12 items-center justify-center rounded-xl bg-primary text-sm font-bold text-on-primary"
                >
                  Connexion
                </Link>
              </li>
            )}
          </ul>
        </nav>
      )}
    </header>
  );
}