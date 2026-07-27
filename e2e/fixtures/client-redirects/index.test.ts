import { expect, test } from '@playwright/test';
import {
  getPort,
  killProcess,
  runBuildCommand,
  runDevCommand,
  runPreviewCommand,
} from '../../utils/runCommands';

test.describe('client redirects production test', async () => {
  let appPort: number;
  let app: Awaited<ReturnType<typeof runPreviewCommand>>;
  test.beforeAll(async () => {
    const appDir = import.meta.dirname;
    appPort = await getPort();
    await runBuildCommand(appDir);
    app = await runPreviewCommand(appDir, appPort);
  });

  test.afterAll(async () => {
    if (app) {
      await killProcess(app);
    }
  });

  test('Should redirect correctly - normal', async ({ page }) => {
    await page.goto(`http://localhost:${appPort}/docs/old1`, {
      waitUntil: 'networkidle',
    });
    await expect(page).toHaveURL(`http://localhost:${appPort}/docs/new1`);
  });

  test('Should redirect before hydration', async ({ page }) => {
    await page.route('**/*', async route => {
      if (route.request().resourceType() === 'script') {
        await route.abort();
      } else {
        await route.continue();
      }
    });

    await page.goto(`http://localhost:${appPort}/docs/old1`, {
      waitUntil: 'domcontentloaded',
    });
    await expect(page).toHaveURL(`http://localhost:${appPort}/docs/new1`);
  });

  test('Should redirect SPA route changes', async ({ page }) => {
    await page.goto(`http://localhost:${appPort}/`, {
      waitUntil: 'networkidle',
    });
    await page.getByRole('link', { name: 'Navigate to an old route' }).click();
    await expect(page).toHaveURL(
      new RegExp(`^http://localhost:${appPort}/docs/new1(?:\\.html)?$`),
    );
  });

  test('Should fall back to the runtime redirect under a strict CSP', async ({
    page,
  }) => {
    await page.route('**/*', async route => {
      const response = await route.fetch();
      await route.fulfill({
        response,
        headers: {
          ...response.headers(),
          'content-security-policy': "script-src 'self'",
        },
      });
    });

    await page.goto(`http://localhost:${appPort}/docs/old1`, {
      waitUntil: 'networkidle',
    });
    await expect(page).toHaveURL(`http://localhost:${appPort}/docs/new1`);
  });

  test('Should redirect correctly - array', async ({ page }) => {
    await page.goto(`http://localhost:${appPort}/docs/2022`, {
      waitUntil: 'networkidle',
    });
    await expect(page).toHaveURL(`http://localhost:${appPort}/docs/2024`);

    await page.goto(`http://localhost:${appPort}/docs/2023/new`, {
      waitUntil: 'networkidle',
    });
    await expect(page).toHaveURL(`http://localhost:${appPort}/docs/2024/new`);
  });

  test('Should redirect correctly - reg1', async ({ page }) => {
    await page.goto(`http://localhost:${appPort}/docs/old2`, {
      waitUntil: 'networkidle',
    });
    await expect(page).toHaveURL(`http://localhost:${appPort}/docs/new2`);

    await page.goto(`http://localhost:${appPort}/docs/old2/foo`, {
      waitUntil: 'networkidle',
    });
    await expect(page).toHaveURL(`http://localhost:${appPort}/docs/new2/foo`);
  });

  test('Should redirect correctly - reg2', async ({ page }) => {
    await page.goto(`http://localhost:${appPort}/docs/old3`, {
      waitUntil: 'networkidle',
    });
    await expect(page).toHaveURL(`http://localhost:${appPort}/docs/new3`);

    await page.goto(`http://localhost:${appPort}/foo/docs/old3`, {
      waitUntil: 'networkidle',
    });
    await expect(page).toHaveURL(`http://localhost:${appPort}/foo/docs/new3`);
  });

  test('Should redirect correctly - external', async ({ page }) => {
    const externalUrl = 'https://example.com/';

    await page.route(externalUrl, route => {
      route.fulfill({
        status: 200,
        contentType: 'text/html',
        body: `<html><body>Mocked response for ${externalUrl}</body></html>`,
      });
    });

    await page.goto(`http://localhost:${appPort}/docs/old4`, {
      waitUntil: 'networkidle',
    });

    await expect(page).toHaveURL(externalUrl);
  });
});

test.describe('client redirects development test', async () => {
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

  test('Should be inactive in development', async ({ page }) => {
    const sourceUrl = `http://localhost:${appPort}/docs/old1`;

    await page.goto(sourceUrl, {
      waitUntil: 'networkidle',
    });
    await expect(page).toHaveURL(sourceUrl);
  });
});
