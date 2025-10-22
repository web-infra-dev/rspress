import { expect, test } from '@playwright/test';
import { getPort, killProcess, runDevCommand } from '../../utils/runCommands';

test.describe('replace-rules test', async () => {
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
    await page.goto(`http://localhost:${appPort}`);

    // replace text in _meta.json
    const navItem = page.locator('.rp-nav-menu__item__container').nth(0);
    await expect(navItem).toHaveText('bar-meta');

    // replace text in object frontmatter
    const hero = page.locator('.rp-home-hero__title-brand');
    await expect(hero).toHaveText('bar-hero');
  });

  test('Foo page', async ({ page }) => {
    await page.goto(`http://localhost:${appPort}/foo`);
    const doc = page.locator('.rspress-doc');
    await expect(doc).toBeVisible();

    // text in string frontmatter
    const title = await page.$('title');
    expect(await title?.textContent()).toBe('bar-title');

    // replace text in shared mdx content
    const h2 = page.locator('h2');
    await expect(h2).toHaveText('#bar-h2');

    // replace text in mdx content
    const text = page.locator('.rspress-doc p');
    await expect(text).toHaveText('bar-content');
  });
});
