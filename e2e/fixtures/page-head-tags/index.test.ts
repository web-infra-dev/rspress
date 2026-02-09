import { expect, test } from '@playwright/test';
import {
  getPort,
  killProcess,
  runBuildCommand,
  runPreviewCommand,
} from '../../utils/runCommands';

test.describe('page head tags', async () => {
  let appPort;
  let app;
  test.beforeAll(async () => {
    const appDir = __dirname;
    appPort = await getPort();
    await runBuildCommand(appDir);
    app = await runPreviewCommand(appDir, appPort);
  });

  test.afterAll(async () => {
    if (app) {
      await killProcess(app);
    }
  });

  test('should render <title> tag by default', async ({ page }) => {
    await page.goto(`http://localhost:${appPort}`, {
      waitUntil: 'networkidle',
    });

    expect(await page.content()).toContain('<title>Hello world</title>');

    await page.goto(`http://localhost:${appPort}/jane`, {
      waitUntil: 'networkidle',
    });
    expect(await page.content()).toContain('<title>Jane</title>');
  });

  test('should render basic Open Graph meta tags by default', async ({
    page,
  }) => {
    await page.goto(`http://localhost:${appPort}`, {
      waitUntil: 'networkidle',
    });

    const htmlContent = await page.content();
    expect(htmlContent).toContain(
      '<meta property="og:type" content="website">',
    );
    expect(htmlContent).toContain(
      '<meta property="og:title" content="Hello world">',
    );
    expect(htmlContent).toContain(
      '<meta property="og:description" content="World Hello">',
    );

    await page.goto(`http://localhost:${appPort}/jane`, {
      waitUntil: 'networkidle',
    });
    expect(await page.content()).toContain(
      '<meta property="og:title" content="Jane">',
    );
  });
});
