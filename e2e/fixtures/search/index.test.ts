import { expect, test } from '@e2e/test';
import { getPort, killProcess, runDevCommand } from '../../utils/runCommands';

test.describe('search keyboard', async () => {
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

  test('search panel should animate based on the motion preference', async ({
    page,
  }) => {
    await page.goto(`http://localhost:${appPort}/base/`, {
      waitUntil: 'networkidle',
    });

    await page.locator('.rp-search-button').click();

    const searchModal = page.locator('.rp-search-panel__modal');
    await expect(searchModal).toBeVisible();
    await expect(searchModal).toHaveCSS('animation-name', 'rp-search-panel-in');
    await expect(searchModal).toHaveCSS('animation-duration', '0.18s');
    await expect(searchModal).toHaveCSS(
      'animation-timing-function',
      'ease-out',
    );

    const keyframes = await page.evaluate(() => {
      const rules = Array.from(document.styleSheets).flatMap(styleSheet =>
        Array.from(styleSheet.cssRules),
      );
      const rule = rules.find(
        (cssRule): cssRule is CSSKeyframesRule =>
          cssRule instanceof CSSKeyframesRule &&
          cssRule.name === 'rp-search-panel-in',
      );

      return rule
        ? Array.from(rule.cssRules, keyframe => ({
            keyText: keyframe.keyText,
            opacity: keyframe.style.opacity,
            transform: keyframe.style.transform,
          }))
        : null;
    });

    expect(keyframes).toEqual([
      {
        keyText: '0%',
        opacity: '0',
        transform: 'translateY(-8px) scale(0.98)',
      },
      { keyText: '100%', opacity: '1', transform: 'none' },
    ]);

    await page.keyboard.press('Escape');
    await expect(searchModal).toBeHidden();

    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.locator('.rp-search-button').click();
    await expect(searchModal).toBeVisible();
    await expect(searchModal).toHaveCSS('animation-name', 'none');
  });

  test('keyboard navigation should work', async ({ page }) => {
    await page.goto(`http://localhost:${appPort}/base/`, {
      waitUntil: 'networkidle',
    });

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

  test('page with search: false should be excluded from the index', async ({
    page,
  }) => {
    await page.goto(`http://localhost:${appPort}/base/`, {
      waitUntil: 'networkidle',
    });

    await page.locator('.rp-search-button').click();

    // The Quux keyword only lives on the excluded page, so searching for it
    // should not return any suggestions.
    const searchInput = page.locator('.rp-search-panel__input');
    await expect(searchInput).toBeVisible();
    await searchInput.fill('Quux');

    await expect(page.locator('.rp-no-search-result')).toBeVisible();
    await expect(page.locator('.rp-suggest-item')).toHaveCount(0);
  });

  test('ESC key should close search panel', async ({ page }) => {
    await page.goto(`http://localhost:${appPort}/base/`, {
      waitUntil: 'networkidle',
    });

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
    await page.goto(`http://localhost:${appPort}/base/`, {
      waitUntil: 'networkidle',
    });

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

  test('should reset to first suggestion when search query changes', async ({
    page,
  }) => {
    await page.goto(`http://localhost:${appPort}/base/`, {
      waitUntil: 'networkidle',
    });

    // Open search panel
    const searchButton = await page.$('.rp-search-button');
    await searchButton?.click();

    // Wait for search input to be visible and focus it
    const searchInput = await page.waitForSelector('.rp-search-panel__input', {
      state: 'visible',
    });
    await searchInput.focus();

    // Type first search query
    await page.keyboard.type('Bar');

    // Wait for search results to be visible
    await page.waitForSelector('.rp-suggest-item', { state: 'visible' });
    const suggestItems = await page.$$('.rp-suggest-item');
    expect(suggestItems.length).toBeGreaterThan(0);

    // Navigate to second item
    await page.keyboard.press('ArrowDown');
    await expect
      .poll(() =>
        page.evaluate(() => {
          const items = Array.from(
            document.querySelectorAll('.rp-suggest-item'),
          );
          const current = document.querySelector(
            '.rp-suggest-item.rp-suggest-item--current',
          );
          return items.indexOf(current as Element);
        }),
      )
      .toBe(1);

    // Change search query
    await searchInput.fill('Ba');

    // Wait for new search results to be visible
    await page.waitForSelector('.rp-suggest-item', { state: 'visible' });

    // Verify that first item is now selected
    await expect
      .poll(() =>
        page.evaluate(() => {
          const items = Array.from(
            document.querySelectorAll('.rp-suggest-item'),
          );
          const current = document.querySelector(
            '.rp-suggest-item.rp-suggest-item--current',
          );
          return items.indexOf(current as Element);
        }),
      )
      .toBe(0);
  });
});
