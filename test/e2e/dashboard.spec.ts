import { test, expect } from '@playwright/test';
import { DashboardHelper } from './helpers/auth-helper';

test.describe('Dashboard页面', () => {
  test.beforeEach(async ({ page }) => {
    // 访问dashboard页面
    await DashboardHelper.navigateToDashboard(page);
  });

  test('应该显示dashboard页面标题和布局', async ({ page }) => {
    // 验证页面加载成功
    await expect(page).toHaveURL(/.*\/dashboard/);

    // 验证页面包含简历网格布局
    await expect(page.locator('.grid')).toBeVisible();

    // 验证页面容器样式
    const container = page.locator('.h-\\[calc\\(100vh-3rem\\)\\]');
    await expect(container).toBeVisible();
  });

  test('应该显示"Create New Resume"卡片', async ({ page }) => {
    // 验证"Create New Resume"卡片存在
    const newResumeCard = page.getByText('Create New Resume');
    await expect(newResumeCard).toBeVisible();

    // 验证卡片样式（虚线边框）
    const cardElement = newResumeCard.locator('..').locator('..');
    await expect(cardElement).toHaveClass(/border-dashed/);

    // 验证卡片有悬停效果
    await expect(cardElement).toHaveClass(/hover:scale-105/);
    await expect(cardElement).toHaveClass(/hover:shadow-lg/);
  });

  test('点击"Create New Resume"应该打开创建对话框', async ({ page }) => {
    // 打开创建对话框
    await DashboardHelper.openCreateResumeDialog(page);

    // 验证对话框打开
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Create New Resume' })).toBeVisible();

    // 验证步骤导航存在
    await expect(page.getByText('Job Information')).toBeVisible();
    await expect(page.getByText('Upload Resume')).toBeVisible();
    await expect(page.getByText('Analyze Resume')).toBeVisible();
  });

  test('创建简历对话框应该包含表单步骤', async ({ page }) => {
    // 打开创建对话框
    await DashboardHelper.openCreateResumeDialog(page);

    // 验证第一步（Job Information）的表单字段
    await expect(page.getByLabel(/name/i)).toBeVisible();
    await expect(page.getByLabel(/company/i)).toBeVisible();
    await expect(page.getByLabel(/description/i)).toBeVisible();

    // 验证Next按钮存在
    await expect(page.getByRole('button', { name: 'Next' })).toBeVisible();

    // 验证Previous按钮存在但被禁用（第一步）
    const prevButton = page.getByRole('button', { name: 'Previous' });
    await expect(prevButton).toBeVisible();
    await expect(prevButton).toBeDisabled();
  });

  test('创建简历对话框应该可以关闭', async ({ page }) => {
    // 打开创建对话框
    await DashboardHelper.openCreateResumeDialog(page);

    // 验证对话框打开
    await expect(page.getByRole('dialog')).toBeVisible();

    // 点击对话框外部关闭
    await page.locator("button[data-slot='dialog-close']").click();

    // 验证对话框关闭
    await expect(page.getByRole('dialog')).not.toBeVisible();
  });

  test('现有简历卡片应该可以点击跳转', async ({ page }) => {
    // 等待页面加载完成
    await page.waitForLoadState('networkidle');

    // 获取简历卡片数量
    const cardCount = await DashboardHelper.getResumeCardCount(page);

    // 如果有现有简历，测试点击跳转
    if (cardCount > 0) {
      // 点击第一个简历卡片
      await DashboardHelper.clickFirstResumeCard(page);

      await page.waitForURL("**/application/*")
      // 验证跳转到简历详情页
      await expect(page).toHaveURL(/.*\/application\/.*/);
    }
  });
});

test.describe('Dashboard页面 - 创建简历流程', () => {
  test.beforeEach(async ({ page }) => {
    await DashboardHelper.navigateToDashboard(page);
  });

  test('应该能够填写工作信息表单', async ({ page }) => {
    // 打开创建对话框
    await DashboardHelper.openCreateResumeDialog(page);

    // 填写表单
    const jobData = {
      name: 'Software Engineer',
      company: 'Tech Company',
      description: 'A challenging role in software development'
    };

    await DashboardHelper.fillJobInformationForm(page, jobData);

    // 验证表单值
    await expect(page.getByLabel(/name/i)).toHaveValue(jobData.name);
    await expect(page.getByLabel(/company/i)).toHaveValue(jobData.company);
    await expect(page.getByLabel(/description/i)).toHaveValue(jobData.description);
  });

  test('表单验证应该正常工作', async ({ page }) => {
    // 打开创建对话框
    await DashboardHelper.openCreateResumeDialog(page);

    // 尝试不填写表单直接点击Next
    await page.getByRole('button', { name: 'Next' }).click();

    // 验证表单验证错误
    await expect(page.getByText('Job name must not empty')).toBeVisible();
    await expect(page.getByText('Job company must not empty')).toBeVisible();
    await expect(page.getByText('Job description must not empty')).toBeVisible();
  });

  test('应该能够导航到第二步', async ({ page }) => {
    // 打开创建对话框
    await DashboardHelper.openCreateResumeDialog(page);

    // 填写表单
    const jobData = {
      name: 'Software Engineer',
      company: 'Tech Company',
      description: 'A challenging role in software development'
    };

    await DashboardHelper.fillJobInformationForm(page, jobData);

    // 点击Next进入第二步
    await page.getByRole('button', { name: 'Next' }).click();

    // 验证进入第二步（Upload Resume）
    await expect(page.getByText('Upload Resume')).toBeVisible();

    // 验证Previous按钮现在可用
    const prevButton = page.getByRole('button', { name: 'Previous' });
    await expect(prevButton).toBeVisible();
    await expect(prevButton).not.toBeDisabled();
  });

  test('应该能够在步骤之间导航', async ({ page }) => {
    // 打开创建对话框
    await DashboardHelper.openCreateResumeDialog(page);

    // 填写表单并进入第二步
    const jobData = {
      name: 'Software Engineer',
      company: 'Tech Company',
      description: 'A challenging role in software development'
    };

    await DashboardHelper.fillJobInformationForm(page, jobData);
    await page.getByRole('button', { name: 'Next' }).click();

    // 验证在第二步
    await expect(page.getByText('Upload Resume')).toBeVisible();

    // 点击Previous回到第一步
    await page.getByRole('button', { name: 'Previous' }).click();

    // 验证回到第一步
    await expect(page.getByText('Job Information')).toBeVisible();
    await expect(page.getByLabel(/name/i)).toHaveValue(jobData.name);
  });
});
