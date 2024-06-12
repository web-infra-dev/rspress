import path from 'node:path';
import { expect, test } from '@playwright/test';
import { getPort, killProcess, runDevCommand } from '../utils/runCommands';

const appDir = path.resolve(__dirname, '../fixtures/prism-sytax-highlighter');

test.describe('markdown highlight test', async () => {
  let appPort: number;
  let app: unknown;
  test.beforeAll(async () => {
    appPort = await getPort();
    app = await runDevCommand(appDir, appPort);
  });

  test.afterAll(async () => {
    if (app) {
      await killProcess(app);
    }
  });

  test('does highlight work', async ({ page }) => {
    await page.goto(`http://localhost:${appPort}`);

    const text = await page
      .locator('.language-objectivec .token.macro.directive-hash')
      .evaluate(node => node.textContent);

    expect(text).toBe('#');
  });

  test('alias content match', async ({ page }) => {
    await page.goto(`http://localhost:${appPort}`);

    const [ocInnerHTML, objectivecInnerHTML] = await Promise.all([
      page.locator('code.language-oc').evaluate(node => node.innerHTML),
      page.locator('code.language-objectivec').evaluate(node => node.innerHTML),
    ]);

    expect(ocInnerHTML).toBe(objectivecInnerHTML);
  });
});
