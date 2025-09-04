import { expect, test } from '@playwright/test';
import fs from 'fs/promises';
import path from 'path';
import { getPort, killProcess, runDevCommand } from '../../utils/runCommands';

const TEST_FILE = path.resolve(__dirname, 'doc/guide/test.mdx');
const TEST_FRAGMENT_FILE = path.resolve(
  __dirname,
  'doc/guide/_mdx-fragment.mdx',
);

const TEST_NAV_FILE = path.resolve(__dirname, 'doc/_nav.json');
const TEST_META_FILE = path.resolve(__dirname, 'doc/guide/_meta.json');

test.describe('hmr test', async () => {
  let appPort;
  let app;
  let originalContent: string;
  let originalFragmentContent: string;
  let originalNavContent: string;
  let originalMetaContent: string;

  test.beforeAll(async () => {
    const appDir = __dirname;
    appPort = await getPort();
    app = await runDevCommand(appDir, appPort);
    originalContent = await fs.readFile(TEST_FILE, 'utf-8');
    originalFragmentContent = await fs.readFile(TEST_FRAGMENT_FILE, 'utf-8');
    originalNavContent = await fs.readFile(TEST_NAV_FILE, 'utf-8');
    originalMetaContent = await fs.readFile(TEST_META_FILE, 'utf-8');
  });

  test.afterAll(async () => {
    if (app) {
      await killProcess(app);
    }
    await fs.writeFile(TEST_FILE, originalContent);
    await fs.writeFile(TEST_FRAGMENT_FILE, originalFragmentContent);
    await fs.writeFile(TEST_NAV_FILE, originalNavContent);
    await fs.writeFile(TEST_META_FILE, originalMetaContent);
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
      TEST_FRAGMENT_FILE,
      originalFragmentContent.replace('This is', 'This is hmr'),
    );
    await expect(page.locator('text=This is hmr mdx fragment')).toBeVisible();

    // _nav.json
    await expect(
      page.locator('.rspress-nav-menu .rspress-nav-menu-item:text("Guide")'),
    ).toBeVisible();
    await fs.writeFile(
      TEST_NAV_FILE,
      originalNavContent.replace('"Guide"', '"HMR Guide"'),
    );
    await expect(
      page.locator(
        '.rspress-nav-menu .rspress-nav-menu-item:text("HMR Guide")',
      ),
    ).toBeVisible();
    // _meta.json
    await expect(
      page.locator('.rspress-sidebar-item :text("Test")'),
    ).toBeVisible();
    await fs.writeFile(TEST_META_FILE, '["Foo"]');
    await expect(
      page.locator('.rspress-sidebar-item :text("Foo")'),
    ).toBeVisible();
  });
});
