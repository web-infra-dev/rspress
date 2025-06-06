import path from 'node:path';
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
    await page.goto(`http://localhost:${appPort}/guide`);
    const links = await page.$$('.rspress-doc ul li a');
    const urls = await Promise.all(
      links.map(async link => {
        const href = await link.getAttribute('href');
        return href;
      }),
    );

    const snapshot = urls.join('\n');

    expect(snapshot).toEqual(`/guide/installation.html
/guide/installation.html
/guide/installation.html
/guide/installation.html
/guide/installation.html
/installation.html
/guide/installation.html
/installation.html
/guide/installation.html
/installation.html
/guide/installation.html
/installation.html
/guide/subfolder/foo.html
/subfolder/foo.html
/guide/subfolder/foo.html
/subfolder/foo.html
/guide/subfolder/foo.html
/subfolder/foo.html
/guide/subfolder/foo.html
/subfolder/foo.html
/guide/subfolder.html
/subfolder.html
/guide/subfolder/index.html
/subfolder/index.html
/guide/subfolder.html
/subfolder.html
/guide/subfolder/index.html
/subfolder/index.html`);
  });
});
