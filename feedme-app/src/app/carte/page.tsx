import MapSection from "@/components/map/MapSection";

export default function CartePage() {
  return (
    <section className="w-full px-6 py-8 lg:px-12">
      <div className="mx-auto max-w-6xl">
        <h1 className="mb-6 font-headline text-4xl font-bold">Carte du campus</h1>
        <MapSection />
      </div>
    </section>
  );
}