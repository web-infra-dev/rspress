import { expect, test } from '@playwright/test';
import { getPort, killProcess, runDevCommand } from '../../utils/runCommands';

test.describe('title-number test', async () => {
  let appPort: number;
  let app: Awaited<ReturnType<typeof runDevCommand>> | null;
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
    const h3Elements = page.locator('h3');
    await expect(h3Elements).toHaveText([
      '#-22222222',
      '#-1111111111',
      '#-1111111111',
    ]);

    const h3Links = page.locator('h3 a');
    const hrefList = await Promise.all(
      Array.from({ length: await h3Links.count() }, async (_, i) =>
        h3Links.nth(i).getAttribute('href'),
      ),
    );
    expect(hrefList).toEqual(['#-22222222', '#-1111111111', '#-1111111111-1']);
  });
});
