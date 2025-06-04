import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: '/',
        destination: '/dashboard',
        permanent: true,
      },
    ];
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
  serverExternalPackages: ['@react-pdf/renderer'],
  turbopack: {
    resolveAlias: {
      html2canvas: "html2canvas-pro",
      canvas: './empty-module.ts',
    },
  }
};

export default nextConfig;
