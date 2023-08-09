import { expect, test } from '@playwright/test';

test('basic test', async ({ page }) => {
  await page.goto('https://modernjs.dev/en/guides/get-started/introduction');
  const locator = await page.locator('h1');
  await expect(locator).toContainText('Introduction to Modern.js');
});
