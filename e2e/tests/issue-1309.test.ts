import { expect, test } from '@playwright/test';
import path from 'node:path';
import { getPort, killProcess, runDevCommand } from '../utils/runCommands';
import { getNavbar, getSidebar } from '../utils/getSideBar';

const fixtureDir = path.resolve(__dirname, '../fixtures');

test.describe('issue-1309', async () => {
  let appPort;
  let app;
  test.beforeAll(async () => {
    const appDir = path.join(fixtureDir, 'issue-1309');
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
