/**
 * @vitest-environment node
 */
import { describe, it, expect, vi, beforeEach } from "vitest"
import { parseResume } from "./resume-parser"
import { generateText } from "ai"

vi.mock("ai", () => ({
  generateText: vi.fn(),
  wrapLanguageModel: vi.fn((config: any) => config.model),
  Output: {
    object: vi.fn()
  }
}))

vi.mock("@/lib/agent/model", () => ({
  model: {
    "MiniMax-M2.1": {}
  }
}))

describe("parseResume", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe("successful parsing", () => {
    it("should return parsed resume data with language", async () => {
      const mockResumeData = {
        personalInfo: {
          firstName: "John",
          lastName: "Doe",
          email: "john@example.com",
          phone: "123-456-7890"
        },
        education: {
          title: "Education",
          order: 0,
          blocks: [
            {
              content: "Computer Science degree",
              school: "MIT",
              degree: "Bachelor",
              start: "2018-09",
              end: "2022-06"
            }
          ]
        },
        skills: {
          title: "Skills",
          order: 2,
          blocks: [{ group: "Programming", content: "JavaScript, TypeScript" }]
        },
        _metadata: {
          language: "en"
        }
      }

      ;(generateText as any).mockResolvedValue({
        output: mockResumeData
      })

      const resumeText = `
John Doe
john@example.com
123-456-7890

Education:
MIT, Bachelor in Computer Science, 2018-09 to 2022-06

Skills:
Programming: JavaScript, TypeScript
      `

      const result = await parseResume(resumeText)

      expect(result).toHaveLength(2)
      const [resumeData, language] = result

      expect(language).toBe("en")
      expect(resumeData.personalInfo.firstName).toBe("John")
      expect(resumeData.personalInfo.lastName).toBe("Doe")
      expect(resumeData.personalInfo.email).toBe("john@example.com")
      expect(resumeData.personalInfo.phone).toBe("123-456-7890")
    })

    it("should handle Chinese resume content", async () => {
      const mockResumeData = {
        personalInfo: {
          firstName: "张三",
          lastName: "",
          email: "zhangsan@example.com",
          phone: "13800138000"
        },
        education: {
          title: "教育经历",
          order: 0,
          blocks: [
            {
              content: "计算机科学专业",
              school: "清华大学",
              degree: "本科",
              start: "2015-09",
              end: "2019-06"
            }
          ]
        },
        skills: {
          title: "技能",
          order: 2,
          blocks: [{ group: "编程", content: "JavaScript, TypeScript, Python" }]
        },
        _metadata: {
          language: "zh"
        }
      }

      ;(generateText as any).mockResolvedValue({
        output: mockResumeData
      })

      const resumeText = `
张三
zhangsan@example.com
13800138000

教育经历:
清华大学，本科，计算机科学专业，2015-09到2019-06

技能:
编程: JavaScript, TypeScript, Python
      `

      const result = await parseResume(resumeText)

      expect(result).toHaveLength(2)
      const [resumeData, language] = result
      expect(language).toBe("zh")
      expect(resumeData.personalInfo.firstName).toBe("张三")
    })

    it("should include optional sections when present", async () => {
      const mockResumeData = {
        personalInfo: {
          firstName: "Jane",
          lastName: "Smith",
          email: "jane@example.com",
          phone: "555-123-4567"
        },
        education: {
          title: "Education",
          order: 0,
          blocks: [
            {
              content: "Master's degree",
              school: "Stanford",
              degree: "Master",
              start: "2019-09",
              end: "2021-06"
            }
          ]
        },
        employment: {
          title: "Work Experience",
          order: 1,
          blocks: [
            {
              content: "Led backend development team",
              company: "Tech Corp",
              jobTitle: "Senior Engineer",
              start: "2021-07",
              end: "present"
            }
          ]
        },
        skills: {
          title: "Skills",
          order: 2,
          blocks: [{ group: "Backend", content: "Node.js, Python, AWS" }]
        },
        research: {
          title: "Research Experience",
          order: 3,
          blocks: [
            {
              title: "AI Research",
              content: "Published paper on ML",
              role: "Researcher",
              date: { start: "2018-01", end: "2019-06", isCurrent: false }
            }
          ]
        },
        projects: {
          title: "Projects",
          order: 4,
          blocks: [
            {
              title: "E-commerce Platform",
              content: "Built full-stack application",
              role: "Lead Developer",
              date: { start: "2020-01", end: "2020-12", isCurrent: false }
            }
          ]
        },
        _metadata: {
          language: "en"
        }
      }

      ;(generateText as any).mockResolvedValue({
        output: mockResumeData
      })

      const result = await parseResume("Resume content")

      expect(result).toHaveLength(2)
      const [resumeData] = result

      expect(resumeData.employment).toBeDefined()
      expect(resumeData.employment?.blocks).toHaveLength(1)
      expect(resumeData.research).toBeDefined()
      expect(resumeData.projects).toBeDefined()
    })
  })

  describe("empty or minimal resume", () => {
    it("should handle resume with minimal information", async () => {
      const mockResumeData = {
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
        skills: {
          title: "Skills",
          order: 2,
          blocks: []
        },
        _metadata: {
          language: "en"
        }
      }

      ;(generateText as any).mockResolvedValue({
        output: mockResumeData
      })

      const result = await parseResume("")

      expect(result).toHaveLength(2)
      const [resumeData] = result
      expect(resumeData.education.blocks).toHaveLength(0)
      expect(resumeData.skills.blocks).toHaveLength(0)
    })

    it("should return empty arrays when no data provided", async () => {
      const mockResumeData = {
        personalInfo: {
          firstName: "Test",
          lastName: "User",
          email: "test@test.com",
          phone: ""
        },
        education: {
          title: "Education",
          order: 0,
          blocks: []
        },
        skills: {
          title: "Skills",
          order: 2,
          blocks: []
        },
        _metadata: {
          language: "en"
        }
      }

      ;(generateText as any).mockResolvedValue({
        output: mockResumeData
      })

      const result = await parseResume("No content")

      expect(result).toHaveLength(2)
      expect(result[0].education.blocks).toEqual([])
    })
  })

  describe("generateText parameters", () => {
    it("should call generateText with correct parameters", async () => {
      ;(generateText as any).mockResolvedValue({
        output: {
          personalInfo: {
            firstName: "Test",
            lastName: "User",
            email: "test@test.com",
            phone: ""
          },
          education: { title: "Education", order: 0, blocks: [] },
          skills: { title: "Skills", order: 2, blocks: [] },
          _metadata: { language: "en" }
        }
      })

      await parseResume("Test resume content")

      expect(generateText).toHaveBeenCalledWith(
        expect.objectContaining({
          temperature: 0,
          model: expect.any(Object)
        })
      )
    })

    it("should format resume text in prompt", async () => {
      ;(generateText as any).mockResolvedValue({
        output: {
          personalInfo: {
            firstName: "Test",
            lastName: "User",
            email: "test@test.com",
            phone: ""
          },
          education: { title: "Education", order: 0, blocks: [] },
          skills: { title: "Skills", order: 2, blocks: [] },
          _metadata: { language: "en" }
        }
      })

      const testContent = "This is my resume content"
      await parseResume(testContent)

      expect(generateText).toHaveBeenCalledWith(
        expect.objectContaining({
          prompt: expect.stringContaining(testContent)
        })
      )
    })
  })

  describe("error handling", () => {
    it("should throw error when AI service fails", async () => {
      ;(generateText as any).mockRejectedValue(
        new Error("AI service unavailable")
      )

      await expect(parseResume("Resume content")).rejects.toThrow()
    })

    it("should throw error for invalid output format", async () => {
      ;(generateText as any).mockResolvedValue({
        output: {
          invalid: "structure"
        }
      })

      await expect(parseResume("Resume content")).rejects.toThrow()
    })
  })

  describe("output structure", () => {
    it("should return tuple with ResumeData and Locale", async () => {
      ;(generateText as any).mockResolvedValue({
        output: {
          personalInfo: {
            firstName: "John",
            lastName: "Doe",
            email: "john@example.com",
            phone: "123-456-7890"
          },
          education: {
            title: "Education",
            order: 0,
            blocks: [
              {
                content: "Degree",
                school: "University",
                degree: "Bachelor",
                start: "2015-09",
                end: "2019-06"
              }
            ]
          },
          skills: {
            title: "Skills",
            order: 2,
            blocks: [{ group: "Tech", content: "React" }]
          },
          _metadata: {
            language: "en"
          }
        }
      })

      const result = await parseResume("Resume text")

      const [resumeData, language] = result

      expect(resumeData).toHaveProperty("personalInfo")
      expect(resumeData).toHaveProperty("education")
      expect(resumeData).toHaveProperty("skills")
      expect(typeof language).toBe("string")
      expect(["en", "zh"]).toContain(language)
    })

    it("should exclude _metadata from resume data", async () => {
      ;(generateText as any).mockResolvedValue({
        output: {
          personalInfo: {
            firstName: "John",
            lastName: "Doe",
            email: "john@example.com",
            phone: "123-456-7890"
          },
          education: {
            title: "Education",
            order: 0,
            blocks: [
              {
                content: "Content",
                school: "School",
                degree: "Degree",
                start: "2018-09",
                end: "2022-06"
              }
            ]
          },
          skills: {
            title: "Skills",
            order: 2,
            blocks: [{ group: "Group", content: "Skills" }]
          },
          _metadata: {
            language: "zh"
          }
        }
      })

      const [resumeData] = await parseResume("Content")

      expect(resumeData).not.toHaveProperty("_metadata")
    })
  })
})
