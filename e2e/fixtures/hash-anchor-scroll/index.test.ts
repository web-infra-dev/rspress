import { expect, test } from '@e2e/test';
import { getPort, killProcess, runDevCommand } from '../../utils/runCommands';

test.describe('hash anchor scrolling', async () => {
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

  test('scrolls after the target layout is ready', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto(`http://localhost:${appPort}/source`, {
      waitUntil: 'networkidle',
    });

    await page.getByRole('link', { name: 'Target section' }).click();
    await expect(page).toHaveURL(/\/target#target-heading$/);

    const headingOffset = await page.locator('#target-heading').evaluate(el => {
      const scrollPaddingTop = Number.parseFloat(
        getComputedStyle(document.documentElement).scrollPaddingTop,
      );
      return Math.abs(el.getBoundingClientRect().top - scrollPaddingTop);
    });
    expect(headingOffset).toBeLessThanOrEqual(1);
  });
});
