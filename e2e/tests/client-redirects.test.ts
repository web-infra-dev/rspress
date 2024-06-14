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

  test('Should redirect correctly', async ({ page }) => {
    await page.goto(`http://localhost:${appPort}/docs/old1`, {
      waitUntil: 'networkidle',
    });
    expect(page.url()).toBe(`http://localhost:${appPort}/docs/new1`);

    await page.goto(`http://localhost:${appPort}/docs/2022`, {
      waitUntil: 'networkidle',
    });
    expect(page.url()).toBe(`http://localhost:${appPort}/docs/2024`);

    await page.goto(`http://localhost:${appPort}/docs/2023/new`, {
      waitUntil: 'networkidle',
    });
    expect(page.url()).toBe(`http://localhost:${appPort}/docs/2024/new`);

    await page.goto(`http://localhost:${appPort}/docs/old2`, {
      waitUntil: 'networkidle',
    });
    expect(page.url()).toBe(`http://localhost:${appPort}/docs/new2`);

    await page.goto(`http://localhost:${appPort}/docs/old2/foo`, {
      waitUntil: 'networkidle',
    });
    expect(page.url()).toBe(`http://localhost:${appPort}/docs/new2/foo`);

    await page.goto(`http://localhost:${appPort}/docs/old3`, {
      waitUntil: 'networkidle',
    });
    expect(page.url()).toBe(`http://localhost:${appPort}/docs/new3`);

    await page.goto(`http://localhost:${appPort}/foo/docs/old3`, {
      waitUntil: 'networkidle',
    });
    expect(page.url()).toBe(`http://localhost:${appPort}/foo/docs/new3`);

    await page.goto(`http://localhost:${appPort}/docs/old4`, {
      waitUntil: 'networkidle',
    });
    expect(page.url()).toBe('https://example.com/');
  });
});
