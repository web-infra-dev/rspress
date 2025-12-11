import { expect, test } from '@playwright/test';
import { getNavbarItems, getSidebar } from '../../utils/getSideBar';
import { getPort, killProcess, runDevCommand } from '../../utils/runCommands';

test.describe('issue-1309', async () => {
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

  test('should not generate the sidebar in homePage', async ({ page }) => {
    await page.goto(`http://localhost:${appPort}`);
    const navItems = getNavbarItems(page);
    await expect(navItems).toHaveCount(1);

    const sidebar = getSidebar(page);
    expect(await sidebar.count()).toBe(0);
  });

  test('should render the sidebar correctly in guide page', async ({
    page,
  }) => {
    await page.goto(`http://localhost:${appPort}/guide`);
    const navItems = getNavbarItems(page);
    await expect(navItems).toHaveCount(1);

    const sidebar = getSidebar(page);
    expect(await sidebar.count()).toBe(4);
  });
});
