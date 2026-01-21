import { cn, resumeFormat } from "./utils"
import { ResumeData } from "@/types/resume"

describe("cn", () => {
  it("should merge classes with clsx and twMerge", () => {
    const result = cn("p-2", "bg-blue-500")
    expect(result).toBe("p-2 bg-blue-500")
  })

  it("should handle empty input", () => {
    const result = cn()
    expect(result).toBe("")
  })

  it("should resolve conflicting classes, keeping the latter one", () => {
    const result = cn("p-2 p-4")
    expect(result).toBe("p-4")
  })

  it("should handle conditional classes", () => {
    const condition = true
    const result = cn("p-2", condition && "bg-blue-500")
    expect(result).toBe("p-2 bg-blue-500")
  })

  it("should handle false conditionals", () => {
    const condition = false
    const result = cn("p-2", condition && "bg-blue-500")
    expect(result).toBe("p-2")
  })

  it("should handle complex conditional objects", () => {
    const result = cn("p-2", {
      "bg-blue-500": true,
      "bg-red-500": false,
      "text-white": true
    })
    expect(result).toContain("p-2")
    expect(result).toContain("bg-blue-500")
    expect(result).toContain("text-white")
    expect(result).not.toContain("bg-red-500")
  })
})

describe("resumeFormat", () => {
  const createResumeData = (
    overrides: Partial<ResumeData> = {}
  ): ResumeData => ({
    personalInfo: {
      firstName: "John",
      lastName: "Doe",
      email: "john.doe@example.com",
      phone: "123-456-7890",
      website: "https://johndoe.com",
      linkedin: "https://linkedin.com/in/johndoe",
      ...overrides.personalInfo
    },
    education: {
      title: "Education",
      order: 0,
      blocks: overrides.education?.blocks || [
        {
          school: "MIT",
          degree: "Bachelor of Science",
          content: "Computer Science",
          start: "2018-09",
          end: "2022-06"
        }
      ],
      ...overrides.education
    },
    employment: {
      title: "Employment",
      order: 1,
      blocks: overrides.employment?.blocks || [
        {
          company: "Tech Corp",
          jobTitle: "Software Engineer",
          content: "Developed web applications",
          start: "2022-07",
          end: "2024-01"
        }
      ],
      ...overrides.employment
    },
    skills: {
      title: "Skills",
      order: 2,
      blocks: overrides.skills?.blocks || [
        {
          group: "Programming",
          content: "JavaScript, TypeScript, React"
        }
      ],
      ...overrides.skills
    }
  })

  it("should format complete resume data", () => {
    const resumeData = createResumeData()
    const result = resumeFormat(resumeData)

    expect(result).toContain("John Doe")
    expect(result).toContain("john.doe@example.com")
    expect(result).toContain("123-456-7890")
    expect(result).toContain("MIT")
    expect(result).toContain("Bachelor of Science")
    expect(result).toContain("Tech Corp")
    expect(result).toContain("Software Engineer")
    expect(result).toContain("Programming")
    expect(result).toContain("JavaScript, TypeScript, React")
  })

  it("should handle empty resume data", () => {
    const resumeData: ResumeData = {
      personalInfo: {
        firstName: "",
        lastName: "",
        email: "",
        phone: ""
      },
      education: {
        title: "Education",
        order: 0,
        blocks: []
      },
      employment: {
        title: "Employment",
        order: 1,
        blocks: []
      },
      skills: {
        title: "Skills",
        order: 2,
        blocks: []
      }
    }

    const result = resumeFormat(resumeData)

    expect(result).toContain("Name: ")
    expect(result).toContain("Email: ")
    expect(result).toContain("None")
  })

  it("should handle missing optional fields", () => {
    const resumeData: ResumeData = {
      personalInfo: {
        firstName: "Jane",
        lastName: "Smith",
        email: "jane@example.com",
        phone: "",
        website: undefined,
        linkedin: undefined
      },
      education: {
        title: "Education",
        order: 0,
        blocks: [
          {
            school: "MIT",
            degree: "Bachelor of Science",
            content: "Computer Science",
            start: "2018-09",
            end: "2022-06"
          }
        ]
      },
      employment: {
        title: "Employment",
        order: 1,
        blocks: [
          {
            company: "Tech Corp",
            jobTitle: "Software Engineer",
            content: "Developed web applications",
            start: "2022-07",
            end: "2024-01"
          }
        ]
      },
      skills: {
        title: "Skills",
        order: 2,
        blocks: [
          {
            group: "Programming",
            content: "JavaScript, TypeScript, React"
          }
        ]
      }
    }

    const result = resumeFormat(resumeData)

    expect(result).toContain("Jane Smith")
    expect(result).toContain("jane@example.com")
    expect(result).toContain("Not provided")
    expect(result).toContain("Not provided")
  })

  it("should handle multiple education blocks", () => {
    const resumeData = createResumeData({
      education: {
        title: "Education",
        order: 0,
        blocks: [
          {
            school: "MIT",
            degree: "PhD",
            content: "Artificial Intelligence",
            start: "2022-09",
            end: "2026-06"
          },
          {
            school: "Stanford",
            degree: "Bachelor",
            content: "Computer Science",
            start: "2018-09",
            end: "2022-06"
          }
        ]
      }
    })

    const result = resumeFormat(resumeData)

    expect(result).toContain("Education Block 1")
    expect(result).toContain("Education Block 2")
    expect(result).toContain("MIT")
    expect(result).toContain("Stanford")
  })

  it("should handle multiple employment blocks", () => {
    const resumeData = createResumeData({
      employment: {
        title: "Employment",
        order: 1,
        blocks: [
          {
            company: "Google",
            jobTitle: "Senior Engineer",
            content: "Led team projects",
            start: "2023-01",
            end: "2024-12"
          },
          {
            company: "Facebook",
            jobTitle: "Engineer",
            content: "Developed features",
            start: "2021-06",
            end: "2022-12"
          }
        ]
      }
    })

    const result = resumeFormat(resumeData)

    expect(result).toContain("Employment Block 1")
    expect(result).toContain("Employment Block 2")
    expect(result).toContain("Google")
    expect(result).toContain("Facebook")
  })

  it("should handle multiple skills groups", () => {
    const resumeData = createResumeData({
      skills: {
        title: "Skills",
        order: 2,
        blocks: [
          {
            group: "Frontend",
            content: "React, Vue, Angular"
          },
          {
            group: "Backend",
            content: "Node.js, Python, Go"
          }
        ]
      }
    })

    const result = resumeFormat(resumeData)

    expect(result).toContain("Skills Block 1")
    expect(result).toContain("Skills Block 2")
    expect(result).toContain("Frontend")
    expect(result).toContain("Backend")
  })

  it("should handle only education section", () => {
    const resumeData: ResumeData = {
      personalInfo: {
        firstName: "Test",
        lastName: "User",
        email: "test@test.com",
        phone: ""
      },
      education: {
        title: "Education",
        order: 0,
        blocks: [
          {
            school: "Harvard",
            degree: "MBA",
            content: "Business Administration",
            start: "2020-01",
            end: "2022-01"
          }
        ]
      },
      employment: {
        title: "Employment",
        order: 1,
        blocks: []
      },
      skills: {
        title: "Skills",
        order: 2,
        blocks: []
      }
    }

    const result = resumeFormat(resumeData)

    expect(result).toContain("Education Block 1")
    expect(result).toContain("Harvard")
    expect(result).toContain("None")
    expect(result).toContain("None")
  })
})
