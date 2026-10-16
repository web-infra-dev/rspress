import { fileURLToPath } from 'node:url';
import { readFile } from 'node:fs/promises';
import { config } from 'dotenv';
import { defineNode, z } from '@midscene/test';
import { defineProjectSetup, defineTestProject } from '@midscene/test/config';
import { createMidsceneNodes } from '@midscene/test/midscene';
import { PlaywrightAgent } from '@midscene/web/playwright/agent';
import { playgroundAsset } from './scripts/playground-assets.js';
import { fixturePolicy } from './scripts/original-fixture-data.js';
import { startFixtureServer } from './fixture-server.js';
import {
  OriginalFixture,
  originalFixtures,
  fixtureUpdateParts,
} from './scripts/original-fixture.js';
import {
  chromium,
  type Browser,
  type BrowserContext,
  type Page,
} from 'playwright';

config({ path: fileURLToPath(new URL('.env', import.meta.url)) });
const baseURL = process.env.MIDSCENE_BASE_URL ?? 'http://127.0.0.1:4173';
interface Context {
  browser: Browser;
  session?: BrowserContext;
  page?: Page;
  agent?: PlaywrightAgent;
  fixture: OriginalFixture;
}
const setup = defineProjectSetup<Context>({
  name: 'web',
  async setup({ onTeardown, signal }) {
    const stopServer = await startFixtureServer(
      baseURL,
      fileURLToPath(new URL('midscene_run/fixture.log', import.meta.url)),
      signal,
    );
    onTeardown(stopServer);
    const context: Context = {
      fixture: new OriginalFixture(
        fileURLToPath(new URL('../../', import.meta.url)),
      ),
      browser: await chromium.launch({
        headless: process.env.HEADLESS !== 'false',
      }),
    };
    onTeardown(async () => {
      try {
        await context.agent?.destroy();
      } finally {
        try {
          await context.browser.close();
        } finally {
          await context.fixture.close();
        }
      }
    });
    return context;
  },
});
const input = z.strictObject({
  fixture: z.enum(originalFixtures).optional(),
  mode: z.enum(['development', 'production']).default('development'),
  javascript: z.boolean().default(true),
  colorScheme: z.enum(['light', 'dark']).default('light'),
  locale: z.enum(['en-US', 'nl-NL']).default('en-US'),
  savedAppearance: z.enum(['light', 'dark']).optional(),
  path: z.string().startsWith('/').default('/'),
  viewport: z.enum(['desktop', 'mobile', 'tablet']).default('desktop'),
});
const open = defineNode<typeof input, void, Context>({
  name: 'app.open',
  description: 'Open a local fixture in a fresh browser session.',
  inputSchema: input,
  async execute({ context, input }) {
    const policy = fixturePolicy(input.fixture);
    const origin = input.fixture
      ? await context.fixture.open(input.fixture, input.mode)
      : baseURL;
    const url = new URL(input.path, origin);
    if (url.origin !== new URL(origin).origin)
      throw new Error('Only fixture routes are allowed');
    await context.agent?.destroy();
    context.agent = undefined;
    await context.session?.close();
    context.session = await context.browser.newContext({
      javaScriptEnabled: input.javascript,
      colorScheme: input.colorScheme,
      locale: input.locale,
      viewport:
        input.viewport === 'mobile'
          ? { width: 390, height: 844 }
          : input.viewport === 'tablet'
            ? { width: 1024, height: 768 }
            : { width: 1440, height: 900 },
    });
    if (input.savedAppearance) {
      await context.session.addInitScript(
        appearance =>
          localStorage.setItem('rspress-theme-appearance', appearance),
        input.savedAppearance,
      );
    }
    const allowedOrigins = new Set([url.origin]);
    await context.session.route('**/*', async route => {
      const requestURL = new URL(route.request().url());
      if (
        route.request().method() === 'GET' &&
        requestURL.href === 'https://assets.rspack.rs/rspress/rspress-logo.svg'
      ) {
        return route.fulfill({
          contentType: 'image/svg+xml',
          body: await readFile(
            new URL('./assets/rspress-logo.svg', import.meta.url),
          ),
        });
      }
      if (policy.playgroundAssets && route.request().method() === 'GET') {
        const asset = await playgroundAsset(requestURL).catch(() => undefined);
        if (asset) return route.fulfill({ status: 200, ...asset });
      }
      if (
        policy.iframeOrigins &&
        context.page &&
        !allowedOrigins.has(requestURL.origin)
      ) {
        const frames = await context.page
          .evaluate(() =>
            Array.from(document.querySelectorAll('iframe'), frame => frame.src),
          )
          .catch(() => [] as string[]);
        for (const frame of frames) {
          const source = new URL(frame, url.href);
          if (
            source.protocol === 'http:' &&
            ['127.0.0.1', 'localhost'].includes(source.hostname)
          ) {
            allowedOrigins.add(source.origin);
          }
        }
      }
      return ['data:', 'blob:'].includes(requestURL.protocol) ||
        allowedOrigins.has(requestURL.origin)
        ? route.continue()
        : route.abort('blockedbyclient');
    });
    context.page = await context.session.newPage();
    await context.page.goto(url.href, { waitUntil: 'domcontentloaded' });
    await context.page
      .locator(policy.readySelector)
      .first()
      .waitFor({ state: 'visible' });
    if (policy.waitForFrames) {
      const frames = context.page.locator('iframe');
      for (const iframe of await frames.all()) {
        const src = await iframe.getAttribute('src');
        const handle = await iframe.elementHandle();
        const frame = await handle?.contentFrame();
        if (src && frame)
          await frame.waitForURL(new URL(src, url.href).href, {
            waitUntil: 'load',
          });
      }
    }
  },
});
const updateInput = z.strictObject({
  part: z.enum(fixtureUpdateParts),
});
const updateFixture = defineNode<typeof updateInput, void, Context>({
  name: 'fixture.update',
  description:
    'Update an allowlisted source file in an isolated HMR fixture, without operating the UI.',
  inputSchema: updateInput,
  async execute({ context, input }) {
    await context.fixture.update(input.part);
  },
});
export default defineTestProject<Context>({
  test: { maxConcurrency: 1, testTimeout: 8 * 60_000 },
  projects: [
    {
      name: 'web',
      setup,
      retry: 0,
      files: { include: ['cases/**/*.yaml'] },
      tags: {
        include: (process.env.MIDSCENE_INCLUDE_TAGS ?? '')
          .split(',')
          .filter(Boolean),
      },
    },
  ],
  nodes: [
    open,
    updateFixture,
    ...createMidsceneNodes<Context>({
      agentClass: PlaywrightAgent,
      getAgent({ context }) {
        if (!context.page) throw new Error('Call app.open first');
        return (context.agent ??= new PlaywrightAgent(context.page));
      },
    }),
  ],
});
