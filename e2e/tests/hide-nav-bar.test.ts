import { expect, type Page, test } from '@playwright/test';
import path from 'node:path';
import { getPort, killProcess, runDevCommand } from '../utils/runCommands';

const fixtureDir = path.resolve(__dirname, '../fixtures');
async function isNavBarVisible(page: Page): Promise<boolean> {
  const nav = await page.$('.rspress-nav');
  const className: string = await nav?.evaluate(el => el.className);
  console.log(className);

  return !className.includes('hidden');
}

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

  test('hideNavBar: "auto" should work', async ({ page }) => {
    await launchApp('./rspress-hide-auto.config.ts');
    await page.goto(`http://localhost:${appPort}/`);

    // scroll down
    await page.mouse.wheel(0, 100);
    await page.waitForTimeout(100);
    await page.mouse.wheel(0, 100);
    await page.waitForTimeout(100);
    await page.mouse.wheel(0, 100);
    await page.waitForTimeout(100);

    const isVisible = await isNavBarVisible(page);
    expect(isVisible).toBeFalsy();
  });

  test('Navbar should be visible on mobile when we scroll down with hideNavbar to never', async ({
    page,
  }) => {
    await launchApp('./rspress.config.ts');
    await page.setViewportSize({ width: 375, height: 812 });

    await page.goto(`http://localhost:${appPort}/`);

    // scroll down
    await page.mouse.wheel(0, 100);
    await page.waitForTimeout(100);
    await page.mouse.wheel(0, 100);
    await page.waitForTimeout(100);
    await page.mouse.wheel(0, 100);

    expect(await isNavBarVisible(page)).toBeTruthy();
  });
});
