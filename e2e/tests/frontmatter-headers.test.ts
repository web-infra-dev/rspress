import { expect, test } from '@playwright/test';
import path from 'path';
import { getPort, killProcess, runDevCommand } from '../utils/runCommands';

const fixtureDir = path.resolve(__dirname, '../fixtures');

test.describe('frontmatter headers', async () => {
  let appPort;
  let app;
  test.beforeAll(async () => {
    const appDir = path.join(fixtureDir, 'frontmatter-headers');
    appPort = await getPort();
    app = await runDevCommand(appDir, appPort);
  });

  test.afterAll(async () => {
    if (app) {
      await killProcess(app);
    }
  });

  test('page specific headers should be injected', async ({ page }) => {
    await page.goto(`http://localhost:${appPort}`, {
      waitUntil: 'networkidle',
    });

    const customMetaContent = await page.$eval(
      'meta[name="custom-meta"]',
      customMeta => customMeta.getAttribute('content'),
    );
    expect(customMetaContent).toEqual('custom-meta-content');

    const customMetaContent2 = await page.getAttribute(
      'meta[name="custom-meta-2"]',
      'content',
    );
    expect(customMetaContent2).toEqual('custom-meta-content-2');
  });
});
