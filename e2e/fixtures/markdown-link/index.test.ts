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
    const links = await page.$$('.rspress-doc ul li a');
    const urls = await Promise.all(
      links.map(async link => {
        const href = await link.getAttribute('href');
        return href;
      }),
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
