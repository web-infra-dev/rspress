import type { Locator, Page } from '@playwright/test';
import { expect, test } from '@playwright/test';
import { getPort, killProcess, runDevCommand } from '../../utils/runCommands';

test.describe('Nav should functions well', async () => {
  let appPort: number;
  let app: Awaited<ReturnType<typeof runDevCommand>>;
  let navMenu: Locator;
  let navMenuItems: Locator;
  let onlyLinkItem: Locator;
  let itemsAndLinkItem: Locator;
  let itemsAndLinkDropdown: Locator;

  const init = async (page: Page) => {
    await page.goto(`http://localhost:${appPort}`, {
      waitUntil: 'networkidle',
    });

    await page.waitForSelector('.rp-nav-menu');

    navMenu = page.locator('.rp-nav-menu');
    navMenuItems = navMenu.locator('.rp-nav-menu__item');

    onlyLinkItem = navMenuItems.nth(0);
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

  test('sidebar should redirect and render correctly', async ({ page }) => {
    await page.goto(`http://localhost:${appPort}/items-and-link/child-1`, {
      waitUntil: 'networkidle',
    });
    const navItems = await page.locator('.rp-doc-layout__sidebar a').all();
    await navItems[1].click();
    const content = await page.innerText('.rspress-doc');
    expect(content).toContain('child-2');
  });

  test('bottom link should redirect and render correctly', async ({ page }) => {
    await page.goto(`http://localhost:${appPort}/items-and-link/child-1`, {
      waitUntil: 'networkidle',
    });
    const navItems = await page.locator('footer a').all();
    await navItems[0].click();
    await page.waitForURL('**/child-2');
    await page.waitForSelector('.rspress-doc');
    const content = await page.innerText('.rspress-doc');
    expect(content).toContain('child-2');
  });

  test('it should be able to redirect correctly', async ({ page }) => {
    await init(page);

    await onlyLinkItem.locator('a').click();
    await page.waitForURL('**/only-link/');
    expect(page.url()).toBe(gotoPage('/only-link/'));

    await page.goto(gotoPage('/'), {
      waitUntil: 'networkidle',
    });
    const navScreen = await openNavScreen(page);
    await navScreen.getByRole('link', { name: 'Item' }).click();
    await page.waitForURL('**/only-items/item');
    expect(page.url()).toBe(gotoPage('/only-items/item'));

    await page.goto(gotoPage('/'), {
      waitUntil: 'networkidle',
    });
    await itemsAndLinkItem.locator('a').click();
    expect(page.url()).toBe(gotoPage('/items-and-link/'));

    await page.goto(gotoPage('/'), {
      waitUntil: 'networkidle',
    });
    await itemsAndLinkItem.hover();
    await itemsAndLinkDropdown
      .locator('.rp-hover-group__item a')
      .first()
      .click({ force: true, timeout: 1000 });
    await page.waitForURL('**/child-1');
    expect(page.url()).toBe(gotoPage('/items-and-link/child-1'));

    await page.goto(gotoPage('/'), {
      waitUntil: 'networkidle',
    });
    await itemsAndLinkItem.hover();
    await itemsAndLinkDropdown
      .locator('.rp-hover-group__item a')
      .nth(1)
      .click({ force: true, timeout: 1000 });
    await page.waitForURL('**/child-2');
    expect(page.url()).toBe(gotoPage('/items-and-link/child-2'));
  });
});
