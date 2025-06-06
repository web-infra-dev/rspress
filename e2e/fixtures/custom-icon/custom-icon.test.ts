import path from 'node:path';
import { expect, test } from '@playwright/test';
import { getPort, killProcess, runDevCommand } from '../../utils/runCommands';

test.describe('custom icon test', async () => {
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

  test('Index page', async ({ page }) => {
    await page.goto(`http://localhost:${appPort}`, {
      waitUntil: 'networkidle',
    });
    const h1 = await page.$('h1');
    const text = await page.evaluate(h1 => h1?.textContent, h1);
    await expect(text).toContain('Hello world');

    const headerAnchor = await page.$('.rspress-nav-search-button img');
    const src = await page.evaluate(
      headerAnchor => headerAnchor?.getAttribute('src'),
      headerAnchor,
    );
    expect(src).toContain('data:image/svg+xml;base64');
  });
});
