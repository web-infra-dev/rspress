import path from 'node:path';
import { expect, test } from '@playwright/test';
import { getNavbarItems, getSidebarTexts } from '../../utils/getSideBar';
import { getPort, killProcess, runDevCommand } from '../../utils/runCommands';

test.describe('plugin-typedoc single entry', async () => {
  let appPort;
  let app;
  test.beforeAll(async () => {
    const appDir = path.join(__dirname, 'single');
    appPort = await getPort();
    app = await runDevCommand(appDir, appPort);
  });

  test.afterAll(async () => {
    if (app) {
      await killProcess(app);
    }
  });
  test('Should render nav and sidebar correctly', async ({ page }) => {
    await page.goto(`http://localhost:${appPort}/api/`, {
      waitUntil: 'networkidle',
    });

    const navItems = await getNavbarItems(page);
    expect(navItems?.length).toBe(2);

    const sidebarTexts = await getSidebarTexts(page);
    expect(sidebarTexts?.length).toBe(3);
    expect(sidebarTexts.join(',')).toEqual(
      [
        '@rspress-fixture/rspress-plugin-typedoc-single',
        'FunctionsFunction: createMiddlewareFunction: mergeMiddlewares',
        'TypesType alias: Middleware',
      ].join(','),
    );
  });
});

test.describe('plugin-typedoc multi entries', async () => {
  let appPort;
  let app;
  test.beforeAll(async () => {
    const appDir = path.join(__dirname, 'multi');
    appPort = await getPort();
    app = await runDevCommand(appDir, appPort);
  });

  test.afterAll(async () => {
    if (app) {
      await killProcess(app);
    }
  });
  test('Should render nav and sidebar correctly', async ({ page }) => {
    await page.goto(`http://localhost:${appPort}/api/`, {
      waitUntil: 'networkidle',
    });

    const navItems = await getNavbarItems(page);
    expect(navItems?.length).toBe(2);

    const sidebarTexts = await getSidebarTexts(page);
    expect(sidebarTexts?.length).toBe(4);
    expect(sidebarTexts.join(',')).toEqual(
      [
        '@rspress-fixture/rspress-plugin-typedoc-multi',
        'FunctionsFunction: createMiddlewareFunction: mergeMiddlewares',
        'ModulesModule: middleware',
        'TypesType alias: Middleware',
      ].join(','),
    );
  });
});
