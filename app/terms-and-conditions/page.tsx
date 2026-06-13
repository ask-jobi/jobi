import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { getLegalPolicyBySlug } from "@/components/legal/legal-policies"
import { LegalPolicyPage } from "@/components/legal/legal-policy-page"

const policy = getLegalPolicyBySlug("terms-and-conditions")

export const metadata: Metadata = {
  title: "Terms and Conditions | Jobi",
  description:
    "Terms and Conditions for using Jobi and purchasing Jobi token bundles."
}

export default function TermsAndConditionsPage() {
  if (!policy) {
    notFound()
  }

  return <LegalPolicyPage policy={policy} />
}
