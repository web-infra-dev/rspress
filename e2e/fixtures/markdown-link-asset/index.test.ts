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

  async function testAssetLink(
    page: Page,
    isI18n: boolean,
    cleanUrls: boolean,
  ) {
    if (isI18n) {
      await page.goto(`http://localhost:${appPort}/base/zh/public-asset-test`);
    } else {
      await page.goto(`http://localhost:${appPort}/base/public-asset-test`);
    }

    await page.waitForLoadState('networkidle');
    const links = await page.locator('.rspress-doc p>a').all();
    expect(links.length).toBe(6);

    const assetLinks = links.slice(0, 4);
    let count = 0;
    for (const link of assetLinks) {
      await link.click();
      await page.waitForLoadState('networkidle');
      const url = page.url();
      if (url.includes('arrow-down.svg')) {
        expect(url).toBe(`http://localhost:${appPort}/base/arrow-down.svg`);
        const content = await page.content();
        expect(content).toContain('<title>arrow-down</title>');
        count++;
      } else if (url.includes('plain.txt')) {
        expect(url).toBe(`http://localhost:${appPort}/base/plain.txt`);
        const content = await page.content();
        expect(content).toContain('Plain Text');
        count++;
      } else if (url.includes('hello')) {
        if (cleanUrls) {
          expect(url).toBe(`http://localhost:${appPort}/base/hello`);
        } else {
          expect(url).toBe(`http://localhost:${appPort}/base/hello.html`);
        }
        const content = await page.content();
        expect(content).toContain('<h1 id="hello-world">Hello world</h1>');
        count++;
      } else if (url.includes('test.md')) {
        expect(url).toBe(`http://localhost:${appPort}/base/test.md`);
        const content = await page.content();
        expect(content).toContain('# Test');
        count++;
      }
      await page.goBack();
    }
    expect(count).toBe(4);
  }

  test('should support asset link', async ({ page }) => {
    const appDir = __dirname;
    appPort = await getPort();
    await runBuildCommand(appDir);
    app = await runPreviewCommand(appDir, appPort);
    await testAssetLink(page, false, false);
  });

  test('should support asset link - i18n', async ({ page }) => {
    const appDir = __dirname;
    appPort = await getPort();
    await runBuildCommand(appDir);
    app = await runPreviewCommand(appDir, appPort);
    await testAssetLink(page, true, false);
  });

  test('should support asset link - cleanUrls: false', async ({ page }) => {
    const appDir = __dirname;
    appPort = await getPort();
    await runBuildCommand(appDir, 'rspress-clean.config.ts');
    app = await runPreviewCommand(appDir, appPort);
    await testAssetLink(page, false, true);
  });

  test('should support asset link - cleanUrls: false - i18n', async ({
    page,
  }) => {
    const appDir = __dirname;
    appPort = await getPort();
    await runBuildCommand(appDir, 'rspress-clean.config.ts');
    app = await runPreviewCommand(appDir, appPort);
    await testAssetLink(page, true, true);
  });
});
