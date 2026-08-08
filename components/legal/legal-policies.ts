export type LegalPolicy = {
  slug: "terms-and-conditions" | "privacy-policy"
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
    description: "These terms explain the rules for using Jobi.",
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
          "We use information to provide Jobi, process uploads, generate resume suggestions, maintain workspace access, respond to support requests, improve reliability, and prevent misuse.",
          "We may use aggregated or de-identified information to understand product usage and improve features."
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
          "We share information with service providers that help us operate Jobi, such as hosting, analytics, storage, email, and AI infrastructure providers.",
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
  }
]

export function getLegalPolicyBySlug(slug: LegalPolicy["slug"]) {
  return legalPolicies.find((policy) => policy.slug === slug)
}
