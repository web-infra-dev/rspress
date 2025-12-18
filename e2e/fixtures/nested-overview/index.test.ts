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
      '.rp-overview h2.rp-toc-include span',
    );
    await expect(overviewHeadings).toHaveText(['Level 2']);

    // Items can be in either standard layout or grid layout
    const standardItems = page.locator(
      '.rp-overview .rp-overview-group__item__title > a',
    );
    const gridItems = page.locator(
      '.rp-overview .rp-overview-group__grid-item__link',
    );

    // Get text from both selectors and combine
    const standardText = await standardItems.allTextContents();
    const gridText = await gridItems.allTextContents();
    const allText = [...standardText, ...gridText];

    expect(allText).toEqual(['two', 'Level 2', 'Level 3']);
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
      '.rp-overview h2.rp-toc-include span',
    );
    await expect(overviewHeadings).toHaveText(['two', 'Level 3']);

    // Items can be in either standard layout or grid layout
    const standardItems = page.locator(
      '.rp-overview .rp-overview-group__item__title > a',
    );
    const gridItems = page.locator(
      '.rp-overview .rp-overview-group__grid-item__link',
    );

    // Get text from both selectors and combine
    const standardText = await standardItems.allTextContents();
    const gridText = await gridItems.allTextContents();
    const allText = [...standardText, ...gridText];

    // Items with headers (standard layout) come first, then items without headers (grid layout)
    expect(allText).toEqual(['two', 'three', 'Level 3']);
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
      '.rp-overview h2.rp-toc-include span',
    );
    await expect(overviewHeadings).toHaveText(['three']);

    // Items can be in either standard layout or grid layout
    const standardItems = page.locator(
      '.rp-overview .rp-overview-group__item__title > a',
    );
    const gridItems = page.locator(
      '.rp-overview .rp-overview-group__grid-item__link',
    );

    // Get text from both selectors and combine
    const standardText = await standardItems.allTextContents();
    const gridText = await gridItems.allTextContents();
    const allText = [...standardText, ...gridText];

    expect(allText).toEqual(['three']);
  });
});
