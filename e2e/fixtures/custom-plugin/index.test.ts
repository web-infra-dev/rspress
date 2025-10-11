import { expect, test } from '@playwright/test';
import { getPort, killProcess, runDevCommand } from '../../utils/runCommands';

test.describe('plugin test', async () => {
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

  test('Should add route by filepath', async ({ page }) => {
    await page.goto(`http://localhost:${appPort}/filepath-route`, {
      waitUntil: 'networkidle',
    });
    const heading = page.getByRole('heading', { name: /Demo1/ });
    await expect(heading).toBeVisible();
  });

  test('Should add route by content', async ({ page }) => {
    await page.goto(`http://localhost:${appPort}/content-route`, {
      waitUntil: 'networkidle',
    });

    const heading = page.getByRole('heading', { name: /Demo2/ });
    await expect(heading).toBeVisible();
  });
});
