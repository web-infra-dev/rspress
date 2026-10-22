import { expect, test, type Locator } from '@e2e/test';
import { getNavbar } from '../../utils/getSideBar';
import { getPort, killProcess, runDevCommand } from '../../utils/runCommands';

async function expectContainedLabels(sidebar: Locator) {
  await expect
    .poll(() =>
      sidebar.evaluate(element => {
        const overflowing = Array.from(
          element.querySelectorAll<HTMLElement>('.rp-sidebar-item'),
        ).filter(item => {
          const text = item.querySelector<HTMLElement>('.rp-doc')!;
          const right = item.querySelector<HTMLElement>(
            '.rp-sidebar-item__right',
          )!;
          const row = item.getBoundingClientRect();
          const textBox = text.getBoundingClientRect();
          const rightBox = right.getBoundingClientRect();
          const range = document.createRange();
          range.selectNodeContents(text);
          return (
            textBox.right > rightBox.left + 1 ||
            rightBox.right > row.right + 1 ||
            Array.from(range.getClientRects()).some(
              line =>
                line.left < row.left - 1 || line.right > textBox.right + 1,
            )
          );
        });
        return {
          overflowing: overflowing.map(item => item.dataset.context),
          // Active-item scrolling can also move an overflow:hidden ancestor.
          scrolled: Array.from(element.querySelectorAll('*')).some(
            item => Math.abs(item.scrollLeft) > 1,
          ),
          sidebarOverflow: element.scrollWidth > element.clientWidth + 1,
          sidebarScrolled: Math.abs(element.scrollLeft) > 1,
        };
      }),
    )
    .toEqual({
      overflowing: [],
      scrolled: false,
      sidebarOverflow: false,
      sidebarScrolled: false,
    });
}

async function expectLineCount(item: Locator, wrapped: boolean) {
  const text = item.locator('.rp-sidebar-item__left > .rp-doc');
  const lines = await text.evaluate(element => {
    const range = document.createRange();
    range.selectNodeContents(element);
    return new Set(Array.from(range.getClientRects(), rect => rect.top)).size;
  });
  if (wrapped) {
    expect(lines).toBeGreaterThan(1);
  } else {
    expect(lines).toBe(1);
  }
}

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

  test('Should render nav and sidebar correctly', async ({ page }) => {
    await page.goto(`http://localhost:${appPort}/guide/index.html`, {
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
    await page.goto(`http://localhost:${appPort}/guide/index.html`, {
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

  for (const width of [1440, 500]) {
    test(`wraps labels and preserves sidebar interactions at ${width}px`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: 800 });
      await page.goto(`http://localhost:${appPort}/long-sidebar/active`, {
        waitUntil: 'networkidle',
      });

      const sidebar = page.locator('.rp-doc-layout__sidebar');
      if (width === 500) {
        await page.locator('.rp-sidebar-menu__left').click();
        await expect(sidebar).toHaveClass(/rp-doc-layout__sidebar--open/);
      }

      const item = (context: string) =>
        sidebar.locator(`[data-context="long-sidebar-${context}"]`);
      const active = item('active');
      await expect(active).toHaveClass(/rp-sidebar-item--active/);
      await expect(active).toHaveAttribute('data-depth', '3');

      // Each ancestor starts collapsed in metadata and opens for the active link.
      for (const context of ['packages', 'group', 'classes']) {
        await expect
          .poll(() =>
            item(context).evaluate(
              element =>
                element.nextElementSibling!.getBoundingClientRect().height,
            ),
          )
          .toBeGreaterThan(0);
      }

      await expectContainedLabels(sidebar);
      for (const context of ['root', 'group', 'active', 'words']) {
        await expectLineCount(item(context), true);
      }
      await expectLineCount(item('short'), false);
      await expect(item('group').locator('.rp-sidebar-item__icon')).toHaveCSS(
        'width',
        '16px',
      );
      await expect(item('group').locator('.rp-badge')).toHaveText('new');

      const group = item('group');
      const childrenHeight = () =>
        group.evaluate(
          element => element.nextElementSibling!.getBoundingClientRect().height,
        );
      await group.locator('.rp-sidebar-item__right').click();
      await expect.poll(childrenHeight).toBe(0);
      await group.locator('.rp-sidebar-item__right').click();
      await expect.poll(childrenHeight).toBeGreaterThan(0);
      await expectContainedLabels(sidebar);

      await item('short').click();
      await expect(page).toHaveURL(`http://localhost:${appPort}/long-sidebar/`);
      if (width === 500) {
        await expect(sidebar).not.toHaveClass(/rp-doc-layout__sidebar--open/);
        await page.locator('.rp-sidebar-menu__left').click();
      }
      await active.click();
      await expect(page).toHaveURL(
        `http://localhost:${appPort}/long-sidebar/active`,
      );
      if (width === 500) {
        await page.locator('.rp-sidebar-menu__left').click();
      }
      await expect(active).toHaveClass(/rp-sidebar-item--active/);
      await expectContainedLabels(sidebar);
    });
  }
});
