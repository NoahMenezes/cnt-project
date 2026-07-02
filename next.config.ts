import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    unoptimized: true,
  },
  // @ts-ignore - Next.js requires this for turbopack dev but TS definition is sometimes missing
  allowedDevOrigins: ["192.168.240.200"],
} as any;

export default nextConfig;
