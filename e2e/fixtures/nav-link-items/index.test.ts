import type { Locator, Page } from '@playwright/test';
import { expect, test } from '@playwright/test';
import { getPort, killProcess, runDevCommand } from '../../utils/runCommands';

interface NavSuiteConfig {
  title: string;
  configFile?: string;
  paths: {
    onlyLink: string;
    onlyItemsItem: string;
    itemsAndLink: string;
    child1: string;
    child2: string;
    level2Item1: string;
    level3Item1: string;
    level3Item2: string;
    level1Item2: string;
  };
}

const createNavSuite = ({ title, configFile, paths }: NavSuiteConfig) => {
  test.describe(title, () => {
    let appPort: number;
    let app: Awaited<ReturnType<typeof runDevCommand>>;
    let navMenu: Locator;
    let navMenuItems: Locator;
    let onlyLinkItem: Locator;
    let onlyItemsItem: Locator;
    let itemsAndLinkItem: Locator;
    let itemsAndLinkDropdown: Locator;
    let nestedItemsItem: Locator;
    let nestedItemsDropdown: Locator;

    const init = async (page: Page) => {
      await page.goto(`http://localhost:${appPort}`, {
        waitUntil: 'networkidle',
      });

      navMenu = page.locator('.rp-nav-menu');
      navMenuItems = navMenu.locator('.rp-nav-menu__item');

      onlyLinkItem = navMenuItems.nth(0);
      onlyItemsItem = navMenuItems.nth(1);
      itemsAndLinkItem = navMenuItems.nth(2);
      itemsAndLinkDropdown = itemsAndLinkItem.locator('.rp-hover-group');
      nestedItemsItem = navMenuItems.nth(3);
      nestedItemsDropdown = nestedItemsItem.locator('.rp-hover-group');
    };

    const getNavScreen = (page: Page) => page.locator('.rp-nav-screen');

    const openNavScreen = async (page: Page) => {
      await page.setViewportSize({ width: 500, height: 800 });
      const navScreen = getNavScreen(page);
      await page.locator('.rp-nav-hamburger.rp-nav-hamburger__sm').click();
      await expect(navScreen).toHaveClass(/rp-nav-screen--open/);
      await expect(navScreen).toBeVisible();
      return navScreen;
    };

    const gotoPage = (suffix: string) => `http://localhost:${appPort}${suffix}`;

    test.beforeAll(async () => {
      const appDir = __dirname;
      appPort = await getPort();
      app = await runDevCommand(appDir, appPort, configFile);
    });

    test.afterAll(async () => {
      if (app) {
        await killProcess(app);
      }
    });

    test('it should render correct visibility', async ({ page }) => {
      await init(page);

      await expect(navMenu).toBeVisible();
      await expect(
        onlyLinkItem.locator('a.rp-nav-menu__item__container'),
      ).toBeVisible();
      await expect(
        onlyItemsItem.locator('.rp-nav-menu__item__container'),
      ).toBeVisible();
      await expect(
        itemsAndLinkItem.locator('.rp-nav-menu__item__container'),
      ).toBeVisible();
      await expect(onlyItemsItem.locator('.rp-hover-group')).toHaveCount(1);
      await expect(itemsAndLinkItem.locator('.rp-hover-group')).toHaveCount(1);
      await expect(itemsAndLinkDropdown).toHaveClass(/rp-hover-group--hidden/);
    });

    test('items should be visible when button is hovered', async ({ page }) => {
      await init(page);

      await expect(itemsAndLinkDropdown).toHaveClass(/rp-hover-group--hidden/);
      await itemsAndLinkItem.hover();
      await expect(itemsAndLinkDropdown).not.toHaveClass(
        /rp-hover-group--hidden/,
      );
    });

    test('it should render correct number of nav', async ({ page }) => {
      await init(page);

      await expect(navMenuItems).toHaveCount(4);
    });

    test('it should render correct type of nav', async ({ page }) => {
      await init(page);

      const onlyLinkElTag = await onlyLinkItem.evaluate(node => node.tagName);
      const onlyItemsElTag = await onlyItemsItem.evaluate(node => node.tagName);
      const itemsAndLinkElTag = await itemsAndLinkItem.evaluate(
        node => node.tagName,
      );

      expect(onlyLinkElTag).toBe('LI');
      expect(onlyItemsElTag).toBe('LI');
      expect(itemsAndLinkElTag).toBe('LI');

      expect(
        await onlyLinkItem.locator('a.rp-nav-menu__item__container').count(),
      ).toBe(1);
      expect(
        await onlyItemsItem.locator('a.rp-nav-menu__item__container').count(),
      ).toBe(0);
      expect(
        await onlyItemsItem.locator('div.rp-nav-menu__item__container').count(),
      ).toBe(1);
      expect(
        await itemsAndLinkItem
          .locator('a.rp-nav-menu__item__container')
          .count(),
      ).toBe(1);
    });

    test('it should navigate to the correct page when a link is clicked', async ({
      page,
    }) => {
      await init(page);
      // hover OnlyItems
      await onlyItemsItem.hover();
      const onlyItemsDropdown = onlyItemsItem.locator('.rp-hover-group');
      await expect(onlyItemsDropdown).not.toHaveClass(/rp-hover-group--hidden/);
      await expect(
        onlyItemsDropdown.locator('.rp-hover-group__item'),
      ).toHaveCount(1);

      // click the first child
      await onlyItemsDropdown
        .locator('.rp-hover-group__item')
        .first()
        .locator('a')
        .click();
      expect(page.url()).toBe(gotoPage(paths.onlyItemsItem));

      // hover itemsAndLink
      await itemsAndLinkItem.hover();
      await expect(itemsAndLinkDropdown).not.toHaveClass(
        /rp-hover-group--hidden/,
      );
      await expect(
        itemsAndLinkDropdown.locator('.rp-hover-group__item'),
      ).toHaveCount(2);

      // click the first child
      await itemsAndLinkDropdown
        .locator('.rp-hover-group__item')
        .first()
        .locator('a')
        .click();
      expect(page.url()).toBe(gotoPage(paths.child1));

      // click the second child
      await itemsAndLinkItem.hover();
      await itemsAndLinkDropdown
        .locator('.rp-hover-group__item')
        .nth(1)
        .locator('a')
        .click();
      expect(page.url()).toBe(gotoPage(paths.child2));
    });

    test('it should navigate to the correct page when a link is clicked - navScreen', async ({
      page,
    }) => {
      await init(page);

      // Mobile menu: first ensure top-level links open expected pages.
      await onlyLinkItem.locator('a').click();
      expect(page.url()).toBe(gotoPage(paths.onlyLink));

      await page.goto(gotoPage('/'), { waitUntil: 'networkidle' });
      let navScreen = await openNavScreen(page);
      await navScreen
        .locator('.rp-nav-screen-menu-item')
        .filter({ hasText: 'OnlyItems' })
        .click();
      // Mobile submenu: OnlyItems -> Item.
      await navScreen
        .locator('a.rp-nav-screen-menu-item')
        .filter({ hasText: /^Item$/ })
        .click();
      expect(page.url()).toBe(gotoPage(paths.onlyItemsItem));

      await page.goto(gotoPage(paths.itemsAndLink), {
        waitUntil: 'networkidle',
      });
      navScreen = await openNavScreen(page);
      await navScreen
        .locator('.rp-nav-screen-menu-item')
        .filter({ hasText: 'ItemsAndLink' })
        .click();
      // Mobile submenu: ItemsAndLink -> Child1.
      await navScreen
        .locator('a.rp-nav-screen-menu-item')
        .filter({ hasText: 'Child1' })
        .click();
      expect(page.url()).toBe(gotoPage(paths.child1));
    });

    test('it should render nested items with correct depth attributes', async ({
      page,
    }) => {
      await init(page);

      // Hover over nested items
      await nestedItemsItem.hover();
      await expect(nestedItemsDropdown).not.toHaveClass(
        /rp-hover-group--hidden/,
      );

      // Check that nested items render with correct data-depth attributes
      const depthZeroItems = nestedItemsDropdown.locator(
        '.rp-hover-group__item[data-depth="0"]',
      );
      const depthOneItems = nestedItemsDropdown.locator(
        '.rp-hover-group__item[data-depth="1"]',
      );
      const depthTwoItems = nestedItemsDropdown.locator(
        '.rp-hover-group__item[data-depth="2"]',
      );

      // Level 0: Level1Item2
      await expect(depthZeroItems).toHaveCount(1);
      // Level 1: Level2Item1
      await expect(depthOneItems).toHaveCount(1);
      // Level 2: Level3Item1, Level3Item2
      await expect(depthTwoItems).toHaveCount(2);

      // Click nested item and verify navigation
      await depthTwoItems.first().locator('.rp-link').click();
      await page.waitForURL(gotoPage(paths.level3Item1));
      expect(page.url()).toBe(gotoPage(paths.level3Item1));
    });

    test('it should navigate to deeply nested items - navScreen', async ({
      page,
    }) => {
      await init(page);

      const navScreen = await openNavScreen(page);

      // Click on NestedItems
      await navScreen
        .locator('.rp-nav-screen-menu-item')
        .filter({ hasText: 'NestedItems' })
        .first()
        .click();

      // Click on Level1
      await navScreen
        .locator('.rp-nav-screen-menu-item')
        .filter({ hasText: 'Level1' })
        .first()
        .click();

      // Click on Level2Nested
      await navScreen
        .locator('.rp-nav-screen-menu-item')
        .filter({ hasText: 'Level2Nested' })
        .first()
        .click();

      // Click on Level3Item1
      await navScreen
        .locator('a.rp-nav-screen-menu-item')
        .filter({ hasText: 'Level3Item1' })
        .click();

      await page.waitForURL(gotoPage(paths.level3Item1));
      expect(page.url()).toBe(gotoPage(paths.level3Item1));
    });
  });
};

createNavSuite({
  title: 'Nav should functions well',
  paths: {
    onlyLink: '/only-link/index.html',
    onlyItemsItem: '/only-items/item.html',
    itemsAndLink: '/items-and-link/index.html',
    child1: '/items-and-link/child-1.html',
    child2: '/items-and-link/child-2.html',
    level2Item1: '/nested-items/level2-item1.html',
    level3Item1: '/nested-items/level3-item1.html',
    level3Item2: '/nested-items/level3-item2.html',
    level1Item2: '/nested-items/level1-item2.html',
  },
});

createNavSuite({
  title: 'Nav should functions well with clean urls',
  configFile: 'rspress-clean.config.ts',
  paths: {
    onlyLink: '/only-link/',
    onlyItemsItem: '/only-items/item',
    itemsAndLink: '/items-and-link/',
    child1: '/items-and-link/child-1',
    child2: '/items-and-link/child-2',
    level2Item1: '/nested-items/level2-item1',
    level3Item1: '/nested-items/level3-item1',
    level3Item2: '/nested-items/level3-item2',
    level1Item2: '/nested-items/level1-item2',
  },
});
