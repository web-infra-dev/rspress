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
    await page.getByRole('button', { name: 'Parameters', exact: true }).click();
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
  test('sends text and form examples in the selected wire format', async ({
    page,
  }) => {
    const bodies: string[] = [];
    const types: string[] = [];
    await page.route('https://example.com/v1/planets', async route => {
      bodies.push(route.request().postData() ?? '');
      types.push(route.request().headers()['content-type']);
      await route.fulfill({
        contentType: 'application/json',
        body: '{"ok":true}',
      });
    });
    await page.goto(`http://localhost:${appPort}/api/createplanet`);
    await page
      .getByRole('button', { name: 'Request body', exact: true })
      .click();
    for (const [type, expected] of [
      ['text/plain', 'Hello Mars'],
      [
        'application/x-www-form-urlencoded',
        'name=Mars+%26+Venus&tags=rocky&tags=red',
      ],
    ]) {
      await page
        .getByRole('combobox', { name: 'Request content type' })
        .selectOption(type);
      await expect(
        page.getByRole('textbox', { name: 'Request body', exact: true }),
      ).toHaveValue(expected);
      await page.getByRole('button', { name: 'Send', exact: true }).click();
      await expect(page.getByRole('status')).toContainText('true');
    }
    expect(bodies).toEqual([
      'Hello Mars',
      'name=Mars+%26+Venus&tags=rocky&tags=red',
    ]);
    expect(types).toEqual(['text/plain', 'application/x-www-form-urlencoded']);
  });
  test('requires real credentials for Send even when examples have placeholders', async ({
    page,
  }) => {
    const credentials: string[] = [];
    await page.route('https://example.com/v1/planets/*', async route => {
      credentials.push(route.request().headers().authorization);
      await route.fulfill({
        contentType: 'application/json',
        body: '{"name":"Mars"}',
      });
    });
    await page.goto(`http://localhost:${appPort}/api/getplanet`);
    await expect(page.locator('.rp-openapi-code').first()).toContainText(
      'YOUR_ACCESS_TOKEN',
    );
    await page.getByRole('button', { name: 'Send', exact: true }).click();
    await expect(page.getByRole('alert')).toContainText(
      'Enter credentials for token',
    );
    expect(credentials).toEqual([]);
    await page
      .getByRole('button', { name: 'Authorization', exact: true })
      .click();
    await page.getByLabel('token', { exact: true }).fill('real-token');
    await page.getByRole('button', { name: 'Send', exact: true }).click();
    await expect(page.getByRole('status')).toContainText('Mars');
    expect(credentials).toEqual(['Bearer real-token']);
  });
  test('renders empty servers and authenticated examples with playground disabled', async ({
    page,
  }) => {
    const port = await getPort();
    const readonlyApp = await runDevCommand(
      import.meta.dirname,
      port,
      'rspress.readonly.config.ts',
    );
    try {
      await page.goto(`http://localhost:${port}/api/status`);
      await expect(
        page.getByRole('heading', { name: 'Get status', exact: true }),
      ).toBeVisible();
      await expect(page.getByLabel('Server URL', { exact: true })).toHaveValue(
        '/',
      );
      await expect(
        page.getByRole('button', { name: 'Send', exact: true }),
      ).toHaveCount(0);
      await expect(
        page.getByRole('button', { name: 'Authorization', exact: true }),
      ).toHaveCount(0);
      await expect(page.locator('.rp-openapi-code').first()).toContainText(
        'YOUR_ACCESS_TOKEN',
      );
      await page.getByRole('button', { name: 'Python', exact: true }).click();
      await expect(page.locator('.rp-openapi-code').first()).toContainText(
        'YOUR_ACCESS_TOKEN',
      );
      await expect(page.locator('.rp-openapi-code').first()).toContainText(
        'requests',
      );
    } finally {
      await killProcess(readonlyApp);
    }
  });
});
