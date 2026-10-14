import Link from "next/link";
import { SlidersHorizontal, ThumbsUp } from "lucide-react";
import { restaurants } from "../../lib/restaurant";
import RestaurantCard from "./RestaurantCard";

export default function PepitesSection() {
  return (
    <section className="w-full px-6 py-12 lg:px-12">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <div className="mb-1.5 flex items-center gap-2 text-primary">
              <ThumbsUp size={20} />
              <span className="text-xs font-semibold uppercase tracking-wider">
                Validé par les étudiants
              </span>
            </div>
            <h2 className="font-headline text-3xl font-bold sm:text-4xl">Pépites sous le radar</h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="inline-flex items-center gap-1.5 rounded-lg bg-surface-container px-3 py-1.5 text-xs font-medium text-on-surface-variant transition-colors hover:text-on-surface"
            >
              <SlidersHorizontal size={16} />
              Trier par distance
            </button>
            <Link href="/carte" className="ml-2 text-xs font-semibold text-primary hover:underline">
              Tout voir (18)
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3 lg:gap-8">
          {restaurants.map((restaurant) => (
            <RestaurantCard key={restaurant.id} restaurant={restaurant} />
          ))}
        </div>
      </div>
    </section>
  );
}