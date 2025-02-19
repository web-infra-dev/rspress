import path from 'node:path';
import { expect, test } from '@playwright/test';
import { getPort, killProcess, runDevCommand } from '../utils/runCommands';
import { searchInPage } from '../utils/search';

const fixtureDir = path.resolve(__dirname, '../fixtures');

test.describe('search code blocks test', async () => {
  let appPort;
  let app;

  test.beforeAll(async () => {
    const appDir = path.join(fixtureDir, 'search-code-blocks');
    appPort = await getPort();
    app = await runDevCommand(appDir, appPort);
  });

  test.afterAll(async () => {
    if (app) {
      await killProcess(app);
    }
  });

  test('search index should include content of code blocks', async ({
    page,
  }) => {
    await page.goto(`http://localhost:${appPort}`);

    // inline code block
    const suggestItems0 = await searchInPage(
      page,
      'hello from inline code block',
    );
    expect(suggestItems0.length).toBe(1);
    const suggestItems1 = await searchInPage(
      page,
      'hello from <React.inline />',
    );
    expect(suggestItems1.length).toBe(1);

    // js code block
    const suggestItems2 = await searchInPage(page, 'hello from js code block');
    expect(suggestItems2.length).toBe(1);

    // jsx code block
    const suggestItems3 = await searchInPage(page, '<HelloFromJsxCodeBlock />');
    expect(suggestItems3.length).toBe(1);
  });
});
