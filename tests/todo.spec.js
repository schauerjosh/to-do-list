import { test, expect } from '@playwright/test';

test.describe('To-Do List GUI', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
  });

  test('should add a new task', async ({ page }) => {
    await page.fill('.add-input', 'Playwright Task');
    await page.click('.add-btn');
    await expect(page.locator('.task-text')).toHaveText(['Playwright Task']);
  });

  test('should mark a task as completed', async ({ page }) => {
    await page.fill('.add-input', 'Complete Me');
    await page.click('.add-btn');
    await page.click('.checkbox');
    await expect(page.locator('.task.completed .task-text')).toHaveText(['Complete Me']);
  });

  test('should remove a task', async ({ page }) => {
    await page.fill('.add-input', 'Remove Me');
    await page.click('.add-btn');
    await page.click('.remove-btn');
    await expect(page.locator('.task-text')).not.toHaveText(['Remove Me']);
  });

  test('should mark a task as missed and show in frequently missed', async ({ page }) => {
    await page.fill('.add-input', 'Missed Task');
    await page.click('.add-btn');
    await page.click('.miss-btn');
    await page.fill('.modal input.add-input', 'Forgot');
    await page.click('.modal .add-btn');
    await expect(page.locator('.missed-section')).toContainText('Missed Task');
    await expect(page.locator('.missed-reason')).toContainText('Forgot');
  });

  test('should show tip after missing a task 3 times', async ({ page }) => {
    await page.fill('.add-input', 'Repeat Miss');
    await page.click('.add-btn');
    for (let i = 0; i < 3; i++) {
      await page.click('.miss-btn');
      await page.fill('.modal input.add-input', 'Busy');
      await page.click('.modal .add-btn');
    }
    await expect(page.locator('.missed-tips')).toBeVisible();
  });

  test('should add and complete a daily recurring task', async ({ page }) => {
    await page.click('button:has-text("+ ADD RECURRING TASK")');
    await page.fill('.modal input.add-input', 'Daily Recurring');
    await page.click('.modal input[type="radio"][value="daily"]');
    await page.click('.modal .add-btn');
    await expect(page.locator('.recurring-info')).toContainText('daily');
    await page.click('.checkbox');
    await expect(page.locator('.task.completed .task-text')).toHaveText(['Daily Recurring']);
  });

  test('should add and complete a custom recurring task', async ({ page }) => {
    await page.click('button:has-text("+ ADD RECURRING TASK")');
    await page.fill('.modal input.add-input', 'Custom Recurring');
    await page.click('.modal input[type="radio"][value="custom"]');
    await page.fill('.modal input[type="number"]', '2');
    await page.click('.modal .add-btn');
    await expect(page.locator('.recurring-info')).toContainText('Every 2 days');
    await page.click('.checkbox');
    await expect(page.locator('.task.completed .task-text')).toHaveText(['Custom Recurring']);
  });
});
