import { setTimeout } from 'node:timers/promises';

import { expect, test } from '@playwright/test';

import { getPort, killProcess, runDevCommand } from '../../utils/runCommands';

test.describe('dynamic toc', async () => {
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

    let h2 = await page.$('h2');
    let text = await page.evaluate(h2 => h2?.textContent.trim(), h2);
    expect(text).toBe('#Term');

    let toc = await page.$('.aside-link');
    let tocText = await page.evaluate(toc => toc?.textContent.trim(), toc);
    expect(tocText).toBe('Term');

    await setTimeout(1000); // Wait for dynamic TOC to update

    h2 = await page.$('h2');
    text = await page.evaluate(h2 => h2?.textContent.trim(), h2);
    expect(text).toBe('#Term dynamic content');

    toc = await page.$('.aside-link');
    tocText = await page.evaluate(toc => toc?.textContent.trim(), toc);
    expect(tocText).toBe('Term dynamic content');
  });
});
