import { expect, test } from '@playwright/test';
import { getPort, killProcess, runDevCommand } from '../../utils/runCommands';

test.describe('replace-rules test', async () => {
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
    await page.goto(`http://localhost:${appPort}`);

    // replace text in _meta.json
    const nav = page.locator('.rspress-nav-menu');
    await expect(nav).toHaveText('bar-meta');

    // replace text in object frontmatter
    const hero = page.locator('h1');
    await expect(hero).toHaveText('bar-hero');
  });

  test('Foo page', async ({ page }) => {
    await page.goto(`http://localhost:${appPort}/foo`);

    // text in string frontmatter
    const title = page.locator('title');
    await expect(title).toHaveText('bar-title');

    // replace text in shared mdx content
    const h2 = page.locator('h2');
    await expect(h2).toHaveText('#bar-h2');

    // replace text in mdx content
    const text = page.locator('.rspress-doc p');
    await expect(text).toHaveText('bar-content');
  });
});
