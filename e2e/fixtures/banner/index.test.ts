import { expect, test } from '@playwright/test';
import { getPort, killProcess, runDevCommand } from '../../utils/runCommands';

test.describe('tabs-component test', async () => {
  let appPort: number;
  let app: Awaited<ReturnType<typeof runDevCommand>> | null;

  test.beforeAll(async () => {
    const appDir = import.meta.dirname;
    appPort = await getPort();
    app = await runDevCommand(appDir, appPort);
  });

  test.afterAll(async () => {
    if (app) {
      await killProcess(app);
    }
  });

  test('Banner close hides banner and persists state', async ({ page }) => {
    await page.goto(`http://localhost:${appPort}`, {
      waitUntil: 'networkidle',
    });
    await page.waitForSelector('.rp-banner');

    const closeButton = page.locator('.rp-banner__close');
    await expect(closeButton).toBeVisible();
    await closeButton.click();

    await expect(page.locator('.rp-banner')).toHaveCount(0);
    const stored = await page.evaluate(() =>
      window.localStorage.getItem('rp-banner-closed'),
    );
    expect(stored).toBe('true');
  });

  test('Banner message stays single line on narrow viewport', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto(`http://localhost:${appPort}`, {
      waitUntil: 'networkidle',
    });
    await page.waitForSelector('.rp-banner');

    const layout = await page.locator('.rp-banner').evaluate(element => {
      const link = element.querySelector('.rp-banner__link');
      const close = element.querySelector('.rp-banner__close');

      if (!link || !close) {
        throw new Error('Banner link or close button not found');
      }

      const linkStyle = window.getComputedStyle(link);
      const bannerRect = element.getBoundingClientRect();
      const linkRect = link.getBoundingClientRect();
      const closeRect = close.getBoundingClientRect();

      return {
        bannerHeight: bannerRect.height,
        closeLeft: closeRect.left,
        linkHeight: linkRect.height,
        linkRight: linkRect.right,
        whiteSpace: linkStyle.whiteSpace,
      };
    });

    expect(layout.bannerHeight).toBe(36);
    expect(layout.linkHeight).toBeLessThanOrEqual(layout.bannerHeight);
    expect(layout.linkRight).toBeLessThanOrEqual(layout.closeLeft);
    expect(layout.whiteSpace).toBe('nowrap');
  });
});
