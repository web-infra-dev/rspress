import { expect, test } from '@playwright/test';
import { getPort, killProcess, runDevCommand } from '../../utils/runCommands';

test.describe('route.cleanUrlsRedirect', () => {
  let cleanUrlApp: Awaited<ReturnType<typeof runDevCommand>>;
  let cleanUrlPort: number;
  let disabledApp: Awaited<ReturnType<typeof runDevCommand>>;
  let disabledPort: number;
  let htmlUrlApp: Awaited<ReturnType<typeof runDevCommand>>;
  let htmlUrlPort: number;

  test.beforeAll(async () => {
    const appDir = import.meta.dirname;

    htmlUrlPort = await getPort();
    htmlUrlApp = await runDevCommand(appDir, htmlUrlPort);

    cleanUrlPort = await getPort();
    cleanUrlApp = await runDevCommand(
      appDir,
      cleanUrlPort,
      'rspress.clean-urls.config.ts',
    );

    disabledPort = await getPort();
    disabledApp = await runDevCommand(
      appDir,
      disabledPort,
      'rspress.disabled.config.ts',
    );
  });

  test.afterAll(async () => {
    await Promise.all([
      killProcess(htmlUrlApp),
      killProcess(cleanUrlApp),
      killProcess(disabledApp),
    ]);
  });

  test('normalizes matched routes when cleanUrls is false', async ({
    page,
  }) => {
    const cases = [
      [
        '/docs/zh/guide/start/introduction',
        '/docs/zh/guide/start/introduction.html',
      ],
      [
        '/docs/zh/guide/start/introduction/',
        '/docs/zh/guide/start/introduction.html',
      ],
      [
        '/docs/zh/guide/start/introduction/index.html',
        '/docs/zh/guide/start/introduction.html',
      ],
      ['/docs/zh/folder/', '/docs/zh/folder/index.html'],
    ] as const;

    for (const [incomingUrl, expectedUrl] of cases) {
      await page.goto(`http://localhost:${htmlUrlPort}${incomingUrl}`, {
        waitUntil: 'networkidle',
      });
      await expect(page).toHaveURL(
        `http://localhost:${htmlUrlPort}${expectedUrl}`,
      );
      await expect(page.locator('.rspress-doc')).toBeVisible();
    }
  });

  test('normalizes matched routes when cleanUrls is true', async ({ page }) => {
    const cases = [
      [
        '/docs/zh/guide/start/introduction.html',
        '/docs/zh/guide/start/introduction',
      ],
      [
        '/docs/zh/guide/start/introduction/',
        '/docs/zh/guide/start/introduction',
      ],
      [
        '/docs/zh/guide/start/introduction/index.html',
        '/docs/zh/guide/start/introduction',
      ],
      ['/docs/zh/folder/index.html', '/docs/zh/folder/'],
    ] as const;

    for (const [incomingUrl, expectedUrl] of cases) {
      await page.goto(`http://localhost:${cleanUrlPort}${incomingUrl}`, {
        waitUntil: 'networkidle',
      });
      await expect(page).toHaveURL(
        `http://localhost:${cleanUrlPort}${expectedUrl}`,
      );
      await expect(page.locator('.rspress-doc')).toBeVisible();
    }
  });

  test('does not normalize matched routes when disabled', async ({ page }) => {
    const pathname = '/docs/zh/guide/start/introduction.html';

    await page.goto(`http://localhost:${disabledPort}${pathname}`, {
      waitUntil: 'networkidle',
    });

    await expect(page).toHaveURL(`http://localhost:${disabledPort}${pathname}`);
    await expect(page.locator('.rspress-doc')).toBeVisible();
  });
});
