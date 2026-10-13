"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Flame, MapPin, Bot, Wallet, User } from "lucide-react";

const links = [
    { href: "/", label: "Accueil"},
    { href: "/carte", label: "Carte du campus"},
    { href: "/restaurants", label: "Fiche restaurant" },
    { href: "/profil", label: "Mon profil" },

];

export default function Header() {
  const pathname = usePathname();

  return (
    <header className="fixed inset-x-0 top-0 z-50 bg-surface/90 backdrop-blur-xl">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between gap-6 px-6 lg:px-12">
        <Link href="/" className="flex shrink-0 items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-on-primary">
            <Flame size={22} />
          </div>
          <div className="flex flex-col">
            <span className="font-headline text-2xl font-bold leading-none tracking-tight">
              MidiCampus
            </span>
            <span className="mt-0.5 flex items-center gap-1 text-xs font-medium text-on-surface-variant">
              <MapPin size={13} className="text-primary" />
              Campus Condorcet
            </span>
          </div>
        </Link>
        <nav className="hidden items-center gap-2 rounded-xl bg-surface-container-low p-1.5 md:flex">
          {links.map(({ href, label }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? "page" : undefined}
                className={`rounded-lg px-4 py-2 text-sm transition-colors ${
                  active
                    ? "bg-primary-container font-semibold text-on-primary-container"
                    : "font-medium text-on-surface-variant hover:text-on-surface"
                }`}
              >
                {label}
              </Link>
            );
          })}
        </nav>
        <div className="flex shrink-0 items-center gap-3">
          <button
            type="button"
            className="hidden items-center gap-2 rounded-full bg-primary-fixed px-3.5 py-1.5 text-xs font-semibold text-on-primary-fixed transition-all hover:bg-primary-container hover:text-on-primary-container xl:flex"
          >
            <Bot size={17} className="text-primary" />
            Assistant IA
          </button>

          <div className="hidden items-center gap-2 rounded-full bg-surface-container px-3.5 py-1.5 text-xs font-medium sm:flex">
            <Wallet size={16} className="text-primary" />
            <span>
              Solde midi : <strong className="font-semibold text-primary">6,50 €</strong>
            </span>
          </div>
           <div className="flex items-center gap-2 pl-1">
            <div className="hidden text-right lg:block">
              <span className="block text-xs font-semibold leading-tight">Camille L.</span>
              <span className="text-[11px] leading-none text-on-surface-variant">Étudiante L3</span>
            </div>
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-on-primary">
              <User size={18} />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
