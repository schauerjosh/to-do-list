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
});
