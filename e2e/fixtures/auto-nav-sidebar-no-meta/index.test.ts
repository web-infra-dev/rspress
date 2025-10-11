import { expect, test } from '@playwright/test';
import { getSidebarTexts } from '../../utils/getSideBar';
import { getPort, killProcess, runDevCommand } from '../../utils/runCommands';

test.describe('Auto nav and sidebar test', async () => {
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

  test('Should render sidebar correctly', async ({ page }) => {
    await page.goto(`http://localhost:${appPort}/`, {
      waitUntil: 'networkidle',
    });

    const sidebarTexts = await getSidebarTexts(page);
    expect(sidebarTexts).toEqual([
      'API',
      'plugin',
      'Plugin a',
      'Plugin b',
      'Commands',
      'config',
      'Basic config',
      'Build config',
      'Front matter config',
      'Theme config',
      'HomePage',
    ]);
  });

  test('Should click the directory and navigate to the index page', async ({
    page,
  }) => {
    await page.goto(`http://localhost:${appPort}/api/index`, {
      waitUntil: 'networkidle',
    });

    const configLink = page
      .locator('.rp-doc-layout__sidebar .rp-sidebar-item[data-depth="1"]')
      .filter({
        has: page.locator('.rp-sidebar-item__left span', {
          hasText: /^config$/,
        }),
      });
    await expect(configLink).toHaveCount(1);
    await configLink.first().click();
    await expect(page).toHaveURL(
      `http://localhost:${appPort}/api/rspress-config/index.html`,
    );
  });
});
