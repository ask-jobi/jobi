import { describe, expect, test } from "vitest"

import { legalPolicies } from "./legal-policies"

describe("legalPolicies", () => {
  test("defines the required public policy pages", () => {
    expect(legalPolicies.map((policy) => policy.slug)).toEqual([
      "terms-and-conditions",
      "privacy-policy"
    ])

    expect(legalPolicies.map((policy) => policy.title)).toEqual([
      "Terms and Conditions",
      "Privacy Policy"
    ])
  })
})
