import { notFound } from 'next/navigation';
import { restaurants, formatPrice } from '@/lib/restaurant';

export const instant = false;

export default async function RestaurantPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const restaurant = restaurants.find((item) => item.id === id);

  if (!restaurant) {
    notFound();
  }

  return (
    <section className="w-full px-6 py-12 lg:px-12">
      <article className="mx-auto max-w-3xl overflow-hidden rounded-[24px] bg-surface-container-lowest shadow-[0_4px_30px_rgba(58,48,42,0.06)]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={restaurant.image} alt={restaurant.name} className="h-64 w-full object-cover" />
        <div className="p-8">
          <p className="text-sm font-semibold text-secondary">{restaurant.priceLabel}</p>
          <h1 className="mt-2 font-headline text-4xl font-bold">{restaurant.name}</h1>
          <p className="mt-3 text-on-surface-variant">{restaurant.description}</p>
          <p className="mt-6 font-headline text-3xl font-bold text-primary">
            {formatPrice(restaurant.price)}
          </p>
          <p className="mt-2 text-sm text-on-surface-variant">{restaurant.walkTime}</p>
        </div>
      </article>
    </section>
  );
}
