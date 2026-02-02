import { expect, test } from '@playwright/test';
import { getPort, killProcess, runDevCommand } from '../../utils/runCommands';

test.describe('tailwind-v4', async () => {
  let appPort: number;
  let app: Awaited<ReturnType<typeof runDevCommand>> | null;

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

  test('tailwind utility classes should work', async ({ page }) => {
    await page.goto(`http://localhost:${appPort}`, {
      waitUntil: 'networkidle',
    });

    const redText = page.locator('.text-red-500');
    await expect(redText).toHaveCSS(
      'color',
      /rgb\(239,\s*68,\s*68\)|lab\(55\.4814\s/,
    );

    const boldText = page.locator('.font-bold');
    await expect(boldText).toHaveCSS('font-weight', '700');

    const blueBox = page.locator('.bg-blue-500');
    await expect(blueBox).toHaveCSS('padding', '16px');
  });
});
