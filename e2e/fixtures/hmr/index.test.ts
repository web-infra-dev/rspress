import fs from 'node:fs/promises';
import path from 'node:path';
import { expect, test } from '@playwright/test';
import { getPort, killProcess, runDevCommand } from '../../utils/runCommands';

const TEST_FILE = path.resolve(import.meta.dirname, 'doc/guide/test.mdx');
const TEST_FRAGMENT_FILE = path.resolve(
  import.meta.dirname,
  'doc/guide/_mdx-fragment.mdx',
);

const TEST_NAV_FILE = path.resolve(import.meta.dirname, 'doc/_nav.json');
const TEST_META_FILE = path.resolve(
  import.meta.dirname,
  'doc/guide/_meta.json',
);
const TEST_ADDED_FILE = path.resolve(
  import.meta.dirname,
  'doc/guide/test-temp-added.mdx',
);
const TEST_RESTART_FILE = path.resolve(import.meta.dirname, 'siteConfig.ts');

test.describe.configure({ mode: 'serial' });

function createRestartCounter(app: Awaited<ReturnType<typeof runDevCommand>>) {
  let devOutput = '';
  (app as { stdout?: NodeJS.ReadableStream }).stdout?.on('data', chunk => {
    devOutput += chunk.toString();
  });
  return () => devOutput.match(/restarting server as .* changed/g)?.length ?? 0;
}

test.describe('hmr test', async () => {
  let appPort: number;
  let app: Awaited<ReturnType<typeof runDevCommand>>;
  let originalContent: string;
  let originalFragmentContent: string;
  let originalNavContent: string;
  let originalMetaContent: string;
  let getRestartCount: () => number;

  test.beforeAll(async () => {
    const appDir = import.meta.dirname;
    appPort = await getPort();
    app = await runDevCommand(appDir, appPort);
    getRestartCount = createRestartCounter(app);
    originalContent = await fs.readFile(TEST_FILE, 'utf-8');
    originalFragmentContent = await fs.readFile(TEST_FRAGMENT_FILE, 'utf-8');
    originalNavContent = await fs.readFile(TEST_NAV_FILE, 'utf-8');
    originalMetaContent = await fs.readFile(TEST_META_FILE, 'utf-8');
  });

  test.afterAll(async () => {
    try {
      if (app) {
        await killProcess(app);
      }
    } finally {
      await fs.writeFile(TEST_FILE, originalContent);
      await fs.writeFile(TEST_FRAGMENT_FILE, originalFragmentContent);
      await fs.writeFile(TEST_NAV_FILE, originalNavContent);
      await fs.writeFile(TEST_META_FILE, originalMetaContent);
    }
  });

  test('Test page', async ({ page }) => {
    await page.goto(`http://localhost:${appPort}/guide/test.html`, {
      waitUntil: 'networkidle',
    });

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
    expect(getRestartCount()).toBe(0);
  });
});

test.describe('route restart test', async () => {
  let appPort: number;
  let app: Awaited<ReturnType<typeof runDevCommand>>;
  let getRestartCount: () => number;

  test.beforeAll(async () => {
    const appDir = import.meta.dirname;
    appPort = await getPort();
    app = await runDevCommand(appDir, appPort);
    getRestartCount = createRestartCounter(app);
  });

  test.afterAll(async () => {
    try {
      if (app) {
        await killProcess(app);
      }
    } finally {
      await fs.rm(TEST_ADDED_FILE, { force: true });
    }
  });

  test('restart when routes are added or removed', async ({ page }) => {
    await page.goto(`http://localhost:${appPort}/guide/test.html`, {
      waitUntil: 'networkidle',
    });
    await expect(page).toHaveTitle(/HMR fixture/);

    await fs.writeFile(TEST_ADDED_FILE, '# Added route');
    await expect.poll(getRestartCount).toBe(1);

    await expect
      .poll(async () => {
        try {
          await page.goto(
            `http://localhost:${appPort}/guide/test-temp-added.html`,
          );
          return page.locator('h1').textContent();
        } catch {
          return null;
        }
      })
      .toContain('Added route');

    await fs.rm(TEST_ADDED_FILE);
    await expect.poll(getRestartCount).toBe(2);

    await expect
      .poll(async () => {
        try {
          await page.goto(
            `http://localhost:${appPort}/guide/test-temp-added.html`,
          );
          return page.locator('body').textContent();
        } catch {
          return null;
        }
      })
      .toContain('404');
  });
});

test.describe('config dependency restart test', async () => {
  let appPort: number;
  let app: Awaited<ReturnType<typeof runDevCommand>>;
  let originalRestartFileContent: string;
  let getRestartCount: () => number;

  test.beforeAll(async () => {
    const appDir = import.meta.dirname;
    originalRestartFileContent = await fs.readFile(TEST_RESTART_FILE, 'utf-8');
    appPort = await getPort();
    app = await runDevCommand(appDir, appPort);
    getRestartCount = createRestartCounter(app);
  });

  test.afterAll(async () => {
    try {
      if (app) {
        await killProcess(app);
      }
    } finally {
      await fs.writeFile(TEST_RESTART_FILE, originalRestartFileContent);
    }
  });

  test('restart when config dependencies change', async ({ page }) => {
    const pageUrl = `http://localhost:${appPort}/guide/test.html`;
    await page.goto(pageUrl, { waitUntil: 'networkidle' });
    await expect(page).toHaveTitle(/HMR fixture/);

    await fs.writeFile(
      TEST_RESTART_FILE,
      originalRestartFileContent.replace('HMR fixture', 'Restarted fixture'),
    );
    await expect.poll(getRestartCount).toBe(1);

    await expect
      .poll(async () => {
        try {
          await page.goto(pageUrl);
          return page.title();
        } catch {
          return '';
        }
      })
      .toContain('Restarted fixture');
  });
});
