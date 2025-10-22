import { expect, test } from '@playwright/test';

import { getPort, killProcess, runDevCommand } from '../../utils/runCommands';

test.describe('dynamic toc', async () => {
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

  test('Index page', async ({ page }) => {
    await page.goto(`http://localhost:${appPort}`, {
      waitUntil: 'networkidle',
    });

    const heading = page.locator('h2');
    await expect(heading).toContainText('Term');

    const tocItem = page
      .locator('.rp-toc-item .rp-aside__toc-item__text')
      .first();
    await expect(tocItem).toHaveText('Term');

    await expect(heading).toContainText('Term dynamic & content');

    await expect(tocItem).toHaveText('Term dynamic & content');
  });
});
