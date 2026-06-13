import type { NextConfig } from "next"
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare"
import createNextIntlPlugin from "next-intl/plugin"

const withNextIntl = createNextIntlPlugin("./lib/i18n/request.ts")

if (process.env.NODE_ENV === "development") {
  initOpenNextCloudflareForDev()
}

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb"
    }
  },
  turbopack: {
    resolveAlias: {
      html2canvas: "html2canvas-pro"
    }
  }
}

export default withNextIntl(nextConfig)
