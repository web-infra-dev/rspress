import { expect, test } from '@playwright/test';
import path from 'node:path';
import { getPort, killProcess, runDevCommand } from '../utils/runCommands';

import type { Locator, Page } from '@playwright/test';

const fixtureDir = path.resolve(__dirname, '../fixtures');

test.describe('Nav should functions well', async () => {
  let appPort: number;
  let app: unknown;
  let navMenu: Locator;
  let navMenuItems: Locator[];
  let onlyItemsButton: Locator;
  let onlyItemsContainer: Locator;
  let onlyItemsChildren: Locator[];
  let itemsAndLinkButton: Locator;
  let itemsAndLinkChildren: Locator[];
  let itemsAndLinkContainer: Locator;

  const init = async (page: Page) => {
    await page.goto(`http://localhost:${appPort}`, {
      waitUntil: 'networkidle',
    });

    // ElementHandler is currently discouraged by official
    // use Locator instead
    // Please refer to https://playwright.dev/docs/api/class-elementhandle
    navMenu = page.locator('.rspress-nav-menu');
    navMenuItems = await page.locator('.rspress-nav-menu > *').all();

    onlyItemsButton = navMenuItems[1].locator('.rspress-nav-menu-group-button');
    onlyItemsChildren = await navMenuItems[1]
      .locator('.rspress-nav-menu-group-content a')
      .all();
    onlyItemsContainer = navMenuItems[1].locator(
      '.rspress-nav-menu-group-content',
    );

    itemsAndLinkButton = navMenuItems[2].locator(
      '.rspress-nav-menu-group-button',
    );
    itemsAndLinkChildren = await navMenuItems[2]
      .locator('.rspress-nav-menu-group-content a')
      .all();
    itemsAndLinkContainer = navMenuItems[2].locator(
      '.rspress-nav-menu-group-content',
    );
  };

  const gotoPage = (suffix: string) => `http://localhost:${appPort}${suffix}`;

  test.beforeAll(async () => {
    const appDir = path.join(fixtureDir, 'nav-link-items');
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

    expect(await navMenu.isVisible()).toBe(true);
    expect(await navMenuItems[0].isVisible()).toBe(true);
    expect(await onlyItemsButton.isVisible()).toBe(true);
    expect(await onlyItemsContainer.isVisible()).toBe(false);
    expect(await itemsAndLinkButton.isVisible()).toBe(true);
    expect(await itemsAndLinkContainer.isVisible()).toBe(false);
  });

  test('items should be visible when button is hovered', async ({ page }) => {
    await init(page);

    expect(await onlyItemsContainer.isVisible()).toBe(false);
    await onlyItemsButton.hover();
    expect(await onlyItemsContainer.isVisible()).toBe(true);

    expect(await itemsAndLinkContainer.isVisible()).toBe(false);
    await itemsAndLinkButton.hover();
    expect(await itemsAndLinkContainer.isVisible()).toBe(true);
  });

  test('it should render correct number of nav', async ({ page }) => {
    await init(page);

    expect(navMenuItems.length).toBe(3);
  });

  test('it should render correct type of nav', async ({ page }) => {
    await init(page);

    const onlyLinkElTag = await navMenuItems[0].evaluate(e => e.tagName);
    const onlyItemsElTag = await navMenuItems[1].evaluate(e => e.tagName);
    const itemsAndLinkElTag = await navMenuItems[2].evaluate(e => e.tagName);

    expect(onlyLinkElTag).toBe('A');
    expect(onlyItemsElTag).toBe('DIV');
    expect(itemsAndLinkElTag).toBe('DIV');
  });

  test('it should be able to redirect correctly', async ({ page }) => {
    await init(page);

    await navMenuItems[0].click();
    expect(page.url()).toBe(gotoPage('/only-link/index.html'));

    await onlyItemsButton.hover();
    await onlyItemsChildren[0].click({ force: true });
    expect(page.url()).toBe(gotoPage('/only-items/item.html'));

    await itemsAndLinkButton.click();
    expect(page.url()).toBe(gotoPage('/items-and-link/index.html'));

    await page.goto(gotoPage('/'), {
      waitUntil: 'networkidle',
    });
    await itemsAndLinkButton.hover();
    await itemsAndLinkChildren[0].click({ force: true, timeout: 1000 });
    expect(page.url()).toBe(gotoPage('/items-and-link/child-1.html'));

    await page.goto(gotoPage('/'), {
      waitUntil: 'networkidle',
    });
    await itemsAndLinkButton.hover();
    await itemsAndLinkChildren[1].click({ force: true, timeout: 1000 });
    expect(page.url()).toBe(gotoPage('/items-and-link/child-2.html'));
  });

  test('it should render correct text', async ({ page }) => {
    await init(page);

    const onlyLinkText = await navMenuItems[0].textContent();
    const onlyItemsButtonText = await onlyItemsButton.textContent();
    const onlyItemsChildrenText = await onlyItemsChildren[0].textContent();

    const itemsAndLinkButtonText = await itemsAndLinkButton.textContent();
    const itemsAndLinkChildrenText1 =
      await itemsAndLinkChildren[0].textContent();
    const itemsAndLinkChildrenText2 =
      await itemsAndLinkChildren[1].textContent();

    expect(onlyLinkText).toBe('OnlyLink');
    expect(onlyItemsButtonText).toBe('OnlyItems');
    expect(onlyItemsChildrenText).toBe('Item');
    expect(itemsAndLinkButtonText).toBe('ItemsAndLink');
    expect(itemsAndLinkChildrenText1).toBe('Child1');
    expect(itemsAndLinkChildrenText2).toBe('Child2');
  });
});
