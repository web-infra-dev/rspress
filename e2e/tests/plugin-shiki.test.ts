import path from 'node:path';
import { expect, test } from '@playwright/test';
import fixture from '../fixtures/plugin-rss/fixture.json';
import {
  getPort,
  killProcess,
  runBuildCommand,
  runPreviewCommand,
} from '../utils/runCommands';

const fixtureDir = path.resolve(__dirname, '../fixtures');
test.describe('plugin shiki test', async () => {
  let appPort: number;
  let app: unknown;
  test.beforeAll(async () => {
    const appDir = path.join(fixtureDir, 'plugin-shiki');
    appPort = await getPort();
    await runBuildCommand(appDir);
    app = await runPreviewCommand(appDir, appPort);
  });

  test.afterAll(async () => {
    if (app) {
      await killProcess(app);
    }
  });

  test('should render shiki code block successfully', async ({ page }) => {
    await page.goto(`http://localhost:${appPort}`, {
      waitUntil: 'networkidle',
    });
    const shikiDoms = await page.$$('.shiki');
    expect(shikiDoms.length).toBe(4);
  });
});
