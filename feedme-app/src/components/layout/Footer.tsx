import Link from "next/link";
import { Utensils } from "lucide-react";

const links = [
  { href: "/partenaires", label: "Campus partenaires" },
  { href: "/assos", label: "BDE & Assos" },
  { href: "/ajouter-un-bon-plan", label: "Ajouter un bon plan" },
  { href: "/contact", label: "FAQ & Contact" },
  { href: "/mentions-legales", label: "Mentions légales" },
];

export default function Footer() {
  return (
    <footer className="w-full bg-surface-container-low py-14">
      <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-8 px-6 md:flex-row md:items-center lg:px-12">
        <div className="max-w-md space-y-2">
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-on-primary">
              <Utensils size={16} />
            </div>
            <span className="font-headline text-xl font-bold">MidiCampus</span>
          </div>
          <p className="text-sm leading-relaxed text-on-surface-variant">
            Le carnet de bons plans étudiants sans se ruiner. Fait avec amour pour le campus Condorcet.
          </p>
        </div>

        <ul className="flex flex-wrap items-center gap-x-8 gap-y-3 text-sm font-medium">
          {links.map(({ href, label }) => (
            <li key={href}>
              <Link href={href} className="text-on-surface-variant transition-colors hover:text-on-surface">
                {label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </footer>
  );
}