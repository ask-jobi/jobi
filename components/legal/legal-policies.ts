export type LegalPolicy = {
  slug: "terms-and-conditions" | "privacy-policy" | "refund-policy"
  title: string
  description: string
  lastUpdated: string
  sections: {
    heading: string
    paragraphs: string[]
  }[]
}

export const legalPolicies: LegalPolicy[] = [
  {
    slug: "terms-and-conditions",
    title: "Terms and Conditions",
    description:
      "These terms explain the rules for using Jobi and purchasing token bundles.",
    lastUpdated: "June 13, 2026",
    sections: [
      {
        heading: "Agreement to These Terms",
        paragraphs: [
          "By accessing or using Jobi, you agree to these Terms and Conditions. If you do not agree, do not use the service.",
          "Jobi provides resume editing, job application support, and related AI-assisted tools. The service is intended to help you prepare application materials, but it does not guarantee interviews, job offers, or hiring outcomes."
        ]
      },
      {
        heading: "Accounts and Eligibility",
        paragraphs: [
          "You are responsible for maintaining the confidentiality of your account credentials and for all activity under your account.",
          "You agree to provide accurate information and to use Jobi only for lawful purposes."
        ]
      },
      {
        heading: "Purchases and Tokens",
        paragraphs: [
          "Jobi sells token bundles that can be used for eligible AI-powered product features. Token bundles are not cash, stored value, or transferable currency.",
          "Prices, token amounts, and available plans are shown at checkout. Paid tokens are added to your account after successful payment processing."
        ]
      },
      {
        heading: "Acceptable Use",
        paragraphs: [
          "You may not misuse the service, attempt to bypass security controls, interfere with service operation, scrape the service at scale, or use Jobi to create fraudulent, misleading, unlawful, or harmful content.",
          "You are responsible for reviewing any AI-generated suggestions before using them in job applications."
        ]
      },
      {
        heading: "Intellectual Property",
        paragraphs: [
          "You retain ownership of the resume content, job descriptions, and other materials you provide to Jobi.",
          "Jobi and its licensors retain ownership of the service, software, design, trademarks, and related intellectual property."
        ]
      },
      {
        heading: "Service Changes and Availability",
        paragraphs: [
          "We may update, suspend, or discontinue parts of the service as the product evolves. We aim to keep Jobi available, but we do not guarantee uninterrupted operation."
        ]
      },
      {
        heading: "Disclaimers and Limitation of Liability",
        paragraphs: [
          "Jobi is provided on an as-is and as-available basis. To the maximum extent permitted by law, we disclaim warranties of merchantability, fitness for a particular purpose, and non-infringement.",
          "To the maximum extent permitted by law, Jobi will not be liable for indirect, incidental, special, consequential, or punitive damages, or for lost opportunities, lost profits, or lost data."
        ]
      },
      {
        heading: "Contact",
        paragraphs: [
          "Questions about these terms can be sent to support@askjobi.com."
        ]
      }
    ]
  },
  {
    slug: "privacy-policy",
    title: "Privacy Policy",
    description:
      "This policy explains what information Jobi collects and how we use it.",
    lastUpdated: "June 13, 2026",
    sections: [
      {
        heading: "Information We Collect",
        paragraphs: [
          "We collect information you provide directly, such as your account details, resume content, job descriptions, uploaded files, and messages or prompts you submit in the product.",
          "We may also collect technical information such as device, browser, log, usage, and analytics data to operate and improve the service."
        ]
      },
      {
        heading: "How We Use Information",
        paragraphs: [
          "We use information to provide Jobi, process uploads, generate resume suggestions, maintain account access, process payments, respond to support requests, improve reliability, and prevent misuse.",
          "We may use aggregated or de-identified information to understand product usage and improve features."
        ]
      },
      {
        heading: "Payments",
        paragraphs: [
          "Payments are processed by third-party payment providers. Jobi does not store full payment card numbers. Payment providers may collect and process payment information according to their own terms and privacy policies."
        ]
      },
      {
        heading: "AI Processing",
        paragraphs: [
          "Jobi may send resume content, job descriptions, prompts, and related context to AI service providers so the product can generate responses and editing suggestions.",
          "You should not submit sensitive personal information that is not necessary for your resume or job application workflow."
        ]
      },
      {
        heading: "Sharing Information",
        paragraphs: [
          "We share information with service providers that help us operate Jobi, such as hosting, authentication, analytics, payment, storage, email, and AI infrastructure providers.",
          "We may disclose information if required by law, to protect rights and safety, or in connection with a business transfer."
        ]
      },
      {
        heading: "Data Retention",
        paragraphs: [
          "We retain information for as long as needed to provide the service, comply with legal obligations, resolve disputes, and enforce agreements.",
          "You may request deletion of your account or certain personal information, subject to legal and operational limits."
        ]
      },
      {
        heading: "Security",
        paragraphs: [
          "We use reasonable administrative, technical, and organizational measures to protect information. No method of transmission or storage is completely secure."
        ]
      },
      {
        heading: "Contact",
        paragraphs: [
          "Questions about this privacy policy can be sent to support@askjobi.com."
        ]
      }
    ]
  },
  {
    slug: "refund-policy",
    title: "Refund Policy",
    description:
      "This policy explains how refunds work for Jobi token bundle purchases.",
    lastUpdated: "June 13, 2026",
    sections: [
      {
        heading: "7-Day Refund Window",
        paragraphs: [
          "We offer a 7-day no-questions-asked refund for paid Jobi token bundle purchases if you are not satisfied with the service.",
          "The refund window starts on the date your payment is successfully completed."
        ]
      },
      {
        heading: "Eligibility",
        paragraphs: [
          "Refunds are available for paid Lite and Pro token bundle purchases made within the last 7 days.",
          "Free token grants, promotional credits, and tokens issued at no charge are not refundable."
        ]
      },
      {
        heading: "How to Request a Refund",
        paragraphs: [
          "To request a refund, contact support@askjobi.com with the email address used for your Jobi account and any payment or order information available.",
          "We may ask for basic information needed to locate the payment and process the refund."
        ]
      },
      {
        heading: "Processing Time",
        paragraphs: [
          "Approved refunds are returned to the original payment method when possible. Your bank, card network, wallet provider, or payment provider may take additional time to post the refund."
        ]
      },
      {
        heading: "Token Access After Refund",
        paragraphs: [
          "If a refund is issued, the related paid token bundle may be removed from your account or your token balance may be adjusted to reflect the refunded purchase."
        ]
      },
      {
        heading: "Abuse and Duplicate Requests",
        paragraphs: [
          "We may decline refund requests that appear fraudulent, abusive, or inconsistent with this policy, to the extent permitted by law."
        ]
      },
      {
        heading: "Contact",
        paragraphs: [
          "Questions about refunds can be sent to support@askjobi.com."
        ]
      }
    ]
  }
]

export function getLegalPolicyBySlug(slug: LegalPolicy["slug"]) {
  return legalPolicies.find((policy) => policy.slug === slug)
}
