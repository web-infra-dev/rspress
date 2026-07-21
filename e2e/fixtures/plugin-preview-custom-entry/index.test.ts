import { expect, test } from '@playwright/test';
import { getPort, killProcess, runDevCommand } from '../../utils/runCommands';

test.describe('plugin test', async () => {
  let appPort;
  let app;
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

  test('Should render the element', async ({ page }) => {
    await page.goto(`http://localhost:${appPort}/guide/`, {
      waitUntil: 'networkidle',
    });
    const codeBlockElements = page.locator('.rspress-doc > .rp-preview');
    await expect(codeBlockElements).toHaveCount(3);

    const internalIframeJsxDemoCodePreview = await page
      .frameLocator('iframe')
      .first()
      .getByText('JSX')
      .innerText();
    const internalIframeTsxDemoCodePreview = await page
      .frameLocator('iframe')
      .nth(1)
      .getByText('TSX')
      .innerText();
    const externalIframeJsxDemoCodePreview = await page
      .frameLocator('iframe')
      .nth(2)
      .getByText('EXTERNAL')
      .innerText();

    expect(internalIframeJsxDemoCodePreview).toBe('Hello World JSX');
    expect(internalIframeTsxDemoCodePreview).toBe('Hello World TSX');
    expect(externalIframeJsxDemoCodePreview).toBe('Hello World External');
  });

  test('should render vue', async ({ page }) => {
    await page.goto(`http://localhost:${appPort}/guide/vue`, {
      waitUntil: 'networkidle',
    });
    const transformedCodePreview = await page
      .frameLocator('.rp-preview iframe')
      .getByText('VUE')
      .innerText();

    expect(transformedCodePreview).toBe('Hello World VUE');

    const fixedIframe = page.locator('.rp-fixed-device__iframe');
    const fixedIframeBody = fixedIframe.contentFrame().locator('body');
    await expect(fixedIframeBody).toContainText('Hello World VUE');
    await expect(fixedIframeBody).toContainText('Hello World VUE FIXED');

    const fixedEntry = fixedIframe.contentFrame().locator('.vue-fixed-entry');
    await expect(fixedEntry).toHaveAttribute('data-route-path', '/guide/vue');
    await expect(fixedEntry).toHaveAttribute('data-lang', 'en');

    // The two fixed demos are preview-only and should not render code blocks.
    await expect(page.locator('.rspress-doc > .rp-preview')).toHaveCount(1);

    const mobileDemoLink = page.locator('.rp-fixed-device__mobile-link');
    await expect(mobileDemoLink).toHaveAttribute('target', '_blank');
    await expect(mobileDemoLink).toHaveAttribute(
      'href',
      /(?:\/~demo\/|:\d+\/)_guide_vue$/,
    );
  });
});
