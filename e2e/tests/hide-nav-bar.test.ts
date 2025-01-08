import { expect, test } from '@playwright/test';
import path from 'node:path';
import { getPort, killProcess, runDevCommand } from '../utils/runCommands';

const fixtureDir = path.resolve(__dirname, '../fixtures');

test.describe('basic test', async () => {
  let appPort;
  let app;
  async function launchApp(configFile: string) {
    const appDir = path.join(fixtureDir, 'hide-nav-bar');
    appPort = await getPort();
    app = await runDevCommand(appDir, appPort, configFile);
  }

  test.afterAll(async () => {
    if (app) {
      await killProcess(app);
    }
  });
  test('Navbar should be visible on mobile when we scroll down with hideNavbar to never', async ({
    page,
  }) => {
    await launchApp('./rspress.config.ts');
    await page.setViewportSize({ width: 375, height: 812 });

    await page.goto(`http://localhost:${appPort}/`);

    await page.evaluate(() => {
      window.scrollBy(0, 800);
    });

    // Allow to check if the rspress-nav is in the viewport
    // toBeVisible() doesn't work here because it check the visibility and the display property
    const isInViewport = await page.evaluate(sel => {
      const element = document.querySelector(sel);

      if (!element) return false;

      const rect = element.getBoundingClientRect();
      return (
        rect.top >= 0 &&
        rect.left >= 0 &&
        rect.bottom <=
          (window.innerHeight || document.documentElement.clientHeight) &&
        rect.right <=
          (window.innerWidth || document.documentElement.clientWidth)
      );
    }, '.rspress-nav');

    expect(isInViewport).toBeTruthy();
  });
});
