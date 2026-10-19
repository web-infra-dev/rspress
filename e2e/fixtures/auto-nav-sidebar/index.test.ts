import { expect, test } from '@e2e/test';
import { getPort, killProcess, runDevCommand } from '../../utils/runCommands';

test.describe('auto nav and sidebar', async () => {
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

  test('preserves sidebar and navigation icon dimensions sources and DOM order', async ({
    page,
  }) => {
    await page.goto(`http://localhost:${appPort}/sidebar-icon/`, {
      waitUntil: 'networkidle',
    });

    const sidebar = page.locator('.rp-doc-layout__sidebar');
    const overviewItem = sidebar.locator(
      '.rp-sidebar-item[data-context="sidebar-icon-overview"]',
    );
    const overviewIcon = overviewItem.locator('.rp-sidebar-item__icon');

    await expect(overviewIcon.locator('svg')).toHaveCount(1);
    await expect(overviewIcon).toHaveCSS('width', '16px');
    await expect(overviewIcon).toHaveCSS('height', '16px');
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

  test('Sidebar not have same name md/mdx will not navigate', async ({
    page,
  }) => {
    await page.goto(`http://localhost:${appPort}/guide/index.html`, {
      waitUntil: 'networkidle',
    });
    await page.click('.rp-doc-layout__sidebar .rp-sidebar-group');
    expect(page.url()).toBe(`http://localhost:${appPort}/guide/`);
  });

  test('generates exact sidebar data-context values and custom-link counts', async ({
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
    await expect(customLinkItems).toHaveCount(2);
  });
});
