import dynamic from "next/dynamic";
import { createClient } from "@/lib/supabase/server";
import { LandingNavbar } from "@/components/modules/landing/landing-navbar";
import { LandingHero } from "@/components/modules/landing/landing-hero";
import { WhyFisstech } from "@/components/modules/landing/why-fisstech";
import { ScanDemo } from "@/components/modules/landing/scan-demo";
import { FeaturesSection } from "@/components/modules/landing/features-section";
import { WorkflowSection } from "@/components/modules/landing/workflow-section";
import { PricingSection } from "@/components/modules/landing/pricing-section";
import { ComparisonTable } from "@/components/modules/landing/comparison-table";
import { ClosingCta } from "@/components/modules/landing/closing-cta";
import { LandingFooter } from "@/components/modules/landing/landing-footer";
import { AiWidget } from "@/components/modules/landing/ai-widget";

// Katlanma altındaki, framer-motion-yoğun bölümler next/dynamic ile
// bölünüyor (SSR korunuyor — sadece client hydration JS'i geciktiriliyor) —
// hero ile aynı ilk bundle'a girmelerine gerek yok. Optimizasyon denetimi
// bulgusu, bkz. docs/PROGRESS.md.
const StepSlider = dynamic(() =>
  import("@/components/modules/landing/step-slider").then((m) => m.StepSlider),
);
const AiScannerShowcase = dynamic(() =>
  import("@/components/modules/landing/ai-scanner-showcase").then((m) => m.AiScannerShowcase),
);
const SectorSolutions = dynamic(() =>
  import("@/components/modules/landing/sector-solutions").then((m) => m.SectorSolutions),
);
const FaqSection = dynamic(() =>
  import("@/components/modules/landing/faq-section").then((m) => m.FaqSection),
);

// / artık herkese açık bir pazarlama sayfası (bkz. PUBLIC_ROUTES,
// src/lib/supabase/middleware.ts) — oturum açmış ziyaretçi buradan
// otomatik /dashboard'a atılmıyor, "Uygulamaya Git" CTA'sı ile kendi seçer.
export default async function RootPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const isAuthenticated = !!user;

  return (
    <div className="min-h-full bg-bg">
      <LandingNavbar isAuthenticated={isAuthenticated} />
      <main>
        <LandingHero isAuthenticated={isAuthenticated} />
        <StepSlider />
        <AiScannerShowcase />
        <SectorSolutions />
        <WhyFisstech />
        <ScanDemo />
        <FeaturesSection />
        <WorkflowSection />
        <PricingSection />
        <ComparisonTable />
        <FaqSection />
        <ClosingCta />
      </main>
      <LandingFooter />
      <AiWidget />
    </div>
  );
}
