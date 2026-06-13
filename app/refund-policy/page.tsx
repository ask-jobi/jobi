import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { getLegalPolicyBySlug } from "@/components/legal/legal-policies"
import { LegalPolicyPage } from "@/components/legal/legal-policy-page"

const policy = getLegalPolicyBySlug("refund-policy")

export const metadata: Metadata = {
  title: "Refund Policy | Jobi",
  description:
    "Refund Policy for Jobi token bundle purchases, including the 7-day refund window."
}

export default function RefundPolicyPage() {
  if (!policy) {
    notFound()
  }

  return <LegalPolicyPage policy={policy} />
}
