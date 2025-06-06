import path from 'node:path';
import { expect, test } from '@playwright/test';
import { getNavbar, getSidebar } from '../../utils/getSideBar';
import { getPort, killProcess, runDevCommand } from '../../utils/runCommands';

test.describe('issue-1309', async () => {
  let appPort;
  let app;
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

  test('should not generate the sidebar in homePage', async ({ page }) => {
    await page.goto(`http://localhost:${appPort}`);
    const nav = await getNavbar(page);
    expect(nav?.length).toBe(1);

    const sidebar = await getSidebar(page);
    expect(sidebar?.length).toBe(0);
  });

  test('should render the sidebar correctly in guide page', async ({
    page,
  }) => {
    await page.goto(`http://localhost:${appPort}/guide`);
    const nav = await getNavbar(page);
    expect(nav?.length).toBe(1);

    const sidebar = await getSidebar(page);
    expect(sidebar?.length).toBe(3);
  });
});
