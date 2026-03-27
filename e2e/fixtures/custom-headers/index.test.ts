import { expect, test } from '@playwright/test';
import {
  getPort,
  killProcess,
  runBuildCommand,
  runPreviewCommand,
} from '../../utils/runCommands';

test.describe('custom headers', async () => {
  let appPort: number;
  let app: Awaited<ReturnType<typeof runPreviewCommand>>;
  test.beforeAll(async () => {
    const appDir = import.meta.dirname;
    appPort = await getPort();
    await runBuildCommand(appDir);
    app = await runPreviewCommand(appDir, appPort);
  });

  test.afterAll(async () => {
    if (app) {
      await killProcess(app);
    }
  });

  test('should render only one title tag during ssg', async ({ page }) => {
    await page.goto(`http://localhost:${appPort}`, {
      waitUntil: 'networkidle',
    });
    await expect(page.locator('title')).toHaveCount(1);
  });

  test('config headers should be injected', async ({ page }) => {
    await page.goto(`http://localhost:${appPort}`, {
      waitUntil: 'networkidle',
    });

    await expect(
      page.locator('meta[name="config-string-head"]'),
    ).toHaveAttribute('content', 'config-string-head-value');

    await expect(
      page.locator('meta[name="config-tuple-head"]'),
    ).toHaveAttribute('content', 'config-tuple-head-value');

    const configFnStringMetaContent = await page
      .locator('meta[name="config-fn-string-head"]')
      .getAttribute('content');
    expect(
      configFnStringMetaContent?.endsWith(
        'e2e/fixtures/custom-headers/doc/index.mdx',
      ),
    ).toBeTruthy();

    const configFnTupleMetaContent = await page
      .locator('meta[name="config-fn-tuple-head"]')
      .getAttribute('content');
    expect(
      configFnTupleMetaContent?.endsWith(
        'e2e/fixtures/custom-headers/doc/index.mdx',
      ),
    ).toBeTruthy();
  });

  test('frontmatter headers should be injected', async ({ page }) => {
    await page.goto(`http://localhost:${appPort}`, {
      waitUntil: 'networkidle',
    });

    await expect(page.locator('meta[name="custom-meta"]')).toHaveAttribute(
      'content',
      'custom-meta-content',
    );

    await expect(page.locator('meta[name="custom-meta-2"]')).toHaveAttribute(
      'content',
      'custom-meta-content-2',
    );

    await expect(page.locator('meta[http-equiv="refresh"]')).toHaveAttribute(
      'content',
      '300',
    );

    const htmlContent = await page.content();
    expect(htmlContent).toContain(
      '<meta name="custom-meta" content="custom-meta-content">',
    );
    expect(htmlContent).toContain(
      '<meta name="custom-meta-2" content="custom-meta-content-2">',
    );
    expect(htmlContent).toContain('<meta http-equiv="refresh" content="300">');
  });

  test('frontmatter property headers should override auto-injected OG tags', async ({
    page,
  }) => {
    await page.goto(`http://localhost:${appPort}`, {
      waitUntil: 'networkidle',
    });

    // frontmatter og:title should override auto-injected og:title
    const ogTitles = page.locator('meta[property="og:title"]');
    await expect(ogTitles).toHaveCount(1);
    await expect(ogTitles).toHaveAttribute('content', 'Custom OG Title');

    // frontmatter og:description should override auto-injected og:description
    const ogDescriptions = page.locator('meta[property="og:description"]');
    await expect(ogDescriptions).toHaveCount(1);
    await expect(ogDescriptions).toHaveAttribute(
      'content',
      'Custom OG Description',
    );
  });
});
