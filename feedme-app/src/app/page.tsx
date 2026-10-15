import AssistantSection from "@/components/home/AssistantSection";
import Link from "next/link";

export default function HomePage() {
  return (
    <>
      <AssistantSection />
      <div className="px-6 pb-12 text-center">
        <Link href="/carte" className="font-semibold text-primary underline underline-offset-4">Explorer les restaurants sur la carte</Link>
      </div>
    </>
  );
}
