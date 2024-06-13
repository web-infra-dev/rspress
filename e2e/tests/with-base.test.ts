import { expect, test } from '@playwright/test';
import path from 'node:path';
import { getPort, killProcess, runDevCommand } from '../utils/runCommands';

const fixtureDir = path.resolve(__dirname, '../fixtures');

test.describe('plugin test', async () => {
  let appPort;
  let app;
  test.beforeAll(async () => {
    const appDir = path.join(fixtureDir, 'with-base');
    appPort = await getPort();
    app = await runDevCommand(appDir, appPort);
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
    const sidebar = await page.$$(
      '.rspress-sidebar .rspress-scrollbar > nav > section',
    );
    expect(sidebar?.length).toBe(1);
    // get the section
  });

  test('Should goto correct link', async ({ page }) => {
    await page.goto(`http://localhost:${appPort}/base/en/guide/quick-start`, {
      waitUntil: 'networkidle',
    });
    const a = await page.$('.rspress-doc a:not(.header-anchor)');
    // extract the href of a tag
    const href = await page.evaluate(a => a?.getAttribute('href'), a);
    expect(href).toBe('/base/en/guide/install.html');
  });
});
