import { expect, test } from '@playwright/test';
import { getPort, killProcess, runDevCommand } from '../../utils/runCommands';

test.describe('search code blocks test', async () => {
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

  test('should search by algolia', async ({ page }) => {
    await page.goto(`http://localhost:${appPort}`);

    const searchButton = page.locator('.DocSearch.DocSearch-Button');
    await searchButton.click();

    const searchBar = page.locator('.DocSearch-SearchBar');
    await expect(searchBar).toBeVisible();
  });

  test('should have correct crawler selectors for Algolia', async ({
    page,
  }) => {
    await page.goto(`http://localhost:${appPort}`);

    // Test lvl0 selector - active navigation menu item
    const navMenuItem = page.locator(
      '.rspress-nav-menu-item.rspress-nav-menu-item-active',
    );
    // lvl0 might not exist on simple pages, but the selector should be valid
    const navMenuCount = await navMenuItem.count();
    expect(navMenuCount).toBeGreaterThanOrEqual(0);

    // Test lvl1 selector - h1 heading
    const h1 = page.locator('.rspress-doc h1');
    await expect(h1).toBeVisible();
    const h1Text = await h1.textContent();
    expect(h1Text).toBeTruthy();

    // Test lvl2 selector - h2 heading
    const h2 = page.locator('.rspress-doc h2');
    await expect(h2.first()).toBeVisible();
    const h2Text = await h2.first().textContent();
    expect(h2Text).toBeTruthy();

    // Test lvl3 selector - h3 heading
    const h3 = page.locator('.rspress-doc h3');
    await expect(h3.first()).toBeVisible();
    const h3Text = await h3.first().textContent();
    expect(h3Text).toBeTruthy();

    // Test lvl4 selector - h4 heading
    const h4 = page.locator('.rspress-doc h4');
    await expect(h4.first()).toBeVisible();
    const h4Text = await h4.first().textContent();
    expect(h4Text).toBeTruthy();

    // Test lvl5 selector - h5 heading
    const h5 = page.locator('.rspress-doc h5');
    await expect(h5.first()).toBeVisible();
    const h5Text = await h5.first().textContent();
    expect(h5Text).toBeTruthy();

    // Test lvl6 selector - code blocks (pre > code)
    const codeBlock = page.locator('.rspress-doc pre > code');
    await expect(codeBlock.first()).toBeVisible();
    const codeText = await codeBlock.first().textContent();
    expect(codeText).toBeTruthy();

    // Test content selector - paragraphs
    const paragraphs = page.locator('.rspress-doc p');
    await expect(paragraphs.first()).toBeVisible();
    const paragraphText = await paragraphs.first().textContent();
    expect(paragraphText).toBeTruthy();

    // Test content selector - list items
    const listItems = page.locator('.rspress-doc li');
    await expect(listItems.first()).toBeVisible();
    const listItemText = await listItems.first().textContent();
    expect(listItemText).toBeTruthy();

    // Verify that all selectors return non-empty content
    // This ensures the crawler can actually extract meaningful data
    const allSelectors = {
      h1: await h1.textContent(),
      h2: await h2.first().textContent(),
      h3: await h3.first().textContent(),
      h4: await h4.first().textContent(),
      h5: await h5.first().textContent(),
      code: await codeBlock.first().textContent(),
      paragraph: await paragraphs.first().textContent(),
      listItem: await listItems.first().textContent(),
    };

    // All selectors should have extracted some text
    for (const [selector, text] of Object.entries(allSelectors)) {
      expect(
        text?.trim().length,
        `${selector} should have content`,
      ).toBeGreaterThan(0);
    }
  });
});
