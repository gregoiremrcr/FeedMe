import Link from "next/link";
import { Footprints } from "lucide-react";
import { formatPrice } from "@/lib/restaurant";
import { KIND_LABELS, Spot } from "@/lib/spots";

export default function SpotCard({ spot }: { spot: Spot }) {
  return (
    <Link
      href="/"
      className="flex items-center justify-between gap-4 rounded-xl bg-surface p-3 transition-shadow hover:shadow-md"
    >
      <div className="min-w-0">
        <h4 className="truncate text-sm font-bold">{spot.name}</h4>
        <p className="mt-0.5 flex items-center gap-1 text-xs text-on-surface-variant">
          <Footprints size={13} aria-hidden="true" />
          {spot.walkMinutes} min • {KIND_LABELS[spot.kind]}
        </p>
      </div>
      <span className="shrink-0 font-headline text-lg font-bold text-primary">
        {spot.priceIsEstimate ? "~" : ""}
        {formatPrice(spot.price)}
      </span>
    </Link>
  );
}