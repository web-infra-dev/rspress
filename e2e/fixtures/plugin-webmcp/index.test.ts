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
  listToolNames,
  listTools,
} from './webmcpTestUtils';

const appDir = import.meta.dirname;
const outputDir = path.join(appDir, 'doc_build');
const counterToolsFile = path.join(appDir, 'src/CounterTools.tsx');
const pageScopedToolFile = path.join(appDir, 'src/PageScopedTool.tsx');
const homePageFile = path.join(appDir, 'doc/v1/en/index.mdx');
const guidePageFile = path.join(appDir, 'doc/v1/en/guide.mdx');

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
        'rspress_navigate',
        'rspress_search_docs',
      ]);
  });

  test('lists descriptors and reads generated Markdown', async ({ page }) => {
    const tools = await listTools(page);
    const currentPageTool = tools.find(
      tool => tool.name === 'rspress_get_current_page',
    );
    const searchTool = tools.find(tool => tool.name === 'rspress_search_docs');
    const navigateTool = tools.find(tool => tool.name === 'rspress_navigate');
    expect(JSON.parse(currentPageTool!.inputSchema!)).toMatchObject({
      type: 'object',
      additionalProperties: false,
    });
    expect(JSON.parse(searchTool!.inputSchema!)).toMatchObject({
      required: ['query'],
      properties: { limit: { maximum: 20 } },
    });
    expect(JSON.parse(navigateTool!.inputSchema!)).toMatchObject({
      required: ['routePath'],
    });

    const currentPage = await executeTool(page, 'rspress_get_current_page', {});
    expect(currentPage?.structuredContent).toMatchObject({
      title: 'WebMCP home',
      routePath: '/',
    });
    expect(
      (currentPage?.structuredContent as { markdown: string }).markdown,
    ).toContain('# WebMCP home');
  });

  test('executes search and both custom registration APIs', async ({
    page,
  }) => {
    const search = await executeTool(page, 'rspress_search_docs', {
      query: 'cobalt platypus',
      limit: 5,
    });
    expect(JSON.stringify(search?.structuredContent)).toContain('WebMCP home');

    await executeTool(page, 'fixture_increment_counter', {});
    await expect(page.getByTestId('webmcp-counter')).toHaveText('Counter: 1');
    await executeTool(page, 'fixture_reset_counter', {});
    await expect(page.getByTestId('webmcp-counter')).toHaveText('Counter: 0');

    await expect(
      executeTool(page, 'rspress_search_docs', { query: '', limit: 100 }),
    ).rejects.toThrow(/Input validation error/);
  });

  test('awaits navigation and cleans up page-scoped tools', async ({
    page,
  }) => {
    await executeTool(page, 'rspress_navigate', {
      routePath: '/guide.html?source=webmcp#webmcp-guide',
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

    expect(first?.structuredContent).toEqual({
      routePath: '/guide?sequence=first',
    });
    expect(second?.structuredContent).toEqual({
      routePath: '/?sequence=second',
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
  let originalGuidePage: string;

  test.beforeAll(async () => {
    appPort = await getPort();
    [
      originalCounterTools,
      originalPageScopedTool,
      originalHomePage,
      originalGuidePage,
    ] = await Promise.all([
      readFile(counterToolsFile, 'utf8'),
      readFile(pageScopedToolFile, 'utf8'),
      readFile(homePageFile, 'utf8'),
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

  test('omits the unavailable current-page tool', async ({ page }) => {
    await expect
      .poll(() => listToolNames(page))
      .not.toContain('rspress_get_current_page');
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
    const updatedHomePage = originalHomePage.replace(
      'cobalt platypus',
      'silver capybara',
    );

    try {
      await writeFile(homePageFile, updatedHomePage);
      await expect(page.getByText('silver capybara')).toBeVisible();
      await expect
        .poll(async () => {
          const search = await executeTool(page, 'rspress_search_docs', {
            query: 'silver capybara',
          });
          return JSON.stringify(search?.structuredContent);
        })
        .toContain('WebMCP home');
    } finally {
      await writeFile(homePageFile, originalHomePage);
    }

    await expect(page.getByText('cobalt platypus')).toBeVisible();
    await expect
      .poll(async () => {
        const search = await executeTool(page, 'rspress_search_docs', {
          query: 'cobalt platypus',
        });
        return JSON.stringify(search?.structuredContent);
      })
      .toContain('WebMCP home');
  });
});
