import path from 'node:path';
import { expect, test } from '@playwright/test';
import { getPort, killProcess, runDevCommand } from '../utils/runCommands';

const fixtureDir = path.resolve(__dirname, '../fixtures');

test.describe('plugin test', async () => {
  let appPort;
  let app;
  test.beforeAll(async () => {
    const appDir = path.join(fixtureDir, 'plugin-preview-fixed-with-per-comp');
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
    // FIXME: ContainerFixedPerComp add a additional div structure, so we use `.rspress-doc div[class*=language-]` rather than '.rspress-doc > div[class*=language-]'
    const codeBlockElements = await page.$$(
      '.rspress-doc div[class*=language-]',
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

  test('<code previewMode="internal" /> and ```tsx internal preview', async ({
    page,
  }) => {
    await page.goto(`http://localhost:${appPort}/prop`, {
      waitUntil: 'networkidle',
    });
    const externalDemoCodePreview = await page
      .frameLocator('iframe')
      .getByText('External')
      .innerText();

    const cardTexts = await Promise.all(
      (await page.$$('.rspress-preview-card')).map(i => i.innerText()),
    );

    const externalDemoCodePreviewWithPreviewModeInternal = cardTexts[0];

    const innerCodePreviewWithPreviewModeInternal = cardTexts[1];

    expect(externalDemoCodePreview).toBe('Hello World External');
    expect(externalDemoCodePreviewWithPreviewModeInternal).toBe(
      'Hello World External',
    );
    expect(innerCodePreviewWithPreviewModeInternal).toBe('This is a component');
  });
});
