import { expect, test } from '@playwright/test';
import { getSidebarTexts } from '../../utils/getSideBar';
import { getPort, killProcess, runDevCommand } from '../../utils/runCommands';

test.describe('Multi version global sidebar test', async () => {
  let appPort: number;
  let app: Awaited<ReturnType<typeof runDevCommand>>;
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

  test('Should keep global sidebar isolated by version', async ({ page }) => {
    await page.goto(`http://localhost:${appPort}/`, {
      waitUntil: 'networkidle',
    });
    await expect(page.locator('h1')).toContainText('Version One');
    expect(await getSidebarTexts(page)).toEqual([
      'Version One',
      'Version One Guide',
    ]);

    await page.goto(`http://localhost:${appPort}/v2/`, {
      waitUntil: 'networkidle',
    });
    await expect(page.locator('h1')).toContainText('Version Two');
    expect(await getSidebarTexts(page)).toEqual([
      'Version Two',
      'Version Two Guide',
    ]);
  });
});
