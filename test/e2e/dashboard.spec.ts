import { test, expect, type Page } from "@playwright/test"
import { DashboardHelper } from "./helpers/auth-helper"

async function mockUploadAndAnalyzeSuccess(
  page: Page,
  input: {
    intakeId: string
    applicationId: string
    resumeId: string
  }
) {
  await page.route("**/api/resume/upload-and-analyze", async (route) => {
    await route.fulfill({
      status: 200,
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache"
      },
      body: [
        `data: ${JSON.stringify({ type: "intake.start", intakeId: input.intakeId })}`,
        `data: ${JSON.stringify({ type: "step.start", intakeId: input.intakeId, step: "extract" })}`,
        `data: ${JSON.stringify({ type: "step.done", intakeId: input.intakeId, step: "extract" })}`,
        `data: ${JSON.stringify({ type: "step.start", intakeId: input.intakeId, step: "parse" })}`,
        `data: ${JSON.stringify({ type: "step.done", intakeId: input.intakeId, step: "parse" })}`,
        `data: ${JSON.stringify({ type: "step.start", intakeId: input.intakeId, step: "upload" })}`,
        `data: ${JSON.stringify({ type: "step.done", intakeId: input.intakeId, step: "upload" })}`,
        `data: ${JSON.stringify({ type: "step.start", intakeId: input.intakeId, step: "persist" })}`,
        `data: ${JSON.stringify({ type: "step.done", intakeId: input.intakeId, step: "persist" })}`,
        `data: ${JSON.stringify({ type: "step.start", intakeId: input.intakeId, step: "evaluate" })}`,
        `data: ${JSON.stringify({ type: "step.done", intakeId: input.intakeId, step: "evaluate" })}`,
        `data: ${JSON.stringify({ type: "intake.done", intakeId: input.intakeId, applicationId: input.applicationId, resumeId: input.resumeId })}`,
        ""
      ].join("\n\n")
    })
  })
}

test.describe("Dashboard页面", () => {
  test.beforeEach(async ({ page }) => {
    // 访问dashboard页面
    await DashboardHelper.navigateToDashboard(page)
  })

  test("应该显示dashboard页面标题和布局", async ({ page }) => {
    // 验证页面加载成功
    await expect(page).toHaveURL(/.*\/dashboard/)

    // 验证页面包含简历网格布局
    await expect(page.locator(".grid")).toBeVisible()

    // 验证页面容器样式
    const container = page.locator(".h-\\[calc\\(100vh-3rem\\)\\]")
    await expect(container).toBeVisible()
  })

  test('应该显示"Create New Resume"卡片', async ({ page }) => {
    // 验证"Create New Resume"卡片存在
    const newResumeCard = page.getByText("Create New Resume")
    await expect(newResumeCard).toBeVisible()

    // 验证卡片样式（虚线边框）
    const cardElement = newResumeCard.locator("..").locator("..")
    await expect(cardElement).toHaveClass(/border-dashed/)

    // 验证卡片有悬停效果
    await expect(cardElement).toHaveClass(/hover:scale-105/)
    await expect(cardElement).toHaveClass(/hover:shadow-lg/)
  })

  test('点击"Create New Resume"应该打开创建对话框', async ({ page }) => {
    // 打开创建对话框
    await DashboardHelper.openCreateResumeDialog(page)

    // 验证对话框打开
    await expect(page.getByRole("dialog")).toBeVisible()
    await expect(
      page.getByRole("heading", { name: "Create New Resume" })
    ).toBeVisible()

    // 验证步骤导航存在
    await expect(page.getByText("Job Information")).toBeVisible()
    await expect(page.getByText("Upload Resume")).toBeVisible()
    await expect(page.getByText("Analyze Resume")).toBeVisible()
  })

  test("创建简历对话框应该包含表单步骤", async ({ page }) => {
    // 打开创建对话框
    await DashboardHelper.openCreateResumeDialog(page)

    // 验证第一步（Job Information）的表单字段
    await expect(page.getByLabel(/name/i)).toBeVisible()
    await expect(page.getByLabel(/company/i)).toBeVisible()
    await expect(page.getByLabel(/description/i)).toBeVisible()

    // 验证Next按钮存在
    await expect(page.getByRole("button", { name: "Next" })).toBeVisible()

    // 验证Previous按钮存在但被禁用（第一步）
    const prevButton = page.getByRole("button", { name: "Previous" })
    await expect(prevButton).toBeVisible()
    await expect(prevButton).toBeDisabled()
  })

  test("创建简历对话框应该可以关闭", async ({ page }) => {
    // 打开创建对话框
    await DashboardHelper.openCreateResumeDialog(page)

    // 验证对话框打开
    await expect(page.getByRole("dialog")).toBeVisible()

    // 点击对话框外部关闭
    await page.locator("button[data-slot='dialog-close']").click()

    // 验证对话框关闭
    await expect(page.getByRole("dialog")).not.toBeVisible()
  })

  test("现有简历卡片应该可以点击跳转", async ({ page }) => {
    // 等待页面加载完成
    await page.waitForLoadState("networkidle")

    // 获取简历卡片数量
    const cardCount = await DashboardHelper.getResumeCardCount(page)

    // 如果有现有简历，测试点击跳转
    if (cardCount > 0) {
      // 点击第一个简历卡片
      await DashboardHelper.clickFirstResumeCard(page)

      await page.waitForURL("**/application/*")
      // 验证跳转到简历详情页
      await expect(page).toHaveURL(/.*\/application\/.*/)
    }
  })
})

test.describe("Dashboard页面 - 创建简历流程", () => {
  test.beforeEach(async ({ page }) => {
    await DashboardHelper.navigateToDashboard(page)
  })

  test("应该能够填写工作信息表单", async ({ page }) => {
    // 打开创建对话框
    await DashboardHelper.openCreateResumeDialog(page)

    // 填写表单
    const jobData = {
      name: "Software Engineer",
      company: "Tech Company",
      description: "A challenging role in software development"
    }

    await DashboardHelper.fillJobInformationForm(page, jobData)

    // 验证表单值
    await expect(page.getByLabel(/name/i)).toHaveValue(jobData.name)
    await expect(page.getByLabel(/company/i)).toHaveValue(jobData.company)
    await expect(page.getByLabel(/description/i)).toHaveValue(
      jobData.description
    )
  })

  test("表单验证应该正常工作", async ({ page }) => {
    // 打开创建对话框
    await DashboardHelper.openCreateResumeDialog(page)

    // 尝试不填写表单直接点击Next
    await page.getByRole("button", { name: "Next" }).click()

    // 验证表单进入 invalid 状态
    await expect(page.getByLabel(/name/i)).toHaveAttribute(
      "aria-invalid",
      "true"
    )
    await expect(page.getByLabel(/company/i)).toHaveAttribute(
      "aria-invalid",
      "true"
    )
    await expect(page.getByLabel(/description/i)).toHaveAttribute(
      "aria-invalid",
      "true"
    )
    await expect(page.locator("[data-slot='form-message']")).toHaveCount(3)
  })

  test("应该能够导航到第二步", async ({ page }) => {
    // 打开创建对话框
    await DashboardHelper.openCreateResumeDialog(page)

    // 填写表单
    const jobData = {
      name: "Software Engineer",
      company: "Tech Company",
      description: "A challenging role in software development"
    }

    await DashboardHelper.fillJobInformationForm(page, jobData)

    // 点击Next进入第二步
    await page.getByRole("button", { name: "Next" }).click()

    // 验证进入第二步（Upload Resume）
    await expect(page.getByText("Upload Resume")).toBeVisible()

    // 验证Previous按钮现在可用
    const prevButton = page.getByRole("button", { name: "Previous" })
    await expect(prevButton).toBeVisible()
    await expect(prevButton).not.toBeDisabled()
  })

  test("应该能够在步骤之间导航", async ({ page }) => {
    // 打开创建对话框
    await DashboardHelper.openCreateResumeDialog(page)

    // 填写表单并进入第二步
    const jobData = {
      name: "Software Engineer",
      company: "Tech Company",
      description: "A challenging role in software development"
    }

    await DashboardHelper.fillJobInformationForm(page, jobData)
    await page.getByRole("button", { name: "Next" }).click()

    // 验证在第二步
    await expect(page.getByText("Upload Resume")).toBeVisible()

    // 点击Previous回到第一步
    await page.getByRole("button", { name: "Previous" }).click()

    // 验证回到第一步
    await expect(page.getByText("Job Information")).toBeVisible()
    await expect(page.getByLabel(/name/i)).toHaveValue(jobData.name)
  })

  test("上传 PDF 后应按新 SSE 协议跳转到 application 页面", async ({
    page
  }) => {
    await mockUploadAndAnalyzeSuccess(page, {
      intakeId: "intake-e2e-1",
      applicationId: "app-e2e-1",
      resumeId: "resume-e2e-1"
    })

    await DashboardHelper.openCreateResumeDialog(page)

    await DashboardHelper.fillJobInformationForm(page, {
      name: "Software Engineer",
      company: "Tech Company",
      description: "A challenging role in software development"
    })

    await page.getByRole("button", { name: "Next" }).click()
    await page.locator('input[type="file"]').setInputFiles("test/test_pdf.pdf")
    await expect(
      page.getByRole("button", { name: "Start Analysis" })
    ).toBeEnabled()
    await page.getByRole("button", { name: "Start Analysis" }).click()

    await page.waitForURL("**/application/app-e2e-1")
  })

  for (const scenario of [
    {
      label: "English PDF",
      file: {
        name: "resume-en.pdf",
        mimeType: "application/pdf",
        buffer: Buffer.from("%PDF-1.4 English resume")
      },
      applicationId: "app-e2e-en",
      resumeId: "resume-e2e-en"
    },
    {
      label: "Chinese PDF",
      file: {
        name: "简历-中文.pdf",
        mimeType: "application/pdf",
        buffer: Buffer.from("%PDF-1.4 中文简历")
      },
      applicationId: "app-e2e-zh",
      resumeId: "resume-e2e-zh"
    }
  ]) {
    test(`creates an Application Resume from a ${scenario.label}`, async ({
      page
    }) => {
      await mockUploadAndAnalyzeSuccess(page, {
        intakeId: `intake-${scenario.applicationId}`,
        applicationId: scenario.applicationId,
        resumeId: scenario.resumeId
      })

      await DashboardHelper.openCreateResumeDialog(page)
      await DashboardHelper.fillJobInformationForm(page, {
        name: "Software Engineer",
        company: "Tech Company",
        description: "A challenging role in software development"
      })

      await page.getByRole("button", { name: "Next" }).click()
      await page.locator('input[type="file"]').setInputFiles(scenario.file)
      await expect(
        page.getByRole("button", { name: "Start Analysis" })
      ).toBeEnabled()
      await page.getByRole("button", { name: "Start Analysis" }).click()

      await page.waitForURL(`**/application/${scenario.applicationId}`)
    })
  }

  test("closing the dialog during analysis resets the flow without stale navigation", async ({
    page
  }) => {
    let releaseResponse!: () => void
    const responseReleased = new Promise<void>((resolve) => {
      releaseResponse = resolve
    })

    await page.route("**/api/resume/upload-and-analyze", async (route) => {
      await responseReleased
      await route.fulfill({
        status: 200,
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache"
        },
        body: [
          'data: {"type":"intake.start","intakeId":"intake-close-1"}',
          'data: {"type":"intake.done","intakeId":"intake-close-1","applicationId":"app-stale-close","resumeId":"resume-stale-close"}',
          ""
        ].join("\n\n")
      })
    })

    await DashboardHelper.openCreateResumeDialog(page)
    await DashboardHelper.fillJobInformationForm(page, {
      name: "Software Engineer",
      company: "Tech Company",
      description: "A challenging role in software development"
    })

    await page.getByRole("button", { name: "Next" }).click()
    await page.locator('input[type="file"]').setInputFiles("test/test_pdf.pdf")
    await page.getByRole("button", { name: "Start Analysis" }).click()

    await expect(page.getByRole("dialog")).toBeVisible()
    await page.locator("button[data-slot='dialog-close']").click()
    await expect(page.getByRole("dialog")).not.toBeVisible()

    releaseResponse()
    await page.waitForTimeout(1200)
    await expect(page).toHaveURL(/.*\/dashboard/)

    await DashboardHelper.openCreateResumeDialog(page)
    await expect(page.getByLabel(/name/i)).toHaveValue("")
    await expect(page.getByLabel(/company/i)).toHaveValue("")
    await expect(page.getByLabel(/description/i)).toHaveValue("")
  })

  test("reloading the page during analysis does not leave stale UI state", async ({
    page
  }) => {
    let releaseResponse!: () => void
    const responseReleased = new Promise<void>((resolve) => {
      releaseResponse = resolve
    })

    await page.route("**/api/resume/upload-and-analyze", async (route) => {
      await responseReleased
      await route.fulfill({
        status: 200,
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache"
        },
        body: [
          'data: {"type":"intake.start","intakeId":"intake-reload-1"}',
          'data: {"type":"intake.done","intakeId":"intake-reload-1","applicationId":"app-stale-reload","resumeId":"resume-stale-reload"}',
          ""
        ].join("\n\n")
      })
    })

    await DashboardHelper.openCreateResumeDialog(page)
    await DashboardHelper.fillJobInformationForm(page, {
      name: "Software Engineer",
      company: "Tech Company",
      description: "A challenging role in software development"
    })

    await page.getByRole("button", { name: "Next" }).click()
    await page.locator('input[type="file"]').setInputFiles("test/test_pdf.pdf")
    await page.getByRole("button", { name: "Start Analysis" }).click()

    await page.reload()
    releaseResponse()
    await page.waitForTimeout(1200)

    await expect(page).toHaveURL(/.*\/dashboard/)
    await DashboardHelper.openCreateResumeDialog(page)
    await expect(page.getByRole("button", { name: "Next" })).toBeVisible()
  })

  test("上传接口返回 JSON 错误时应展示真实错误信息", async ({ page }) => {
    await page.route("**/api/resume/upload-and-analyze", async (route) => {
      await route.fulfill({
        status: 400,
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ error: "Only PDF files are supported" })
      })
    })

    await DashboardHelper.openCreateResumeDialog(page)

    await DashboardHelper.fillJobInformationForm(page, {
      name: "Software Engineer",
      company: "Tech Company",
      description: "A challenging role in software development"
    })

    await page.getByRole("button", { name: "Next" }).click()
    await page.locator('input[type="file"]').setInputFiles("test/test_pdf.pdf")
    await page.getByRole("button", { name: "Start Analysis" }).click()

    await expect(page.getByText("Only PDF files are supported")).toBeVisible()
    await expect(page).toHaveURL(/.*\/dashboard/)
  })
})
