import { expect, test } from '@e2e/test';
import { getPort, killProcess, runDevCommand } from '../../utils/runCommands';

test.describe('replace rules', async () => {
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

  test('replaces text in the document title metadata', async ({ page }) => {
    await page.goto(`http://localhost:${appPort}/foo`, {
      waitUntil: 'networkidle',
    });
    // text in string frontmatter
    const title = await page.$('title');
    expect(await title?.textContent()).toBe('bar-title');
  });
});
