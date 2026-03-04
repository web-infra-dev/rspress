import { expect, test } from '@playwright/test';

import { getPort, killProcess, runDevCommand } from '../../utils/runCommands';

test.describe('dynamic toc', async () => {
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

  test('Index page', async ({ page }) => {
    await page.goto(`http://localhost:${appPort}`, {
      waitUntil: 'networkidle',
    });

    const heading = page.locator('h2');
    await expect(heading).toContainText('Term');

    const tocItem = page.locator('.rp-toc-item .rp-toc-item__text').first();
    await expect(tocItem).toHaveText('Term');

    await expect(heading).toContainText('Term dynamic & content');

    await expect(tocItem).toHaveText('Term dynamic & content');
  });

  test('Data depth attribute', async ({ page }) => {
    await page.goto(`http://localhost:${appPort}/test-depth`, {
      waitUntil: 'networkidle',
    });

    // Check that TOC items have data-depth attributes
    const tocItems = page.locator('.rp-toc-item');
    const count = await tocItems.count();

    // Should have multiple TOC items
    expect(count).toBeGreaterThan(0);

    // Verify first item (h2) has data-depth="0"
    const firstItem = tocItems.nth(0);
    await expect(firstItem).toHaveAttribute('data-depth', '0');

    // If there are more items, check different depths
    if (count > 1) {
      // Check for h3 with data-depth="1"
      const h3Items = page.locator('.rp-toc-item[data-depth="1"]');
      const h3Count = await h3Items.count();
      expect(h3Count).toBeGreaterThan(0);
    }

    if (count > 2) {
      // Check for h4 with data-depth="2"
      const h4Items = page.locator('.rp-toc-item[data-depth="2"]');
      const h4Count = await h4Items.count();
      expect(h4Count).toBeGreaterThan(0);
    }
  });
});
