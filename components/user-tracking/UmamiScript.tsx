import Script from "next/script"

export default function UmamiScript() {
  const websiteId = process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID

  if (!websiteId) {
    console.log(
      "Umami tracking is disabled (NEXT_PUBLIC_UMAMI_WEBSITE_ID not set)."
    )
    return null
  }

  return (
    <Script
      src="https://cloud.umami.is/script.js"
      data-website-id={websiteId}
      strategy="afterInteractive"
    />
  )
}
