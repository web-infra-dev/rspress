import { expect, test } from '@e2e/test';
import { getPort, killProcess, runDevCommand } from '../../utils/runCommands';

test.describe('OpenAPI plugin', () => {
  let appPort: number;
  let app: Awaited<ReturnType<typeof runDevCommand>>;
  test.beforeAll(async () => {
    appPort = await getPort();
    app = await runDevCommand(import.meta.dirname, appPort);
  });
  test.afterAll(async () => {
    if (app) await killProcess(app);
  });
  test('renders docs, switches language and sends edited parameters', async ({
    page,
  }) => {
    await page.route('https://example.com/v1/planets*', async route => {
      expect(route.request().url()).toContain('limit=3');
      await route.fulfill({
        contentType: 'application/json',
        body: JSON.stringify({ data: [{ name: 'Earth' }] }),
      });
    });
    await page.goto(`http://localhost:${appPort}/api/getallplanets`);
    await expect(
      page.getByRole('heading', { level: 1, name: 'Get all planets' }),
    ).toBeVisible();
    await page.getByRole('button', { name: 'Python', exact: true }).click();
    await expect(page.locator('.rp-openapi-code').first()).toContainText(
      'requests',
    );
    await page
      .locator('summary')
      .filter({ hasText: /^Parameters$/ })
      .click();
    await page.getByRole('textbox', { name: 'query limit' }).fill('3');
    await page.getByRole('button', { name: 'Send', exact: true }).click();
    await expect(page.getByRole('status')).toContainText('Earth');
  });
  test('uses native tabs, section headers and distinct method colors in both themes', async ({
    page,
  }) => {
    await page.goto(`http://localhost:${appPort}/api/getallplanets`);
    await expect(page.locator('.rp-sidebar-section-header')).toHaveText(
      'Planets',
    );
    await expect(page.locator('.rp-openapi-examples > .rp-tabs')).toHaveCount(
      2,
    );
    for (const theme of ['light', 'dark'] as const) {
      await page.emulateMedia({ colorScheme: theme });
      const get = page
        .locator('.rp-sidebar-item .rp-badge[data-text="GET"]')
        .first();
      const post = page
        .locator('.rp-sidebar-item .rp-badge[data-text="POST"]')
        .first();
      await expect(get).toBeVisible();
      const getColor = await get.evaluate(
        element => getComputedStyle(element).color,
      );
      const postColor = await post.evaluate(
        element => getComputedStyle(element).color,
      );
      expect(getColor).not.toBe(postColor);
    }
    await page.goto(`http://localhost:${appPort}/api/getplanet`);
    await page.getByRole('button', { name: '404', exact: true }).click();
    await expect(page.locator('.rp-openapi-samples').last()).toContainText(
      'No response body',
    );
  });
  test('shows request failures and stays within the viewport on mobile', async ({
    page,
  }) => {
    await page.route('https://example.com/**', route => route.abort());
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`http://localhost:${appPort}/api/getallplanets`);
    await page.getByRole('button', { name: 'Send', exact: true }).click();
    await expect(page.getByRole('alert')).toContainText('CORS');
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
  });
});
