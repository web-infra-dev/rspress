import path from 'node:path';
import { expect, test } from '@playwright/test';
import { getPort, killProcess, runDevCommand } from '../utils/runCommands';

const fixtureDir = path.resolve(__dirname, '../fixtures');

test.describe('heading-title test', async () => {
  let appPort;
  let app;
  test.beforeAll(async () => {
    const appDir = path.join(fixtureDir, 'heading-title');
    appPort = await getPort();
    app = await runDevCommand(appDir, appPort);
  });

  test.afterAll(async () => {
    if (app) {
      await killProcess(app);
    }
  });

  test('Guide page', async ({ page }) => {
    await page.goto(`http://localhost:${appPort}/guide`, {
      waitUntil: 'networkidle',
    });
    const h1s = await page.$$('h1');
    expect(h1s.length).toBe(1);

    const h1 = h1s[0];
    const className = await page.evaluate(h1 => h1?.className, h1);
    expect(className).toContain('rspress-doc-title');
    const text = await page.evaluate(h1 => h1?.textContent, h1);
    expect(text).toContain('Heading Title');
    expect(await page.evaluate(h1 => h1?.id, h1)).toBe('heading-title');
    expect(await page.evaluate(link => link?.hash, await h1?.$('a'))).toBe(
      '#heading-title',
    );
  });
});
