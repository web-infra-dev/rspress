import { type Page, expect, test } from '@playwright/test';
import { getPort, killProcess, runDevCommand } from '../../utils/runCommands';

async function isNavBarVisible(page: Page): Promise<boolean> {
  const nav = await page.$('.rspress-nav');
  const className: string = await nav?.evaluate(el => el.className);
  return !className.includes('hidden');
}

async function scrollDown(page: Page) {
  // Simulate the scrolling of people
  await page.mouse.wheel(0, 100);
  await page.waitForTimeout(100);
  await page.mouse.wheel(0, 100);
  await page.waitForTimeout(100);
}

test.describe('basic test', async () => {
  let appPort;
  let app;
  async function launchApp(configFile: string) {
    const appDir = __dirname;
    appPort = await getPort();
    app = await runDevCommand(appDir, appPort, configFile);
  }

  test.afterAll(async () => {
    if (app) {
      await killProcess(app);
    }
  });

  test('hideNavBar: "auto" should work', async ({ page }) => {
    await launchApp('./rspress-hide-auto.config.ts');
    await page.goto(`http://localhost:${appPort}/`);
    await scrollDown(page);
    expect(await isNavBarVisible(page)).toBeFalsy();
  });

  test('Navbar should be visible on mobile when we scroll down with hideNavbar to never', async ({
    page,
  }) => {
    await launchApp('./rspress.config.ts');
    await page.setViewportSize({ width: 375, height: 812 });

    await page.goto(`http://localhost:${appPort}/`);

    await scrollDown(page);
    expect(await isNavBarVisible(page)).toBeTruthy();
  });
});
