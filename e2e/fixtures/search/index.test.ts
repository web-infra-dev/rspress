import { expect, test } from '@playwright/test';
import { getPort, killProcess, runDevCommand } from '../../utils/runCommands';

test.describe('search keyboard', async () => {
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

  test('keyboard navigation should work', async ({ page }) => {
    await page.goto(`http://localhost:${appPort}/base/`);

    // Open search panel
    const searchButton = await page.$('.rp-search-button');
    await searchButton?.click();
    await page.waitForSelector('.rp-search-panel__input');

    // Type search query
    const searchInput = await page.$('.rp-search-panel__input');
    await searchInput?.focus();
    await page.keyboard.type('Foo');
    await page.waitForTimeout(400);

    // Wait for search results
    await page.waitForSelector('.rp-suggest-item');
    const suggestItems = await page.$$('.rp-suggest-item');
    expect(suggestItems.length).toBeGreaterThan(0);

    // Press ArrowDown again - second item should be highlighted
    await page.keyboard.press('ArrowDown');
    await page.waitForTimeout(100);
    let currentIndex = await page.evaluate(() => {
      const items = Array.from(document.querySelectorAll('.rp-suggest-item'));
      const current = document.querySelector(
        '.rp-suggest-item.rp-suggest-item--current',
      );
      return items.indexOf(current as Element);
    });
    expect(currentIndex).toBe(1);

    // Press ArrowUp - first item should be highlighted again
    await page.keyboard.press('ArrowUp');
    await page.waitForTimeout(100);
    currentIndex = await page.evaluate(() => {
      const items = Array.from(document.querySelectorAll('.rp-suggest-item'));
      const current = document.querySelector(
        '.rp-suggest-item.rp-suggest-item--current',
      );
      return items.indexOf(current as Element);
    });
    expect(currentIndex).toBe(0);

    // Test Enter key navigation
    const currentLink = await page.evaluate(() => {
      const current = document.querySelector(
        '.rp-suggest-item.rp-suggest-item--current',
      );
      return current?.querySelector('a')?.getAttribute('href');
    });

    await page.keyboard.press('Enter');
    await page.waitForTimeout(500);

    // Verify navigation occurred
    const currentUrl = page.url();
    expect(currentUrl).toContain(currentLink || '');

    // Verify search panel is closed
    const searchPanel = await page.$('.rp-search-panel__mask');
    expect(searchPanel).toBeNull();
  });

  test('ESC key should close search panel', async ({ page }) => {
    await page.goto(`http://localhost:${appPort}/base/`);

    // Open search panel
    const searchButton = await page.$('.rp-search-button');
    await searchButton?.click();
    await page.waitForSelector('.rp-search-panel__input');

    // Type search query
    const searchInput = await page.$('.rp-search-panel__input');
    await searchInput?.focus();
    await page.keyboard.type('Foo');
    await page.waitForTimeout(400);

    // Verify search panel is open
    let searchPanel = await page.$('.rp-search-panel__mask');
    expect(searchPanel).not.toBeNull();

    // Press ESC
    await page.keyboard.press('Escape');
    await page.waitForTimeout(200);

    // Verify search panel is closed
    searchPanel = await page.$('.rp-search-panel__mask');
    expect(searchPanel).toBeNull();
  });

  test('keyboard shortcut (Cmd+K / Ctrl+K) should toggle search panel', async ({
    page,
  }) => {
    await page.goto(`http://localhost:${appPort}/base/`);

    // Verify search panel is closed initially
    let searchPanel = await page.$('.rp-search-panel__mask');
    expect(searchPanel).toBeNull();

    // Press Cmd+K (or Ctrl+K on non-Mac)
    const isMac = process.platform === 'darwin';
    if (isMac) {
      await page.keyboard.press('Meta+KeyK');
    } else {
      await page.keyboard.press('Control+KeyK');
    }
    await page.waitForTimeout(200);

    // Verify search panel is open
    searchPanel = await page.$('.rp-search-panel__mask');
    expect(searchPanel).not.toBeNull();

    // Press Cmd+K / Ctrl+K again
    if (isMac) {
      await page.keyboard.press('Meta+KeyK');
    } else {
      await page.keyboard.press('Control+KeyK');
    }
    await page.waitForTimeout(200);

    // Verify search panel is closed
    searchPanel = await page.$('.rp-search-panel__mask');
    expect(searchPanel).toBeNull();
  });
});
