import { DELETE } from "./route"
import { deleteJobApplication } from "@/server/resume"
import { NextRequest } from "next/server"
import { vi, describe, it, expect, beforeEach } from "vitest"

vi.mock("@/server/resume", () => ({
  deleteJobApplication: vi.fn()
}))

const mockDeleteJobApplication = deleteJobApplication as unknown as ReturnType<
  typeof vi.fn
>

describe("DELETE /api/application/delete", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  const createMockRequest = (body: object): NextRequest => {
    return new NextRequest("http://localhost:3000/api/application/delete", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    })
  }

  describe("Validation scenarios", () => {
    it("should return 400 when id is missing", async () => {
      const request = createMockRequest({})
      const response = await DELETE(request)
      const data = (await response.json()) as any

      expect(response.status).toBe(400)
      expect(data.error).toBe("Invalid request parameters")
      expect(mockDeleteJobApplication).not.toHaveBeenCalled()
    })

    it("should return 400 when id is invalid UUID format", async () => {
      const request = createMockRequest({ id: "invalid-uuid" })
      const response = await DELETE(request)
      const data = (await response.json()) as any

      expect(response.status).toBe(400)
      expect(data.error).toBe("Invalid request parameters")
      expect(mockDeleteJobApplication).not.toHaveBeenCalled()
    })

    it("should return 400 when id is null", async () => {
      const request = createMockRequest({ id: null })
      const response = await DELETE(request)
      await response.json()

      expect(response.status).toBe(400)
      expect(mockDeleteJobApplication).not.toHaveBeenCalled()
    })
  })

  describe("Success scenarios", () => {
    it("should successfully delete a job application", async () => {
      mockDeleteJobApplication.mockResolvedValue(undefined)

      const request = createMockRequest({
        id: "550e8400-e29b-41d4-a716-446655440000"
      })
      const response = await DELETE(request)
      const data = (await response.json()) as any

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.message).toBe("Job application deleted successfully")
      expect(mockDeleteJobApplication).toHaveBeenCalledWith(
        "550e8400-e29b-41d4-a716-446655440000"
      )
    })
  })

  describe("Error scenarios", () => {
    it("should return 401 when user is not authenticated", async () => {
      mockDeleteJobApplication.mockRejectedValue(
        new Error("User not authenticated")
      )

      const request = createMockRequest({
        id: "550e8400-e29b-41d4-a716-446655440000"
      })
      const response = await DELETE(request)
      const data = (await response.json()) as any

      expect(response.status).toBe(401)
      expect(data.error).toBe("User not authenticated")
    })

    it("should return 403 when user is unauthorized", async () => {
      mockDeleteJobApplication.mockRejectedValue(
        new Error("Unauthorized access")
      )

      const request = createMockRequest({
        id: "550e8400-e29b-41d4-a716-446655440000"
      })
      const response = await DELETE(request)
      const data = (await response.json()) as any

      expect(response.status).toBe(403)
      expect(data.error).toBe("Unauthorized access")
    })

    it("should return 404 when application is not found", async () => {
      mockDeleteJobApplication.mockRejectedValue(
        new Error("Application not found")
      )

      const request = createMockRequest({
        id: "550e8400-e29b-41d4-a716-446655440000"
      })
      const response = await DELETE(request)
      const data = (await response.json()) as any

      expect(response.status).toBe(404)
      expect(data.error).toBe("Application not found")
    })

    it("should return 500 for unknown errors", async () => {
      mockDeleteJobApplication.mockRejectedValue(
        new Error("Database connection failed")
      )

      const request = createMockRequest({
        id: "550e8400-e29b-41d4-a716-446655440000"
      })
      const response = await DELETE(request)
      const data = (await response.json()) as any

      expect(response.status).toBe(500)
      expect(data.error).toBe("Database connection failed")
    })
  })
})
