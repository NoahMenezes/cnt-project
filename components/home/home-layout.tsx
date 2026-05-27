"use client";

import HeroSection from "@/components/home/hero-section";
import type { NavigationSection } from "@/components/layout/header";
import Header from "@/components/layout/header";
import { GlassmorphismMinimalMetricsBlock } from "@/components/home/metrics-block";

export default function AgencyHeroSection() {
  const navigationData: NavigationSection[] = [
    {
      title: "Home",
      href: "/",
      isActive: true,
    },
    {
      title: "Dashboard",
      href: "/dashboard",
    },
  ];

  return (
    <div className="relative min-h-screen bg-black">
      <Header navigationData={navigationData} />
      <main className="relative">
        {/* Sticky Hero section that stays fixed in place */}
        <div className="sticky top-0 h-screen w-full flex items-center justify-center z-0 overflow-hidden bg-black">
          <HeroSection />
        </div>
        
        {/* Relative Metrics block that overlaps it on scroll */}
        <div className="relative z-10 bg-zinc-950 shadow-[0_-40px_80px_rgba(0,0,0,0.9)] rounded-t-[3rem] border-t border-zinc-900">
          <GlassmorphismMinimalMetricsBlock />
        </div>
      </main>
    </div>
  );
}
