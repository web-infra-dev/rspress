import { expect, type Page, test } from '@playwright/test';
import { getPort, killProcess, runDevCommand } from '../../utils/runCommands';
import { searchInPage } from '../../utils/search';

function proxyConsole(page: Page) {
  const infoList: string[] = [];
  page.on('console', async msg => {
    if (msg.type() === 'info') {
      const values = await Promise.all(msg.args().map(i => i.jsonValue()));
      infoList.push(...values);
    }
  });
  return {
    infoList,
  };
}

test.describe('search code blocks test', async () => {
  let appPort;
  let app;

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

  test('search-hooks should work', async ({ page }) => {
    await page.goto(`http://localhost:${appPort}`);
    const { infoList } = proxyConsole(page);
    const suggestItems0 = await searchInPage(page, 'Sear');
    expect(suggestItems0.length).toBe(1);
    expect(infoList).toEqual(['beforeSearch', 'Sear', 'onSearch', 'Sear']);
  });
});
