import BudgetSection from "@/components/home/BudgetSection";
import PepitesSection from "@/components/home/PepitesSection";
import AssistantSection from "@/components/home/AssistantSection";
import MapSection from "@/components/map/MapSection";

export default function HomePage() {
  return (
    <>
      <BudgetSection />
      <PepitesSection />
      <AssistantSection />
    </>
  );
}