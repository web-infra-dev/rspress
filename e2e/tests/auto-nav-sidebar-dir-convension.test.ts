import { expect, test } from '@playwright/test';
import path from 'node:path';
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

    // take the sidebar, properly a section or a tag
    const sidebar =
      (await page.$$(
        `.rspress-sidebar .rspress-scrollbar > nav > section,
      .rspress-sidebar .rspress-scrollbar > nav > a`,
      )) ?? [];
    expect(sidebar.length).toBe(7);
    const sidebarTexts = await Promise.all(
      sidebar.map(element => element.textContent()),
    );
    expect(sidebarTexts.join(',')).toEqual(
      [
        '/guide Page',
        'index md convention',
        'index mdx convention',
        'same name',
        'index in metaIndex In Meta',
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
    expect(contexts3.join(',')).toEqual(['context-index-in-meta'].join(','));
  });
});
