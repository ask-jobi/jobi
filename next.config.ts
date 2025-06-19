import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
  turbopack: {
    resolveAlias: {
      html2canvas: "html2canvas-pro",
    },
  }
};

export default nextConfig;
