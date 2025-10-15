import { expect, test } from '@playwright/test';
import { getPort, killProcess, runDevCommand } from '../../utils/runCommands';

test.describe('Inline markdown test', async () => {
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

  test('Should render inline markdown of sidebar correctly', async ({
    page,
  }) => {
    await page.goto(`http://localhost:${appPort}/inline/index`, {
      waitUntil: 'networkidle',
    });

    const sidebar = page.locator('.rp-doc-layout__sidebar .rp-sidebar-item');
    await expect(sidebar).toHaveCount(9);

    const sidebarTexts = (await sidebar.allTextContents()).map(text =>
      text.trim(),
    );
    expect(sidebarTexts.join(',')).toEqual(
      [
        'Overview',
        'Class: Component<P, S>',
        'Class: Component<P, S>',
        'bold',
        'emphasis',
        '<foo>',
        '-m <number>',
        'delete',
        'link',
      ].join(','),
    );

    const sidebarCount = await sidebar.count();
    const sidebarInnerHtml = await Promise.all(
      Array.from({ length: sidebarCount }, (_, index) =>
        sidebar.nth(index).locator('.rp-sidebar-item__left span').innerHTML(),
      ),
    );
    const expectedSidebarInnerHtml = [
      'Overview',
      'Class: Component&lt;P, S&gt;',
      'Class: Component&lt;P, S&gt;',
      '<strong>bold</strong>',
      '<em>emphasis</em>',
      '<code>&lt;foo&gt;</code>',
      '-m &lt;number&gt;',
      '<del>delete</del>',
      'link',
    ];
    for (const [index, html] of sidebarInnerHtml.entries()) {
      expect(html).toContain(expectedSidebarInnerHtml[index]);
    }
  });

  test('Should render inline markdown of overview page correctly', async ({
    page,
  }) => {
    await page.goto(`http://localhost:${appPort}/inline/index`, {
      waitUntil: 'networkidle',
    });

    const overviewHeadingLocator = page.locator(
      '.rp-overview h2.rp-toc-include span',
    );
    const overviewHeadings = await overviewHeadingLocator.allTextContents();
    expect(overviewHeadings.map(text => text.trim()).join(',')).toEqual(
      [
        'Class: Component<P, S>',
        'Class: Component<P, S>',
        'bold',
        'emphasis',
        '<foo>',
        '-m <number>',
        'delete',
        'link',
      ].join(','),
    );

    const overviewHeadingCount = await overviewHeadingLocator.count();
    const overviewHeadingHtml = await Promise.all(
      Array.from({ length: overviewHeadingCount }, (_, index) =>
        overviewHeadingLocator.nth(index).innerHTML(),
      ),
    );
    expect(overviewHeadingHtml.join(',')).toEqual(
      [
        'Class: Component&lt;P, S&gt;',
        'Class: Component&lt;P, S&gt;',
        '<strong>bold</strong>',
        '<em>emphasis</em>',
        '<code>&lt;foo&gt;</code>',
        '-m &lt;number&gt;',
        '<del>delete</del>',
        'link',
      ].join(','),
    );

    const overviewTitles = page.locator(
      '.rp-overview .rp-overview-group__item__title > a',
    );
    await expect(overviewTitles).toHaveText([
      'Class: Component<P, S>',
      'Class: Component<P, S>',
      'bold',
      'emphasis',
      '<foo>',
      '-m <number>',
      'delete',
      'link',
    ]);

    const overviewTitlesCount = await overviewTitles.count();
    const titleInnerHtml = await Promise.all(
      Array.from({ length: overviewTitlesCount }, (_, index) =>
        overviewTitles.nth(index).innerHTML(),
      ),
    );
    const expectedTitleInnerHtml = [
      'Class: Component&lt;P, S&gt;',
      'Class: Component&lt;P, S&gt;',
      '<strong>bold</strong>',
      '<em>emphasis</em>',
      '<code>&lt;foo&gt;</code>',
      '-m &lt;number&gt;',
      '<del>delete</del>',
      'link',
    ];
    for (const [index, html] of titleInnerHtml.entries()) {
      expect(html).toContain(expectedTitleInnerHtml[index]);
    }

    const overviewLinks = page.locator(
      '.rp-overview .rp-overview-group__item__content__item__link',
    );
    await expect(overviewLinks).toHaveText([
      'Class: Component<P, S>',
      'Class: Component<P, S>',
      '-m <number>',
      '<foo>',
      'foo <bar> baz',
      'bold',
      'emphasis',
      'delete',
      'This is a long string to test regex performance',
      'this is link rsbuild',
      'this is bold link', // FIXME: should be 'this is bold link rsbuild'
      'this is code link',
      'this is bold code link',
    ]);

    const overviewLinkCount = await overviewLinks.count();
    const overviewLinkInnerHtml = await Promise.all(
      Array.from({ length: overviewLinkCount }, (_, index) =>
        overviewLinks.nth(index).innerHTML(),
      ),
    );
    const expectedOverviewLinkInnerHtml = [
      'Class: Component&lt;P, S&gt;',
      'Class: Component&lt;P, S&gt;',
      '-m &lt;number&gt;',
      '<code>&lt;foo&gt;</code>',
      '<code>foo &lt;bar&gt; baz</code>',
      '<strong>bold</strong>',
      '<em>emphasis</em>',
      '<del>delete</del>',
      '<code>This is a long string to test regex performance</code>',
      'this is link rsbuild',
      'this is bold link',
      'this is code link',
      'this is bold code link',
    ];
    for (const [index, html] of overviewLinkInnerHtml.entries()) {
      expect(html).toContain(expectedOverviewLinkInnerHtml[index]);
    }
  });

  test('Should render inline markdown of aside correctly', async ({ page }) => {
    await page.goto(`http://localhost:${appPort}/inline/all`, {
      waitUntil: 'networkidle',
    });

    const asideItems = page.locator('.rp-aside__toc-item__text');
    await expect(asideItems).toHaveCount(9);

    const asideTexts = (await asideItems.allTextContents()).map(text =>
      text.trim(),
    );
    expect(asideTexts.join(',')).toEqual(
      [
        'Class: Component<P, S>',
        'Class: Component<P, S>',
        '-m <number>',
        '<foo>',
        'foo <bar> baz',
        'bold',
        'emphasis',
        'delete',
        'This is a long string to test regex performance',
      ].join(','),
    );

    const asideCount = await asideItems.count();
    const asideInnerHtml = await Promise.all(
      Array.from({ length: asideCount }, (_, index) =>
        asideItems.nth(index).innerHTML(),
      ),
    );
    expect(asideInnerHtml.join(',')).toEqual(
      [
        'Class: Component&lt;P, S&gt;',
        'Class: Component&lt;P, S&gt;',
        '-m &lt;number&gt;',
        '<code>&lt;foo&gt;</code>',
        '<code>foo &lt;bar&gt; baz</code>',
        '<strong>bold</strong>',
        '<em>emphasis</em>',
        '<del>delete</del>',
        '<code>This is a long string to test regex performance</code>',
      ].join(','),
    );
  });

  test('Should generate header anchor and id with inline markdown syntax correctly', async ({
    page,
  }) => {
    await page.goto(`http://localhost:${appPort}/inline/all`, {
      waitUntil: 'networkidle',
    });

    // Check h1 element
    const h1 = page.locator('h1#class-componentp-s');
    await expect(h1).toHaveCount(1);
    const h1Anchor = h1.locator('a.rp-header-anchor');
    await expect(h1Anchor).toHaveAttribute('href', '#class-componentp-s');

    // Check h2 elements
    const h2Selectors = [
      'h2#class-componentp-s-1',
      'h2#class-componentp-s-2',
      'h2#-m-number',
      'h2#foo',
      'h2#foo-bar-baz',
      'h2#bold',
      'h2#emphasis',
      'h2#delete',
    ];

    for (const selector of h2Selectors) {
      const h2 = page.locator(selector);
      await expect(h2).toHaveCount(1);
      const h2Anchor = h2.locator('a.rp-header-anchor');
      await expect(h2Anchor).toHaveAttribute(
        'href',
        `#${selector.split('#')[1]}`,
      );
    }
  });

  test('Should render html like <img> with inline markdown syntax correctly', async ({
    page,
  }) => {
    await page.goto(`http://localhost:${appPort}/`, {
      waitUntil: 'networkidle',
    });

    const img = page.locator('img').first();
    await expect(img).toBeVisible();
    await expect(img).toHaveAttribute(
      'src',
      'https://assets.rspack.rs/rspress/rspress-logo-480x480.png',
    );
  });
});
