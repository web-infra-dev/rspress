import { expect, test } from '@playwright/test';
import path from 'path';
import fs from 'fs';
import { getPort, killProcess, runDevCommand } from '../utils/runCommands';

const fixtureDir = path.resolve(__dirname, '../fixtures');
const structPath = path.resolve(fixtureDir, './annotation/doc/struct')

test.describe('basic test', async () => {
  let appPort;
  let app;
  test.beforeAll(async () => {
    const appDir = path.join(fixtureDir, 'annotation');
    appPort = await getPort();
    app = await runDevCommand(appDir, appPort);
  });

  test.afterAll(async () => {
    if (app) {
      await killProcess(app);
    }
  });

  test('should show 404 page if there has no .rspress-doc', async ({ page }) => {
    await page.goto(`http://localhost:${appPort}/not-found`, {
      waitUntil: 'networkidle',
    });
    const text = await page.evaluate(() => document.body.textContent);
    expect(text).toContain('404');
  });

  test('copy in codeblock should works', async ({ page }) => {
    await page.goto(`http://localhost:${appPort}/struct/codeblock`, {
      waitUntil: 'networkidle',
    });
    const locator = page.locator(".language-javascript>.rspress-code-content>.copy")
    await expect(locator.evaluate((el) => el.nodeName)).resolves.toBe("BUTTON")
    await locator.click()
    const text = await page.evaluate("navigator.clipboard.readText()");
    expect(text).toBe("codeblock")
  })

  fs.readdirSync(structPath).forEach((struct) => {
    let item: string = struct;
    if (struct.endsWith('.md')) {
      item = struct.slice(0, struct.length - 3)
    } else if (struct.endsWith('.mdx')) {
      item = struct.slice(0, struct.length - 4)
    }
    test(`should has stable struct - ${item}`, async ({ page }) => {
      await page.goto(`http://localhost:${appPort}/struct/${item}`, {
        waitUntil: 'networkidle',
      });
      const html = await page.locator('.rspress-doc').innerHTML();
      expect(html).toMatchSnapshot()
    })
  })
});
