import { expect, test } from '@playwright/test';
import path from 'path';
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
    const appDir = path.join(fixtureDir, 'nav-link-items-without-suffix');
    appPort = await getPort();
    app = await runDevCommand(appDir, appPort);
  });

  test.afterAll(async () => {
    if (app) {
      await killProcess(app);
    }
  });

  test('sidebar should redirect and render corrently', async ({ page }) => {
    await page.goto(`http://localhost:${appPort}/items-and-link/child-1`, {
      waitUntil: 'networkidle',
    });
    const navItems = await page.locator('.rspress-sidebar nav a').all();
    await navItems[1].click();
    const content = await page.innerText('.rspress-doc');
    expect(content).toContain('child-2');
  });

  test('bottom link should redirect and render corrently', async ({ page }) => {
    await page.goto(`http://localhost:${appPort}/items-and-link/child-1`, {
      waitUntil: 'networkidle',
    });
    const navItems = await page.locator('footer a').all();
    await navItems[0].click();
    await page.waitForURL('**/child-2');
    const content = await page.innerText('.rspress-doc');
    expect(content).toContain('child-2');
  });

  test('it should be able to redirect correctly', async ({ page }) => {
    await init(page);

    await navMenuItems[0].click();
    await page.waitForURL('**/only-link/index');
    expect(page.url()).toBe(gotoPage('/only-link/index'));

    await onlyItemsButton.hover();
    await onlyItemsChildren[0].click();
    await page.waitForURL('**/item');
    expect(page.url()).toBe(gotoPage('/only-items/item'));

    await itemsAndLinkButton.click();
    expect(page.url()).toBe(gotoPage('/items-and-link/index'));

    await page.goto(gotoPage('/'), {
      waitUntil: 'networkidle',
    });
    await itemsAndLinkButton.hover();
    await itemsAndLinkChildren[0].click({ force: true, timeout: 1000 });
    await page.waitForURL('**/child-1');
    expect(page.url()).toBe(gotoPage('/items-and-link/child-1'));

    await page.goto(gotoPage('/'), {
      waitUntil: 'networkidle',
    });
    await itemsAndLinkButton.hover();
    await itemsAndLinkChildren[1].click({ force: true, timeout: 1000 });
    await page.waitForURL('**/child-2');
    expect(page.url()).toBe(gotoPage('/items-and-link/child-2'));
  });
});
