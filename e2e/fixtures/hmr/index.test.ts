import fs from 'node:fs/promises';
import path from 'node:path';
import { expect, test } from '@e2e/test';
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

test.describe('hmr test', async () => {
  let appPort: number;
  let app: Awaited<ReturnType<typeof runDevCommand>>;
  let originalContent: string;
  let originalFragmentContent: string;
  let originalNavContent: string;
  let originalMetaContent: string;
  let originalRestartFileContent: string;
  let devOutput = '';

  const getRestartCount = () =>
    devOutput.match(/restarting server as .* changed/g)?.length ?? 0;
  const getBuildCount = () => devOutput.match(/built in/g)?.length ?? 0;

  const waitForRestart = async (
    restartCount: number,
    previousBuildCount: number,
  ) => {
    await expect.poll(getRestartCount, { timeout: 5000 }).toBe(restartCount);
    await expect
      .poll(getBuildCount, { timeout: 5000 })
      .toBeGreaterThan(previousBuildCount);
  };

  test.beforeAll(async () => {
    const appDir = import.meta.dirname;
    appPort = await getPort();
    app = await runDevCommand(appDir, appPort);
    (app as { stdout?: NodeJS.ReadableStream }).stdout?.on('data', chunk => {
      devOutput += chunk.toString();
    });
    originalContent = await fs.readFile(TEST_FILE, 'utf-8');
    originalFragmentContent = await fs.readFile(TEST_FRAGMENT_FILE, 'utf-8');
    originalNavContent = await fs.readFile(TEST_NAV_FILE, 'utf-8');
    originalMetaContent = await fs.readFile(TEST_META_FILE, 'utf-8');
    originalRestartFileContent = await fs.readFile(TEST_RESTART_FILE, 'utf-8');
  });

  test.afterAll(async () => {
    if (app) {
      await killProcess(app);
    }
    await fs.writeFile(TEST_FILE, originalContent);
    await fs.writeFile(TEST_FRAGMENT_FILE, originalFragmentContent);
    await fs.writeFile(TEST_NAV_FILE, originalNavContent);
    await fs.writeFile(TEST_META_FILE, originalMetaContent);
    await fs.writeFile(TEST_RESTART_FILE, originalRestartFileContent);
    await fs.rm(TEST_ADDED_FILE, { force: true });
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

  test('restart when routes or config dependencies change', async ({
    page,
  }) => {
    const initialRestartCount = getRestartCount();

    try {
      let previousBuildCount = getBuildCount();
      await fs.writeFile(TEST_ADDED_FILE, '# Added route');
      await waitForRestart(initialRestartCount + 1, previousBuildCount);

      await expect
        .poll(
          async () => {
            try {
              await page.goto(
                `http://localhost:${appPort}/guide/test-temp-added.html`,
              );
              return page.locator('h1').textContent();
            } catch {
              return null;
            }
          },
          { timeout: 5000 },
        )
        .toContain('Added route');

      previousBuildCount = getBuildCount();
      await fs.rm(TEST_ADDED_FILE);
      await waitForRestart(initialRestartCount + 2, previousBuildCount);

      previousBuildCount = getBuildCount();
      await fs.writeFile(
        TEST_RESTART_FILE,
        originalRestartFileContent.replace('HMR fixture', 'Restarted fixture'),
      );
      await waitForRestart(initialRestartCount + 3, previousBuildCount);

      await expect
        .poll(
          async () => {
            try {
              await page.reload();
              return page.title();
            } catch {
              return '';
            }
          },
          { timeout: 5000 },
        )
        .toContain('Restarted fixture');
    } finally {
      const cleanupRestartCount = getRestartCount();
      const cleanupBuildCount = getBuildCount();
      await fs.rm(TEST_ADDED_FILE, { force: true });
      await fs.writeFile(TEST_RESTART_FILE, originalRestartFileContent);
      await expect
        .poll(getRestartCount, { timeout: 5000 })
        .toBeGreaterThan(cleanupRestartCount);
      await expect
        .poll(getBuildCount, { timeout: 5000 })
        .toBeGreaterThan(cleanupBuildCount);
    }
  });
});
