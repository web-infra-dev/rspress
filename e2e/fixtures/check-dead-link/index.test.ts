import { expect, test } from '@playwright/test';
import {
  getPort,
  killProcess,
  runBuildCommand,
  runPreviewCommand,
} from '../../utils/runCommands';

test.describe('check dead links', async () => {
  let appPort;
  let app;
  test.afterAll(async () => {
    if (app) {
      await killProcess(app);
    }
  });

  test('should link the correct page', async ({ page }) => {
    const appDir = __dirname;
    appPort = await getPort();
    await runBuildCommand(appDir);
    app = await runPreviewCommand(appDir, appPort);

    await page.goto(
      `http://localhost:${appPort}/base/guide/basic/quick-start`,
      {
        waitUntil: 'networkidle',
      },
    );
    // Get all the <a /> element
    const linkDoms = await page.$$('.rspress-doc a');

    const links = (
      await Promise.all(linkDoms.map(linkDom => linkDom.getAttribute('href')))
    ).filter(i => !i?.startsWith('#'));
    expect(links).toEqual([
      '/base/guide/basic/install.html',
      '/base/guide/basic/install.html',
      '/base/guide/basic/install.html',
      '/base/guide/basic/install.html',
      '/base/guide/basic/install.html',
      '/base/guide/basic/install.html',
      '/base/guide/basic/install.html',
      '/base/api/index.html',
      '/base/api.html',
      '/base/api.html',
    ]);
  });

  test('should link the correct page - cleanUrl', async ({ page }) => {
    const appDir = __dirname;
    appPort = await getPort();
    await runBuildCommand(appDir, 'rspress-clean.config.ts');
    app = await runPreviewCommand(appDir, appPort);

    await page.goto(
      `http://localhost:${appPort}/base/guide/basic/quick-start`,
      {
        waitUntil: 'networkidle',
      },
    );
    // Get all the <a /> element
    const linkDoms = await page.$$('.rspress-doc a');

    const links = (
      await Promise.all(linkDoms.map(linkDom => linkDom.getAttribute('href')))
    ).filter(i => !i?.startsWith('#'));
    expect(links).toEqual([
      '/base/guide/basic/install',
      '/base/guide/basic/install',
      '/base/guide/basic/install',
      '/base/guide/basic/install',
      '/base/guide/basic/install',
      '/base/guide/basic/install',
      '/base/guide/basic/install',
      '/base/api',
      '/base/api',
      '/base/api',
    ]);
  });
});
