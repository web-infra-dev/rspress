import { expect, test } from '@e2e/test';

import {
  getPort,
  killProcess,
  runBuildCommand,
  runDevCommand,
  runPreviewCommand,
} from '../../utils/runCommands';

test.describe.each(['dev', 'build'])('dynamic toc (%s)', async mode => {
  let appPort: number;
  let app: Awaited<ReturnType<typeof runDevCommand>>;
  test.beforeAll(async () => {
    const appDir = import.meta.dirname;
    appPort = await getPort();
    if (mode === 'dev') {
      app = await runDevCommand(appDir, appPort);
    } else {
      await runBuildCommand(appDir);
      app = await runPreviewCommand(appDir, appPort);
    }
  });

  test.afterAll(async () => {
    if (app) {
      await killProcess(app);
    }
  });

  test('Index page', async ({ page }) => {
    await page.goto(`http://localhost:${appPort}`, {
      waitUntil: 'networkidle',
    });

    const heading = page.locator('h2').first();
    await expect(heading).toContainText('Term');

    const tocItem = page.locator('.rp-toc-item .rp-toc-item__text').first();
    await expect(tocItem).toHaveText('Term');

    await expect(heading).toContainText('Term dynamic & content');

    await expect(tocItem).toHaveText('Term dynamic & content');

    // The header text collected from the DOM is HTML, its entities should not be shown in the tooltip
    await expect(page.locator('.rp-toc-item').first()).toHaveAttribute(
      'title',
      'Term dynamic & content',
    );

    const literalItem = page.locator('.rp-toc-item').nth(1);
    await expect(literalItem).toHaveText('Literal **literal** &lt;');
    await expect(literalItem).toHaveAttribute(
      'title',
      'Literal **literal** &lt;',
    );
    await expect(literalItem.locator('code')).toHaveText('**literal** &lt;');
    await expect(literalItem.locator('strong')).toHaveCount(0);
  });

  test('Should omit browser-serialized void elements from TOC tooltips', async ({
    page,
  }) => {
    await page.goto(`http://localhost:${appPort}`, {
      waitUntil: 'networkidle',
    });

    const headingHtml = await page.locator('.rspress-doc').evaluate(doc => {
      const heading = document.createElement('h2');
      heading.id = 'logo-image';
      heading.className = 'rp-toc-include';
      heading.textContent = 'Logo ';
      const image = document.createElement('img');
      image.src =
        'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
      heading.appendChild(image);
      doc.appendChild(heading);
      return heading.innerHTML;
    });
    expect(headingHtml).toContain('<img ');
    expect(headingHtml).not.toContain('/>');
    await expect(
      page.locator('.rp-toc-item[href="#logo-image"]'),
    ).toHaveAttribute('title', 'Logo');
  });

  test('Data depth attribute', async ({ page }) => {
    await page.goto(`http://localhost:${appPort}/test-depth`, {
      waitUntil: 'networkidle',
    });

    // Check that TOC items have data-depth attributes
    const tocItems = page.locator('.rp-toc-item');
    const count = await tocItems.count();

    // Should have multiple TOC items
    expect(count).toBeGreaterThan(0);

    // Verify first item (h2) has data-depth="0"
    const firstItem = tocItems.nth(0);
    await expect(firstItem).toHaveAttribute('data-depth', '0');

    // If there are more items, check different depths
    if (count > 1) {
      // Check for h3 with data-depth="1"
      const h3Items = page.locator('.rp-toc-item[data-depth="1"]');
      const h3Count = await h3Items.count();
      expect(h3Count).toBeGreaterThan(0);
    }

    if (count > 2) {
      // Check for h4 with data-depth="2"
      const h4Items = page.locator('.rp-toc-item[data-depth="2"]');
      const h4Count = await h4Items.count();
      expect(h4Count).toBeGreaterThan(0);
    }
  });

  test('Should clear the outline when navigating to an overview page', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1100, height: 900 });
    await page.goto(`http://localhost:${appPort}/overview`, {
      waitUntil: 'networkidle',
    });

    const outlineButton = page.locator('.rp-sidebar-menu__right');
    const outlineArrow = page.locator('.rp-sidebar-menu__right__icon');
    await expect(outlineButton).toBeDisabled();
    await expect(outlineArrow).toHaveCount(0);

    await page
      .locator('.rp-overview')
      .getByRole('link', { name: 'Dynamic TOC', exact: true })
      .click();
    await expect(page.locator('.rp-toc-item').first()).toHaveText(
      'Term dynamic & content',
    );
    await expect(outlineButton).toBeEnabled();

    await page
      .locator('.rspress-doc')
      .getByRole('link', { name: 'Overview', exact: true })
      .click();
    await expect(page.locator('.rp-overview')).toBeVisible();
    await expect(outlineButton).toBeDisabled();
    await expect(outlineArrow).toHaveCount(0);

    await page.goBack();
    await expect(page.locator('.rp-toc-item').first()).toHaveText(
      'Term dynamic & content',
    );
    await expect(outlineButton).toBeEnabled();
    await expect(outlineArrow).toHaveCount(1);
  });

  test('Should keep the outline empty after removing all headings', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1100, height: 900 });
    await page.goto(`http://localhost:${appPort}/test-depth`, {
      waitUntil: 'networkidle',
    });

    await expect(page.locator('.rp-toc-item')).toHaveCount(5);
    await page.locator('.rspress-doc').evaluate(doc => {
      for (const heading of doc.querySelectorAll('h2, h3, h4')) {
        heading.remove();
      }
    });

    await expect(page.locator('.rp-toc-item')).toHaveCount(0);
    await expect(page.locator('.rp-sidebar-menu__right')).toBeDisabled();
    await expect(page.locator('.rp-sidebar-menu__right__icon')).toHaveCount(0);
  });

  test('Should update the outline between document pages', async ({ page }) => {
    await page.goto(`http://localhost:${appPort}`, {
      waitUntil: 'networkidle',
    });
    await expect(page.locator('.rp-toc-item').first()).toHaveText(
      'Term dynamic & content',
    );

    await page
      .locator('.rspress-doc')
      .getByRole('link', { name: 'Test data depth', exact: true })
      .click();
    await expect(page.locator('.rp-toc-item')).toHaveText([
      'Heading level 2',
      'Heading level 3',
      'Heading level 4',
      'Another level 3',
      'Another level 2',
    ]);

    await page
      .locator('.rspress-doc')
      .getByRole('link', { name: 'Dynamic TOC', exact: true })
      .click();
    await expect(page.locator('.rp-toc-item')).toHaveText([
      'Term dynamic & content',
      'Literal **literal** &lt;',
    ]);
  });
});
