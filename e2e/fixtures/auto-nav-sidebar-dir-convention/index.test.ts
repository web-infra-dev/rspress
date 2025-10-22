import { expect, test } from '@playwright/test';
import { getSidebar, getSidebarTexts } from '../../utils/getSideBar';
import { getPort, killProcess, runDevCommand } from '../../utils/runCommands';

test.describe('Auto nav and sidebar dir convention', async () => {
  let appPort: number;
  let app: Awaited<ReturnType<typeof runDevCommand>>;
  test.beforeAll(async () => {
    const appDir = __dirname;
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
    expect(sidebarTexts.length).toBe(8);
    expect(sidebarTexts.join(',')).toEqual(
      [
        '/guide Page',
        'index md convention',
        'index mdx convention',
        'same name',
        'index in meta',
        'Index in meta',
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
    await page
      .locator(
        '.rp-doc-layout__sidebar .rp-sidebar-item[data-context="context-index-md-convention"]',
      )
      .click();
    await page.waitForURL('**/index-md-convention/**');
    expect(page.url()).toBe(
      `http://localhost:${appPort}/guide/index-md-convention/index.html`,
    );
  });

  test('Should generate data-context in dir convention', async ({ page }) => {
    await page.goto(`http://localhost:${appPort}/guide/`, {
      waitUntil: 'networkidle',
    });
    const itemsWithContext = await page
      .locator('.rp-doc-layout__sidebar .rp-sidebar-item[data-context]')
      .evaluateAll(sidebarNodes =>
        sidebarNodes
          .map(node => node.getAttribute('data-context'))
          .filter((context): context is string => Boolean(context)),
      );
    expect(itemsWithContext).toEqual([
      'context-index-md-convention',
      'context-index-mdx-convention',
      'context-same-name',
      'context-index-in-meta',
      'context-no-meta-md',
      'context-no-meta-mdx',
    ]);

    const nestedContexts = await page
      .locator(
        '.rp-doc-layout__sidebar .rp-sidebar-item[data-depth="1"][data-context]',
      )
      .evaluateAll(sidebarNodes =>
        sidebarNodes
          .map(node => node.getAttribute('data-context'))
          .filter((context): context is string => Boolean(context)),
      );
    expect(nestedContexts).toEqual(['context-index-in-meta']);
  });

  test('/api/config/index.html /api/config/index /api/config should be the same page', async ({
    page,
  }) => {
    async function getSidebarLength(): Promise<number> {
      return getSidebar(page).count();
    }

    async function isMenuItemActive(): Promise<boolean> {
      const activeMenuItem = page.locator(
        '.rp-doc-layout__sidebar .rp-sidebar-item--active .rp-sidebar-item__left span',
      );
      const content = await activeMenuItem.textContent();
      return content?.trim() === 'index md convention';
    }
    // /api/config/index.html
    await page.goto(
      `http://localhost:${appPort}/guide/index-md-convention/index.html`,
      {
        waitUntil: 'networkidle',
      },
    );
    expect(await getSidebarLength()).toBe(8);
    expect(await isMenuItemActive()).toBe(true);

    // /api/config/index
    await page.goto(
      `http://localhost:${appPort}/guide/index-md-convention/index`,
      {
        waitUntil: 'networkidle',
      },
    );
    expect(await getSidebarLength()).toBe(8);
    expect(await isMenuItemActive()).toBe(true);

    // /api/config
    await page.goto(`http://localhost:${appPort}/guide/index-md-convention`, {
      waitUntil: 'networkidle',
    });
    expect(await getSidebarLength()).toBe(8);
    expect(await isMenuItemActive()).toBe(true);
  });
});
