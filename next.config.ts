import type { NextConfig } from "next";
import path from "path";

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
    turbo: {
      resolveAlias: {
          html2canvas: "html2canvas-pro",
      },
  },
  },
  webpack: (config) => {
    config.resolve.alias = {
        ...config.resolve.alias,
        html2canvas: path.resolve(
            __dirname,
            "node_modules/html2canvas-pro"
        ),
    };
    return config;
  },
};

export default nextConfig;
