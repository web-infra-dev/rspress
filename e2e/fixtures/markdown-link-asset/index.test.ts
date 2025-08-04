import { expect, type Page, test } from '@playwright/test';
import {
  getPort,
  killProcess,
  runBuildCommand,
  runPreviewCommand,
} from '../../utils/runCommands';

test.describe('basic test', async () => {
  let appPort;
  let app;
  test.afterAll(async () => {
    if (app) {
      await killProcess(app);
    }
  });

  async function testAssetLink(page: Page) {
    await page.goto(`http://localhost:${appPort}/base/public-asset-test`);
    await page.waitForLoadState('networkidle');
    const links = await page.locator('.rspress-doc p>a').all();
    expect(links.length).toBe(3);
    for (const link of links) {
      await link.click();
      await page.waitForLoadState('networkidle');
      const url = page.url();
      if (url.includes('arrow-down.svg')) {
        expect(url).toBe(`http://localhost:${appPort}/base/arrow-down.svg`);
      } else if (url.includes('plain.txt')) {
        expect(url).toBe(`http://localhost:${appPort}/base/plain.txt`);
      } else if (url.includes('hello.html')) {
        expect(url).toBe(`http://localhost:${appPort}/base/hello.html`);
      }

      const content = await page.content();
      if (url.includes('arrow-down.svg')) {
        expect(content).toContain('<title>arrow-down</title>');
      } else if (url.includes('plain.txt')) {
        expect(content).toContain('# Rspress');
      } else if (url.includes('hello.html')) {
        expect(content).toContain(' <h1 id="hello-world">Hello world</h1>');
      }
      await page.goBack();
    }
  }

  test('should support asset link', async ({ page }) => {
    const appDir = __dirname;
    appPort = await getPort();
    await runBuildCommand(appDir);
    app = await runPreviewCommand(appDir, appPort);
    await testAssetLink(page);
  });

  test('should support asset link - cleanUrls: false', async ({ page }) => {
    const appDir = __dirname;
    appPort = await getPort();
    await runBuildCommand(appDir, 'rspress-clean.config.ts');
    app = await runPreviewCommand(appDir, appPort);
    await testAssetLink(page);
  });
});
