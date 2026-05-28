"use client";

import React, { useState, useEffect } from "react";
import Header from "@/components/layout/header";
import { getStats } from "@/lib/store";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { motion, type Variants } from "framer-motion";
import {
  Activity,
  BarChart3,
  ChevronRight,
  Clock,
  Download,
  Menu,
  Settings,
  TrendingDown,
  TrendingUp,
  Zap,
  Shield,
  FileText,
  AlertTriangle,
} from "lucide-react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

interface MetricCardProps {
  label: string;
  value: string;
  change: string;
  trend: "up" | "down";
  icon: React.ReactNode;
}

interface ChartCardProps {
  title: string;
  description: string;
  data: Array<{ name: string; value: number }>;
  dataKey: string;
  height?: number;
}

interface DetailItem {
  label: string;
  value: string;
  subtitle: string;
}

interface DetailedCardProps {
  title: string;
  items: DetailItem[];
}

// ============================================================================
// STATIC CHART DATA - EXTENSIVE DUMMY DATA FOR PROPER RENDERING
// ============================================================================

const ANALYSIS_ACTIVITY_DATA = [
  { name: "Week 1", value: 3 },
  { name: "Week 2", value: 5 },
  { name: "Week 3", value: 4 },
  { name: "Week 4", value: 8 },
  { name: "Week 5", value: 7 },
  { name: "Week 6", value: 9 },
  { name: "Week 7", value: 12 },
  { name: "Week 8", value: 11 },
  { name: "Week 9", value: 15 },
  { name: "Week 10", value: 14 },
  { name: "Week 11", value: 18 },
  { name: "Week 12", value: 22 },
  { name: "Week 13", value: 24 },
];

const SECURITY_SCORE_TREND_DATA = [
  { name: "Week 1", value: 54 },
  { name: "Week 2", value: 58 },
  { name: "Week 3", value: 60 },
  { name: "Week 4", value: 61 },
  { name: "Week 5", value: 64 },
  { name: "Week 6", value: 66 },
  { name: "Week 7", value: 67 },
  { name: "Week 8", value: 69 },
  { name: "Week 9", value: 70 },
  { name: "Week 10", value: 71 },
  { name: "Week 11", value: 71 },
  { name: "Week 12", value: 72 },
  { name: "Week 13", value: 71 },
];

// ============================================================================
// ANIMATION VARIANTS
// ============================================================================

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4 },
  },
};

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

function MetricCard({ label, value, change, trend, icon }: MetricCardProps) {
  const isPositive = trend === "up";
  const TrendIcon = isPositive ? TrendingUp : TrendingDown;

  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
      className="group relative overflow-hidden rounded-2xl border border-border/40 bg-background/60 p-6 backdrop-blur transition-all hover:border-border/60 hover:shadow-lg"
      role="article"
      aria-label={`${label}: ${value}, ${change} ${trend === "up" ? "increase" : "decrease"}`}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-foreground/[0.04] via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100 -z-10" />

      <div className="relative space-y-4">
        <div className="flex items-center justify-between">
          <div className="text-2xl" aria-hidden="true">
            {icon}
          </div>
          <div
            className={`flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full ${
              isPositive
                ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                : "bg-red-500/20 text-red-600 dark:text-red-400"
            }`}
            aria-live="polite"
            aria-label={`${change} ${trend === "up" ? "increase" : "decrease"}`}
          >
            <TrendIcon className="h-3 w-3" aria-hidden="true" />
            {change}
          </div>
        </div>

        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-foreground/40">
            {label}
          </p>
          <p className="text-2xl font-semibold tracking-tight text-foreground">
            {value}
          </p>
        </div>
      </div>
    </motion.div>
  );
}

function ChartCard({
  title,
  description,
  data,
  dataKey,
  height = 300,
}: ChartCardProps) {
  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
      className="group relative overflow-hidden rounded-2xl border border-border/40 bg-background/60 p-6 backdrop-blur transition-all hover:border-border/60 hover:shadow-lg"
      role="article"
      aria-label={`${title} chart: ${description}`}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-foreground/[0.04] via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100 -z-10" />

      <div className="relative space-y-4">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <h3 className="text-sm font-semibold uppercase tracking-[0.25em] text-foreground">
              {title}
            </h3>
            <p className="text-xs text-foreground/60">{description}</p>
          </div>
          <button
            className="text-foreground/40 hover:text-foreground/70 transition-colors p-2 hover:bg-background/50 rounded-lg"
            aria-label={`View details for ${title}`}
          >
            <TrendingUp className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        <div style={{ width: "100%", height: height }} className="relative">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={data}
              margin={{ top: 5, right: 10, left: -25, bottom: 5 }}
            >
              <defs>
                <linearGradient
                  id={`colorGradient-${title}`}
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop
                    offset="5%"
                    stopColor="var(--primary)"
                    stopOpacity={0.5}
                  />
                  <stop
                    offset="95%"
                    stopColor="var(--primary)"
                    stopOpacity={0.05}
                  />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="var(--border)"
                opacity={0.3}
                vertical={false}
              />
              <XAxis
                dataKey="name"
                stroke="var(--foreground)"
                opacity={0.6}
                style={{ fontSize: "11px" }}
              />
              <YAxis
                stroke="var(--foreground)"
                opacity={0.6}
                style={{ fontSize: "11px" }}
                width={35}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "var(--background)",
                  opacity: 0.95,
                  border: `1px solid var(--border)`,
                  borderRadius: "8px",
                  backdropFilter: "blur(12px)",
                  padding: "8px 12px",
                }}
                labelStyle={{ color: "var(--foreground)" }}
                cursor={{ stroke: "var(--primary)", strokeOpacity: 0.2 }}
              />
              <Line
                type="natural"
                dataKey={dataKey}
                stroke="var(--primary)"
                strokeWidth={2.5}
                dot={false}
                activeDot={{ r: 6 }}
                fill={`url(#colorGradient-${title})`}
                isAnimationActive={true}
                animationDuration={800}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </motion.div>
  );
}

function DetailedCard({ title, items }: DetailedCardProps) {
  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
      className="group relative overflow-hidden rounded-2xl border border-border/40 bg-background/60 p-6 backdrop-blur transition-all hover:border-border/60 hover:shadow-lg"
      role="article"
      aria-label={title}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-foreground/[0.04] via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100 -z-10" />

      <div className="relative space-y-4">
        <h3 className="text-sm font-semibold uppercase tracking-[0.25em] text-foreground">
          {title}
        </h3>

        <div className="space-y-3" role="list" aria-label={`${title} list`}>
          {items.map((item, index) => (
            <motion.button
              key={`${item.label}-${index}`}
              whileHover={{ x: 4 }}
              transition={{ duration: 0.2 }}
              className="group/item w-full text-left"
              role="listitem"
              aria-label={`${item.label}: ${item.value} (${item.subtitle})`}
            >
              <div className="flex items-center justify-between rounded-lg border border-border/20 bg-background/40 p-3 transition-all hover:border-border/40 hover:bg-background/60">
                <div className="space-y-1 flex-1">
                  <p className="text-sm font-medium text-foreground">
                    {item.label}
                  </p>
                  <p className="text-xs text-foreground/60">{item.subtitle}</p>
                </div>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-foreground">
                    {item.value}
                  </p>
                  <ChevronRight
                    className="h-4 w-4 text-foreground/40 transition-transform group-hover/item:translate-x-1"
                    aria-hidden="true"
                  />
                </div>
              </div>
            </motion.button>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

function DashboardNav() {
  const [isOpen, setIsOpen] = useState(false);

  const navItems = [
    { label: "Overview", icon: Shield },
    { label: "Entropy Analysis", icon: Activity },
    { label: "Algorithms", icon: Zap },
    { label: "Analysis History", icon: Clock },
  ];

  return (
    <motion.nav
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="border-b border-border/40 bg-background/40 backdrop-blur-md"
      role="navigation"
      aria-label="Main dashboard navigation"
    >
      <div className="mx-auto max-w-7xl px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="text-xl font-semibold text-foreground tracking-tight">
            Dashboard
          </div>

          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden p-2 hover:bg-background/60 rounded-lg transition-colors"
            aria-label="Toggle navigation menu"
            aria-expanded={isOpen}
          >
            <Menu className="h-5 w-5" />
          </button>

          <div
            className="hidden md:flex gap-1"
            role="menubar"
            aria-label="Navigation tabs"
          >
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Button
                  key={item.label}
                  variant="ghost"
                  size="sm"
                  className="gap-2 text-foreground/70 hover:text-foreground hover:bg-background/50 rounded-lg"
                  role="menuitem"
                  aria-current={item.label === "Overview" ? "page" : undefined}
                >
                  <Icon className="h-4 w-4" aria-hidden="true" />
                  <span className="text-xs uppercase tracking-[0.1em]">
                    {item.label}
                  </span>
                </Button>
              );
            })}
          </div>
        </div>

        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-4 flex flex-col gap-2 md:hidden"
            role="menu"
            aria-label="Mobile navigation menu"
          >
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Button
                  key={item.label}
                  variant="ghost"
                  size="sm"
                  className="justify-start gap-2 text-foreground/70 hover:text-foreground hover:bg-background/50"
                  role="menuitem"
                >
                  <Icon className="h-4 w-4" aria-hidden="true" />
                  <span className="text-xs uppercase tracking-[0.1em]">
                    {item.label}
                  </span>
                </Button>
              );
            })}
          </motion.div>
        )}
      </div>
    </motion.nav>
  );
}

function DashboardHeader() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="mb-12 space-y-4"
    >
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div className="space-y-2">
          <Badge
            variant="outline"
            className="inline-flex items-center gap-2 rounded-full border-border/50 bg-background/55 px-4 py-1.5 text-xs uppercase tracking-[0.2em] text-foreground/70 backdrop-blur"
            aria-label="Dashboard status: Live"
          >
            <span
              className="h-2 w-2 rounded-full bg-emerald-500"
              aria-hidden="true"
            />
            Live Dashboard
          </Badge>

          <h1 className="text-balance text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
            Security Operations Dashboard
          </h1>
          <p className="max-w-2xl text-foreground/70">
            Monitor file audit volumes, average algorithm strengths, and cryptographic key evaluations in real-time.
          </p>
        </div>

        <div
          className="flex gap-2"
          role="toolbar"
          aria-label="Dashboard actions"
        >
          <Button
            variant="outline"
            size="icon"
            className="rounded-full border-border/40 bg-background/60 backdrop-blur hover:border-border/60 hover:bg-background/70"
            aria-label="Download report"
          >
            <Download className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="rounded-full border-border/40 bg-background/60 backdrop-blur hover:border-border/60 hover:bg-background/70"
            aria-label="Dashboard settings"
          >
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </motion.div>
  );
}

function DashboardGrid() {
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    setStats(getStats());
  }, []);

  const totalFiles = stats ? stats.totalFiles.toString() : "0";
  const avgScore = stats ? stats.avgSecurityScore + "%" : "0%";
  const vuln = stats ? stats.vulnerabilitiesCount.toString() : "0";
  
  const fileCategories = stats ? stats.fileCategories : [
    { label: "TXT Files", value: "0", subtitle: "plain text & key configs" },
    { label: "PDF Documents", value: "0", subtitle: "signed contracts & docs" },
    { label: "JSON Configurations", value: "0", subtitle: "key pairs & metadata" },
  ];
  const rsaDistribution = stats ? stats.rsaDistribution : [
    { label: "4096-bit Keys", value: "0%", subtitle: "secure key size" },
    { label: "2048-bit Keys", value: "0%", subtitle: "standard key size" },
    { label: "1024-bit / Less", value: "0%", subtitle: "deprecated/weak size" },
  ];
  const recentEvents = stats ? stats.recentEvents : [
    { label: "File Analyzed", value: "Now", subtitle: "No recent events" }
  ];

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
      role="region"
      aria-label="Dashboard metrics and charts"
    >
      <motion.div
        variants={itemVariants}
        className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
        role="presentation"
      >
        <MetricCard
          label="Total Files Analyzed"
          value={totalFiles}
          change="+12.5%"
          trend="up"
          icon={<FileText className="h-6 w-6 text-primary" aria-hidden="true" />}
        />
        <MetricCard
          label="Avg Security Score"
          value={avgScore}
          change="+8.2%"
          trend="up"
          icon={<Shield className="h-6 w-6 text-primary" aria-hidden="true" />}
        />
        <MetricCard
          label="RSA Key Strength"
          value="2048-bit"
          change="Standard"
          trend="up"
          icon={<Zap className="h-6 w-6 text-primary" aria-hidden="true" />}
        />
        <MetricCard
          label="Vulnerabilities Flagged"
          value={vuln}
          change="-4.3%"
          trend="down"
          icon={
            <AlertTriangle className="h-6 w-6 text-primary" aria-hidden="true" />
          }
        />
      </motion.div>

      <motion.div
        variants={itemVariants}
        className="grid gap-6 lg:grid-cols-2"
        role="presentation"
      >
        <ChartCard
          title="Analysis Activity"
          description="Weekly file count processed"
          data={ANALYSIS_ACTIVITY_DATA}
          dataKey="value"
          height={300}
        />
        <ChartCard
          title="Security Score Trend"
          description="Weekly security score average"
          data={SECURITY_SCORE_TREND_DATA}
          dataKey="value"
          height={300}
        />
      </motion.div>

      <motion.div
        variants={itemVariants}
        className="grid gap-6 lg:grid-cols-3"
        role="presentation"
      >
        <DetailedCard
          title="Top File Categories"
          items={fileCategories}
        />
        <DetailedCard
          title="RSA Modulus Distribution"
          items={rsaDistribution}
        />
        <DetailedCard
          title="System Events"
          items={recentEvents}
        />
      </motion.div>
    </motion.div>
  );
}

// ============================================================================
// MAIN PAGE EXPORT
// ============================================================================

export default function Dashboard() {
  const navigationData = [
    { title: "Home", href: "/" },
    { title: "Dashboard", href: "/dashboard", isActive: true },
    { title: "Analyze", href: "/analyze" },
    { title: "Hybrid Lab", href: "/hybrid-lab" },
    { title: "Visualizations", href: "/visualizations" },
    { title: "Reports", href: "/reports" },
    { title: "Learn", href: "/learn" },
    { title: "Profile", href: "/profile" },
  ];

  return (
    <div className="relative min-h-screen bg-background">
      <Header navigationData={navigationData} />
      <div className="pt-20">
        <main className="relative min-h-[calc(100vh-80px)] overflow-hidden bg-background">
          {/* Glassmorphism background blobs */}
          <div className="absolute inset-0 -z-10 pointer-events-none">
            <div className="absolute left-1/2 top-0 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-foreground/[0.035] blur-[140px]" />
            <div className="absolute bottom-0 right-0 h-[360px] w-[360px] rounded-full bg-foreground/[0.025] blur-[120px]" />
            <div className="absolute top-1/2 left-1/4 h-[400px] w-[400px] rounded-full bg-primary/[0.02] blur-[150px]" />
          </div>

          {/* Sub Navigation */}
          <DashboardNav />

          {/* Main Content */}
          <div className="relative px-6 py-8 lg:py-12">
            <div className="mx-auto max-w-7xl">
              <DashboardHeader />
              <DashboardGrid />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
