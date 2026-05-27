"use client";

import React from "react";
import Header from "@/components/layout/header";
import { DashboardPage } from "@/components/dashboard/dashboard-page";

export default function Dashboard() {
  const navigationData = [
    {
      title: "Home",
      href: "/",
    },
    {
      title: "Dashboard",
      href: "/dashboard",
      isActive: true,
    },
  ];

  return (
    <div className="relative min-h-screen bg-background">
      <Header navigationData={navigationData} />
      <div className="pt-20">
        <DashboardPage />
      </div>
    </div>
  );
}
