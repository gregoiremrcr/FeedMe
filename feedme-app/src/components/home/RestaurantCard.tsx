import Link from "next/link";
import { Footprints } from "lucide-react";
import { Restaurant, formatPrice } from "../../lib/restaurant";

export default function RestaurantCard({ restaurant }: { restaurant: Restaurant }) {
  const { id, name, description, priceLabel, price, badge, badgeAccent, walkTime, image } = restaurant;

  return (
    <article className="flex flex-col rounded-[20px] bg-surface-container-lowest p-5 shadow-[0_2px_16px_rgba(58,48,42,0.04)] transition-all duration-300 hover:-translate-y-1">
      <div className="relative mb-4 h-44 w-full overflow-hidden rounded-2xl">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={image} alt={`Plat proposé par ${name}`} className="h-full w-full object-cover" />
        <span
          className={`absolute left-3 top-3 rounded-full px-2.5 py-1 text-xs font-semibold ${
            badgeAccent
              ? "bg-primary-fixed text-on-primary-fixed"
              : "bg-surface/90 text-secondary backdrop-blur-sm"
          }`}
        >
          {badge}
        </span>
        <span className="absolute bottom-3 right-3 flex items-center gap-1 rounded-lg bg-on-surface/80 px-2.5 py-1 text-xs font-semibold text-surface backdrop-blur-sm">
          <Footprints size={14} />
          {walkTime}
        </span>
      </div>

      <h3 className="font-headline text-2xl font-bold leading-tight">{name}</h3>
      <p className="mt-1 line-clamp-1 text-xs text-on-surface-variant">{description}</p>

      <div className="mt-4 flex items-center justify-between pt-4">
        <div className="flex flex-col">
          <span className="text-[11px] uppercase tracking-wider text-secondary">{priceLabel}</span>
          <span className="font-headline text-2xl font-bold text-primary">{formatPrice(price)}</span>
        </div>
        <Link
          href={`/restaurants/${id}`}
          className="rounded-xl bg-surface-container px-4 py-2 text-xs font-semibold transition-colors hover:bg-primary hover:text-on-primary"
        >
          Voir le menu
        </Link>
      </div>
    </article>
  );
}