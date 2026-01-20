import type { NextConfig } from "next"
import createNextIntlPlugin from "next-intl/plugin"

const withNextIntl = createNextIntlPlugin("./lib/i18n/request.ts")

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb"
    }
  },
  serverExternalPackages: ["pdf-parse"],
  turbopack: {
    resolveAlias: {
      html2canvas: "html2canvas-pro"
    }
  }
}

export default withNextIntl(nextConfig)
