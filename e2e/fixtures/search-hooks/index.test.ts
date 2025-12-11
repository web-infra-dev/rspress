import { expect, type Page, test } from '@playwright/test';
import { getPort, killProcess, runDevCommand } from '../../utils/runCommands';
import { searchInPage } from '../../utils/search';

function proxyConsole(page: Page) {
  const infoList: string[] = [];
  page.on('console', async msg => {
    if (msg.type() === 'info') {
      const values = await Promise.all(msg.args().map(i => i.jsonValue()));
      if (values[0] === 'beforeSearch' || values[0] === 'onSearch') {
        infoList.push(...values);
      }
    }
  });
  return {
    infoList,
  };
}

test.describe('search hooks', async () => {
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

  test('search-hooks should work', async ({ page }) => {
    await page.goto(`http://localhost:${appPort}/base/`);
    const { infoList } = proxyConsole(page);
    const suggestItems0 = await searchInPage(page, 'Foo');
    expect(suggestItems0.length).toBe(1);
    expect(infoList).toEqual(['beforeSearch', 'Foo', 'onSearch', 'Foo']);
  });
});
