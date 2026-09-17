import { expect, test } from '@e2e/test';
import { getPort, killProcess, runDevCommand } from '../../utils/runCommands';
import { searchInPage } from '../../utils/search';

test.describe('localized search', async () => {
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

  test('should update search index when language changed', async ({ page }) => {
    await page.goto(`http://localhost:${appPort}`, {
      waitUntil: 'networkidle',
    });

    const suggestItems1 = await searchInPage(page, 'Button');
    expect(await suggestItems1[0].textContent()).toContain('Button en');

    await page.keyboard.press('Escape');

    const langMenu = page
      .locator('.rp-nav__others .rp-nav-menu__item__container')
      .first();

    // Switch language to Chinese
    await langMenu.click();
    await page.getByRole('link', { name: '简体中文' }).click();
    await page.waitForURL(/\/zh\//);

    const suggestItems2 = await searchInPage(page, 'Button');
    expect(await suggestItems2[0].textContent()).toContain('Button 中文');
    await page.keyboard.press('Escape');

    // Switch language to English
    await langMenu.click();
    await page.getByRole('link', { name: 'English' }).click();
    await page.waitForURL(/\/index\.html/);

    const suggestItems3 = await searchInPage(page, 'Button');
    expect(await suggestItems3[0].textContent()).toContain('Button en');
  });

  test('should return search results for voiced katakana content correctly', async ({
    page,
  }) => {
    await page.goto(`http://localhost:${appPort}`, {
      waitUntil: 'networkidle',
    });

    // Switch to Japanese locale
    const langMenu = page
      .locator('.rp-nav__others .rp-nav-menu__item__container')
      .first();
    await langMenu.click();
    await page.getByRole('link', { name: '日本語' }).click();
    await page.waitForURL(/\/ja\//);

    const suggestItemsTitle = await searchInPage(page, 'ご');
    expect(suggestItemsTitle.length).toBe(1);
    expect(await suggestItemsTitle[0].textContent()).toContain('にほんご');

    const suggestItemsHeader = await searchInPage(page, 'ヘッダー');
    expect(suggestItemsHeader.length).toBe(2);
    expect(await suggestItemsHeader[0].textContent()).toContain('ヘッダー');

    const suggestItemsContent1 = await searchInPage(page, 'す');
    expect(suggestItemsContent1.length).toBe(1);
    expect(await suggestItemsContent1[0].textContent()).toContain('できます');

    const suggestItemsContent2 = await searchInPage(page, 'さ');
    expect(suggestItemsContent2.length).toBe(1);
    expect(await suggestItemsContent2[0].textContent()).toContain('さい');
  });

  test('ignores an old locale index failure after switching language', async ({
    page,
  }) => {
    let releaseIndex!: () => void;
    const pendingIndex = new Promise<void>(resolve => {
      releaseIndex = resolve;
    });
    await page.route('**/search_index.en.*.json', async route => {
      await pendingIndex;
      await route.fulfill({ status: 503, body: 'Index unavailable' });
    });
    await page.goto(`http://localhost:${appPort}`);
    await page.locator('.rp-search-button').click();
    await expect(page.locator('.rp-search-panel__search-icon')).toHaveClass(
      /--loading/,
    );
    await page.keyboard.press('Escape');
    await page
      .locator('.rp-nav__others .rp-nav-menu__item__container')
      .first()
      .click();
    await page.getByRole('link', { name: '简体中文' }).click();
    await page.waitForURL(/\/zh\//);
    await searchInPage(page, 'Button', false);
    await expect(page.locator('.rp-suggest-item').first()).toContainText(
      'Button 中文',
    );

    const failureLogged = page.waitForEvent('console', {
      predicate: message =>
        message.text().includes('Failed to fetch search index'),
    });
    releaseIndex();
    await failureLogged;
    // Let the old rejection and any resulting React updates finish.
    await page.evaluate(
      () =>
        new Promise(resolve =>
          requestAnimationFrame(() => requestAnimationFrame(resolve)),
        ),
    );
    await expect(page.locator('.rp-search-panel__error')).toHaveCount(0);
    await expect(page.locator('.rp-suggest-item').first()).toContainText(
      'Button 中文',
    );
  });

  test('public full-text search handles an index load failure', async ({
    page,
  }) => {
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.route('**/search_index.en.*.json', route =>
      route.fulfill({ status: 503, body: 'Index unavailable' }),
    );
    const failureLogged = page.waitForEvent('console', {
      predicate: message =>
        message.text().includes('Failed to initialize full-text search'),
    });
    await page.goto(`http://localhost:${appPort}/full-text-search`);
    await failureLogged;
    await expect(page.getByTestId('search-initialized')).toHaveText('false');
    expect(errors).toEqual([]);
  });
});
