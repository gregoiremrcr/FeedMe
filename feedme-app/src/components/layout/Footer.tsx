import Link from "next/link";

const links = [
  { href: "/", label: "Accueil" },
  { href: "/assistant", label: "Assistant" },
  { href: "/profil", label: "Profil" },
];

export default function Footer() {
  return (
    <footer className="mt-16 w-full border-t border-surface-container-high py-12">
      <div className="mx-auto flex max-w-7xl flex-col justify-between gap-8 px-6 md:flex-row md:items-end lg:px-12">
        <div className="max-w-sm">
          <span className="font-headline text-2xl font-semibold">FeedMe</span>
          <p className="mt-2 text-sm leading-relaxed text-on-surface-variant">
            Trouve où manger près de toi, selon ce qu’il te reste dans le porte-monnaie.
          </p>
        </div>

        <nav aria-label="Pied de page">
          <ul className="flex flex-wrap gap-x-8 gap-y-3 text-sm font-medium">
            {links.map(({ href, label }) => (
              <li key={href}>
                <Link href={href} className="text-on-surface-variant transition-colors hover:text-on-surface">
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      <div className="mx-auto mt-10 flex max-w-7xl flex-col gap-1 px-6 text-xs text-secondary sm:flex-row sm:justify-between lg:px-12">
        <p>© 2026 FeedMe. Projet fil rouge.</p>
        <p>Données cartographiques © contributeurs OpenStreetMap</p>
      </div>
    </footer>
  );
}