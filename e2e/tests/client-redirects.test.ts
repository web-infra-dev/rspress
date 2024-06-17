import { expect, test } from '@playwright/test';
import path from 'node:path';
import { getPort, killProcess, runDevCommand } from '../utils/runCommands';

const fixtureDir = path.resolve(__dirname, '../fixtures');

test.describe('client redirects test', async () => {
  let appPort;
  let app;
  test.beforeAll(async () => {
    const appDir = path.join(fixtureDir, 'client-redirects');
    appPort = await getPort();
    app = await runDevCommand(appDir, appPort);
  });

  test.afterAll(async () => {
    if (app) {
      await killProcess(app);
    }
  });

  test('Should redirect correctly - normal', async ({ page }) => {
    await page.goto(`http://localhost:${appPort}/docs/old1`, {
      waitUntil: 'networkidle',
    });
    expect(page.url()).toBe(`http://localhost:${appPort}/docs/new1`);
  });

  test('Should redirect correctly - array', async ({ page }) => {
    await page.goto(`http://localhost:${appPort}/docs/2022`, {
      waitUntil: 'networkidle',
    });
    expect(page.url()).toBe(`http://localhost:${appPort}/docs/2024`);

    await page.goto(`http://localhost:${appPort}/docs/2023/new`, {
      waitUntil: 'networkidle',
    });
    expect(page.url()).toBe(`http://localhost:${appPort}/docs/2024/new`);
  });

  test('Should redirect correctly - reg1', async ({ page }) => {
    await page.goto(`http://localhost:${appPort}/docs/old2`, {
      waitUntil: 'networkidle',
    });
    expect(page.url()).toBe(`http://localhost:${appPort}/docs/new2`);

    await page.goto(`http://localhost:${appPort}/docs/old2/foo`, {
      waitUntil: 'networkidle',
    });
    expect(page.url()).toBe(`http://localhost:${appPort}/docs/new2/foo`);
  });

  test('Should redirect correctly - reg2', async ({ page }) => {
    await page.goto(`http://localhost:${appPort}/docs/old3`, {
      waitUntil: 'networkidle',
    });
    expect(page.url()).toBe(`http://localhost:${appPort}/docs/new3`);

    await page.goto(`http://localhost:${appPort}/foo/docs/old3`, {
      waitUntil: 'networkidle',
    });
    expect(page.url()).toBe(`http://localhost:${appPort}/foo/docs/new3`);
  });

  test('Should redirect correctly - external', async ({ page }) => {
    const externalUrl = 'https://example.com/';

    await page.route(externalUrl, route => {
      route.fulfill({
        status: 200,
        contentType: 'text/html',
        body: `<html><body>Mocked response for ${externalUrl}</body></html>`,
      });
    });

    await page.goto(`http://localhost:${appPort}/docs/old4`, {
      waitUntil: 'networkidle',
    });

    expect(page.url()).toBe(externalUrl);
  });
});
