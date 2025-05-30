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
    serverComponentsExternalPackages: ['@react-pdf/renderer'],
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
  turbopack: {
    resolveAlias: {
      html2canvas: "html2canvas-pro",
      canvas: './empty-module.ts',
    },
  }
};

export default nextConfig;
