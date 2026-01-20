import { GET } from "./route"
import { generateAISuggestionQueue } from "@/server/ai/full-optimize"
import { getJobApplication } from "@/server/resume"
import type { ResumeData, AISuggestionQueue } from "@/types/resume"
import { NextRequest } from "next/server"
import { Locale } from "@/lib/i18n/config"

// Mock the dependencies
jest.mock("@/server/ai/full-optimize", () => ({
  generateAISuggestionQueue: jest.fn()
}))

jest.mock("@/server/resume", () => ({
  getJobApplication: jest.fn()
}))

const mockGenerateAISuggestionQueue =
  generateAISuggestionQueue as jest.MockedFunction<
    typeof generateAISuggestionQueue
  >
const mockGetJobApplication = getJobApplication as jest.MockedFunction<
  typeof getJobApplication
>

describe("GET /api/resume/full-suggestion", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  const createMockRequest = (jobApplicationId?: string): NextRequest => {
    const url = new URL("http://localhost:3000/api/resume/full-suggestion")
    if (jobApplicationId) {
      url.searchParams.set("jobApplicationId", jobApplicationId)
    }
    return new NextRequest(url.toString(), {
      method: "GET"
    })
  }

  const mockResumeData: ResumeData = {
    personalInfo: {
      firstName: "John",
      lastName: "Doe",
      email: "john.doe@example.com",
      phone: "123-456-7890"
    },
    education: {
      title: "Education",
      order: 1,
      blocks: [
        {
          content: "Bachelor of Computer Science",
          school: "University of Technology",
          degree: "BSc",
          start: "2018-09",
          end: "2022-06"
        }
      ]
    },
    employment: {
      title: "Experience",
      order: 2,
      blocks: [
        {
          content: "Frontend Developer at Tech Corp",
          company: "Tech Corp",
          jobTitle: "Frontend Developer",
          start: "2022-07",
          end: "2023-12"
        }
      ]
    },
    skills: {
      title: "Skills",
      order: 3,
      blocks: [
        {
          group: "Programming Languages",
          content: "JavaScript, TypeScript, React"
        }
      ]
    }
  }

  const mockJobApplication = {
    id: "job-app-123",
    optimized_resume_url: "https://example.com/resume.pdf",
    created_at: "2024-01-01T00:00:00Z",
    resumes: {
      id: "resume-123",
      upload_url: "https://example.com/upload.pdf",
      language: "zh" as Locale,
      resume_json: mockResumeData,
      evaluation_report: null
    },
    jobs: {
      id: "job-123",
      name: "Frontend Developer",
      company: "Tech Corp",
      description: "We are looking for a skilled frontend developer..."
    }
  }

  const mockSuggestions: AISuggestionQueue = [
    {
      section: "employment",
      blockIndex: 0,
      suggestionType: "quantify_achievements",
      reason: "Add specific metrics to demonstrate impact",
      originalContent: "Frontend Developer at Tech Corp",
      optimizedContent:
        "Frontend Developer at Tech Corp, improved performance by 30%",
      highlight: ["performance", "30%"]
    },
    {
      section: "skills",
      blockIndex: 0,
      suggestionType: "enhance_technical_skills",
      reason: "Add more specific technical skills",
      originalContent: "JavaScript, TypeScript, React",
      optimizedContent: "JavaScript (ES6+), TypeScript, React 18, Next.js",
      highlight: ["ES6+", "React 18", "Next.js"]
    }
  ]

  describe("Success scenarios", () => {
    it("should successfully generate AI suggestions for valid job application", async () => {
      mockGetJobApplication.mockResolvedValue(mockJobApplication)
      mockGenerateAISuggestionQueue.mockResolvedValue(mockSuggestions)

      const request = createMockRequest("job-app-123")
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toEqual(mockSuggestions)
      expect(mockGetJobApplication).toHaveBeenCalledWith("job-app-123")
      expect(mockGenerateAISuggestionQueue).toHaveBeenCalledWith(
        mockResumeData,
        "zh"
      )
    })

    it("should handle different languages correctly", async () => {
      const englishJobApplication = {
        ...mockJobApplication,
        resumes: {
          ...mockJobApplication.resumes,
          language: "en" as Locale
        }
      }

      mockGetJobApplication.mockResolvedValue(englishJobApplication)
      mockGenerateAISuggestionQueue.mockResolvedValue(mockSuggestions)

      const request = createMockRequest("job-app-123")
      const response = await GET(request)

      expect(response.status).toBe(200)
      expect(mockGenerateAISuggestionQueue).toHaveBeenCalledWith(
        mockResumeData,
        "en"
      )
    })
  })

  describe("Validation error scenarios", () => {
    it("should return 400 error when jobApplicationId is missing", async () => {
      const request = createMockRequest()
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe("缺少 jobApplicationId 参数")
      expect(mockGetJobApplication).not.toHaveBeenCalled()
      expect(mockGenerateAISuggestionQueue).not.toHaveBeenCalled()
    })

    it("should return 400 error when jobApplicationId is empty", async () => {
      const request = createMockRequest("")
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe("缺少 jobApplicationId 参数")
      expect(mockGetJobApplication).not.toHaveBeenCalled()
      expect(mockGenerateAISuggestionQueue).not.toHaveBeenCalled()
    })
  })

  describe("Not found scenarios", () => {
    it("should return 404 error when job application is not found", async () => {
      mockGetJobApplication.mockResolvedValue(undefined as any)

      const request = createMockRequest("non-existent-id")
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toBe("未找到对应的简历")
      expect(mockGetJobApplication).toHaveBeenCalledWith("non-existent-id")
      expect(mockGenerateAISuggestionQueue).not.toHaveBeenCalled()
    })
  })

  describe("Server error scenarios", () => {
    it("should return 500 error when getJobApplication throws an exception", async () => {
      const error = new Error("Database connection failed")
      mockGetJobApplication.mockRejectedValue(error)

      const request = createMockRequest("job-app-123")
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe("Database connection failed")
      expect(mockGetJobApplication).toHaveBeenCalledWith("job-app-123")
      expect(mockGenerateAISuggestionQueue).not.toHaveBeenCalled()
    })

    it("should return 500 error when generateAISuggestionQueue throws an exception", async () => {
      mockGetJobApplication.mockResolvedValue(mockJobApplication)
      const error = new Error("AI service unavailable")
      mockGenerateAISuggestionQueue.mockRejectedValue(error)

      const request = createMockRequest("job-app-123")
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe("AI service unavailable")
      expect(mockGetJobApplication).toHaveBeenCalledWith("job-app-123")
      expect(mockGenerateAISuggestionQueue).toHaveBeenCalledWith(
        mockResumeData,
        "zh"
      )
    })
  })

  describe("Edge cases", () => {
    it("should handle job application with minimal resume data", async () => {
      const minimalResumeData: ResumeData = {
        personalInfo: {
          firstName: "Jane",
          lastName: "Smith",
          email: "jane.smith@example.com",
          phone: "098-765-4321"
        },
        education: {
          title: "Education",
          order: 1,
          blocks: []
        },
        employment: {
          title: "Experience",
          order: 2,
          blocks: []
        },
        skills: {
          title: "Skills",
          order: 3,
          blocks: []
        }
      }

      const minimalJobApplication = {
        ...mockJobApplication,
        resumes: {
          ...mockJobApplication.resumes,
          resume_json: minimalResumeData
        }
      }

      const emptySuggestions: AISuggestionQueue = []

      mockGetJobApplication.mockResolvedValue(minimalJobApplication)
      mockGenerateAISuggestionQueue.mockResolvedValue(emptySuggestions)

      const request = createMockRequest("job-app-123")
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toEqual(emptySuggestions)
      expect(mockGenerateAISuggestionQueue).toHaveBeenCalledWith(
        minimalResumeData,
        "zh"
      )
    })

    it("should handle job application with complex resume data", async () => {
      const complexResumeData: ResumeData = {
        ...mockResumeData,
        education: {
          title: "Education",
          order: 1,
          blocks: [
            {
              content: "Bachelor of Computer Science with honors",
              school: "University of Technology",
              degree: "BSc (Hons)",
              start: "2018-09",
              end: "2022-06"
            },
            {
              content: "Master of Software Engineering",
              school: "Advanced Institute of Technology",
              degree: "MSc",
              start: "2022-09",
              end: "2024-06"
            }
          ]
        },
        employment: {
          title: "Experience",
          order: 2,
          blocks: [
            {
              content: "Senior Frontend Developer at Tech Corp",
              company: "Tech Corp",
              jobTitle: "Senior Frontend Developer",
              start: "2023-01",
              end: "2024-12"
            },
            {
              content: "Frontend Developer at Startup Inc",
              company: "Startup Inc",
              jobTitle: "Frontend Developer",
              start: "2022-07",
              end: "2022-12"
            }
          ]
        }
      }

      const complexJobApplication = {
        ...mockJobApplication,
        resumes: {
          ...mockJobApplication.resumes,
          resume_json: complexResumeData
        }
      }

      const complexSuggestions: AISuggestionQueue = [
        {
          section: "education",
          blockIndex: 0,
          suggestionType: "enhance_education",
          reason: "Add GPA and relevant coursework",
          originalContent: "Bachelor of Computer Science with honors",
          optimizedContent:
            "Bachelor of Computer Science with honors (GPA: 3.8/4.0)",
          highlight: ["GPA", "3.8"]
        },
        {
          section: "employment",
          blockIndex: 0,
          suggestionType: "quantify_leadership",
          reason: "Highlight leadership and team management",
          originalContent: "Senior Frontend Developer at Tech Corp",
          optimizedContent:
            "Senior Frontend Developer at Tech Corp, led team of 5 developers",
          highlight: ["led", "team", "5"]
        }
      ]

      mockGetJobApplication.mockResolvedValue(complexJobApplication)
      mockGenerateAISuggestionQueue.mockResolvedValue(complexSuggestions)

      const request = createMockRequest("job-app-123")
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toEqual(complexSuggestions)
      expect(mockGenerateAISuggestionQueue).toHaveBeenCalledWith(
        complexResumeData,
        "zh"
      )
    })
  })
})
