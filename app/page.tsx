"use client";

import React from "react";
import { LandingPage } from "../components/LandingPage";
import { BlogSection } from "../components/BlogSection";

export default function Page() {
  return (
    <main className="bg-[#0c0c0c] min-h-screen w-full relative">
      <div className="sticky bottom-0 w-full z-0">
        <LandingPage />
      </div>
      <BlogSection />
    </main>
  );
}
