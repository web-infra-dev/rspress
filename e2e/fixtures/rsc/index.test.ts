import { expect, test } from '@playwright/test';
import {
  getPort,
  killProcess,
  runBuildCommand,
  runPreviewCommand,
} from '../../utils/runCommands';

test.describe('rsc render mode', () => {
  let appPort: number;
  let app: Awaited<ReturnType<typeof runPreviewCommand>> | null;

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

  test('renders html on the server and hydrates client islands', async ({
    page,
  }) => {
    const response = await page.request.get(`http://localhost:${appPort}/`);
    const html = await response.text();

    expect(html).toContain('RSC Index');
    expect(html).toContain('server rendered through the RSC pipeline');

    await page.goto(`http://localhost:${appPort}/`, {
      waitUntil: 'networkidle',
    });

    const appearanceToggle = page.locator('.rp-switch-appearance').first();
    const getIsDark = () =>
      page.evaluate(() =>
        document.documentElement.classList.contains('rp-dark'),
      );
    const defaultIsDark = await getIsDark();
    await appearanceToggle.click();
    await expect.poll(getIsDark).toBe(!defaultIsDark);
  });

  test('keeps internal links working in rsc mode', async ({ page }) => {
    await page.goto(`http://localhost:${appPort}/`, {
      waitUntil: 'networkidle',
    });

    await page.getByRole('link', { name: 'Go to guide' }).click();
    await page.waitForLoadState('networkidle');
    await expect(page.locator('h1')).toContainText('RSC Guide');
  });
});
