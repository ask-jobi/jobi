import { describe, expect, test } from "vitest"

import { legalPolicies } from "./legal-policies"

describe("legalPolicies", () => {
  test("defines the required public policy pages", () => {
    expect(legalPolicies.map((policy) => policy.slug)).toEqual([
      "terms-and-conditions",
      "privacy-policy",
      "refund-policy"
    ])

    expect(legalPolicies.map((policy) => policy.title)).toEqual([
      "Terms and Conditions",
      "Privacy Policy",
      "Refund Policy"
    ])
  })

  test("keeps the refund promise aligned with pricing copy", () => {
    const refundPolicy = legalPolicies.find(
      (policy) => policy.slug === "refund-policy"
    )

    expect(refundPolicy?.sections).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          heading: "7-Day Refund Window",
          paragraphs: expect.arrayContaining([
            expect.stringContaining("7-day no-questions-asked refund")
          ])
        })
      ])
    )
  })
})
