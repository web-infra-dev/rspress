import fs from 'node:fs/promises';
import path from 'node:path';
import { expect, test } from '@e2e/test';
import {
  getPort,
  killProcess,
  runDevCommand,
  runBuildCommand,
  runPreviewCommand,
} from '../../utils/runCommands';

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
const HMR_TIMEOUT = 30_000;

test.describe('HMR', async () => {
  let appPort: number;
  let app: Awaited<ReturnType<typeof runDevCommand>> | null = null;
  let originalContent: string;
  let originalFragmentContent: string;
  let originalNavContent: string;
  let originalMetaContent: string;
  let originalRestartFileContent: string;
  let devOutput = '';

  const getRestartCount = () =>
    devOutput.match(/restarting server as .* changed/g)?.length ?? 0;

  test.beforeAll(async () => {
    originalContent = await fs.readFile(TEST_FILE, 'utf-8');
    originalFragmentContent = await fs.readFile(TEST_FRAGMENT_FILE, 'utf-8');
    originalNavContent = await fs.readFile(TEST_NAV_FILE, 'utf-8');
    originalMetaContent = await fs.readFile(TEST_META_FILE, 'utf-8');
    originalRestartFileContent = await fs.readFile(TEST_RESTART_FILE, 'utf-8');

    appPort = await getPort();
    app = await runDevCommand(import.meta.dirname, appPort);
    (app as { stdout?: NodeJS.ReadableStream }).stdout?.on('data', chunk => {
      devOutput += chunk.toString();
    });
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

  test('update page content without restarting', async ({ page }) => {
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
    const addedPageUrl = `http://localhost:${appPort}/guide/test-temp-added.html`;
    const stablePageUrl = `http://localhost:${appPort}/guide/test.html`;
    // Ensure the initial file watchers are ready before the first mutation.
    await page.goto(stablePageUrl, {
      waitUntil: 'networkidle',
    });

    const initialRestartCount = getRestartCount();

    try {
      await fs.writeFile(TEST_ADDED_FILE, '# Added route');
      await expect
        .poll(getRestartCount, { timeout: HMR_TIMEOUT })
        .toBe(initialRestartCount + 1);

      await expect
        .poll(
          async () => {
            try {
              await page.goto(addedPageUrl, { timeout: 10_000 });
              return page.locator('h1').textContent();
            } catch {
              return null;
            }
          },
          { timeout: HMR_TIMEOUT },
        )
        .toContain('Added route');

      await fs.rm(TEST_ADDED_FILE);
      await expect
        .poll(getRestartCount, { timeout: HMR_TIMEOUT })
        .toBe(initialRestartCount + 2);

      // The 404 confirms that the unlink restart finished before the next change.
      await expect
        .poll(
          async () => {
            try {
              await page.goto(addedPageUrl, { timeout: 10_000 });
              return page.locator('body').textContent();
            } catch {
              return null;
            }
          },
          { timeout: HMR_TIMEOUT },
        )
        .toContain('404');

      await fs.writeFile(
        TEST_RESTART_FILE,
        originalRestartFileContent.replace('HMR fixture', 'Restarted fixture'),
      );
      await expect
        .poll(getRestartCount, { timeout: HMR_TIMEOUT })
        .toBe(initialRestartCount + 3);

      await expect
        .poll(
          async () => {
            try {
              await page.goto(stablePageUrl, { timeout: 10_000 });
              return page.title();
            } catch {
              return '';
            }
          },
          { timeout: HMR_TIMEOUT },
        )
        .toContain('Restarted fixture');
    } finally {
      const cleanupRestartCount = getRestartCount();
      await fs.rm(TEST_ADDED_FILE, { force: true });
      await fs.writeFile(TEST_RESTART_FILE, originalRestartFileContent);
      await expect
        .poll(getRestartCount, { timeout: HMR_TIMEOUT })
        .toBeGreaterThan(cleanupRestartCount);
    }
  });
});

test.describe('HMR with lazy compilation', async () => {
  let appPort: number;
  let app: Awaited<ReturnType<typeof runDevCommand>> | null = null;
  let originalNavContent: string;

  test.beforeAll(async () => {
    originalNavContent = await fs.readFile(TEST_NAV_FILE, 'utf-8');
    appPort = await getPort();
    app = await runDevCommand(
      import.meta.dirname,
      appPort,
      'rspress.lazy.config.ts',
    );
  });

  test.afterAll(async () => {
    if (app) {
      await killProcess(app);
    }
    await fs.writeFile(TEST_NAV_FILE, originalNavContent);
  });

  test('updates site data without a full reload', async ({ page }) => {
    await page.goto(`http://localhost:${appPort}/guide/test.html`, {
      waitUntil: 'networkidle',
    });

    await expect(
      page.locator('.rp-nav-menu__item', { hasText: 'Guide' }),
    ).toBeVisible();
    await page.evaluate(() => {
      (window as Window & { __rspressHmrMarker?: string }).__rspressHmrMarker =
        'preserved';
    });

    await fs.writeFile(
      TEST_NAV_FILE,
      originalNavContent.replace('"Guide"', '"HMR Guide"'),
    );

    await expect(
      page.locator('.rp-nav-menu__item', { hasText: 'HMR Guide' }),
    ).toBeVisible();
    expect(
      await page.evaluate(
        () =>
          (window as Window & { __rspressHmrMarker?: string })
            .__rspressHmrMarker,
      ),
    ).toBe('preserved');
  });
});

test.describe('virtual module HMR', () => {
  let appPort: number;
  let app: Awaited<ReturnType<typeof runDevCommand>>;
  const filenames = [
    'i18n.json',
    'searchHooks.tsx',
    'global.css',
    'virtualProbe.tsx',
  ];
  const originals = new Map<string, string>();

  test.beforeAll(async () => {
    for (const filename of filenames) {
      originals.set(
        filename,
        await fs.readFile(path.join(import.meta.dirname, filename), 'utf-8'),
      );
    }
    appPort = await getPort();
    app = await runDevCommand(
      import.meta.dirname,
      appPort,
      'rspress.lazy.config.ts',
    );
  });

  test.afterAll(async () => {
    if (app) await killProcess(app);
    for (const [filename, content] of originals) {
      await fs.writeFile(path.join(import.meta.dirname, filename), content);
    }
  });

  test('updates translations, search hooks, global components and styles without reloading', async ({
    page,
  }) => {
    await page.goto(`http://localhost:${appPort}/guide/test.html`, {
      waitUntil: 'networkidle',
    });
    const probe = page.getByTestId('virtual-probe');
    await expect(probe.getByText('Translation before')).toBeVisible();
    await expect(probe.getByText('Search hook before')).toBeVisible();
    await expect(probe).toHaveCSS('color', 'rgb(1, 2, 3)');
    await probe.getByRole('button', { name: 'Count: 0' }).click();
    await page.evaluate(() => {
      (window as Window & { __rspressHmrMarker?: string }).__rspressHmrMarker =
        'preserved';
    });

    const update = async (filename: string, before: string, after: string) => {
      await fs.writeFile(
        path.join(import.meta.dirname, filename),
        originals.get(filename)!.replace(before, after),
      );
    };
    await update('i18n.json', 'Translation before', 'Translation after');
    await expect(probe.getByText('Translation after')).toBeVisible();
    await update('searchHooks.tsx', 'Search hook before', 'Search hook after');
    await expect(probe.getByText('Search hook after')).toBeVisible();
    // Export removal must also replace the namespace snapshot.
    await fs.writeFile(
      path.join(import.meta.dirname, 'searchHooks.tsx'),
      'export const onSearch = () => [];',
    );
    await expect(probe.getByText('No custom renderer')).toBeVisible();
    await update('global.css', 'rgb(1, 2, 3)', 'rgb(4, 5, 6)');
    await expect(probe).toHaveCSS('color', 'rgb(4, 5, 6)');
    await update('virtualProbe.tsx', 'Count:', 'Updated count:');
    await expect(
      probe.getByRole('button', { name: 'Updated count: 1' }),
    ).toBeVisible();
    expect(
      await page.evaluate(
        () =>
          (window as Window & { __rspressHmrMarker?: string })
            .__rspressHmrMarker,
      ),
    ).toBe('preserved');
  });
});

test.describe('virtual modules in production', () => {
  let appPort: number;
  let app: Awaited<ReturnType<typeof runPreviewCommand>>;

  test.beforeAll(async () => {
    await runBuildCommand(import.meta.dirname, 'rspress.lazy.config.ts');
    appPort = await getPort();
    app = await runPreviewCommand(import.meta.dirname, appPort, [
      '-c',
      'rspress.lazy.config.ts',
    ]);
  });

  test.afterAll(async () => {
    if (app) await killProcess(app);
  });

  test('preserves virtual data and global styles in the production build', async ({
    page,
  }) => {
    await page.goto(`http://localhost:${appPort}/guide/test.html`);
    const probe = page.getByTestId('virtual-probe');
    await expect(probe.getByText('Translation before')).toBeVisible();
    await expect(probe.getByText('Search hook before')).toBeVisible();
    await expect(probe).toHaveCSS('color', 'rgb(1, 2, 3)');
    await expect(
      page
        .locator('a[href="https://github.com/web-infra-dev/rspress"] svg')
        .first(),
    ).toBeVisible();
    await probe.getByRole('button', { name: 'Count: 0' }).click();
    await expect(probe.getByRole('button', { name: 'Count: 1' })).toBeVisible();
  });
});
