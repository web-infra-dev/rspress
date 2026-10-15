import { expect, test } from '@e2e/test';
import { getPort, killProcess, runDevCommand } from '../../utils/runCommands';

test.describe('multi version', async () => {
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

  test('Home feature icon should include base with multi-version and i18n', async ({
    page,
  }) => {
    await page.goto(`http://localhost:${appPort}/base/v2/zh/home`, {
      waitUntil: 'networkidle',
    });
    const featureIcon = page.locator('.rp-home-feature__icon img').first();
    await expect(featureIcon).toHaveAttribute('src', '/base/home/ai.svg');
  });
});
