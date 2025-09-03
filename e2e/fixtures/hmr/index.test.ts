import { expect, test } from '@playwright/test';
import fs from 'fs/promises';
import path from 'path';
import { getPort, killProcess, runDevCommand } from '../../utils/runCommands';

const TEST_FILE = path.resolve(__dirname, 'doc/guide/test.mdx');
const TEST_FILE_FRAGMENT = path.resolve(
  __dirname,
  'doc/guide/_mdx-fragment.mdx',
);

test.describe('hmr test', async () => {
  let appPort;
  let app;
  let originalContent: string;
  let originalFragmentContent: string;
  test.beforeAll(async () => {
    const appDir = __dirname;
    appPort = await getPort();
    app = await runDevCommand(appDir, appPort);
    originalContent = await fs.readFile(TEST_FILE, 'utf-8');
    originalFragmentContent = await fs.readFile(TEST_FILE_FRAGMENT, 'utf-8');
  });

  test.afterAll(async () => {
    if (app) {
      await killProcess(app);
    }
    await fs.writeFile(TEST_FILE, originalContent);
    await fs.writeFile(TEST_FILE_FRAGMENT, originalFragmentContent);
  });

  test('Test page', async ({ page }) => {
    await page.goto(`http://localhost:${appPort}/guide/test.html`);
    await page.waitForSelector('p:text("Hello world")');

    // basic
    await expect(page.locator('p:text("Hello world")')).toBeVisible();
    await fs.writeFile(
      TEST_FILE,
      originalContent.replace('Hello world', 'Hello hmr world'),
    );
    await expect(page.locator('p:text("Hello hmr world")')).toBeVisible();

    // file code block
    await expect(page.locator('text=This is mdx fragment')).toBeVisible();
    await fs.writeFile(
      TEST_FILE_FRAGMENT,
      originalFragmentContent.replace('This is', 'This is hmr'),
    );
    await expect(page.locator('text=This is hmr mdx fragment')).toBeVisible();
  });
});
