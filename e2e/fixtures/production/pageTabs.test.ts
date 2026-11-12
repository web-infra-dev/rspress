import { expect, test } from '@e2e/test';
import {
  getPort,
  killProcess,
  runBuildCommand,
  runPreviewCommand,
} from '../../utils/runCommands';

test.describe('PageTabs outline', () => {
  let appPort: number;
  let app: Awaited<ReturnType<typeof runPreviewCommand>>;

  test.beforeAll(async () => {
    appPort = await getPort();
    await runBuildCommand(import.meta.dirname);
    app = await runPreviewCommand(import.meta.dirname, appPort);
  });

  test.afterAll(async () => {
    await killProcess(app);
  });

  test('tracks the visible tab on load, switches and history navigation', async ({
    page,
  }) => {
    await page.goto(`http://localhost:${appPort}/page-tabs?page=1`, {
      waitUntil: 'networkidle',
    });
    const links = page.locator('.rp-doc-layout__outline .rp-toc-item');
    await expect(links).toHaveText(['Dynamic TOC']);

    await page
      .locator('.rp-page-tabs__label__item')
      .getByText('API', { exact: true })
      .click();
    await expect(links).toHaveText(['Basic usage', 'Props']);

    await page
      .locator('.rp-page-tabs__label__item')
      .getByText('Empty', { exact: true })
      .click();
    await expect(links).toHaveCount(0);

    await page.goBack();
    await expect(links).toHaveText(['Basic usage', 'Props']);
    await page.goBack();
    await expect(links).toHaveText(['Dynamic TOC']);

    await page.goto(`http://localhost:${appPort}/page-tabs`);
    await expect(links).toHaveText(['Basic usage', 'Props']);
  });
});
