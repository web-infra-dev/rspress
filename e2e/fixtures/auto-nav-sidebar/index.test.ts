import { type ElementHandle, expect, test } from '@playwright/test';
import { getNavbar } from '../../utils/getSideBar';
import { getPort, killProcess, runDevCommand } from '../../utils/runCommands';

test.describe('Auto nav and sidebar test', async () => {
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

  test('Should render nav and sidebar correctly', async ({ page }) => {
    await page.goto(`http://localhost:${appPort}/guide/`, {
      waitUntil: 'networkidle',
    });

    const nav = getNavbar(page);
    expect(await nav.count()).toBeGreaterThan(0);

    const topLevelSidebarItems = page.locator(
      '.rp-doc-layout__sidebar .rp-sidebar-item[data-depth="0"]',
    );
    expect(await topLevelSidebarItems.count()).toBeGreaterThan(0);

    const topLevelTexts = await topLevelSidebarItems.allTextContents();
    const trimmedTopLevelTexts = topLevelTexts
      .map(text => text.trim())
      .filter((text): text is string => text.length > 0);
    expect(trimmedTopLevelTexts).toEqual(
      expect.arrayContaining(['Guide', 'Advanced']),
    );
  });

  test('Should load total API Overview correctly', async ({ page }) => {
    await page.goto(`http://localhost:${appPort}/api/index.html`, {
      waitUntil: 'networkidle',
    });

    const h2Texts = await page.$$eval(
      '.rp-overview h2.rspress-doc-outline span',
      nodes => nodes.map(node => node.textContent?.trim()).filter(Boolean),
    );
    expect(h2Texts.join(',')).toEqual(
      [
        'Config',
        'Client API',
        'Commands',
        'Single',
        'Section a',
        'Section b',
      ].join(','),
    );

    const itemTitleTexts = await page.$$eval(
      '.rp-overview .rp-overview-group__item__title > a',
      nodes => nodes.map(node => node.textContent?.trim()).filter(Boolean),
    );
    expect(itemTitleTexts.join(',')).toEqual(
      [
        'Basic config',
        'Theme config',
        'Front matter config',
        'Build config',
        'Extname config',
        'Nested',
        'Runtime API',
        'Components',
        'Commands',
        'Single',
        'Section a',
        'Section b',
      ].join(','),
    );

    const linkTexts = await page.$$eval(
      '.rp-overview .rp-overview-group__item__content__item__link',
      nodes => nodes.map(node => node.textContent?.trim()).filter(Boolean),
    );
    expect(linkTexts.join(',')).toEqual(
      [
        'root',
        'logoText',
        'nav',
        'sidebar',
        'builderConfig',
        'Default config',
        'markdown',
        'markdown.remarkPlugins',
        'Usage',
        'Example',
        'rspress dev',
        'rspress build',
      ].join(','),
    );
  });

  test('Should load subpage API Overview correctly - same name', async ({
    page,
  }) => {
    await page.goto(`http://localhost:${appPort}/api/config.html`, {
      waitUntil: 'networkidle',
    });

    const h2Texts = await page.$$eval(
      '.rp-overview h2.rspress-doc-outline span',
      nodes => nodes.map(node => node.textContent?.trim()).filter(Boolean),
    );
    expect(h2Texts.join(',')).toEqual(
      [
        'Basic config',
        'Theme config',
        'Front matter config',
        'Build config',
        'Extname config',
        'Nested',
      ].join(','),
    );

    const itemTitleTexts = await page.$$eval(
      '.rp-overview .rp-overview-group__item__title > a',
      nodes => nodes.map(node => node.textContent?.trim()).filter(Boolean),
    );
    expect(itemTitleTexts.join(',')).toEqual(
      [
        'Basic config',
        'Theme config',
        'Front matter config',
        'Build config',
        'Extname config',
        'Nested config',
      ].join(','),
    );

    const linkTexts = await page.$$eval(
      '.rp-overview .rp-overview-group__item__content__item__link',
      nodes => nodes.map(node => node.textContent?.trim()).filter(Boolean),
    );
    expect(linkTexts.join(',')).toEqual(
      [
        'root',
        'logoText',
        'nav',
        'sidebar',
        'builderConfig',
        'Default config',
        'markdown',
        'markdown.remarkPlugins',
        'Nested H2',
      ].join(','),
    );
  });

  test('Should load subpage API Overview correctly - index.md', async ({
    page,
  }) => {
    await page.goto(`http://localhost:${appPort}/api/client-api.html`, {
      waitUntil: 'networkidle',
    });

    const h2Texts = await page.$$eval(
      '.rp-overview h2.rspress-doc-outline span',
      nodes => nodes.map(node => node.textContent?.trim()).filter(Boolean),
    );
    expect(h2Texts.join(',')).toEqual(['Client API'].join(','));

    const itemTitleTexts = await page.$$eval(
      '.rp-overview .rp-overview-group__item__title > a',
      nodes => nodes.map(node => node.textContent?.trim()).filter(Boolean),
    );
    expect(itemTitleTexts.join(',')).toEqual(
      ['Runtime API', 'Components'].join(','),
    );

    const linkTexts = await page.$$eval(
      '.rp-overview .rp-overview-group__item__content__item__link',
      nodes => nodes.map(node => node.textContent?.trim()).filter(Boolean),
    );
    expect(linkTexts.join(',')).toEqual(['Usage', 'Example'].join(','));
  });

  test('Sidebar not have same name md/mdx will not navigate', async ({
    page,
  }) => {
    await page.goto(`http://localhost:${appPort}/guide/`, {
      waitUntil: 'networkidle',
    });
    await page.click('.rp-doc-layout__sidebar .rp-sidebar-group');
    expect(page.url()).toBe(`http://localhost:${appPort}/guide/`);
  });

  test('Should load nested subpage API Overview correctly', async ({
    page,
  }) => {
    await page.goto(`http://localhost:${appPort}/api/config/nested.html`, {
      waitUntil: 'networkidle',
    });

    const h2Texts = await page.$$eval(
      '.rp-overview h2.rspress-doc-outline span',
      nodes => nodes.map(node => node.textContent?.trim()).filter(Boolean),
    );
    expect(h2Texts.join(',')).toEqual(['Nested'].join(','));

    const itemTitleTexts = await page.$$eval(
      '.rp-overview .rp-overview-group__item__title > a',
      nodes => nodes.map(node => node.textContent?.trim()).filter(Boolean),
    );
    expect(itemTitleTexts.join(',')).toEqual(['Nested config'].join(','));

    const linkTexts = await page.$$eval(
      '.rp-overview .rp-overview-group__item__content__item__link',
      nodes => nodes.map(node => node.textContent?.trim()).filter(Boolean),
    );
    expect(linkTexts.join(',')).toEqual(['Nested H2'].join(','));
  });

  test('Should generate data-context in sidebar group dom', async ({
    page,
  }) => {
    await page.goto(`http://localhost:${appPort}/api/index.html`, {
      waitUntil: 'networkidle',
    });

    function getDataContextFromElements(
      elements: ElementHandle<SVGElement | HTMLElement>[],
    ) {
      return page.evaluate(
        sidebars =>
          sidebars?.map(sidebar => sidebar.getAttribute('data-context')),
        elements,
      );
    }

    const topLevelItems = await page.$$(
      '.rp-doc-layout__sidebar .rp-sidebar-item[data-depth="0"]',
    );
    const topLevelContexts = await getDataContextFromElements(topLevelItems);
    expect(topLevelContexts.filter(Boolean)).toEqual([
      'api-overview',
      'config',
      'client-api',
      'rspack-official-docsite-custom-link',
    ]);

    const overviewItems = await page.$$('[data-context="api-overview"]');
    expect(overviewItems.length).toEqual(1);

    const depthOneItems = await page.$$(
      '.rp-doc-layout__sidebar .rp-sidebar-item[data-depth="1"]',
    );
    const depthOneContexts = await getDataContextFromElements(depthOneItems);
    expect(depthOneContexts).toEqual(
      expect.arrayContaining(['front-matter', 'config-build']),
    );

    const customLinkItems = await page.$$(
      '.rp-doc-layout__sidebar [data-context="rspack-official-docsite-custom-link"]',
    );
    const customLinkTexts = await Promise.all(
      customLinkItems.map(i => i.textContent()),
    );

    expect(
      customLinkTexts
        .map(text => text?.trim())
        .filter(Boolean)
        .join(','),
    ).toEqual(
      ['Rspack Official Docsite', 'Inner SideBar Rspack Official Docsite'].join(
        ',',
      ),
    );
  });
});
