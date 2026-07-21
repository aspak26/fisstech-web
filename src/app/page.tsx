import { createClient } from "@/lib/supabase/server";
import { LandingNavbar } from "@/components/modules/landing/landing-navbar";
import { LandingHero } from "@/components/modules/landing/landing-hero";
import { ScanDemo } from "@/components/modules/landing/scan-demo";
import { HowItWorks } from "@/components/modules/landing/how-it-works";
import { FeaturesSection } from "@/components/modules/landing/features-section";
import { PricingSection } from "@/components/modules/landing/pricing-section";
import { FaqSection } from "@/components/modules/landing/faq-section";
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
        <ScanDemo />
        <HowItWorks />
        <FeaturesSection />
        <PricingSection />
        <FaqSection />
      </main>
      <LandingFooter />
      <AiWidget />
    </div>
  );
}
