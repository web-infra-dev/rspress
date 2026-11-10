import { expect, test } from '@e2e/test';
import {
  getPort,
  killProcess,
  runBuildCommand,
  runPreviewCommand,
} from '../../utils/runCommands';

test.describe('production build', async () => {
  let appPort;
  let app;
  test.beforeAll(async () => {
    const appDir = import.meta.dirname;
    appPort = await getPort();
    await runBuildCommand(appDir);
    app = await runPreviewCommand(appDir, appPort);
  });

  test.afterAll(async () => {
    if (app) {
      await killProcess(app);
    }
  });

  test('check whether the page can be interacted', async ({ page }) => {
    await page.goto(`http://localhost:${appPort}`, {
      waitUntil: 'networkidle',
    });
    const appearanceToggle = page.locator('.rp-switch-appearance').first();
    const getIsDark = () =>
      page.evaluate(() =>
        document.documentElement.classList.contains('rp-dark'),
      );
    const defaultIsDark = await getIsDark();
    await appearanceToggle.click();
    await expect.poll(getIsDark).toBe(!defaultIsDark);
  });

  test('statically renders alt text for Markdown and MDX images', async ({
    browser,
  }) => {
    const context = await browser.newContext({ javaScriptEnabled: false });

    try {
      const page = await context.newPage();
      await page.goto(`http://localhost:${appPort}`, {
        waitUntil: 'domcontentloaded',
      });

      const images = page.locator('.rp-doc img');
      await expect(images).toHaveCount(7);
      expect(
        await images.evaluateAll(nodes =>
          nodes.map(node => node.getAttribute('alt')),
        ),
      ).toEqual([
        'Image from relative path',
        'Image from absolute path',
        'Image from external path',
        '',
        '',
        '',
        'Image with spread props',
      ]);
    } finally {
      await context.close();
    }
  });
});
