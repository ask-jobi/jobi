import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { getLegalPolicyBySlug } from "@/components/legal/legal-policies"
import { LegalPolicyPage } from "@/components/legal/legal-policy-page"

const policy = getLegalPolicyBySlug("privacy-policy")

export const metadata: Metadata = {
  title: "Privacy Policy | Jobi",
  description:
    "Privacy Policy for Jobi, including how Jobi collects and uses information."
}

export default function PrivacyPolicyPage() {
  if (!policy) {
    notFound()
  }

  return <LegalPolicyPage policy={policy} />
}
