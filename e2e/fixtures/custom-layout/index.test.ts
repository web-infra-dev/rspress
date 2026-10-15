import { expect, test } from '@e2e/test';
import { getPort, killProcess, runDevCommand } from '../../utils/runCommands';

test.describe('custom layout', async () => {
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

  test('omits disabled frontmatter chrome from the DOM', async ({ page }) => {
    await page.goto(`http://localhost:${appPort}/frontmatter`, {
      waitUntil: 'networkidle',
    });

    await expect(page.locator('header.rp-nav')).toHaveCount(0);
    await expect(page.locator('.rp-doc-layout__sidebar')).toHaveCount(0);
    await expect(page.locator('.rp-doc-layout__outline')).toHaveCount(0);
    await expect(page.locator('.rp-doc-footer')).toHaveCount(0);
  });

  test('omits the document container for a home page', async ({ page }) => {
    await page.goto(`http://localhost:${appPort}/`, {
      waitUntil: 'networkidle',
    });

    await expect(page.locator('.rp-doc-layout__container')).toHaveCount(0);
  });

  test('omits hero and document containers for a custom page', async ({
    page,
  }) => {
    await page.goto(`http://localhost:${appPort}/page-type`, {
      waitUntil: 'networkidle',
    });

    await expect(page.locator('.rp-home-hero')).toHaveCount(0);
    await expect(page.locator('.rp-doc-layout__container')).toHaveCount(0);
  });

  test('does not generate TOC entries for custom outline slots', async ({
    page,
  }) => {
    await page.goto(`http://localhost:${appPort}/no-headings`, {
      waitUntil: 'networkidle',
    });

    await expect(page.locator('.rp-toc-item')).toHaveCount(0);
  });

  test('sets the mobile outline open class for custom slots', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 800, height: 600 });
    await page.goto(`http://localhost:${appPort}/no-headings`, {
      waitUntil: 'networkidle',
    });

    const outlineButton = page.locator('.rp-sidebar-menu__right');
    await expect(outlineButton).toBeEnabled();
    await outlineButton.click();

    await expect(page.locator('.rp-doc-layout__outline')).toHaveClass(
      /rp-doc-layout__outline--open/,
    );
  });
});
