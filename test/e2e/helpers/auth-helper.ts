import { Page } from '@playwright/test';

export class DashboardHelper {
  /**
   * 导航到dashboard页面
   */
  static async navigateToDashboard(page: Page) {
    await page.goto('/dashboard');
  }

  /**
   * 打开创建简历对话框
   */
  static async openCreateResumeDialog(page: Page) {
    await page.getByText('Create New Resume').click();
    await page.waitForSelector('[role="dialog"]');
  }

  /**
   * 填写工作信息表单
   */
  static async fillJobInformationForm(page: Page, jobData: {
    name: string;
    company: string;
    description: string;
  }) {
    await page.getByLabel(/name/i).fill(jobData.name);
    await page.getByLabel(/company/i).fill(jobData.company);
    await page.getByLabel(/description/i).fill(jobData.description);
  }

  /**
   * 获取现有简历卡片数量
   */
  static async getResumeCardCount(page: Page): Promise<number> {
    return await page.locator('a[href^="/resume/"]').count();
  }

  /**
   * 点击第一个简历卡片
   */
  static async clickFirstResumeCard(page: Page) {
    const resumeCards = page.locator('a[href^="/resume/"]');
    if (await resumeCards.count() > 0) {
      await resumeCards.first().click();
    }
  }
}
