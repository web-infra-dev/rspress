import { expect, test } from '@playwright/test';
import { getPort, killProcess, runDevCommand } from '../../utils/runCommands';
import { searchInPage } from '../../utils/search';

test.describe('search i18n test', async () => {
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

  test('should update search index when language changed', async ({ page }) => {
    await page.goto(`http://localhost:${appPort}`);

    const suggestItems1 = await searchInPage(page, 'Button');
    expect(await suggestItems1[0].textContent()).toContain('Button en');

    await page.keyboard.press('Escape');

    const langMenu = page
      .locator('.rp-nav__others .rp-nav-menu__item__container')
      .first();

    // Switch language to Chinese
    await langMenu.click();
    await page.getByRole('link', { name: '简体中文' }).click();
    await page.waitForLoadState();

    const suggestItems2 = await searchInPage(page, 'Button');
    expect(await suggestItems2[0].textContent()).toContain('Button 中文');
    await page.keyboard.press('Escape');

    // Switch language to English
    await langMenu.click();
    await page.getByRole('link', { name: 'English' }).click();
    await page.waitForLoadState();

    const suggestItems3 = await searchInPage(page, 'Button');
    expect(await suggestItems3[0].textContent()).toContain('Button en');
  });
});
