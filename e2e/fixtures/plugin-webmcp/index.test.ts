import { existsSync, rmSync } from 'node:fs';
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { expect, test, type Route } from '@playwright/test';
import {
  getPort,
  killProcess,
  runBuildCommand,
  runDevCommand,
  runPreviewCommand,
} from '../../utils/runCommands';
import {
  executeTool,
  findTool,
  listRegistrations,
  listToolNames,
  listTools,
} from './webmcpTestUtils';

const appDir = import.meta.dirname;
const outputDir = path.join(appDir, 'doc_build');
const counterToolsFile = path.join(appDir, 'src/CounterTools.tsx');
const pageScopedToolFile = path.join(appDir, 'src/PageScopedTool.tsx');
const homePageFile = path.join(appDir, 'doc/v1/en/index.mdx');
const searchFragmentFile = path.join(appDir, 'doc/v1/en/_search-fragment.mdx');
const guidePageFile = path.join(appDir, 'doc/v1/en/guide.mdx');

test('normalizes native WebMCP execution results', async ({ page }) => {
  await page.goto('about:blank');
  await page.evaluate(() => {
    const tools = ['native_echo', 'native_void'].map(name => ({
      name,
      description: name,
      inputSchema: '{"type":"object"}',
    }));
    Object.defineProperty(document, 'modelContext', {
      configurable: true,
      value: {
        async getTools() {
          return tools;
        },
        async executeTool(tool: { name: string }, input: string) {
          return tool.name === 'native_void'
            ? undefined
            : { tool: tool.name, input: JSON.parse(input) };
        },
      },
    });
  });

  await expect(
    executeTool(page, 'native_echo', { value: 'ok' }),
  ).resolves.toEqual({
    structuredContent: {
      tool: 'native_echo',
      input: { value: 'ok' },
    },
    content: [
      {
        type: 'text',
        text: '{"tool":"native_echo","input":{"value":"ok"}}',
      },
    ],
  });
  await expect(executeTool(page, 'native_void', {})).resolves.toEqual({
    structuredContent: null,
    content: [{ type: 'text', text: 'undefined' }],
  });
});

test.describe('plugin-webmcp preview', () => {
  let appPort: number;
  let app: Awaited<ReturnType<typeof runPreviewCommand>> | undefined;

  test.beforeAll(async () => {
    appPort = await getPort();
    rmSync(outputDir, { recursive: true, force: true });
    await runBuildCommand(appDir);
    app = await runPreviewCommand(appDir, appPort);
  });

  test.afterAll(async () => {
    if (app) {
      await killProcess(app);
    }
    rmSync(outputDir, { recursive: true, force: true });
  });

  test.beforeEach(async ({ page }) => {
    await page.goto(`http://localhost:${appPort}/`, {
      waitUntil: 'networkidle',
    });
    await expect
      .poll(async () => (await listToolNames(page)).sort())
      .toEqual([
        'fixture_increment_counter',
        'fixture_reset_counter',
        'rspress_get_current_page',
        'rspress_get_page',
        'rspress_get_site_info',
        'rspress_list_pages',
        'rspress_navigate',
        'rspress_search_docs',
      ]);
  });

  test('lists descriptors and reads generated Markdown', async ({ page }) => {
    const tools = await listTools(page);
    const currentPageTool = tools.find(
      tool => tool.name === 'rspress_get_current_page',
    );
    const pageTool = tools.find(tool => tool.name === 'rspress_get_page');
    const siteInfoTool = tools.find(
      tool => tool.name === 'rspress_get_site_info',
    );
    const listPagesTool = tools.find(
      tool => tool.name === 'rspress_list_pages',
    );
    const searchTool = tools.find(tool => tool.name === 'rspress_search_docs');
    const navigateTool = tools.find(tool => tool.name === 'rspress_navigate');
    expect(JSON.parse(currentPageTool!.inputSchema!)).toMatchObject({
      type: 'object',
      additionalProperties: false,
    });
    expect(JSON.parse(pageTool!.inputSchema!)).toMatchObject({
      required: ['routePath'],
    });
    expect(JSON.parse(siteInfoTool!.inputSchema!)).toMatchObject({
      properties: {},
      additionalProperties: false,
    });
    expect(JSON.parse(listPagesTool!.inputSchema!)).toMatchObject({
      properties: {
        limit: { maximum: 100 },
        offset: { minimum: 0 },
      },
    });
    expect(JSON.parse(searchTool!.inputSchema!)).toMatchObject({
      required: ['query'],
      properties: { limit: { maximum: 20 } },
    });
    expect(JSON.parse(navigateTool!.inputSchema!)).toMatchObject({
      required: ['routePath'],
    });
    expect(
      (await listRegistrations(page))
        .filter(registration => registration.name.startsWith('rspress_'))
        .every(
          registration =>
            registration.exposedTo?.[0] === 'https://agent.example',
        ),
    ).toBe(true);

    const currentPage = await executeTool(page, 'rspress_get_current_page', {});
    expect(currentPage?.structuredContent).toMatchObject({
      title: 'WebMCP home',
      routePath: '/',
    });
    expect(
      (currentPage?.structuredContent as { markdown: string }).markdown,
    ).toContain('# WebMCP home');

    const siteInfo = await executeTool(page, 'rspress_get_site_info', {});
    expect(siteInfo?.structuredContent).toMatchObject({
      title: 'WebMCP fixture',
      lang: 'en',
      version: 'v1',
      locales: [{ lang: 'en' }, { lang: 'zh' }],
      versions: ['v1', 'v2'],
      defaultVersion: 'v1',
    });
    expect(JSON.stringify(siteInfo?.structuredContent)).toContain('Guide');

    const listedPages = await executeTool(page, 'rspress_list_pages', {
      query: 'register tools',
      limit: 10,
    });
    expect(listedPages?.structuredContent).toMatchObject({
      pages: [expect.objectContaining({ routePath: '/guide' })],
      total: 1,
      offset: 0,
      limit: 10,
    });

    const urlBeforeRead = page.url();
    const guide = await executeTool(page, 'rspress_get_page', {
      routePath: '/guide.html?source=read#webmcp-guide',
    });
    expect(guide?.structuredContent).toMatchObject({
      title: 'WebMCP guide',
      routePath: '/guide',
    });
    expect(
      (guide?.structuredContent as { markdown: string }).markdown,
    ).toContain('# WebMCP guide');
    expect(page.url()).toBe(urlBeforeRead);
  });

  test('executes search and both custom registration APIs', async ({
    page,
  }) => {
    const search = await executeTool(page, 'rspress_search_docs', {
      query: 'cobalt platypus',
      limit: 5,
    });
    expect(JSON.stringify(search?.structuredContent)).toContain('WebMCP home');

    const registrationsBeforeIncrement = (
      await listRegistrations(page, 'fixture_increment_counter')
    ).length;
    await executeTool(page, 'fixture_increment_counter', {});
    await expect(page.getByTestId('webmcp-counter')).toHaveText('Counter: 1');
    await expect
      .poll(async () => {
        const registrations = await listRegistrations(
          page,
          'fixture_increment_counter',
        );
        return (
          registrations.length > registrationsBeforeIncrement &&
          registrations.at(-2)?.aborted === true
        );
      })
      .toBe(true);
    await executeTool(page, 'fixture_reset_counter', {});
    await expect(page.getByTestId('webmcp-counter')).toHaveText('Counter: 0');

    await expect(
      executeTool(page, 'rspress_search_docs', { query: '', limit: 100 }),
    ).rejects.toThrow(/Input validation error/);
  });

  test('awaits navigation and cleans up page-scoped tools', async ({
    page,
  }) => {
    const navigation = await executeTool(page, 'rspress_navigate', {
      routePath: '/guide.html?source=webmcp#webmcp-guide',
    });
    expect(navigation?.structuredContent).toMatchObject({
      routePath: '/guide?source=webmcp#webmcp-guide',
      page: { title: 'WebMCP guide', lang: 'en', version: 'v1' },
      sections: [
        {
          title: 'Register tools',
          depth: 2,
          routePath: '/guide?source=webmcp#register-tools',
        },
      ],
      previousPage: { title: 'Home', routePath: '/index.html' },
      nextPage: null,
    });

    const currentPage = await executeTool(page, 'rspress_get_current_page', {});
    expect(currentPage?.structuredContent).toMatchObject({
      title: 'WebMCP guide',
      routePath: '/guide',
    });
    expect(
      (currentPage?.structuredContent as { markdown: string }).markdown,
    ).toContain('# WebMCP guide');
    await expect(page).toHaveURL(/\/guide\?source=webmcp#webmcp-guide$/);
    await expect
      .poll(() => listToolNames(page))
      .toContain('fixture_page_scoped');

    await expect(
      executeTool(page, 'rspress_navigate', {
        routePath: 'https://example.com/',
      }),
    ).rejects.toThrow();
    await expect(
      executeTool(page, 'rspress_navigate', { routePath: '/missing' }),
    ).rejects.toThrow(/Unknown internal route/);
    await expect(
      executeTool(page, 'rspress_get_page', {
        routePath: 'https://example.com/',
      }),
    ).rejects.toThrow();
    await expect(
      executeTool(page, 'rspress_get_page', { routePath: '/missing' }),
    ).rejects.toThrow(/Unknown internal route/);

    await executeTool(page, 'rspress_navigate', { routePath: '/index.html' });
    await expect(page).toHaveURL(new RegExp(`:${appPort}/$`));
    await expect
      .poll(() => listToolNames(page))
      .not.toContain('fixture_page_scoped');
  });

  test('refreshes search for language and version navigation', async ({
    page,
  }) => {
    await executeTool(page, 'rspress_navigate', { routePath: '/zh/' });
    await expect
      .poll(() => listToolNames(page))
      .toContain('rspress_search_docs');
    const zhSearch = await executeTool(page, 'rspress_search_docs', {
      query: 'jade pangolin',
    });
    expect(JSON.stringify(zhSearch?.structuredContent)).toContain(
      'WebMCP 中文主页',
    );
    const zhSiteInfo = await executeTool(page, 'rspress_get_site_info', {});
    expect(zhSiteInfo?.structuredContent).toMatchObject({
      lang: 'zh',
      version: 'v1',
    });
    const zhPages = await executeTool(page, 'rspress_list_pages', {});
    expect(zhPages?.structuredContent).toMatchObject({
      pages: [expect.objectContaining({ title: 'WebMCP 中文主页' })],
      total: 1,
    });

    await executeTool(page, 'rspress_navigate', { routePath: '/v2/' });
    await expect
      .poll(() => listToolNames(page))
      .toContain('rspress_search_docs');
    const versionSearch = await executeTool(page, 'rspress_search_docs', {
      query: 'amber axolotl',
    });
    expect(JSON.stringify(versionSearch?.structuredContent)).toContain(
      'WebMCP version two',
    );
    const versionPages = await executeTool(page, 'rspress_list_pages', {});
    expect(versionPages?.structuredContent).toMatchObject({
      pages: [expect.objectContaining({ title: 'WebMCP version two' })],
      total: 1,
    });
  });

  test('serializes concurrent navigation calls', async ({ page }) => {
    const [first, second] = await Promise.all([
      executeTool(page, 'rspress_navigate', {
        routePath: '/guide?sequence=first',
      }),
      executeTool(page, 'rspress_navigate', {
        routePath: '/index.html?sequence=second',
      }),
    ]);

    expect(first?.structuredContent).toMatchObject({
      routePath: '/guide?sequence=first',
      page: { title: 'WebMCP guide' },
    });
    expect(second?.structuredContent).toMatchObject({
      routePath: '/?sequence=second',
      page: { title: 'WebMCP home' },
    });
    await expect(page).toHaveURL(new RegExp(`:${appPort}/\\?sequence=second$`));
    const currentPage = await executeTool(page, 'rspress_get_current_page', {});
    expect(currentPage?.structuredContent).toMatchObject({
      title: 'WebMCP home',
      routePath: '/',
    });
  });

  test('releases the navigation queue after a route load failure', async ({
    page,
  }) => {
    test.slow();
    const chunkPattern = '**/static/js/async/*.js';
    const abortChunk = (route: Route) => route.abort('failed');
    await page.route(chunkPattern, abortChunk);
    try {
      await expect(
        executeTool(page, 'rspress_navigate', { routePath: '/failure' }),
      ).rejects.toThrow(
        /Navigation did not complete|Failed to fetch|Loading chunk/,
      );
    } finally {
      await page.unroute(chunkPattern, abortChunk);
    }

    await executeTool(page, 'rspress_navigate', { routePath: '/guide' });
    await expect(page).toHaveURL(new RegExp(`:${appPort}/guide$`));
  });

  test('cancels a timed-out navigation before it can commit late', async ({
    page,
  }) => {
    test.slow();
    const chunkPattern = '**/static/js/async/*.js';
    let releaseChunk!: () => void;
    let markChunkBlocked!: () => void;
    const chunkGate = new Promise<void>(resolve => {
      releaseChunk = resolve;
    });
    const chunkBlocked = new Promise<void>(resolve => {
      markChunkBlocked = resolve;
    });
    let heldFirstChunk = false;
    let heldChunkUrl = '';
    const holdFirstChunk = async (route: Route) => {
      if (heldFirstChunk) {
        await route.continue();
        return;
      }
      heldFirstChunk = true;
      heldChunkUrl = route.request().url();
      markChunkBlocked();
      await chunkGate;
      await route.continue();
    };
    await page.route(chunkPattern, holdFirstChunk);

    const firstNavigation = executeTool(page, 'rspress_navigate', {
      routePath: '/failure',
    });
    await chunkBlocked;
    await expect(firstNavigation).rejects.toThrow(
      /Navigation did not complete/,
    );

    await executeTool(page, 'rspress_navigate', { routePath: '/guide' });
    await expect(page).toHaveURL(new RegExp(`:${appPort}/guide$`));

    const heldChunkResponse = page.waitForResponse(
      response => response.url() === heldChunkUrl,
    );
    releaseChunk();
    await heldChunkResponse;
    await page.waitForTimeout(100);
    await expect(page).toHaveURL(new RegExp(`:${appPort}/guide$`));
    const currentPage = await executeTool(page, 'rspress_get_current_page', {});
    expect(currentPage?.structuredContent).toMatchObject({
      title: 'WebMCP guide',
      routePath: '/guide',
    });

    await page.unroute(chunkPattern, holdFirstChunk);
  });

  test('build emits SSG-MD output', () => {
    expect(existsSync(path.join(outputDir, 'index.md'))).toBe(true);
    expect(existsSync(path.join(outputDir, 'guide.md'))).toBe(true);
    expect(existsSync(path.join(outputDir, 'zh/index.md'))).toBe(true);
    expect(existsSync(path.join(outputDir, 'v2/index.md'))).toBe(true);
  });
});

test.describe('plugin-webmcp development server', () => {
  let appPort: number;
  let app: Awaited<ReturnType<typeof runDevCommand>> | undefined;
  let originalCounterTools: string;
  let originalPageScopedTool: string;
  let originalHomePage: string;
  let originalSearchFragment: string;
  let originalGuidePage: string;

  test.beforeAll(async () => {
    appPort = await getPort();
    [
      originalCounterTools,
      originalPageScopedTool,
      originalHomePage,
      originalSearchFragment,
      originalGuidePage,
    ] = await Promise.all([
      readFile(counterToolsFile, 'utf8'),
      readFile(pageScopedToolFile, 'utf8'),
      readFile(homePageFile, 'utf8'),
      readFile(searchFragmentFile, 'utf8'),
      readFile(guidePageFile, 'utf8'),
    ]);
    app = await runDevCommand(appDir, appPort);
  });

  test.afterAll(async () => {
    try {
      if (app) {
        await killProcess(app);
      }
    } finally {
      await Promise.all([
        writeFile(counterToolsFile, originalCounterTools),
        writeFile(pageScopedToolFile, originalPageScopedTool),
        writeFile(homePageFile, originalHomePage),
        writeFile(searchFragmentFile, originalSearchFragment),
        writeFile(guidePageFile, originalGuidePage),
      ]);
    }
  });

  test.beforeEach(async ({ page }) => {
    await page.goto(`http://localhost:${appPort}/`, {
      waitUntil: 'networkidle',
    });
    await expect.poll(() => listToolNames(page)).toContain('rspress_navigate');
  });

  test('omits Markdown tools and keeps discovery tools', async ({ page }) => {
    await expect
      .poll(async () => (await listToolNames(page)).sort())
      .toEqual([
        'fixture_increment_counter',
        'fixture_reset_counter',
        'rspress_get_site_info',
        'rspress_list_pages',
        'rspress_navigate',
        'rspress_search_docs',
      ]);
    await expect(
      page.getByRole('button', { name: 'Copy Markdown' }),
    ).toHaveCount(0);
  });

  test('hot-updates a hook tool descriptor and execute closure', async ({
    page,
  }) => {
    const updatedCounterTools = originalCounterTools
      .replace('fixture counter by one', 'fixture counter by two')
      .replace('countRef.current += 1', 'countRef.current += 2');

    try {
      await writeFile(counterToolsFile, updatedCounterTools);
      await expect
        .poll(async () => {
          return (await findTool(page, 'fixture_increment_counter'))
            ?.description;
        })
        .toContain('by two');

      await executeTool(page, 'fixture_increment_counter', {});
      await expect(page.getByTestId('webmcp-counter')).toHaveText('Counter: 2');
    } finally {
      await writeFile(counterToolsFile, originalCounterTools);
    }

    await expect
      .poll(async () => {
        return (await findTool(page, 'fixture_increment_counter'))?.description;
      })
      .toContain('by one');
    await executeTool(page, 'fixture_reset_counter', {});
  });

  test('hot-updates and unregisters a page-scoped hook tool', async ({
    page,
  }) => {
    await executeTool(page, 'rspress_navigate', { routePath: '/guide' });
    await expect
      .poll(() => listToolNames(page))
      .toContain('fixture_page_scoped');

    const updatedPageScopedTool = originalPageScopedTool
      .replace('guide page is mounted', 'guide HMR page is mounted')
      .replace("{ page: 'guide' }", "{ page: 'guide-hmr' }");
    try {
      await writeFile(pageScopedToolFile, updatedPageScopedTool);
      await expect
        .poll(async () => {
          return (await findTool(page, 'fixture_page_scoped'))?.description;
        })
        .toContain('guide HMR');
      await expect(
        executeTool(page, 'fixture_page_scoped', {}),
      ).resolves.toMatchObject({ structuredContent: { page: 'guide-hmr' } });
    } finally {
      await writeFile(pageScopedToolFile, originalPageScopedTool);
    }

    await expect
      .poll(async () => {
        return (await findTool(page, 'fixture_page_scoped'))?.description;
      })
      .toContain('guide page');

    try {
      await writeFile(
        guidePageFile,
        originalGuidePage.replace('<PageScopedTool />', ''),
      );
      await expect
        .poll(() => listToolNames(page))
        .not.toContain('fixture_page_scoped');
    } finally {
      await writeFile(guidePageFile, originalGuidePage);
    }
    await expect
      .poll(() => listToolNames(page))
      .toContain('fixture_page_scoped');
  });

  test('hot-updates page content and the local search tool', async ({
    page,
  }) => {
    const updatedHomePage = originalHomePage
      .replace('# WebMCP home', '# WebMCP HMR home')
      .replace('cobalt platypus', 'silver capybara');

    try {
      await writeFile(homePageFile, updatedHomePage);
      await expect(page.getByText('silver capybara')).toBeVisible();
      await expect
        .poll(async () => {
          const result = await executeTool(page, 'rspress_list_pages', {
            query: 'HMR home',
          });
          return JSON.stringify(result?.structuredContent);
        })
        .toContain('WebMCP HMR home');
      await expect
        .poll(async () => {
          const search = await executeTool(page, 'rspress_search_docs', {
            query: 'silver capybara',
          });
          return JSON.stringify(search?.structuredContent);
        })
        .toContain('WebMCP HMR home');
      const navigation = await executeTool(page, 'rspress_navigate', {
        routePath: '/index.html',
      });
      expect(navigation?.structuredContent).toMatchObject({
        routePath: '/',
        page: { title: 'WebMCP HMR home' },
      });
    } finally {
      await writeFile(homePageFile, originalHomePage);
    }

    await expect(page.getByText('cobalt platypus')).toBeVisible();
    await expect
      .poll(async () => {
        const result = await executeTool(page, 'rspress_list_pages', {
          query: 'WebMCP home',
        });
        return JSON.stringify(result?.structuredContent);
      })
      .toContain('WebMCP home');
    await expect
      .poll(async () => {
        const search = await executeTool(page, 'rspress_search_docs', {
          query: 'cobalt platypus',
        });
        return JSON.stringify(search?.structuredContent);
      })
      .toContain('WebMCP home');
    const navigation = await executeTool(page, 'rspress_navigate', {
      routePath: '/index.html',
    });
    expect(navigation?.structuredContent).toMatchObject({
      routePath: '/',
      page: { title: 'WebMCP home' },
    });
  });

  test('hot-updates imported Markdown in the local search tool', async ({
    page,
  }) => {
    const updatedFragment = originalSearchFragment.replace(
      'indigo wombat',
      'violet echidna',
    );

    try {
      await writeFile(searchFragmentFile, updatedFragment);
      await expect(page.getByText(/violet echidna/)).toBeVisible();
      await expect
        .poll(async () => {
          const search = await executeTool(page, 'rspress_search_docs', {
            query: 'violet echidna',
          });
          return JSON.stringify(search?.structuredContent);
        })
        .toContain('WebMCP home');
    } finally {
      await writeFile(searchFragmentFile, originalSearchFragment);
    }

    await expect(page.getByText(/indigo wombat/)).toBeVisible();
  });
});
