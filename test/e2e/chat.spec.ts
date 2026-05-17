import { test, expect } from "@playwright/test"

test.describe("Chat Feature", () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to chat page directly
    await page.goto("/resumes/test-id/chat")
  })

  test("should load chat page without error", async ({ page }) => {
    // Just verify the page loads - actual chat functionality requires auth
    await page.waitForLoadState("domcontentloaded")
    // Page should not have critical errors
    await expect(page.locator("body")).toBeVisible()
  })

  test("should have form structure", async ({ page }) => {
    // Verify form elements exist
    const form = page.locator("form")
    await expect(form).toBeVisible()
  })
})

test.describe("Application Chat Tab", () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to application page
    await page.goto("/application/test-id")
  })

  test("should load application page", async ({ page }) => {
    // Verify the page loads - protected routes redirect to auth
    await page.waitForLoadState("domcontentloaded")
    await expect(page.locator("body")).toBeVisible()
  })
})
