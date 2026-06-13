import Link from "next/link"

import { LandingPageLayout } from "@/components/ui/landing-page-layout"
import type { LegalPolicy } from "@/components/legal/legal-policies"

type LegalPolicyPageProps = {
  policy: LegalPolicy
}

export function LegalPolicyPage({ policy }: LegalPolicyPageProps) {
  return (
    <LandingPageLayout>
      <section className="container mx-auto px-4 py-16 md:py-20">
        <article className="mx-auto max-w-3xl">
          <Link
            href="/"
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            Back to home
          </Link>

          <header className="mt-8 border-b pb-8">
            <p className="mb-3 text-sm font-medium text-muted-foreground">
              Last updated: {policy.lastUpdated}
            </p>
            <h1 className="text-4xl font-bold tracking-tight md:text-5xl">
              {policy.title}
            </h1>
            <p className="mt-5 text-lg leading-8 text-muted-foreground">
              {policy.description}
            </p>
          </header>

          <div className="space-y-10 py-10">
            {policy.sections.map((section) => (
              <section key={section.heading}>
                <h2 className="text-2xl font-semibold tracking-tight">
                  {section.heading}
                </h2>
                <div className="mt-4 space-y-4 text-base leading-7 text-muted-foreground">
                  {section.paragraphs.map((paragraph) => (
                    <p key={paragraph}>{paragraph}</p>
                  ))}
                </div>
              </section>
            ))}
          </div>

          <div className="border-t pt-8 text-sm text-muted-foreground">
            These pages are provided for transparency and product review. They
            are not legal advice.
          </div>
        </article>
      </section>
    </LandingPageLayout>
  )
}
