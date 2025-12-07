import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    eslint: {
    // Disable ESLint during build
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Also ignore TypeScript errors during build
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
