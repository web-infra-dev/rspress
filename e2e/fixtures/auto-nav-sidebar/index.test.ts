import { expect, test } from '../../test';
import { getNavbar } from '../../utils/getSideBar';
import { getPort, killProcess, runDevCommand } from '../../utils/runCommands';

test.describe('Auto nav and sidebar test', async () => {
  let appPort: number;
  let app: Awaited<ReturnType<typeof runDevCommand>>;
  test.beforeAll(async () => {
    const appDir = import.meta.dirname;
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

  test('Should render sidebar icons and tags correctly', async ({ page }) => {
    await page.goto(`http://localhost:${appPort}/sidebar-icon/`, {
      waitUntil: 'networkidle',
    });

    const sidebar = page.locator('.rp-doc-layout__sidebar');
    const overviewItem = sidebar.locator(
      '.rp-sidebar-item[data-context="sidebar-icon-overview"]',
    );
    const overviewIcon = overviewItem.locator('.rp-sidebar-item__icon');
    const overviewTag = overviewItem.locator(
      '.rp-sidebar-item__right .rp-badge',
    );

    await expect(overviewIcon.locator('svg')).toHaveCount(1);
    await expect(overviewIcon).toHaveCSS('width', '16px');
    await expect(overviewIcon).toHaveCSS('height', '16px');
    await expect(overviewTag).toHaveText('new');
    await expect(
      overviewItem.evaluate(item => {
        const iconElement = item.querySelector('.rp-sidebar-item__icon');
        const textElement = item.querySelector(
          '.rp-sidebar-item__left > .rp-doc',
        );
        return Boolean(
          iconElement &&
          textElement &&
          (iconElement.compareDocumentPosition(textElement) &
            Node.DOCUMENT_POSITION_FOLLOWING) !==
            0,
        );
      }),
    ).resolves.toBe(true);

    const relativeImage = sidebar.locator(
      '.rp-sidebar-item[data-context="sidebar-icon-quick-start"] img.rp-sidebar-item__icon',
    );
    await expect(relativeImage).toHaveAttribute(
      'src',
      '/sidebar-icon/sidebar-rocket.svg',
    );

    const groupImage = sidebar.locator(
      '.rp-sidebar-item[data-context="sidebar-icon-guide"] img.rp-sidebar-item__icon',
    );
    await expect(groupImage).toHaveAttribute('src', '/sidebar-book.svg');
    await expect(groupImage).toHaveJSProperty('naturalWidth', 32);
    await expect(groupImage).toHaveCSS('width', '16px');
    await expect(groupImage).toHaveCSS('height', '16px');
    await expect(groupImage).toHaveCSS('object-fit', 'contain');

    const sectionHeaderImage = sidebar
      .locator('.rp-sidebar-section-header')
      .filter({ hasText: /^Resources$/ })
      .locator('.rp-sidebar-section-header__icon > img');
    await expect(sectionHeaderImage).toHaveAttribute(
      'src',
      '/sidebar-resources.svg',
    );
    await expect(sectionHeaderImage).toHaveJSProperty('naturalWidth', 32);
    await expect(sectionHeaderImage).toHaveCSS('width', '16px');
    await expect(sectionHeaderImage).toHaveCSS('height', '16px');

    const navbar = page.locator('.rp-nav-menu');
    const guideNavIcon = navbar
      .locator('.rp-nav-menu__item')
      .filter({ hasText: 'Guide' })
      .locator('.rp-nav-menu__item__leading-icon');
    await expect(guideNavIcon.locator('svg')).toHaveCount(1);

    const sidebarIconNavItem = navbar
      .locator('.rp-nav-menu__item')
      .filter({ hasText: /^Sidebar Icon$/ });
    const navbarImage = sidebarIconNavItem.locator(
      'img.rp-nav-menu__item__leading-icon',
    );
    await expect(navbarImage).toHaveAttribute('src', '/sidebar-panel.svg');
    await expect(navbarImage).toHaveCSS('width', '16px');
    await expect(navbarImage).toHaveCSS('height', '16px');

    await page.setViewportSize({ width: 500, height: 800 });
    await page.locator('.rp-nav-hamburger.rp-nav-hamburger__sm').click();
    const navScreen = page.locator('.rp-nav-screen');
    await expect(navScreen).toHaveClass(/rp-nav-screen--open/);
    const mobileNavbarImage = navScreen
      .locator('.rp-nav-screen-menu-item')
      .filter({ hasText: /^Sidebar Icon$/ })
      .locator('img.rp-nav-screen-menu-item__icon');
    await expect(mobileNavbarImage).toHaveAttribute(
      'src',
      '/sidebar-panel.svg',
    );
  });

  test('Should load total API Overview correctly', async ({ page }) => {
    await page.goto(`http://localhost:${appPort}/api/index.html`, {
      waitUntil: 'networkidle',
    });

    const h2Elements = page.locator('.rp-overview h2.rp-toc-include span');
    const h2Texts = (await h2Elements.allTextContents())
      .map(text => text.trim())
      .filter(Boolean);
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

    const itemTitles = page.locator(
      '.rp-overview .rp-overview-group__item__title > a',
    );
    const itemTitleTexts = (await itemTitles.allTextContents())
      .map(text => text.trim())
      .filter(Boolean);
    expect(itemTitleTexts.join(',')).toEqual(
      [
        'Basic config',
        'Theme config',
        'Build config',
        'Front matter config',
        'Extname config',
        'Nested',
        'Components',
        'Runtime API',
        'Commands',
        'Single',
        'Section a',
        'Section b',
      ].join(','),
    );

    const links = page.locator(
      '.rp-overview .rp-overview-group__item__content__item__link',
    );
    const linkTexts = (await links.allTextContents())
      .map(text => text.trim())
      .filter(Boolean);
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

    const h2Elements = page.locator('.rp-overview h2.rp-toc-include span');
    const h2Texts = (await h2Elements.allTextContents())
      .map(text => text.trim())
      .filter(Boolean);
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

    const itemTitles = page.locator(
      '.rp-overview .rp-overview-group__item__title > a',
    );
    const itemTitleTexts = (await itemTitles.allTextContents())
      .map(text => text.trim())
      .filter(Boolean);
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

    const links = page.locator(
      '.rp-overview .rp-overview-group__item__content__item__link',
    );
    const linkTexts = (await links.allTextContents())
      .map(text => text.trim())
      .filter(Boolean);
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

    const h2Elements = page.locator('.rp-overview h2.rp-toc-include span');
    const h2Texts = (await h2Elements.allTextContents())
      .map(text => text.trim())
      .filter(Boolean);
    expect(h2Texts.join(',')).toEqual(['Client API'].join(','));

    const itemTitles = page.locator(
      '.rp-overview .rp-overview-group__item__title > a',
    );
    const itemTitleTexts = (await itemTitles.allTextContents())
      .map(text => text.trim())
      .filter(Boolean);
    expect(itemTitleTexts.join(',')).toEqual(
      ['Components', 'Runtime API'].join(','),
    );

    const links = page.locator(
      '.rp-overview .rp-overview-group__item__content__item__link',
    );
    const linkTexts = (await links.allTextContents())
      .map(text => text.trim())
      .filter(Boolean);
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

    const h2Elements = page.locator('.rp-overview h2.rp-toc-include span');
    const h2Texts = (await h2Elements.allTextContents())
      .map(text => text.trim())
      .filter(Boolean);
    expect(h2Texts.join(',')).toEqual(['Nested'].join(','));

    const itemTitles = page.locator(
      '.rp-overview .rp-overview-group__item__title > a',
    );
    const itemTitleTexts = (await itemTitles.allTextContents())
      .map(text => text.trim())
      .filter(Boolean);
    expect(itemTitleTexts.join(',')).toEqual(['Nested config'].join(','));

    const links = page.locator(
      '.rp-overview .rp-overview-group__item__content__item__link',
    );
    const linkTexts = (await links.allTextContents())
      .map(text => text.trim())
      .filter(Boolean);
    expect(linkTexts.join(',')).toEqual(['Nested H2'].join(','));
  });

  test('Should generate data-context in sidebar group dom', async ({
    page,
  }) => {
    await page.goto(`http://localhost:${appPort}/api/index.html`, {
      waitUntil: 'networkidle',
    });

    const topLevelItems = page.locator(
      '.rp-doc-layout__sidebar .rp-sidebar-item[data-depth="0"]',
    );
    const topLevelCount = await topLevelItems.count();
    const topLevelContexts = await Promise.all(
      Array.from({ length: topLevelCount }, (_, i) =>
        topLevelItems.nth(i).getAttribute('data-context'),
      ),
    );
    expect(topLevelContexts.filter(Boolean)).toEqual([
      'api-overview',
      'config',
      'client-api',
      'rspack-official-docsite-custom-link',
    ]);

    const overviewItems = page.locator('[data-context="api-overview"]');
    await expect(overviewItems).toHaveCount(1);

    const depthOneItems = page.locator(
      '.rp-doc-layout__sidebar .rp-sidebar-item[data-depth="1"]',
    );
    const depthOneCount = await depthOneItems.count();
    const depthOneContexts = await Promise.all(
      Array.from({ length: depthOneCount }, (_, i) =>
        depthOneItems.nth(i).getAttribute('data-context'),
      ),
    );
    expect(depthOneContexts).toEqual(
      expect.arrayContaining(['front-matter', 'config-build']),
    );

    const customLinkItems = page.locator(
      '.rp-doc-layout__sidebar [data-context="rspack-official-docsite-custom-link"]',
    );
    const customLinkTexts = (await customLinkItems.allTextContents())
      .map(text => text?.trim())
      .filter(Boolean);

    expect(customLinkTexts.join(',')).toEqual(
      ['Rspack Official Docsite', 'Inner SideBar Rspack Official Docsite'].join(
        ',',
      ),
    );
  });
});
