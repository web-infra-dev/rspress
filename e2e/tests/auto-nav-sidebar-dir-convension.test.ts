import path from 'node:path';
import { expect, test } from '@playwright/test';
import { getSidebar, getSidebarTexts } from '../utils/getSideBar';
import { getPort, killProcess, runDevCommand } from '../utils/runCommands';

const fixtureDir = path.resolve(__dirname, '../fixtures');

test.describe('Auto nav and sidebar dir convention', async () => {
  let appPort;
  let app;
  test.beforeAll(async () => {
    const appDir = path.join(fixtureDir, 'auto-nav-sidebar-dir-convention');
    appPort = await getPort();
    app = await runDevCommand(appDir, appPort);
  });

  test.afterAll(async () => {
    if (app) {
      await killProcess(app);
    }
  });

  test('Should render sidebar with index convention correctly', async ({
    page,
  }) => {
    await page.goto(`http://localhost:${appPort}/guide/`, {
      waitUntil: 'networkidle',
    });

    const sidebarTexts = await getSidebarTexts(page);
    expect(sidebarTexts.length).toBe(7);
    expect(sidebarTexts.join(',')).toEqual(
      [
        '/guide Page',
        'index md convention',
        'index mdx convention',
        'same name',
        'index in metaIndex in meta',
        'no meta md',
        'no meta mdx',
      ].join(','),
    );
  });

  test('Should click the directory and navigate to the index page', async ({
    page,
  }) => {
    await page.goto(`http://localhost:${appPort}/guide/`, {
      waitUntil: 'networkidle',
    });
    await page.click('.rspress-scrollbar nav section div');
    expect(page.url()).toBe(
      `http://localhost:${appPort}/guide/index-md-convention.html`,
    );
  });

  test('Should generate data-context in dir convention', async ({ page }) => {
    await page.goto(`http://localhost:${appPort}/guide/`, {
      waitUntil: 'networkidle',
    });

    const sidebarGroupSections = await page.$$('.rspress-sidebar-section');

    // first level
    const contexts1 = await page.evaluate(
      sidebars =>
        sidebars?.map(sidebar => sidebar.getAttribute('data-context')),
      sidebarGroupSections,
    );
    expect(contexts1.join(',')).toEqual(
      [
        'context-index-md-convention',
        'context-index-mdx-convention',
        'context-same-name',
        '',
        'context-no-meta-md',
        'context-no-meta-mdx',
      ].join(','),
    );

    const sidebarGroupCollapses = await page.$$('.rspress-sidebar-collapse');
    const contexts2 = await page.evaluate(
      sidebars =>
        sidebars?.map(sidebar => sidebar.getAttribute('data-context')),
      sidebarGroupCollapses,
    );
    expect(contexts2.join(',')).toEqual(
      [
        'context-index-md-convention',
        'context-index-mdx-convention',
        'context-same-name',
        '',
        'context-no-meta-md',
        'context-no-meta-mdx',
      ].join(','),
    );

    const sidebarGroupItems = await page.$$('.rspress-sidebar-item');
    const contexts3 = await page.evaluate(
      sidebarGroupConfig =>
        sidebarGroupConfig?.map(sidebarItem =>
          sidebarItem.getAttribute('data-context'),
        ),
      sidebarGroupItems,
    );
    // added container `div.rspress-sidebar-item` to ( depth=0 & type=file )'s sidebar item
    // so have to modify this test result
    expect(contexts3.join(',')).toEqual(
      ['', 'context-index-in-meta'].join(','),
    );
  });

  test('/api/config/index.html /api/config/index /api/config should be the same page', async ({
    page,
  }) => {
    async function getSidebarLength(): Promise<number> {
      return ((await getSidebar(page)) ?? []).length;
    }

    async function isMenuItemActive(): Promise<boolean> {
      const activeMenuItem = await page.$(
        '.rspress-sidebar-collapse[class*="menuItemActive"]',
      );
      const content = await activeMenuItem?.textContent();
      return content === 'index md convention';
    }
    // /api/config/index.html
    await page.goto(
      `http://localhost:${appPort}/guide/index-md-convention/index.html`,
      {
        waitUntil: 'networkidle',
      },
    );
    expect(await getSidebarLength()).toBe(7);
    expect(await isMenuItemActive()).toBe(true);

    // /api/config/index
    await page.goto(
      `http://localhost:${appPort}/guide/index-md-convention/index`,
      {
        waitUntil: 'networkidle',
      },
    );
    expect(await getSidebarLength()).toBe(7);
    expect(await isMenuItemActive()).toBe(true);

    // /api/config
    await page.goto(`http://localhost:${appPort}/guide/index-md-convention`, {
      waitUntil: 'networkidle',
    });
    expect(await getSidebarLength()).toBe(7);
    expect(await isMenuItemActive()).toBe(true);
  });
});
