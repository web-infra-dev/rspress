import path from 'node:path';
import { expect, test } from '@playwright/test';
import { getNavbarItems, getSidebarTexts } from '../../utils/getSideBar';
import { getPort, killProcess, runDevCommand } from '../../utils/runCommands';

test.describe('plugin-typedoc single entry', async () => {
  let appPort: number;
  let app: Awaited<ReturnType<typeof runDevCommand>>;
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

    const navItems = getNavbarItems(page);
    await expect(navItems).toHaveCount(2);

    const sidebarTexts = await getSidebarTexts(page);
    expect(sidebarTexts.length).toBe(6);
    expect(sidebarTexts.join(',')).toEqual(
      [
        '@rspress-fixture/rspress-plugin-typedoc-single',
        'Functions',
        'Function: createMiddleware()',
        'Function: mergeMiddlewares()',
        'Types',
        'Type Alias: Middleware()',
      ].join(','),
    );
  });
});

test.describe('plugin-typedoc multi entries', async () => {
  let appPort: number;
  let app: Awaited<ReturnType<typeof runDevCommand>>;
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

    const navItems = getNavbarItems(page);
    await expect(navItems).toHaveCount(2);

    const sidebarTexts = await getSidebarTexts(page);
    expect(sidebarTexts.length).toBe(10);
    expect(sidebarTexts.join(',')).toEqual(
      [
        '@rspress-fixture/rspress-plugin-typedoc-multi',
        'Functions',
        'Function: createMiddleware()',
        'Function: mergeMiddlewares()',
        'Function: getRspressUrl()',
        'Modules',
        'Module: middleware',
        'Module: raw-link',
        'Types',
        'Type Alias: Middleware()',
      ].join(','),
    );
  });

  test('Should render raw link correctly', async ({ page }) => {
    await page.goto(
      `http://localhost:${appPort}/api/functions/raw-link.getRspressUrl.html`,
      {
        waitUntil: 'networkidle',
      },
    );
    const rspressUrl = await page.$eval(
      'a[href="https://rspress.rs"]',
      el => el.textContent,
    );
    expect(rspressUrl).toBe('Rspress site');
  });
});
