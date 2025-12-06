import type { NextConfig } from "next";

const nextConfig: NextConfig = {
      eslint: {
            ignoreDuringBuilds: true,  // ⚠️ This will ignore ALL ESLint errors
            },
        experimental: {
              webpackBuildWorker: false,
        }
};

export default nextConfig;
