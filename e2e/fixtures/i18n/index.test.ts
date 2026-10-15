import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { expect, test } from '@e2e/test';
import {
  getPort,
  killProcess,
  runBuildCommand,
  runDevCommand,
} from '../../utils/runCommands';

test.describe('i18n', async () => {
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

  test('Should localize code wrap button title', async ({ page }) => {
    await page.goto(`http://localhost:${appPort}`, {
      waitUntil: 'networkidle',
    });
    await expect(page.locator('button[title="切换代码换行"]')).toHaveCount(1);

    await page.goto(`http://localhost:${appPort}/en/`, {
      waitUntil: 'networkidle',
    });
    await expect(page.locator('button[title="Toggle code wrap"]')).toHaveCount(
      1,
    );
  });

  test('prefixes both English guide URLs with the non-default locale', async ({
    page,
  }) => {
    await page.goto(`http://localhost:${appPort}/en/guide/basic/quick-start`, {
      waitUntil: 'networkidle',
    });
    // take the `click` button
    const absoluteLink = page.getByRole('link', {
      name: /absolute/,
    });
    await expect(absoluteLink).toHaveAttribute(
      'href',
      '/en/guide/basic/install.html',
    );

    const relativeLink = page.getByRole('link', {
      name: /relative/,
    });
    await expect(relativeLink).toHaveAttribute(
      'href',
      '/en/guide/basic/install.html',
    );
  });

  test('keeps both Chinese guide URLs unprefixed for the default locale', async ({
    page,
  }) => {
    await page.goto(`http://localhost:${appPort}/guide/basic/quick-start`, {
      waitUntil: 'networkidle',
    });
    // check the compile result of absolute link in doc content
    const absoluteLink = page.getByRole('link', {
      name: /绝对路径/,
    });
    await expect(absoluteLink).toHaveAttribute(
      'href',
      '/guide/basic/install.html',
    );
    // check the compile result of relative link in doc content
    const relativeLink = page.getByRole('link', {
      name: /相对路径/,
    });
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

  test('Should not render appearance switch button when darkMode is false', async ({
    page,
  }) => {
    await page.goto(`http://localhost:${appPort}/guide/basic/quick-start`, {
      waitUntil: 'networkidle',
    });
    const button = page.locator('.rp-switch-appearance');
    await expect(button).toHaveCount(0);
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

  test('Language switch should only render non-active languages as links in HoverGroup', async ({
    page,
  }) => {
    await page.goto(`http://localhost:${appPort}`, {
      waitUntil: 'networkidle',
    });

    // Hover the language switcher to open the HoverGroup dropdown
    const languageSwitcher = page.locator(
      '.rp-nav__others .rp-nav-menu__item__container',
      { hasText: '简体中文' },
    );
    await languageSwitcher.hover();

    // Scope lookups to the hover group associated with this nav container
    const hoverGroup = languageSwitcher
      .locator('xpath=ancestor::*[contains(@class, "rp-nav")]')
      .locator('.rp-hover-group');

    // Verify non-active English item has correct lang/hreflang attributes.
    const englishLink = hoverGroup.locator('.rp-hover-group__item a', {
      hasText: 'English',
    });
    await expect(englishLink).toHaveAttribute('lang', 'en');
    await expect(englishLink).toHaveAttribute('hreflang', 'en');
    await expect(englishLink).toHaveAttribute('rel', 'alternate');

    // Verify active Chinese item is not a link.
    const chineseItem = hoverGroup.locator(
      '.rp-hover-group__item--active .rp-hover-group__item__link',
      {
        hasText: '简体中文',
      },
    );
    const chineseTagName = await chineseItem.evaluate(el => el.tagName);
    expect(chineseTagName).toBe('DIV');
    await expect(chineseItem).not.toHaveAttribute('href');
    await expect(chineseItem).not.toHaveAttribute('hreflang');
    await expect(chineseItem).not.toHaveAttribute('rel');
    await expect(
      hoverGroup.locator('.rp-hover-group__item a', {
        hasText: '简体中文',
      }),
    ).toHaveCount(0);
  });

  test('Language switch link to default language should keep lang and hrefLang attributes in HoverGroup', async ({
    page,
  }) => {
    await page.goto(`http://localhost:${appPort}/en/`, {
      waitUntil: 'networkidle',
    });

    const languageSwitcher = page.locator(
      '.rp-nav__others .rp-nav-menu__item__container',
      { hasText: 'English' },
    );
    await languageSwitcher.hover();

    const hoverGroup = languageSwitcher
      .locator('xpath=ancestor::*[contains(@class, "rp-nav")]')
      .locator('.rp-hover-group');

    const chineseLink = hoverGroup.locator('.rp-hover-group__item a', {
      hasText: '简体中文',
    });
    await expect(chineseLink).toHaveAttribute('lang', 'zh');
    await expect(chineseLink).toHaveAttribute('hreflang', 'zh');
    await expect(chineseLink).toHaveAttribute('rel', 'alternate');
  });

  test('mobile language items preserve tags and locale attributes', async ({
    page,
  }) => {
    // Switch to mobile viewport
    await page.setViewportSize({ width: 500, height: 800 });

    await page.goto(`http://localhost:${appPort}`, {
      waitUntil: 'networkidle',
    });
    // Open the hamburger menu
    await page.locator('.rp-nav-hamburger').first().click();
    const navScreen = page.locator('.rp-nav-screen');

    // Open the language dropdown
    await navScreen.locator('.rp-nav-screen-langs').click();

    // The active language (简体中文) renders as a <span>, not a link
    const activeItem = navScreen.locator(
      '.rp-nav-screen-langs-group__item--active',
    );
    // Active item should be a <span>, not an <a>
    const activeTagName = await activeItem.evaluate(el => el.tagName);
    expect(activeTagName).toBe('SPAN');
    // Active item should NOT have hreflang/rel attributes (it's not a link)
    await expect(activeItem).not.toHaveAttribute('hreflang');
    await expect(activeItem).not.toHaveAttribute('rel');

    // The non-active language (English) should be a link with lang/hrefLang/rel
    const englishLink = navScreen.locator(
      'a.rp-nav-screen-langs-group__item:not(.rp-nav-screen-langs-group__item--active)',
    );
    await expect(englishLink).toHaveAttribute('lang', 'en');
    await expect(englishLink).toHaveAttribute('hreflang', 'en');
    await expect(englishLink).toHaveAttribute('rel', 'alternate');
  });
});

test.describe('i18n SEO', () => {
  test.beforeAll(async () => {
    await runBuildCommand(import.meta.dirname);
  });

  test('generates reciprocal alternate language links', async () => {
    const outputDir = path.join(import.meta.dirname, 'doc_build');
    const [chineseHtml, englishHtml] = await Promise.all([
      readFile(path.join(outputDir, 'index.html'), 'utf8'),
      readFile(path.join(outputDir, 'en/index.html'), 'utf8'),
    ]);
    const alternateLinks = [
      '<link rel="alternate" hreflang="zh" href="https://example.com/index.html">',
      '<link rel="alternate" hreflang="en" href="https://example.com/en/index.html">',
    ];

    for (const link of alternateLinks) {
      expect(chineseHtml).toContain(link);
      expect(englishHtml).toContain(link);
    }
  });
});
