import { expect, test } from '@playwright/test';
import { getPort, killProcess, runDevCommand } from '../../utils/runCommands';

test.describe('basic test', async () => {
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

  test('all links should be normalized', async ({ page }) => {
    await page.goto(`http://localhost:${appPort}/base/guide`);
    const links = page.locator('.rspress-doc ul li a');
    const count = await links.count();
    const urls = await Promise.all(
      Array.from({ length: count }, (_, i) =>
        links.nth(i).getAttribute('href'),
      ),
    );

    expect(urls).toEqual([
      '/base/guide/installation.html',
      '/base/guide/installation.html',
      '/base/guide/installation.html',
      '/base/guide/installation.html',
      //
      '/base/guide/installation.html',
      '/base/guide/installation.html',
      '/base/guide/installation.html',
      '/base/guide/installation.html',
      '/base/guide/installation.html',
      '/base/guide/installation.html',
      '/base/guide/installation.html',
      '/base/guide/installation.html',
      //
      '/base/guide/subfolder/foo.html',
      '/base/guide/subfolder/foo.html',
      '/base/guide/subfolder/foo.html',
      '/base/guide/subfolder/foo.html',
      '/base/guide/subfolder/foo.html',
      '/base/guide/subfolder/foo.html',
      '/base/guide/subfolder/foo.html',
      '/base/guide/subfolder/foo.html',
      //
      '/base/guide/subfolder.html',
      '/base/guide/subfolder.html',
      '/base/guide/subfolder/index.html',
      '/base/guide/subfolder/index.html',
      '/base/guide/subfolder.html',
      '/base/guide/subfolder.html',
      '/base/guide/subfolder/index.html',
      '/base/guide/subfolder/index.html',
    ]);
  });
});
