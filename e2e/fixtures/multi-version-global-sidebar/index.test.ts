import { expect, test } from '@e2e/test';
import { getSidebarTexts } from '../../utils/getSideBar';
import { getPort, killProcess, runDevCommand } from '../../utils/runCommands';

test.describe('multi version global sidebar', async () => {
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

  test('uses the target version on a missing page without locales', async ({
    page,
  }) => {
    await page.goto(`http://localhost:${appPort}/`, {
      waitUntil: 'networkidle',
    });
    await page.getByRole('button', { name: 'Missing versioned page' }).click();
    await expect(page.getByTestId('page-context')).toHaveText('v2|en');
    await expect(
      page.getByRole('link', { name: 'go to home' }),
    ).toHaveAttribute('href', '/v2/');
    await page.getByRole('link', { name: 'go to home' }).click();
    await expect(page.locator('h1')).toContainText('Version two');
  });

  test('Should keep global sidebar isolated by version', async ({ page }) => {
    await page.goto(`http://localhost:${appPort}/`, {
      waitUntil: 'networkidle',
    });
    await expect(page.locator('h1')).toContainText('Version one');
    expect(await getSidebarTexts(page)).toEqual([
      'Version one',
      'Version one guide',
    ]);

    await page.goto(`http://localhost:${appPort}/v2/`, {
      waitUntil: 'networkidle',
    });
    await expect(page.locator('h1')).toContainText('Version two');
    expect(await getSidebarTexts(page)).toEqual([
      'Version two',
      'Version two guide',
    ]);
  });
});
