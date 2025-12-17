import { expect, test } from '@playwright/test';
import { getPort, killProcess, runDevCommand } from '../../utils/runCommands';

test.describe('i18n test', async () => {
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

  // check the language switch button
  test('Language switch button', async ({ page }) => {
    await page.goto(`http://localhost:${appPort}`, {
      waitUntil: 'networkidle',
    });

    const heading = page.locator('h1').first();
    await expect(heading).toContainText('首页');

    const languageSwitcher = page.locator(
      '.rp-nav__others .rp-nav-menu__item__container',
      {
        hasText: '简体中文',
      },
    );
    await expect(languageSwitcher).toBeVisible();
    await languageSwitcher.hover();

    const englishOption = page.locator('.rp-hover-group__item a', {
      hasText: 'English',
    });
    await expect(englishOption).toBeVisible();
    await expect(englishOption).toHaveText('English');
  });

  test('Add language prefix in route automatically when current language is not default language', async ({
    page,
  }) => {
    await page.goto(`http://localhost:${appPort}/en/guide/basic/quick-start`, {
      waitUntil: 'networkidle',
    });
    // take the `click` button
    const absoluteLink = page.getByRole('link', {
      name: /absolute/,
    });
    await expect(absoluteLink).toBeVisible();
    await expect(absoluteLink).toHaveAttribute(
      'href',
      '/en/guide/basic/install.html',
    );

    const relativeLink = page.getByRole('link', {
      name: /relative/,
    });
    await expect(relativeLink).toBeVisible();
    await expect(relativeLink).toHaveAttribute(
      'href',
      '/en/guide/basic/install.html',
    );
  });

  test('Should not add language prefix when current language is default language', async ({
    page,
  }) => {
    await page.goto(`http://localhost:${appPort}/guide/basic/quick-start`, {
      waitUntil: 'networkidle',
    });
    // check the compile result of absolute link in doc content
    const absoluteLink = page.getByRole('link', {
      name: /绝对路径/,
    });
    await expect(absoluteLink).toBeVisible();
    await expect(absoluteLink).toHaveAttribute(
      'href',
      '/guide/basic/install.html',
    );
    // check the compile result of relative link in doc content
    const relativeLink = page.getByRole('link', {
      name: /相对路径/,
    });
    await expect(relativeLink).toBeVisible();
    await expect(relativeLink).toHaveAttribute(
      'href',
      '/guide/basic/install.html',
    );
  });

  test('Should render sidebar correctly', async ({ page }) => {
    await page.goto(`http://localhost:${appPort}/guide/basic/quick-start`, {
      waitUntil: 'networkidle',
    });
    const sidebarGroups = page.locator(
      '.rp-doc-layout__sidebar .rp-sidebar-group',
    );
    await expect(sidebarGroups).toHaveCount(1);
  });

  test('Should render appearance switch button', async ({ page }) => {
    await page.goto(`http://localhost:${appPort}/guide/basic/quick-start`, {
      waitUntil: 'networkidle',
    });
    const button = page.locator('.rp-switch-appearance');
    await expect(button).toHaveCount(1);
    await expect(button).toBeVisible();
  });

  test('Should not 404 after redirecting in first visit', async ({ page }) => {
    const changeNavigatorLanguage = async (language: string) => {
      await page.addScriptTag({
        content: `
          localStorage.clear();
          navigator.language = '${language}';
        `,
      });
    };
    await changeNavigatorLanguage('nl-NL');
    await page.goto(`http://localhost:${appPort}`, {
      waitUntil: 'networkidle',
    });
    const content = await page.evaluate(() => document.body.textContent);
    expect(content?.includes('PAGE NOT FOUND')).toBe(false);
  });

  test('Should render i18n sidebar - cn', async ({ page }) => {
    await page.goto(`http://localhost:${appPort}/guide/basic/quick-start`, {
      waitUntil: 'networkidle',
    });
    const dirContent = await page
      .locator('.rp-doc-layout__sidebar')
      .textContent();
    expect(dirContent ?? '').toContain('基本');

    const sectionHeaderContent = await page
      .locator('.rp-sidebar-section-header__left span')
      .textContent();
    expect(sectionHeaderContent ?? '').toEqual('成长');
  });

  test('Should render i18n sidebar - en', async ({ page }) => {
    await page.goto(`http://localhost:${appPort}/en/guide/basic/quick-start`, {
      waitUntil: 'networkidle',
    });
    const dirContent = await page
      .locator('.rp-doc-layout__sidebar')
      .textContent();
    expect(dirContent ?? '').toContain('Basic');

    const sectionHeaderContent = await page
      .locator('.rp-sidebar-section-header__left span')
      .textContent();
    expect(sectionHeaderContent ?? '').toEqual('Growth');
  });

  test('Should add routePrefix when type is custom-link', async ({ page }) => {
    await page.goto(`http://localhost:${appPort}/guide/basic/quick-start`, {
      waitUntil: 'networkidle',
    });
    const customLinkZh = page.locator(
      '.rp-doc-layout__sidebar a.rp-sidebar-item',
      {
        hasText: 'My Link',
      },
    );
    await expect(customLinkZh).toHaveAttribute(
      'href',
      '/guide/basic/install.html',
    );

    await page.goto(`http://localhost:${appPort}/en/guide/basic/quick-start`, {
      waitUntil: 'networkidle',
    });
    const customLinkEn = page.locator(
      '.rp-doc-layout__sidebar a.rp-sidebar-item',
      {
        hasText: 'My Link',
      },
    );
    await expect(customLinkEn).toHaveAttribute(
      'href',
      '/en/guide/basic/install.html',
    );
  });

  test('Should not crash when switch language in api page', async ({
    page,
  }) => {
    await page.goto(`http://localhost:${appPort}/api`, {
      waitUntil: 'networkidle',
    });
    const overviewContentZh = await page.locator('.rp-overview').textContent();
    expect(overviewContentZh ?? '').toContain('Overview');
    expect(overviewContentZh ?? '').toContain('zh');
    expect(overviewContentZh ?? '').not.toContain('en');

    const languageSwitcher = page
      .locator('.rp-nav-menu__item')
      .filter({ hasText: '简体中文' });
    await languageSwitcher.hover();
    const englishOption = languageSwitcher.locator('.rp-hover-group__item a', {
      hasText: 'English',
    });
    await englishOption.click();
    await page.waitForURL(/\/en\//);

    const newLanguageSwitcher = page
      .locator('.rp-nav-menu__item')
      .filter({ hasText: 'English' });
    await expect(newLanguageSwitcher).toBeVisible();

    const content = await page.textContent('#__rspress_root');
    expect(content ?? '').not.toEqual('');
    const overviewContentEn = await page.locator('.rp-overview').textContent();
    expect(overviewContentEn ?? '').toContain('Overview');
    expect(overviewContentEn ?? '').toContain('en');
    expect(overviewContentEn ?? '').not.toContain('zh');
  });
});
