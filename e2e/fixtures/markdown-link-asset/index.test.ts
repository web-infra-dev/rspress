import { expect, type Page, test } from '@e2e/test';
import {
  getPort,
  killProcess,
  runBuildCommand,
  runPreviewCommand,
} from '../../utils/runCommands';

test.describe('Markdown asset links', async () => {
  let appPort: number;
  let app: Awaited<ReturnType<typeof runPreviewCommand>> | null;
  test.afterEach(async () => {
    if (app) {
      await killProcess(app);
      app = null;
    }
  });

  async function testAssetLink(
    page: Page,
    isI18n: boolean,
    cleanUrls: boolean,
  ) {
    if (isI18n) {
      await page.goto(`http://localhost:${appPort}/base/zh/public-asset-test`, {
        waitUntil: 'networkidle',
      });
    } else {
      await page.goto(`http://localhost:${appPort}/base/public-asset-test`, {
        waitUntil: 'networkidle',
      });
    }

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
        count++;
      }
      await page.goBack();
    }
    expect(count).toBe(4);
  }

  test('preserves asset URLs and serialized markup for English HTML routes', async ({
    page,
  }) => {
    const appDir = import.meta.dirname;
    appPort = await getPort();
    await runBuildCommand(appDir);
    app = await runPreviewCommand(appDir, appPort);
    await testAssetLink(page, false, false);
  });

  test('preserves asset URLs and serialized markup for Chinese HTML routes', async ({
    page,
  }) => {
    const appDir = import.meta.dirname;
    appPort = await getPort();
    await runBuildCommand(appDir);
    app = await runPreviewCommand(appDir, appPort);
    await testAssetLink(page, true, false);
  });

  test('preserves asset URLs and serialized markup for English clean routes', async ({
    page,
  }) => {
    const appDir = import.meta.dirname;
    appPort = await getPort();
    await runBuildCommand(appDir, 'rspress-clean.config.ts');
    app = await runPreviewCommand(appDir, appPort);
    await testAssetLink(page, false, true);
  });

  test('preserves asset URLs and serialized markup for Chinese clean routes', async ({
    page,
  }) => {
    const appDir = import.meta.dirname;
    appPort = await getPort();
    await runBuildCommand(appDir, 'rspress-clean.config.ts');
    app = await runPreviewCommand(appDir, appPort);
    await testAssetLink(page, true, true);
  });
});
