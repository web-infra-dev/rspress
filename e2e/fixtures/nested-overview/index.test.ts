import { expect, test } from '@playwright/test';
import { getPort, killProcess, runDevCommand } from '../../utils/runCommands';

test.describe('Nested overview page', async () => {
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

  test('Should load nested overview page correctly - level 1', async ({
    page,
  }) => {
    await page.goto(
      `http://localhost:${appPort}/base-url/basic-level-1/index.html`,
      {
        waitUntil: 'networkidle',
      },
    );
    const overviewHeadings = page.locator(
      '.rp-overview h2.rspress-doc-outline span',
    );
    await expect(overviewHeadings).toHaveText(['Level 2']);

    const overviewGroups = page.locator(
      '.rp-overview .rp-overview-group__item__title > a',
    );
    await expect(overviewGroups).toHaveText(['Level 2', 'two', 'Level 3']);
  });

  test('Should load nested overview page correctly - level 2', async ({
    page,
  }) => {
    await page.goto(
      `http://localhost:${appPort}/base-url/basic-level-1/level-2/index.html`,
      {
        waitUntil: 'networkidle',
      },
    );
    const overviewHeadings = page.locator(
      '.rp-overview h2.rspress-doc-outline span',
    );
    await expect(overviewHeadings).toHaveText(['two', 'Level 3']);

    const overviewGroups = page.locator(
      '.rp-overview .rp-overview-group__item__title > a',
    );
    await expect(overviewGroups).toHaveText(['two', 'Level 3', 'three']);
  });

  test('Should load nested overview page correctly - level 3', async ({
    page,
  }) => {
    await page.goto(
      `http://localhost:${appPort}/base-url/basic-level-1/level-2/level-3/index.html`,
      {
        waitUntil: 'networkidle',
      },
    );
    const overviewHeadings = page.locator(
      '.rp-overview h2.rspress-doc-outline span',
    );
    await expect(overviewHeadings).toHaveText(['three']);

    const overviewGroups = page.locator(
      '.rp-overview .rp-overview-group__item__title > a',
    );
    await expect(overviewGroups).toHaveText(['three']);
  });
});
