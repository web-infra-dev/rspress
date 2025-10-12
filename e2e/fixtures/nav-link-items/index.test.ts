import type { Locator, Page } from '@playwright/test';
import { expect, test } from '@playwright/test';
import { getPort, killProcess, runDevCommand } from '../../utils/runCommands';

test.describe('Nav should functions well', async () => {
  let appPort: number;
  let app: Awaited<ReturnType<typeof runDevCommand>>;
  let navMenu: Locator;
  let navMenuItems: Locator;
  let onlyLinkItem: Locator;
  let onlyItemsItem: Locator;
  let itemsAndLinkItem: Locator;
  let itemsAndLinkDropdown: Locator;

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
  };

  const getNavScreen = (page: Page) => page.locator('.rp-nav-screen');

  const openNavScreen = async (page: Page) => {
    const navScreen = getNavScreen(page);
    await page.waitForSelector('.rp-nav-screen');
    await page.locator('.rp-nav-hamburger').first().click();
    await expect(navScreen).toHaveClass(/rp-nav-screen--open/);
    return navScreen;
  };

  const gotoPage = (suffix: string) => `http://localhost:${appPort}${suffix}`;

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
    await expect(onlyItemsItem.locator('.rp-hover-group')).toHaveCount(0);
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

    await expect(navMenuItems).toHaveCount(3);
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
      await itemsAndLinkItem.locator('a.rp-nav-menu__item__container').count(),
    ).toBe(1);
  });

  test('it should be able to redirect correctly', async ({ page }) => {
    await init(page);

    await onlyLinkItem.locator('a').click();
    expect(page.url()).toBe(gotoPage('/only-link/index.html'));

    await page.goto(gotoPage('/'), { waitUntil: 'networkidle' });
    const navScreen = await openNavScreen(page);
    await navScreen.getByRole('link', { name: 'Item' }).click();
    await page.waitForURL('**/only-items/item.html');
    expect(page.url()).toBe(gotoPage('/only-items/item.html'));

    await page.goto(gotoPage('/'), { waitUntil: 'networkidle' });
    await itemsAndLinkItem.locator('a').click();
    expect(page.url()).toBe(gotoPage('/items-and-link/index.html'));

    await page.goto(gotoPage('/'), {
      waitUntil: 'networkidle',
    });
    await itemsAndLinkItem.hover();
    await itemsAndLinkDropdown
      .locator('.rp-hover-group__item a')
      .first()
      .click({ force: true, timeout: 1000 });
    expect(page.url()).toBe(gotoPage('/items-and-link/child-1.html'));

    await page.goto(gotoPage('/'), {
      waitUntil: 'networkidle',
    });
    await itemsAndLinkItem.hover();
    await itemsAndLinkDropdown
      .locator('.rp-hover-group__item a')
      .nth(1)
      .click({ force: true, timeout: 1000 });
    expect(page.url()).toBe(gotoPage('/items-and-link/child-2.html'));
  });

  test('it should render correct text', async ({ page }) => {
    await init(page);

    const onlyLinkText = await onlyLinkItem.textContent();
    const onlyItemsButtonText = await onlyItemsItem.textContent();
    const navScreen = await openNavScreen(page);
    const onlyItemsNavText = await navScreen
      .getByRole('link', { name: 'Item' })
      .textContent();
    await navScreen.click();
    await expect(navScreen).not.toHaveClass(/rp-nav-screen--open/);

    const itemsAndLinkButtonText = await itemsAndLinkItem.textContent();
    await itemsAndLinkItem.hover();
    const itemsAndLinkChildrenText1 = await itemsAndLinkDropdown
      .locator('.rp-hover-group__item a')
      .first()
      .textContent();
    const itemsAndLinkChildrenText2 = await itemsAndLinkDropdown
      .locator('.rp-hover-group__item a')
      .nth(1)
      .textContent();

    expect(onlyLinkText?.trim()).toBe('OnlyLink');
    expect(onlyItemsButtonText?.includes('OnlyItems')).toBe(true);
    expect(onlyItemsNavText?.trim()).toBe('Item');
    expect(itemsAndLinkButtonText?.includes('ItemsAndLink')).toBe(true);
    expect(itemsAndLinkChildrenText1?.trim()).toBe('Child1');
    expect(itemsAndLinkChildrenText2?.trim()).toBe('Child2');
  });
});
