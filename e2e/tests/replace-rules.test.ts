import path from 'node:path';
import { expect, test } from '@playwright/test';
import { getPort, killProcess, runDevCommand } from '../utils/runCommands';

const fixtureDir = path.resolve(__dirname, '../fixtures');

test.describe('replace-rules test', async () => {
  let appPort;
  let app;
  test.beforeAll(async () => {
    const appDir = path.join(fixtureDir, 'replace-rules');
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
    const nav = await page.$('.rspress-nav-menu');
    const navContent = await page.evaluate(nav => nav?.textContent, nav);

    // replace text in object frontmatter
    const hero = await page.$('h1');
    const heroContent = await page.evaluate(hero => hero?.textContent, hero);

    expect(navContent).toEqual('bar-meta');
    expect(heroContent).toEqual('bar-hero');
  });

  test('Foo page', async ({ page }) => {
    await page.goto(`http://localhost:${appPort}/foo`);

    // text in string frontmatter
    const title = await page.$('title');
    const titleContent = await page.evaluate(
      title => title?.textContent,
      title,
    );

    // replace text in shared mdx content
    const h2 = await page.$('h2');
    const h2Content = await page.evaluate(h2 => h2?.textContent, h2);

    // replace text in mdx content
    const text = await page.$('.rspress-doc p');
    const textContent = await page.evaluate(text => text?.textContent, text);

    expect(titleContent).toEqual('bar-title');
    expect(h2Content).toEqual('#bar-h2');
    expect(textContent).toEqual('bar-content');
  });
});
