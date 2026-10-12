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
  execute: (input: unknown, options: { signal?: AbortSignal }) => unknown;
};
declare global {
  interface Window {
    webMcpTest: {
      list(): string[];
      run(name: string, input?: unknown, signal?: AbortSignal): Promise<any>;
      registrations: string[][];
    };
    navigationResult?: any;
    navigationError?: string;
  }
}

// Only the browser API is substituted. The real runtime, router, network,
// generated Markdown and local search run in the browser without a polyfill.
async function installModelContext(page: Page) {
  await page.addInitScript(() => {
    const tools = new Map<string, Tool>();
    const registrations: string[][] = [];
    Object.defineProperty(document, 'modelContext', {
      configurable: true,
      value: {
        async registerTool(
          tool: Tool,
          options: { signal: AbortSignal; exposedTo?: string[] },
        ) {
          if (options.signal.aborted) return;
          if (tools.has(tool.name))
            throw new Error(`Duplicate tool: ${tool.name}`);
          tools.set(tool.name, tool);
          registrations.push(options.exposedTo ?? []);
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
      async run(name, input = {}, signal) {
        const tool = tools.get(`rspress_${name}`);
        if (!tool) throw new Error(`Missing tool: ${name}`);
        return tool.execute(input, { signal });
      },
      registrations,
    };
  });
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
        .toContain('rspress_navigate');
    });

    test('discovers tools and site context without downloading the search index', async ({
      page,
    }) => {
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
      expect(
        await page.evaluate(() =>
          performance
            .getEntriesByType('resource')
            .some(entry => entry.name.includes('search-index')),
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
