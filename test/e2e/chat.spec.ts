import {
  test,
  expect,
  type APIRequestContext,
  type Page
} from "@playwright/test"

test.describe.configure({ mode: "serial" })
test.setTimeout(120000)

async function createEmptyApplication(request: APIRequestContext) {
  const response = await request.post("/api/resume/create-empty", {
    data: {
      jobInfo: {
        name: "E2E Chat Test Role",
        company: "Jobi",
        description: "Application created by Playwright chat tests"
      },
      language: "en"
    }
  })

  expect(response.ok()).toBe(true)

  const data = await response.json()
  expect(data?.data?.applicationData?.id).toBeTruthy()

  return data.data.applicationData.id as string
}

test.describe("Chat Feature", () => {
  test.beforeEach(async ({ page, request }, testInfo) => {
    if (testInfo.project.name === "chromium-no-auth") {
      await page.goto("/auth/login")
      return
    }

    const applicationId = await createEmptyApplication(request)
    await page.goto(`/application/${applicationId}/resume`, {
      waitUntil: "domcontentloaded"
    })
    await expect(page.getByRole("button", { name: "AI Chat" })).toBeVisible()
    await page.getByRole("button", { name: "AI Chat" }).click()
  })

  test("should load chat page without error", async ({ page }, testInfo) => {
    await expect(page.locator("body")).toBeVisible()

    if (testInfo.project.name === "chromium-no-auth") {
      await expect(page).toHaveURL(/.*\/auth\/login/)
      return
    }

    await page.waitForURL(/.*\/application\/.*\/resume/, { timeout: 15000 })
    await expect(page.getByLabel("Message input")).toBeVisible()
  })

  test("should have form structure", async ({ page }, testInfo) => {
    if (testInfo.project.name === "chromium-no-auth") {
      await expect(page.locator("form")).toBeVisible()
      await expect(page.getByRole("button", { name: "Login" })).toBeVisible()
      return
    }

    await expect(page.getByLabel("Message input")).toBeVisible()
    await expect(
      page.getByRole("button", { name: "Send message" })
    ).toBeVisible()
  })
})

test.describe("Application Chat Tab", () => {
  test.beforeEach(async ({ page, request }, testInfo) => {
    if (testInfo.project.name === "chromium-no-auth") {
      await page.goto("/application/test-id")
      return
    }

    const applicationId = await createEmptyApplication(request)
    await page.goto(`/application/${applicationId}`, {
      waitUntil: "domcontentloaded"
    })
  })

  test("should load application page", async ({ page }, testInfo) => {
    await expect(page.locator("body")).toBeVisible()

    if (testInfo.project.name === "chromium-no-auth") {
      await expect(page).toHaveURL(/.*\/auth\/login/)
      return
    }

    await page.waitForURL(/.*\/application\/.*\/resume/, { timeout: 15000 })
    await expect(page.getByRole("button", { name: "AI Chat" })).toBeVisible()
    await expect(
      page.getByRole("button", { name: "Evaluation Report" })
    ).toBeVisible()
  })
})
