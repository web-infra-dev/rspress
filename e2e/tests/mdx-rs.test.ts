import { expect, test } from '@playwright/test';
import path from 'node:path';
import { getPort, killProcess, runDevCommand } from '../utils/runCommands';

const fixtureDir = path.resolve(__dirname, '../fixtures');

test.describe('i18n test', async () => {
  let appPort;
  let app;
  test.beforeAll(async () => {
    const appDir = path.join(fixtureDir, 'mdx-rs');
    appPort = await getPort();
    app = await runDevCommand(appDir, appPort);
  });

  test.afterAll(async () => {
    if (app) {
      await killProcess(app);
    }
  });

  test('Add language prefix in route automatically when current language is not default language', async ({
    page,
  }) => {
    await page.goto(`http://localhost:${appPort}/en/guide/quick-start`, {
      waitUntil: 'networkidle',
    });
    // take the `click` button
    let link = await page.getByRole('link', {
      name: /absolute/,
    });
    expect(link).toBeTruthy();
    // check the compile result of absolute link in doc content
    expect(await link.getAttribute('href')).toBe('/en/guide/install.html');
    link = await page.getByRole('link', {
      name: /relative/,
    });

    // check the compile result of relative link in doc content
    expect(link).toBeTruthy();
    expect(await link.getAttribute('href')).toBe('/en/guide/install.html');
  });

  test('Should not add language prefix when current language is default language', async ({
    page,
  }) => {
    await page.goto(`http://localhost:${appPort}/guide/quick-start`, {
      waitUntil: 'networkidle',
    });
    // check the compile result of absolute link in doc content
    let link = await page.getByRole('link', {
      name: /绝对路径/,
    });
    expect(link).toBeTruthy();
    expect(await link.getAttribute('href')).toBe('/guide/install.html');
    // check the compile result of relative link in doc content
    link = await page.getByRole('link', {
      name: /相对路径/,
    });
    expect(link).toBeTruthy();
    expect(await link.getAttribute('href')).toBe('/guide/install.html');
  });
});
