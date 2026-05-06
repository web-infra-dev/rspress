import fs from 'node:fs/promises';
import path from 'node:path';
import { expect, test } from '@playwright/test';
import {
  getPort,
  killProcess,
  runBuildCommand,
  runPreviewCommand,
} from '../../utils/runCommands';

test.describe('basic test', async () => {
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
});

test('SSG should add alt attributes to rendered images', async () => {
  const appDir = import.meta.dirname;
  await runBuildCommand(appDir);

  const html = await fs.readFile(path.join(appDir, 'doc_build', 'index.html'), {
    encoding: 'utf-8',
  });
  const imageTags = html.match(/<img\b[^>]*>/g) ?? [];

  expect(imageTags.length).toBeGreaterThan(0);
  expect(imageTags.every(tag => /\balt=/.test(tag))).toBe(true);
});
