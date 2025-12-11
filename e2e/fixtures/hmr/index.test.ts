import fs from 'node:fs/promises';
import path from 'node:path';
import { expect, test } from '@playwright/test';
import { getPort, killProcess, runDevCommand } from '../../utils/runCommands';

const TEST_FILE = path.resolve(__dirname, 'doc/guide/test.mdx');
const TEST_FRAGMENT_FILE = path.resolve(
  __dirname,
  'doc/guide/_mdx-fragment.mdx',
);

const TEST_NAV_FILE = path.resolve(__dirname, 'doc/_nav.json');
const TEST_META_FILE = path.resolve(__dirname, 'doc/guide/_meta.json');

test.describe('hmr test', async () => {
  let appPort: number;
  let app: Awaited<ReturnType<typeof runDevCommand>>;
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

    // basic
    const helloParagraph = page.locator('p', { hasText: 'Hello world' });
    await expect(helloParagraph).toBeVisible();
    await fs.writeFile(
      TEST_FILE,
      originalContent.replace('Hello world', 'Hello hmr world'),
    );
    await expect(
      page.locator('p', { hasText: 'Hello hmr world' }),
    ).toBeVisible();

    // file code block
    await expect(page.getByText('This is mdx fragment')).toBeVisible();
    await fs.writeFile(
      TEST_FRAGMENT_FILE,
      originalFragmentContent.replace('This is', 'This is hmr'),
    );
    await expect(page.getByText('This is hmr mdx fragment')).toBeVisible();

    // _nav.json
    await expect(
      page.locator('.rp-nav-menu__item', { hasText: 'Guide' }),
    ).toBeVisible();
    await fs.writeFile(
      TEST_NAV_FILE,
      originalNavContent.replace('"Guide"', '"HMR Guide"'),
    );
    await expect(
      page.locator('.rp-nav-menu__item', { hasText: 'HMR Guide' }),
    ).toBeVisible();
    // _meta.json
    await expect(
      page.locator('.rp-sidebar-item span', { hasText: 'Test' }),
    ).toBeVisible();
    await fs.writeFile(TEST_META_FILE, '["foo"]');
    await expect(
      page.locator('.rp-sidebar-item span', { hasText: 'Foo' }),
    ).toBeVisible();
  });
});
