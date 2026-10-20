import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { expect, type Page } from '@e2e/test';
import {
  test,
  listTools,
  installModelContext,
  trackToolRegistrations,
} from '../../utils/webMcp';
import {
  getPort,
  killProcess,
  runBuildCommand,
  runDevCommand,
  runPreviewCommand,
} from '../../utils/runCommands';

const allTools = [
  'get_current_page',
  'get_page',
  'get_site_info',
  'list_pages',
  'navigate',
  'search_docs',
].map(name => `rspress_${name}`);

test.describe('WebMCP production tools', () => {
  let app: Awaited<ReturnType<typeof runPreviewCommand>>;
  let port: number;
  test.beforeAll(async () => {
    port = await getPort();
    await runBuildCommand(import.meta.dirname);
    app = await runPreviewCommand(import.meta.dirname, port);
  });
  test.afterAll(async () => {
    await killProcess(app);
  });
  test.beforeEach(async ({ page }) => {
    await trackToolRegistrations(page);
    await page.goto(`http://localhost:${port}/docs/`);
    await expect.poll(() => listTools(page)).toEqual(allTools);
  });
  test('discovers tools and site context without initializing search', async ({
    page,
  }) => {
    await page.waitForLoadState('networkidle');
    const names = await listTools(page);
    expect(names).toEqual(allTools);
    expect(await page.webmcp.callTool('rspress_get_site_info')).toMatchObject({
      title: 'WebMCP docs',
      base: '/docs/',
      lang: 'en',
      version: 'v1',
      versions: ['v1', 'v2'],
      defaultVersion: 'v1',
    });
    expect(
      (await page.webmcp.callTool('rspress_get_site_info')).sidebar.length,
    ).toBeGreaterThan(0);
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
        window.webMcpRegistrations.every(({ exposedTo }) =>
          exposedTo?.includes('https://agent.example'),
        ),
      ),
    ).toBe(true);
  });

  test('filters and paginates page discovery', async ({ page }) => {
    expect(
      await page.webmcp.callTool('rspress_list_pages', {
        limit: 1,
        offset: 2,
      }),
    ).toMatchObject({
      total: 3,
      offset: 2,
      limit: 1,
      pages: [{ title: 'v1 en home' }],
    });
    expect(
      await page.webmcp.callTool('rspress_list_pages', { query: 'install' }),
    ).toMatchObject({ total: 1, pages: [{ routePath: '/guide' }] });
    expect(
      await page.webmcp.callTool('rspress_list_pages', {
        lang: 'zh',
        version: 'v2',
      }),
    ).toMatchObject({ total: 2 });
  });

  test('searches local content and refreshes language and version context', async ({
    page,
  }) => {
    expect(
      JSON.stringify(
        await page.webmcp.callTool('rspress_search_docs', {
          query: 'cobalt',
        }),
      ),
    ).toContain('v1 en home');
    await page.webmcp.callTool('rspress_navigate', { routePath: '/zh/' });
    expect(
      JSON.stringify(
        await page.webmcp.callTool('rspress_search_docs', { query: 'jade' }),
      ),
    ).toContain('v1 zh home');
    expect(
      JSON.stringify(
        await page.webmcp.callTool('rspress_search_docs', {
          query: 'cobalt',
        }),
      ),
    ).not.toContain('v1 en home');
    await page.webmcp.callTool('rspress_navigate', { routePath: '/v2/' });
    expect(
      JSON.stringify(
        await page.webmcp.callTool('rspress_search_docs', { query: 'amber' }),
      ),
    ).toContain('v2 en home');
    expect(await page.webmcp.callTool('rspress_get_site_info')).toMatchObject({
      lang: 'en',
      version: 'v2',
    });
    expect(await page.webmcp.callTool('rspress_list_pages')).toMatchObject({
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
      JSON.stringify(
        await page.webmcp.callTool('rspress_search_docs', {
          query: 'cobalt',
        }),
      ),
    ).toContain('v1 en home');
    await page.locator('.rp-search-button').click();
    await page.locator('.rp-search-panel__input').fill('cobalt');
    await expect(page.locator('.rp-suggest-item').first()).toContainText(
      'v1 en home',
    );
    await page.keyboard.press('Escape');
    await expect(page.locator('.rp-search-panel__input')).not.toBeVisible();
    expect(
      JSON.stringify(
        await page.webmcp.callTool('rspress_search_docs', {
          query: 'cobalt',
        }),
      ),
    ).toContain('v1 en home');
    expect(requests).toHaveLength(1);
  });

  test('returns committed page context, sections and adjacent links with query/hash', async ({
    page,
  }) => {
    const result = await page.webmcp.callTool('rspress_navigate', {
      routePath: '/guide.html?source=agent#install',
    });
    expect(await page.locator('h1').textContent()).toContain('v1 en guide');
    expect(result).toMatchObject({
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
      await page.webmcp.callTool('rspress_navigate', {
        routePath: '/guide?source=agent#install',
      }),
    ).toMatchObject({ page: { title: 'v1 en guide' } });
    expect(
      await page.webmcp.callTool('rspress_navigate', {
        routePath: '/guide#usage',
      }),
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
      await expect(
        page.webmcp.callTool('rspress_navigate', { routePath }),
      ).rejects.toThrow();
    }
    await expect(
      page.webmcp.callTool('rspress_search_docs', { query: ' ', limit: 100 }),
    ).rejects.toThrow();
    await expect(page).toHaveURL(`http://localhost:${port}/docs/`);
  });

  test('handles Unicode routes that share the deployment base prefix', async ({
    page,
  }) => {
    const routePath = '/docs/深入';
    expect(
      await page.webmcp.callTool('rspress_get_page', { routePath }),
    ).toMatchObject({
      title: 'Nested page',
      routePath,
      markdown: expect.stringContaining('Nested content'),
    });
    await expect(page).toHaveURL(`http://localhost:${port}/docs/`);
    expect(
      await page.webmcp.callTool('rspress_navigate', { routePath }),
    ).toMatchObject({
      routePath,
      page: { title: 'Nested page' },
    });
    await expect(page.locator('h1').first()).toContainText('Nested page');
    await expect(page).toHaveURL(
      `http://localhost:${port}/docs/docs/${encodeURIComponent('深入')}`,
    );
  });

  test('reads any page without navigating and reads the latest current page', async ({
    page,
  }) => {
    await expect(page.locator('.rp-llms-hint')).toHaveCount(0);
    const remote = await page.webmcp.callTool('rspress_get_page', {
      routePath: '/v2/zh/guide',
    });
    expect(remote).toMatchObject({
      title: 'v2 zh guide',
      lang: 'zh',
      version: 'v2',
    });
    expect(remote.markdown).toContain('## Install');
    await expect(page).toHaveURL(`http://localhost:${port}/docs/`);
    expect(
      (await page.webmcp.callTool('rspress_get_current_page')).markdown,
    ).toContain('cobalt platypus');
    await page.webmcp.callTool('rspress_navigate', { routePath: '/guide' });
    expect(
      await page.webmcp.callTool('rspress_get_current_page'),
    ).toMatchObject({
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
    let settled = false;
    const navigation = page.webmcp.callTool('rspress_navigate', {
      routePath: '/guide',
    });
    void navigation.then(
      () => {
        settled = true;
      },
      () => {
        settled = true;
      },
    );
    try {
      await started;
      expect(settled).toBe(false);
      await expect(page.locator('h1')).toContainText('v1 en home');
    } finally {
      release();
    }
    expect(await navigation).toMatchObject({
      page: { title: 'v1 en guide' },
    });
  });

  test('rejects superseded navigation calls', async ({ page }) => {
    let release!: () => void;
    let requested!: () => void;
    const gate = new Promise<void>(resolve => {
      release = resolve;
    });
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
    const first = page.webmcp.callTool('rspress_navigate', {
      routePath: '/guide',
    });
    // Handle rejection immediately while the first page chunk is blocked.
    const firstResult = Promise.allSettled([first]);
    try {
      await started;
      await page.webmcp.callTool('rspress_navigate', { routePath: '/zh/' });
      expect((await firstResult)[0].status).toBe('rejected');
      await expect(page.locator('h1')).toContainText('v1 zh home');
    } finally {
      release();
    }
  });

  test('supersedes a started navigation when returning to the current route', async ({
    page,
  }) => {
    // Invoke both handlers in one browser task, before React commits loading state.
    await installModelContext(page);
    await page.reload();
    await expect
      .poll(() => page.evaluate(() => window.webMcpTest.list()))
      .toContain('rspress_navigate');
    const result = await page.evaluate(async () => {
      const first = window.webMcpTest
        .run('navigate', { routePath: '/guide' })
        .catch(error => error.message);
      await Promise.resolve();
      const current = await window.webMcpTest.run('navigate', {
        routePath: '/',
      });
      return { current, first: await first };
    });
    expect(result.current).toMatchObject({ page: { title: 'v1 en home' } });
    expect(result.first).toContain('superseded');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(`http://localhost:${port}/docs`);
    await expect(page.locator('h1')).toContainText('v1 en home');
  });

  test('cancels a pending navigation call and allows the next call', async ({
    page,
  }) => {
    // Playwright callTool does not expose an AbortSignal option.
    await installModelContext(page);
    await page.reload();
    await expect
      .poll(() => page.evaluate(() => window.webMcpTest.list()))
      .toContain('rspress_navigate');
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
      await page.evaluate(() =>
        window.webMcpTest.run('navigate', { routePath: '/zh/' }),
      ),
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
      page.webmcp.callTool('rspress_navigate', { routePath: '/guide' }),
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
      page.webmcp.callTool('rspress_get_page', { routePath: '/guide' }),
    ).rejects.toThrow();
  });
  test('retries a failed index request for agents and the search UI', async ({
    page,
  }) => {
    let requests = 0;
    await page.route('**/static/search_index*.json', async route => {
      if (route.request().resourceType() !== 'fetch') return route.continue();
      requests++;
      if (requests === 1)
        return route.fulfill({ status: 503, body: 'Unavailable' });
      return route.continue();
    });
    await expect(
      page.webmcp.callTool('rspress_search_docs', { query: 'cobalt' }),
    ).rejects.toThrow();
    await page.locator('.rp-search-button').click();
    await page.locator('.rp-search-panel__input').fill('cobalt');
    await expect(page.locator('.rp-suggest-item').first()).toContainText(
      'v1 en home',
    );
    expect(
      JSON.stringify(
        await page.webmcp.callTool('rspress_search_docs', { query: 'cobalt' }),
      ),
    ).toContain('v1 en home');
    expect(requests).toBe(2);
  });

  test('returns serializable custom search results without a local index', async ({
    page,
  }) => {
    await page.webmcp.callTool('rspress_navigate', { routePath: '/v2/zh/' });
    await expect.poll(() => listTools(page)).toContain('rspress_search_docs');
    const result = await page.webmcp.callTool('rspress_search_docs', {
      query: 'custom',
    });
    expect(result).toContainEqual({
      group: 'Custom',
      results: [{ title: 'Custom result', link: '/guide' }],
    });
    expect(result.map((item: { group: string }) => item.group)).not.toContain(
      'Cyclic',
    );
  });

  test('shows results after a failed search hook recovers', async ({
    page,
  }) => {
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
    await expect.poll(() => listTools(page)).toContain('rspress_search_docs');
    expect(
      JSON.stringify(
        await page.webmcp.callTool('rspress_search_docs', { query: 'alias' }),
      ),
    ).toContain('v1 en home');
    await page.locator('.rp-search-button').click();
    await page.locator('.rp-search-panel__input').fill('alias');
    await expect(page.locator('.rp-suggest-item').first()).toContainText(
      'v1 en home',
    );
    await page.keyboard.press('Escape');
    const others = (await listTools(page)).filter(
      name => name !== 'rspress_search_docs',
    );
    await page.getByRole('button', { name: 'Toggle search component' }).click();
    await expect.poll(() => listTools(page)).toEqual(others);
    expect(await page.webmcp.callTool('rspress_list_pages')).toMatchObject({
      total: 3,
    });
    await page.getByRole('button', { name: 'Toggle search component' }).click();
    await expect.poll(() => listTools(page)).toContain('rspress_search_docs');
    expect(
      JSON.stringify(
        await page.webmcp.callTool('rspress_search_docs', { query: 'alias' }),
      ),
    ).toContain('v1 en home');
  });
});

test.describe('WebMCP development', () => {
  let app: Awaited<ReturnType<typeof runDevCommand>>;
  let port: number;
  test.beforeAll(async () => {
    port = await getPort();
    app = await runDevCommand(import.meta.dirname, port);
  });
  test.afterAll(async () => {
    await killProcess(app);
  });

  test('supports search and navigation without generated Markdown', async ({
    page,
  }) => {
    await page.goto(`http://localhost:${port}/docs/`);
    await expect
      .poll(() => listTools(page))
      .toEqual(
        allTools.filter(
          name =>
            !['rspress_get_page', 'rspress_get_current_page'].includes(name),
        ),
      );
    expect(
      JSON.stringify(
        await page.webmcp.callTool('rspress_search_docs', { query: 'cobalt' }),
      ),
    ).toContain('v1 en home');
    expect(
      await page.webmcp.callTool('rspress_navigate', { routePath: '/guide' }),
    ).toMatchObject({ page: { title: 'v1 en guide' } });
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

test.describe('WebMCP default configuration', () => {
  let app: Awaited<ReturnType<typeof runDevCommand>>;
  let port: number;
  test.beforeAll(async () => {
    port = await getPort();
    const config = 'rspress.default.config.ts';
    await runBuildCommand(import.meta.dirname, config);
    app = await runPreviewCommand(import.meta.dirname, port, ['-c', config]);
  });
  test.afterAll(async () => {
    await killProcess(app);
  });
  test('defaults to enabled without search or Markdown and supports HTML routes', async ({
    page,
  }) => {
    await page.goto(`http://localhost:${port}/docs/`);
    await expect
      .poll(() => listTools(page))
      .toEqual([
        'rspress_get_site_info',
        'rspress_list_pages',
        'rspress_navigate',
      ]);
    expect(await page.webmcp.callTool('rspress_list_pages')).toMatchObject({
      total: 3,
    });
    for (const [route, title] of [
      ['/guide', 'v1 en guide'],
      ['/docs/深入', 'Nested page'],
      ['/', 'v1 en home'],
    ]) {
      const routePath = `${route}?from=agent#install`;
      expect(
        await page.webmcp.callTool('rspress_navigate', { routePath }),
      ).toMatchObject({
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
      await expect.poll(() => listTools(page)).toContain('rspress_navigate');
    }
  });
});

test.describe('public useWebMcp hook', () => {
  let app: Awaited<ReturnType<typeof runDevCommand>>;
  let port: number;
  test.beforeAll(async () => {
    port = await getPort();
    app = await runDevCommand(
      import.meta.dirname,
      port,
      'rspress.hook.config.ts',
    );
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
    await trackToolRegistrations(page);
    await open(page);
    await expect
      .poll(() => state(page))
      .toMatchObject({ supported: true, registered: true, count: 0 });
    const registrations = await page.evaluate(
      () => window.webMcpRegistrations.length,
    );
    const tool = (await page.webmcp.tools()).find(
      tool => tool.name === 'rspress_test_value',
    );
    expect(tool?.annotations).toMatchObject({
      readOnly: true,
    });
    await page.getByRole('button', { name: 'Increment tool count' }).click();
    await expect.poll(() => state(page)).toMatchObject({ count: 1 });
    expect(
      await page.webmcp.callTool('rspress_test_value', { add: 3 }),
    ).toMatchObject({
      value: 4,
    });
    expect(await page.evaluate(() => window.webMcpRegistrations.length)).toBe(
      registrations,
    );
    expect(await page.webmcp.callTool('rspress_test_value')).toMatchObject({
      cancellable: true,
    });
    await page.getByRole('button', { name: 'Rename tool' }).click();
    await expect.poll(() => listTools(page)).toEqual(['rspress_test_renamed']);
    expect(await page.webmcp.callTool('rspress_test_renamed')).toMatchObject({
      value: 1,
    });
  });

  test('cleans up on disable and unmount and does not remove another owner', async ({
    page,
  }) => {
    await open(page);
    await expect.poll(() => state(page)).toMatchObject({ registered: true });
    await page.getByRole('button', { name: 'Toggle duplicate tool' }).click();
    await expect(page.getByTestId('duplicate-state')).toContainText(
      'Duplicate tool name',
    );
    await page.getByRole('button', { name: 'Toggle duplicate tool' }).click();
    expect(await page.webmcp.callTool('rspress_test_value')).toMatchObject({
      value: 0,
    });
    await page.getByRole('button', { name: 'Toggle tool enabled' }).click();
    await expect
      .poll(() => state(page))
      .toMatchObject({ supported: true, registered: false });
    expect(await listTools(page)).toEqual([]);
    await page.getByRole('button', { name: 'Toggle tool enabled' }).click();
    await expect.poll(() => state(page)).toMatchObject({ registered: true });
    await page.getByRole('button', { name: 'Toggle tool mounted' }).click();
    await expect.poll(() => listTools(page)).toEqual([]);
    await page.getByRole('button', { name: 'Toggle tool mounted' }).click();
    await expect.poll(() => state(page)).toMatchObject({ registered: true });
  });

  test('reads committed state while a newer render is suspended', async ({
    page,
  }) => {
    await open(page);
    await expect.poll(() => state(page)).toMatchObject({ registered: true });
    await page.getByRole('button', { name: 'Suspend tool render' }).click();
    expect(await page.webmcp.callTool('rspress_test_value')).toMatchObject({
      value: 0,
    });
    await page.getByRole('button', { name: 'Recover tool render' }).click();
    await expect.poll(() => state(page)).toMatchObject({ count: 2 });
    expect(await page.webmcp.callTool('rspress_test_value')).toMatchObject({
      value: 2,
    });
  });

  test('rejects an already-aborted execution signal', async ({ page }) => {
    await installModelContext(page);
    await open(page);
    await expect.poll(() => state(page)).toMatchObject({ registered: true });
    await expect(
      page.evaluate(() =>
        window.webMcpTest.run('test_value', {}, AbortSignal.abort()),
      ),
    ).rejects.toThrow();
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
