import { expect, test } from '@playwright/test';
import {
  getPort,
  killProcess,
  runBuildCommand,
  runDevCommand,
  runPreviewCommand,
} from '../../utils/runCommands';

test.describe('plugin test', async () => {
  let appPort;
  let app;
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

  test('Should render the element', async ({ page }) => {
    await page.goto(`http://localhost:${appPort}/`, {
      waitUntil: 'networkidle',
    });
    const codeBlockElements = page.locator(
      '.rspress-doc > div[class*=language-]',
    );
    await expect(codeBlockElements).toHaveCount(3);

    const internalDemoCodePreview = await page
      .frameLocator('iframe')
      .getByText('Internal')
      .innerText();
    const externalDemoCodePreview = await page
      .frameLocator('iframe')
      .getByText('External')
      .innerText();
    const transformedCodePreview = await page
      .frameLocator('iframe')
      .getByText('JSON')
      .innerText();

    expect(internalDemoCodePreview).toBe('Hello World Internal');
    expect(externalDemoCodePreview).toBe('Hello World External');
    expect(transformedCodePreview).toBe('Render from JSON');
  });

  test('```tsx internal preview', async ({ page }) => {
    await page.goto(`http://localhost:${appPort}/mixed`, {
      waitUntil: 'networkidle',
    });

    // Get the second iframe which contains "External" text (from external file with preview="iframe-follow")
    const externalDemoCodePreview = await page
      .frameLocator('iframe')
      .nth(1)
      .getByText('External')
      .innerText();

    const cardTexts = await Promise.all(
      (await page.$$('.rp-preview--internal__card')).map(i => i.innerText()),
    );

    // First internal card is from inline code (preview="internal")
    const innerCodePreviewWithPreviewModeInternal = cardTexts[0];
    // Second internal card is from external file (preview="internal" file="./component.jsx")
    const externalDemoCodePreviewWithPreviewModeInternal = cardTexts[1];

    expect(externalDemoCodePreview).toBe('Hello World External');
    expect(innerCodePreviewWithPreviewModeInternal).toBe('This is a component');
    expect(externalDemoCodePreviewWithPreviewModeInternal).toBe(
      'Hello World External',
    );
  });
});

test.describe('plugin preview build', async () => {
  let appPort: number;
  let app;
  test.beforeAll(async () => {
    const appDir = __dirname;
    appPort = await getPort();
    await runBuildCommand(appDir);
    app = await runPreviewCommand(appDir, appPort);
  });

  test.afterAll(async () => {
    if (app) {
      await killProcess(app);
    }
  });
  test('build should work', async ({ page }) => {
    await page.goto(`http://localhost:${appPort}`, {
      waitUntil: 'networkidle',
    });
    const codeBlockElements = await page.$$(
      '.rspress-doc > div[class*=language-]',
    );

    const internalDemoCodePreview = await page
      .frameLocator('iframe')
      .getByText('Internal')
      .innerText();
    const externalDemoCodePreview = await page
      .frameLocator('iframe')
      .getByText('External')
      .innerText();
    const transformedCodePreview = await page
      .frameLocator('iframe')
      .getByText('JSON')
      .innerText();

    expect(codeBlockElements.length).toBe(3);
    expect(internalDemoCodePreview).toBe('Hello World Internal');
    expect(externalDemoCodePreview).toBe('Hello World External');
    expect(transformedCodePreview).toBe('Render from JSON');
  });
});
