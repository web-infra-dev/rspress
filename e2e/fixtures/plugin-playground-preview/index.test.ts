import { expect, test } from '@e2e/test';
import { getPort, killProcess, runDevCommand } from '../../utils/runCommands';

test.describe('plugin playground and preview integration', async () => {
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

  test('preserves separate code, playground and preview containers', async ({
    page,
  }) => {
    await page.goto(`http://localhost:${appPort}/`, {
      waitUntil: 'networkidle',
    });

    // Pure code block (default) - should render as normal code block
    const pureCodeBlock = page.locator('pre code').filter({
      hasText: 'PureComponent',
    });
    await expect(pureCodeBlock).toHaveCount(1);

    // Playground element - should render with playground meta
    const playgroundElements = page.locator('.rp-playground'); // TODO: upgrade className
    await expect(playgroundElements).toHaveCount(1);

    // Preview element - should render with preview meta
    const previewElements = page.locator('.rp-preview');
    await expect(previewElements).toHaveCount(1);
  });
});
