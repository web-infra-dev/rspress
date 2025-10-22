import { expect, test } from '@playwright/test';
import {
  getPort,
  killProcess,
  runBuildCommand,
  runPreviewCommand,
} from '../../utils/runCommands';

test.describe('plugin test', async () => {
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

  test('Should render sidebar correctly', async ({ page }) => {
    await page.goto(`http://localhost:${appPort}/base/en/guide/quick-start`, {
      waitUntil: 'networkidle',
    });
    // take the sidebar
    const sidebar = page.locator('.rp-doc-layout__sidebar');
    await expect(sidebar).toHaveCount(1);
    // get the section
  });

  test('Should goto correct link', async ({ page }) => {
    await page.goto(`http://localhost:${appPort}/base/en/guide/quick-start`, {
      waitUntil: 'networkidle',
    });
    const a = page.locator('.rspress-doc a:not(.rp-header-anchor)');
    // extract the href of a tag
    const href = await a.getAttribute('href');
    expect(href).toBe('/base/en/guide/install.html');
  });

  test('Should render the homepage - "/base"', async ({ page }) => {
    await page.goto(`http://localhost:${appPort}/base`, {
      waitUntil: 'networkidle',
    });
    const docContent = page.locator('.rspress-doc');
    await expect(docContent).toContainText('This is the index page');
  });

  test('Should render the homepage - "/base/"', async ({ page }) => {
    await page.goto(`http://localhost:${appPort}/base/`, {
      waitUntil: 'networkidle',
    });
    const docContent = page.locator('.rspress-doc');
    await expect(docContent).toContainText('This is the index page');
  });
});
