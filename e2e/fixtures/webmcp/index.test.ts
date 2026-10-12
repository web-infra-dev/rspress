import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { expect, type Page, test } from '@e2e/test';
import { chromium } from 'playwright';
import {
  getPort,
  killProcess,
  runBuildCommand,
  runDevCommand,
  runPreviewCommand,
} from '../../utils/runCommands';

type Tool = {
  name: string;
  annotations?: Record<string, boolean>;
  execute: (input: unknown, options: { signal?: AbortSignal }) => unknown;
};
declare global {
  interface Window {
    webMcpTest: {
      list(): string[];
      annotations(name: string): Tool['annotations'];
      run(name: string, input?: unknown, signal?: AbortSignal): Promise<any>;
      registrations: string[][];
      registrationNames: string[];
    };
    navigationResult?: any;
    navigationError?: string;
  }
}

// Only the browser API is substituted. The real runtime, router, network,
// generated Markdown and local search run in the browser without a polyfill.
async function installModelContext(page: Page, failure?: 'sync' | 'async') {
  await page.addInitScript(
    ({ failure }) => {
      const tools = new Map<string, Tool>();
      const registrations: string[][] = [];
      const registrationNames: string[] = [];
      Object.defineProperty(document, 'modelContext', {
        configurable: true,
        value: {
          registerTool(
            tool: Tool,
            options: { signal: AbortSignal; exposedTo?: string[] },
          ) {
            if (failure === 'sync') throw new Error('registration denied');
            if (failure === 'async')
              return Promise.reject(new Error('registration denied'));
            if (options.signal.aborted) return;
            if (tools.has(tool.name))
              throw new Error(`Duplicate tool: ${tool.name}`);
            tools.set(tool.name, tool);
            registrations.push(options.exposedTo ?? []);
            registrationNames.push(tool.name);
            options.signal.addEventListener(
              'abort',
              () => tools.delete(tool.name),
              { once: true },
            );
          },
        },
      });
      window.webMcpTest = {
        list: () => [...tools.keys()].sort(),
        annotations: name => tools.get(name)?.annotations,
        async run(name, input = {}, signal) {
          const tool = tools.get(`rspress_${name}`);
          if (!tool) throw new Error(`Missing tool: ${name}`);
          return tool.execute(input, { signal });
        },
        registrations,
        registrationNames,
      };
    },
    { failure },
  );
}

function run(page: Page, name: string, input: unknown = {}) {
  return page.evaluate(
    ({ name, input }) => window.webMcpTest.run(name, input),
    { name, input },
  );
}

const allTools = [
  'get_current_page',
  'get_page',
  'get_site_info',
  'list_pages',
  'navigate',
  'search_docs',
].map(name => `rspress_${name}`);

for (const mode of ['dev', 'build'] as const) {
  test.describe(`WebMCP (${mode})`, () => {
    let app: Awaited<ReturnType<typeof runDevCommand>>;
    let port: number;
    test.beforeAll(async () => {
      port = await getPort();
      if (mode === 'dev') {
        app = await runDevCommand(import.meta.dirname, port);
      } else {
        await runBuildCommand(import.meta.dirname);
        app = await runPreviewCommand(import.meta.dirname, port);
      }
    });
    test.afterAll(async () => {
      await killProcess(app);
    });
    test.beforeEach(async ({ page }) => {
      await installModelContext(page);
      await page.goto(`http://localhost:${port}/docs/`);
      await expect
        .poll(() => page.evaluate(() => window.webMcpTest.list()))
        .toEqual(
          mode === 'build'
            ? allTools
            : allTools.filter(
                name =>
                  !['rspress_get_page', 'rspress_get_current_page'].includes(
                    name,
                  ),
              ),
        );
    });

    test('discovers tools and site context without initializing search', async ({
      page,
    }) => {
      await page.waitForLoadState('networkidle');
      const names = await page.evaluate(() => window.webMcpTest.list());
      expect(names).toEqual(
        mode === 'build'
          ? allTools
          : allTools.filter(
              name =>
                !['rspress_get_page', 'rspress_get_current_page'].includes(
                  name,
                ),
            ),
      );
      expect(await run(page, 'get_site_info')).toMatchObject({
        title: 'WebMCP docs',
        base: '/docs/',
        lang: 'en',
        version: 'v1',
        versions: ['v1', 'v2'],
        defaultVersion: 'v1',
      });
      expect((await run(page, 'get_site_info')).sidebar.length).toBeGreaterThan(
        0,
      );
      // The theme may prefetch the index through a link before any search.
      expect(
        await page.evaluate(() =>
          performance
            .getEntriesByType('resource')
            .some(
              entry =>
                entry.name.includes('search_index') &&
                (entry as PerformanceResourceTiming).initiatorType === 'fetch',
            ),
        ),
      ).toBe(false);
      expect(
        await page.evaluate(() =>
          window.webMcpTest.registrations.every(origins =>
            origins.includes('https://agent.example'),
          ),
        ),
      ).toBe(true);
    });

    test('filters and paginates page discovery', async ({ page }) => {
      expect(
        await run(page, 'list_pages', { limit: 1, offset: 2 }),
      ).toMatchObject({
        total: 3,
        offset: 2,
        limit: 1,
        pages: [{ title: 'v1 en home' }],
      });
      expect(await run(page, 'list_pages', { query: 'install' })).toMatchObject(
        { total: 1, pages: [{ routePath: '/guide' }] },
      );
      expect(
        await run(page, 'list_pages', { lang: 'zh', version: 'v2' }),
      ).toMatchObject({ total: 2 });
    });

    test('searches local content and refreshes language and version context', async ({
      page,
    }) => {
      expect(
        JSON.stringify(await run(page, 'search_docs', { query: 'cobalt' })),
      ).toContain('v1 en home');
      await run(page, 'navigate', { routePath: '/zh/' });
      expect(
        JSON.stringify(await run(page, 'search_docs', { query: 'jade' })),
      ).toContain('v1 zh home');
      expect(
        JSON.stringify(await run(page, 'search_docs', { query: 'cobalt' })),
      ).not.toContain('v1 en home');
      await run(page, 'navigate', { routePath: '/v2/' });
      expect(
        JSON.stringify(await run(page, 'search_docs', { query: 'amber' })),
      ).toContain('v2 en home');
      expect(await run(page, 'get_site_info')).toMatchObject({
        lang: 'en',
        version: 'v2',
      });
      expect(await run(page, 'list_pages')).toMatchObject({
        total: 2,
        pages: [{ version: 'v2' }, { version: 'v2' }],
      });
    });

    test('shares the search provider with the UI while the popup is closed', async ({
      page,
    }) => {
      const requests: string[] = [];
      page.on('request', request => {
        if (
          request.url().includes('search_index') &&
          request.resourceType() === 'fetch'
        )
          requests.push(request.url());
      });
      expect(
        JSON.stringify(await run(page, 'search_docs', { query: 'cobalt' })),
      ).toContain('v1 en home');
      await page.locator('.rp-search-button').click();
      await page.locator('.rp-search-panel__input').fill('cobalt');
      await expect(page.locator('.rp-suggest-item').first()).toContainText(
        'v1 en home',
      );
      await page.keyboard.press('Escape');
      await expect(page.locator('.rp-search-panel__input')).not.toBeVisible();
      expect(
        JSON.stringify(await run(page, 'search_docs', { query: 'cobalt' })),
      ).toContain('v1 en home');
      expect(requests).toHaveLength(1);
    });

    test('returns committed page context, sections and adjacent links with query/hash', async ({
      page,
    }) => {
      const result = await page.evaluate(async () => {
        const result = await window.webMcpTest.run('navigate', {
          routePath: '/guide.html?source=agent#install',
        });
        return { result, heading: document.querySelector('h1')?.textContent };
      });
      expect(result.heading).toContain('v1 en guide');
      expect(result.result).toMatchObject({
        routePath: '/guide?source=agent#install',
        page: { title: 'v1 en guide' },
        sections: [
          { title: 'Install', routePath: '/guide?source=agent#install' },
          { title: 'Usage', routePath: '/guide?source=agent#usage' },
        ],
        previousPage: { routePath: '/' },
        nextPage: null,
      });
      await expect(page).toHaveURL(
        `http://localhost:${port}/docs/guide?source=agent#install`,
      );
      expect(
        await run(page, 'navigate', {
          routePath: '/guide?source=agent#install',
        }),
      ).toMatchObject({ page: { title: 'v1 en guide' } });
      expect(
        await run(page, 'navigate', { routePath: '/guide#usage' }),
      ).toMatchObject({ routePath: '/guide#usage' });
    });

    test('rejects unknown/external routes and invalid input without navigating', async ({
      page,
    }) => {
      for (const routePath of [
        '/missing',
        '//example.com/',
        'https://example.com/',
        'guide',
      ]) {
        await expect(run(page, 'navigate', { routePath })).rejects.toThrow();
      }
      await expect(
        run(page, 'search_docs', { query: ' ', limit: 100 }),
      ).rejects.toThrow();
      await expect(page).toHaveURL(`http://localhost:${port}/docs/`);
    });

    test('handles Unicode routes that share the deployment base prefix', async ({
      page,
    }) => {
      const routePath = '/docs/深入';
      if (mode === 'build') {
        expect(await run(page, 'get_page', { routePath })).toMatchObject({
          title: 'Nested page',
          routePath,
          markdown: expect.stringContaining('Nested content'),
        });
        await expect(page).toHaveURL(`http://localhost:${port}/docs/`);
      }
      expect(await run(page, 'navigate', { routePath })).toMatchObject({
        routePath,
        page: { title: 'Nested page' },
      });
      await expect(page.locator('h1').first()).toContainText('Nested page');
      await expect(page).toHaveURL(
        `http://localhost:${port}/docs/docs/${encodeURIComponent('深入')}`,
      );
    });

    test('works when global UI is hidden', async ({ page }) => {
      await page.goto(`http://localhost:${port}/docs/?globalUIComponents=0`);
      await expect
        .poll(() => page.evaluate(() => window.webMcpTest.list()))
        .toContain('rspress_navigate');
    });

    if (mode === 'build') {
      test('discovers and executes all tools through the native browser API', async () => {
        const browser = await chromium.launch({
          ...(process.env.CI ? { channel: 'chrome' } : {}),
          args: ['--enable-experimental-web-platform-features'],
        });
        try {
          const page = await browser.newPage();
          await page.goto(`http://localhost:${port}/docs/`);
          const names = () =>
            page.evaluate(async () => {
              const context = (document as any).modelContext;
              return (await context.getTools())
                .map((tool: Tool) => tool.name)
                .sort();
            });
          await expect.poll(names).toEqual(allTools);
          const invoke = (name: string, input: unknown = {}) =>
            page.evaluate(
              async ({ name, input }) => {
                const context = (document as any).modelContext;
                const tool = (await context.getTools()).find(
                  (tool: Tool) => tool.name === `rspress_${name}`,
                );
                // Chrome 153 serializes schemas and expects string arguments.
                // Newer WebMCP consumers use object schemas and object arguments.
                const args =
                  typeof tool.inputSchema === 'string'
                    ? JSON.stringify(input)
                    : input;
                return JSON.parse(await context.executeTool(tool, args));
              },
              { name, input },
            );
          expect(await invoke('get_site_info')).toMatchObject({
            title: 'WebMCP docs',
          });
          expect(await invoke('list_pages')).toMatchObject({ total: 3 });
          expect(
            await invoke('get_page', { routePath: '/guide' }),
          ).toMatchObject({ title: 'v1 en guide' });
          expect((await invoke('get_current_page')).markdown).toContain(
            'cobalt platypus',
          );
          expect(
            JSON.stringify(await invoke('search_docs', { query: 'cobalt' })),
          ).toContain('v1 en home');
          expect(
            await invoke('navigate', { routePath: '/guide#install' }),
          ).toMatchObject({
            routePath: '/guide#install',
            page: { title: 'v1 en guide' },
          });
          expect(await invoke('get_current_page')).toMatchObject({
            title: 'v1 en guide',
          });
          expect(await names()).toEqual(allTools);
        } finally {
          await browser.close();
        }
      });

      test('reads any page without navigating and reads the latest current page', async ({
        page,
      }) => {
        const remote = await run(page, 'get_page', {
          routePath: '/v2/zh/guide',
        });
        expect(remote).toMatchObject({
          title: 'v2 zh guide',
          lang: 'zh',
          version: 'v2',
        });
        expect(remote.markdown).toContain('## Install');
        await expect(page).toHaveURL(`http://localhost:${port}/docs/`);
        expect((await run(page, 'get_current_page')).markdown).toContain(
          'cobalt platypus',
        );
        await run(page, 'navigate', { routePath: '/guide' });
        expect(await run(page, 'get_current_page')).toMatchObject({
          title: 'v1 en guide',
          routePath: '/guide',
        });
      });

      test('does not resolve navigation before its page chunk loads', async ({
        page,
      }) => {
        let release!: () => void;
        const gate = new Promise<void>(resolve => {
          release = resolve;
        });
        let requested!: () => void;
        const started = new Promise<void>(resolve => {
          requested = resolve;
        });
        await page.route(
          /\/static\/js\/async\/.*\.js(?:\?.*)?$/,
          async route => {
            requested();
            await gate;
            await route.continue();
          },
          { times: 1 },
        );
        try {
          await page.evaluate(() => {
            void window.webMcpTest
              .run('navigate', { routePath: '/guide' })
              .then(result => {
                window.navigationResult = result;
              });
          });
          await started;
          expect(
            await page.evaluate(() => window.navigationResult),
          ).toBeUndefined();
          await expect(page.locator('h1')).toContainText('v1 en home');
        } finally {
          release();
        }
        await expect
          .poll(() => page.evaluate(() => window.navigationResult?.page.title))
          .toBe('v1 en guide');
      });

      test('rejects superseded navigation calls', async ({ page }) => {
        const results = await page.evaluate(() =>
          Promise.allSettled([
            window.webMcpTest.run('navigate', { routePath: '/guide' }),
            window.webMcpTest.run('navigate', { routePath: '/zh/' }),
          ]).then(results => results.map(result => result.status)),
        );
        expect(results).toEqual(['rejected', 'fulfilled']);
        await expect(page.locator('h1')).toContainText('v1 zh home');
      });

      test('cancels a pending navigation call and allows the next call', async ({
        page,
      }) => {
        const error = await page.evaluate(async () => {
          const controller = new AbortController();
          const result = window.webMcpTest.run(
            'navigate',
            { routePath: '/guide' },
            controller.signal,
          );
          controller.abort();
          try {
            await result;
          } catch (error) {
            return (error as Error).name;
          }
        });
        expect(error).toBe('AbortError');
        expect(
          await run(page, 'navigate', { routePath: '/zh/' }),
        ).toMatchObject({ page: { lang: 'zh' } });
      });

      test('rejects failed page loads instead of returning stale metadata', async ({
        page,
      }) => {
        await page.route(
          /\/static\/js\/async\/.*\.js(?:\?.*)?$/,
          route => route.abort(),
          { times: 1 },
        );
        await expect(
          run(page, 'navigate', { routePath: '/guide' }),
        ).rejects.toThrow();
      });

      test('reports missing Markdown rather than returning fallback HTML', async ({
        page,
      }) => {
        await page.route('**/docs/guide.md', route =>
          route.fulfill({
            contentType: 'text/html',
            body: '<html>fallback</html>',
          }),
        );
        await expect(
          run(page, 'get_page', { routePath: '/guide' }),
        ).rejects.toThrow('Markdown is unavailable');
      });
    }
  });
}

test.describe('WebMCP capability detection', () => {
  let app: Awaited<ReturnType<typeof runDevCommand>>;
  let port: number;
  test.beforeAll(async () => {
    port = await getPort();
    app = await runDevCommand(
      import.meta.dirname,
      port,
      'rspress.no-search.config.ts',
    );
  });
  test.afterAll(async () => {
    await killProcess(app);
  });
  test('omits search when local search is disabled, keeping page discovery', async ({
    page,
  }) => {
    await installModelContext(page);
    await page.goto(`http://localhost:${port}/docs/`);
    await expect
      .poll(() => page.evaluate(() => window.webMcpTest.list()))
      .toContain('rspress_list_pages');
    expect(await page.evaluate(() => window.webMcpTest.list())).not.toContain(
      'rspress_search_docs',
    );
    expect(await run(page, 'list_pages')).toMatchObject({ total: 3 });
  });
  test('unsupported browsers render normally', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.addInitScript(() => {
      Object.defineProperty(document, 'modelContext', { value: undefined });
    });
    await page.goto(`http://localhost:${port}/docs/`);
    await expect(page.locator('h1')).toContainText('v1 en home');
    expect(errors).toEqual([]);
  });
});

test('enables available tools by default in production without llms', async ({
  page,
}) => {
  const config = 'rspress.default.config.ts';
  await runBuildCommand(import.meta.dirname, config);
  const port = await getPort();
  const app = await runPreviewCommand(import.meta.dirname, port, [
    '-c',
    config,
  ]);
  try {
    await installModelContext(page);
    await page.goto(`http://localhost:${port}/docs/`);
    await expect
      .poll(() => page.evaluate(() => window.webMcpTest.list()))
      .toEqual(
        allTools.filter(
          name =>
            !['rspress_get_page', 'rspress_get_current_page'].includes(name),
        ),
      );
    expect(await run(page, 'list_pages')).toMatchObject({ total: 3 });
    expect(
      JSON.stringify(await run(page, 'search_docs', { query: 'cobalt' })),
    ).toContain('v1 en home');
  } finally {
    await killProcess(app);
  }
});

test('disabled WebMCP is absent from production JavaScript', async () => {
  await runBuildCommand(import.meta.dirname, 'rspress.disabled.config.ts');
  const dir = path.join(import.meta.dirname, 'dist-disabled');
  const files = await readdir(dir, { recursive: true });
  const js = await Promise.all(
    files
      .filter(file => file.endsWith('.js'))
      .map(file => readFile(path.join(dir, file), 'utf8')),
  );
  expect(
    js.some(
      code =>
        code.includes('rspress_get_site_info') ||
        code.includes('Failed to register'),
    ),
  ).toBe(false);
});

test.describe('WebMCP HTML navigation', () => {
  let app: Awaited<ReturnType<typeof runDevCommand>>;
  let port: number;
  test.beforeAll(async () => {
    port = await getPort();
    const config = 'rspress.html.config.ts';
    await runBuildCommand(import.meta.dirname, config);
    app = await runPreviewCommand(import.meta.dirname, port, ['-c', config]);
  });
  test.afterAll(async () => {
    await killProcess(app);
  });
  test('preserves canonical results and supports reloading HTML URLs', async ({
    page,
  }) => {
    await installModelContext(page);
    await page.goto(`http://localhost:${port}/docs/`);
    await expect
      .poll(() => page.evaluate(() => window.webMcpTest.list()))
      .toContain('rspress_navigate');
    for (const [route, title] of [
      ['/guide', 'v1 en guide'],
      ['/docs/深入', 'Nested page'],
      ['/', 'v1 en home'],
    ]) {
      const routePath = `${route}?from=agent#install`;
      expect(await run(page, 'navigate', { routePath })).toMatchObject({
        routePath,
        page: { title },
      });
      const htmlPath = route === '/' ? '/index' : route;
      await expect(page).toHaveURL(
        `http://localhost:${port}/docs${encodeURI(htmlPath)}.html?from=agent#install`,
      );
      const response = await page.reload();
      expect(response?.status()).toBe(200);
      await expect(page.locator('h1').first()).toContainText(title);
      await expect
        .poll(() => page.evaluate(() => window.webMcpTest.list()))
        .toContain('rspress_navigate');
    }
  });
});

test.describe('WebMCP React Router 6 compatibility', () => {
  let app: Awaited<ReturnType<typeof runDevCommand>>;
  let port: number;
  test.beforeAll(async () => {
    port = await getPort();
    app = await runDevCommand(
      path.join(import.meta.dirname, '../react-router-dom-6'),
      port,
      'rspress.webmcp.config.ts',
    );
  });
  test.afterAll(async () => {
    await killProcess(app);
  });
  test('waits for committed context even when useNavigate returns void', async ({
    page,
  }) => {
    await installModelContext(page);
    await page.goto(`http://localhost:${port}/docs/`);
    await expect
      .poll(() => page.evaluate(() => window.webMcpTest.list()))
      .toContain('rspress_navigate');
    const result = await page.evaluate(async () => {
      const result = await window.webMcpTest.run('navigate', {
        routePath: '/guide#install',
      });
      return { result, heading: document.querySelector('h1')?.textContent };
    });
    expect(result.heading).toContain('v1 en guide');
    expect(result.result).toMatchObject({
      routePath: '/guide#install',
      page: { title: 'v1 en guide' },
    });
  });
});

for (const mode of ['dev', 'build'] as const) {
  test.describe(`public useWebMcp hook (${mode})`, () => {
    let app: Awaited<ReturnType<typeof runDevCommand>>;
    let port: number;
    test.beforeAll(async () => {
      port = await getPort();
      if (mode === 'dev') {
        app = await runDevCommand(
          import.meta.dirname,
          port,
          'rspress.hook.config.ts',
        );
      } else {
        await runBuildCommand(import.meta.dirname, 'rspress.hook.config.ts');
        app = await runPreviewCommand(import.meta.dirname, port, [
          '-c',
          'rspress.hook.config.ts',
        ]);
      }
    });
    test.afterAll(async () => {
      await killProcess(app);
    });
    const state = async (page: Page) =>
      JSON.parse((await page.getByTestId('hook-state').textContent())!);
    const open = async (page: Page) =>
      page.goto(`http://localhost:${port}/docs/`);

    test('exports a typed hook and updates callbacks without registration churn', async ({
      page,
    }) => {
      await installModelContext(page);
      await open(page);
      await expect
        .poll(() => state(page))
        .toMatchObject({ supported: true, registered: true, count: 0 });
      const registrations = await page.evaluate(
        () => window.webMcpTest.registrationNames.length,
      );
      expect(
        await page.evaluate(() =>
          window.webMcpTest.annotations('rspress_test_value'),
        ),
      ).toEqual({
        readOnlyHint: true,
        untrustedContentHint: false,
        consequentialHint: false,
        debugging: true,
      });
      await page.getByRole('button', { name: 'Increment tool count' }).click();
      await expect.poll(() => state(page)).toMatchObject({ count: 1 });
      expect(await run(page, 'test_value', { add: 3 })).toMatchObject({
        value: 4,
      });
      expect(
        await page.evaluate(() => window.webMcpTest.registrationNames.length),
      ).toBe(registrations);
      expect(
        await page.evaluate(() =>
          window.webMcpTest.run('test_value', {}, new AbortController().signal),
        ),
      ).toMatchObject({ cancellable: true });
      await expect(
        page.evaluate(() =>
          window.webMcpTest.run('test_value', {}, AbortSignal.abort()),
        ),
      ).rejects.toThrow();
      await page.getByRole('button', { name: 'Rename tool' }).click();
      await expect
        .poll(() => page.evaluate(() => window.webMcpTest.list()))
        .toEqual(['rspress_test_renamed']);
      expect(await run(page, 'test_renamed')).toMatchObject({ value: 1 });
    });

    test('cleans up on disable and unmount and does not remove another owner', async ({
      page,
    }) => {
      await installModelContext(page);
      await open(page);
      await expect.poll(() => state(page)).toMatchObject({ registered: true });
      await page.getByRole('button', { name: 'Toggle duplicate tool' }).click();
      await expect(page.getByTestId('duplicate-state')).toContainText(
        'Duplicate tool',
      );
      await page.getByRole('button', { name: 'Toggle duplicate tool' }).click();
      expect(await run(page, 'test_value')).toMatchObject({ value: 0 });
      await page.getByRole('button', { name: 'Toggle tool enabled' }).click();
      await expect
        .poll(() => state(page))
        .toMatchObject({ supported: true, registered: false });
      expect(await page.evaluate(() => window.webMcpTest.list())).toEqual([]);
      await page.getByRole('button', { name: 'Toggle tool enabled' }).click();
      await expect.poll(() => state(page)).toMatchObject({ registered: true });
      await page.getByRole('button', { name: 'Toggle tool mounted' }).click();
      await expect
        .poll(() => page.evaluate(() => window.webMcpTest.list()))
        .toEqual([]);
      await page.getByRole('button', { name: 'Toggle tool mounted' }).click();
      await expect.poll(() => state(page)).toMatchObject({ registered: true });
    });

    test('reads committed state while a newer render is suspended', async ({
      page,
    }) => {
      await installModelContext(page);
      await open(page);
      await expect.poll(() => state(page)).toMatchObject({ registered: true });
      await page.getByRole('button', { name: 'Suspend tool render' }).click();
      expect(await run(page, 'test_value')).toMatchObject({ value: 0 });
      await page.getByRole('button', { name: 'Recover tool render' }).click();
      await expect.poll(() => state(page)).toMatchObject({ count: 2 });
      expect(await run(page, 'test_value')).toMatchObject({ value: 2 });
    });

    for (const failure of ['sync', 'async'] as const) {
      test(`reports ${failure} registration errors`, async ({ page }) => {
        await installModelContext(page, failure);
        await open(page);
        await expect
          .poll(() => state(page))
          .toMatchObject({
            supported: true,
            registered: false,
            error: 'registration denied',
          });
      });
    }

    test('is a no-op when the browser API is unavailable', async ({ page }) => {
      await page.addInitScript(() =>
        Object.defineProperty(document, 'modelContext', {
          configurable: true,
          value: undefined,
        }),
      );
      await open(page);
      await expect
        .poll(() => state(page))
        .toMatchObject({ supported: false, registered: false, error: null });
      await page.getByRole('button', { name: 'Increment tool count' }).click();
      await expect.poll(() => state(page)).toMatchObject({ count: 1 });
    });
  });
}

test.describe('WebMCP search component ownership', () => {
  let app: Awaited<ReturnType<typeof runDevCommand>>;
  let port: number;
  test.beforeAll(async () => {
    port = await getPort();
    app = await runDevCommand(
      import.meta.dirname,
      port,
      'rspress.search-component.config.ts',
    );
  });
  test.afterAll(async () => {
    await killProcess(app);
  });

  test('shows results after a failed search hook recovers', async ({
    page,
  }) => {
    await page.goto(`http://localhost:${port}/docs/`);
    await page.locator('.rp-search-button').click();
    await page.locator('.rp-search-panel__input').fill('fail');
    await expect(page.getByText('Error: Search hook failed')).toBeVisible();
    await page.locator('.rp-search-panel__input').fill('alias');
    await expect(page.locator('.rp-suggest-item').first()).toContainText(
      'v1 en home',
    );
    await expect(page.getByText('Error: Search hook failed')).not.toBeVisible();
  });

  test('uses search hooks and unregisters only search when its component unmounts', async ({
    page,
  }) => {
    await installModelContext(page);
    await page.goto(`http://localhost:${port}/docs/`);
    await expect
      .poll(() => page.evaluate(() => window.webMcpTest.list()))
      .toContain('rspress_search_docs');
    expect(
      JSON.stringify(await run(page, 'search_docs', { query: 'alias' })),
    ).toContain('v1 en home');
    await page.locator('.rp-search-button').click();
    await page.locator('.rp-search-panel__input').fill('alias');
    await expect(page.locator('.rp-suggest-item').first()).toContainText(
      'v1 en home',
    );
    await page.keyboard.press('Escape');
    const others = (await page.evaluate(() => window.webMcpTest.list())).filter(
      name => name !== 'rspress_search_docs',
    );
    await page.getByRole('button', { name: 'Toggle search component' }).click();
    await expect
      .poll(() => page.evaluate(() => window.webMcpTest.list()))
      .toEqual(others);
    expect(await run(page, 'list_pages')).toMatchObject({ total: 3 });
    await page.getByRole('button', { name: 'Toggle search component' }).click();
    await expect
      .poll(() => page.evaluate(() => window.webMcpTest.list()))
      .toContain('rspress_search_docs');
    expect(
      JSON.stringify(await run(page, 'search_docs', { query: 'alias' })),
    ).toContain('v1 en home');
  });
});

test.describe('WebMCP Markdown component ownership', () => {
  let app: Awaited<ReturnType<typeof runDevCommand>>;
  let port: number;
  test.beforeAll(async () => {
    const config = 'rspress.search-component.config.ts';
    await runBuildCommand(import.meta.dirname, config);
    port = await getPort();
    app = await runPreviewCommand(import.meta.dirname, port, ['-c', config]);
  });
  test.afterAll(async () => {
    await killProcess(app);
  });

  test('unregisters page-reading tools when the Markdown component unmounts', async ({
    page,
  }) => {
    await installModelContext(page);
    await page.goto(`http://localhost:${port}/docs/`);
    await expect
      .poll(() => page.evaluate(() => window.webMcpTest.list()))
      .toEqual(allTools);
    expect(await run(page, 'get_current_page')).toMatchObject({
      title: 'v1 en home',
    });
    await page
      .getByRole('button', { name: 'Toggle Markdown component' })
      .click();
    await expect
      .poll(() => page.evaluate(() => window.webMcpTest.list()))
      .toEqual(
        allTools.filter(
          name =>
            !['rspress_get_page', 'rspress_get_current_page'].includes(name),
        ),
      );
    expect(await run(page, 'list_pages')).toMatchObject({ total: 3 });
    await run(page, 'navigate', { routePath: '/guide' });
    await page
      .getByRole('button', { name: 'Toggle Markdown component' })
      .click();
    await expect
      .poll(() => page.evaluate(() => window.webMcpTest.list()))
      .toEqual(allTools);
    expect(await run(page, 'get_current_page')).toMatchObject({
      title: 'v1 en guide',
    });
    expect(await run(page, 'get_page', { routePath: '/' })).toMatchObject({
      title: 'v1 en home',
    });
  });
});
