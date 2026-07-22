import { createClient } from "@/lib/supabase/server";
import { LandingNavbar } from "@/components/modules/landing/landing-navbar";
import { LandingHero } from "@/components/modules/landing/landing-hero";
import { StepSlider } from "@/components/modules/landing/step-slider";
import { AiScannerShowcase } from "@/components/modules/landing/ai-scanner-showcase";
import { SectorSolutions } from "@/components/modules/landing/sector-solutions";
import { WhyFisstech } from "@/components/modules/landing/why-fisstech";
import { ScanDemo } from "@/components/modules/landing/scan-demo";
import { FeaturesSection } from "@/components/modules/landing/features-section";
import { WorkflowSection } from "@/components/modules/landing/workflow-section";
import { PricingSection } from "@/components/modules/landing/pricing-section";
import { ComparisonTable } from "@/components/modules/landing/comparison-table";
import { FaqSection } from "@/components/modules/landing/faq-section";
import { ClosingCta } from "@/components/modules/landing/closing-cta";
import { LandingFooter } from "@/components/modules/landing/landing-footer";
import { AiWidget } from "@/components/modules/landing/ai-widget";

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
