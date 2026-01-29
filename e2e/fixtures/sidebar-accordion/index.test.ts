import { expect, test } from '@playwright/test';
import { getPort, killProcess, runDevCommand } from '../../utils/runCommands';

test.describe('Sidebar accordion mode test', async () => {
  let appPort: number;
  let app: Awaited<ReturnType<typeof runDevCommand>>;
  
  test.beforeAll(async () => {
    const appDir = __dirname;
    appPort = await getPort();
    app = await runDevCommand(appDir, appPort);
  });

  test.afterAll(async () => {
    if (app) {
      await killProcess(app);
    }
  });

  test('Should have three collapsible sidebar groups', async ({ page }) => {
    await page.goto(`http://localhost:${appPort}/`, {
      waitUntil: 'networkidle',
    });

    const sidebarGroups = page.locator('.rp-sidebar-group[data-depth="0"]');
    expect(await sidebarGroups.count()).toBe(3);

    const groupTexts = await sidebarGroups.allTextContents();
    expect(groupTexts.map(t => t.trim())).toEqual(
      expect.arrayContaining(['Guide', 'API Reference', 'Advanced']),
    );
  });

  test('Should only allow one section expanded at a time (accordion mode)', async ({ page }) => {
    await page.goto(`http://localhost:${appPort}/`, {
      waitUntil: 'networkidle',
    });

    // Get all sidebar groups at depth 0
    const sidebarGroups = page.locator('.rp-sidebar-group[data-depth="0"]');
    
    // Click on the first group (Guide) to expand it
    await sidebarGroups.first().click();
    await page.waitForTimeout(300); // Wait for animation

    // Verify Guide section items are visible (check in sidebar only)
    const guideItems = page.locator('.rp-sidebar-item a:has-text("Getting Started")');
    await expect(guideItems.first()).toBeVisible();

    // Click on the second group (API Reference) to expand it
    await sidebarGroups.nth(1).click();
    await page.waitForTimeout(300); // Wait for animation

    // Verify API Reference section items are visible (check in sidebar only)
    const apiItems = page.locator('.rp-sidebar-item a:has-text("Config")');
    await expect(apiItems.first()).toBeVisible();

    // Verify Guide section items are NOT visible (collapsed due to accordion)
    const guideItemsAfter = page.locator('.rp-sidebar-item a:has-text("Getting Started")');
    await expect(guideItemsAfter.first()).not.toBeVisible();

    // Click on the third group (Advanced) to expand it
    await sidebarGroups.nth(2).click();
    await page.waitForTimeout(300); // Wait for animation

    // Verify Advanced section items are visible (check in sidebar only)
    const advancedItems = page.locator('.rp-sidebar-item a:has-text("Plugins")');
    await expect(advancedItems.first()).toBeVisible();

    // Verify API Reference section items are NOT visible (collapsed due to accordion)
    const apiItemsAfter = page.locator('.rp-sidebar-item a:has-text("Config")');
    await expect(apiItemsAfter.first()).not.toBeVisible();
  });

  test('Should expand the section containing the current page', async ({ page }) => {
    await page.goto(`http://localhost:${appPort}/guide/getting-started`, {
      waitUntil: 'networkidle',
    });

    // The Guide section should be expanded because we're on a page in that section
    const guideItems = page.locator('.rp-sidebar-item a:has-text("Getting Started")');
    await expect(guideItems.first()).toBeVisible();

    const installationItems = page.locator('.rp-sidebar-item a:has-text("Installation")');
    await expect(installationItems.first()).toBeVisible();
  });
});
