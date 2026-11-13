import fs from 'node:fs/promises';
import path from 'node:path';
import { expect, test } from '@e2e/test';
import {
  getPort,
  killProcess,
  runBuildCommand,
  runDevCommand,
} from '../../utils/runCommands';

const DOC_FILE = new URL('./doc/index.mdx', import.meta.url);
const CONFIG_FILE = new URL('./rspress.config.ts', import.meta.url);
const MONACO_PREFIX =
  'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.43.0/min/vs';
const MONACO_PRELOAD_URLS = [
  `${MONACO_PREFIX}/loader.js`,
  `${MONACO_PREFIX}/editor/editor.main.js`,
];

test('Should only preload Monaco on pages containing playgrounds', async () => {
  const appDir = import.meta.dirname;
  await runBuildCommand(appDir);

  const [playgroundHtml, pureHtml] = await Promise.all([
    fs.readFile(path.join(appDir, 'doc_build/index.html'), 'utf-8'),
    fs.readFile(path.join(appDir, 'doc_build/pure.html'), 'utf-8'),
  ]);

  for (const url of MONACO_PRELOAD_URLS) {
    expect(playgroundHtml.split(url)).toHaveLength(2);
    expect(pureHtml).not.toContain(url);
  }
});

test.describe('plugin playground rendering and HMR', async () => {
  let appPort;
  let app;
  let originalContent: string;
  let originalConfig: string;
  let output = '';
  test.beforeAll(async () => {
    const appDir = import.meta.dirname;
    originalContent = await fs.readFile(DOC_FILE, 'utf-8');
    originalConfig = await fs.readFile(CONFIG_FILE, 'utf-8');
    appPort = await getPort();
    app = await runDevCommand(appDir, appPort);
    const collectOutput = (chunk: Buffer) => {
      output += chunk.toString();
    };
    app.stdout.on('data', collectOutput);
    app.stderr.on('data', collectOutput);
  });

  test.afterAll(async () => {
    try {
      if (app) {
        await killProcess(app);
      }
    } finally {
      await fs.writeFile(DOC_FILE, originalContent);
      await fs.writeFile(CONFIG_FILE, originalConfig);
    }
  });

  test('Should render the element', async ({ page }) => {
    await page.goto(`http://localhost:${appPort}/`, {
      waitUntil: 'networkidle',
    });

    const playgroundElements = page.locator('.rp-playground');
    await expect(playgroundElements).toHaveCount(3);

    const internalDemoCodePreviewDefault = page
      .locator('.rp-playground > .rp-playground-runner > div')
      .getByText('Hello World Internal (default)');

    const internalDemoCodePreviewVertical = page
      .locator('.rp-playground > .rp-playground-runner > div')
      .getByText('Hello World Internal (vertical)');

    const externalDemoCodePreview = page
      .locator('.rp-playground > .rp-playground-runner > div')
      .getByText('Hello World External');

    await expect(internalDemoCodePreviewDefault).toHaveCount(1);
    await expect(internalDemoCodePreviewVertical).toHaveCount(1);
    await expect(externalDemoCodePreview).toHaveCount(1);
  });

  test('Should update the rendered code through HMR', async ({ page }) => {
    await page.goto(`http://localhost:${appPort}/`, {
      waitUntil: 'networkidle',
    });

    await page.evaluate(() => {
      (
        window as Window & { playgroundHmrMarker?: string }
      ).playgroundHmrMarker = 'preserved';
    });
    for (const label of ['first update', 'second update', 'third update']) {
      const text = `Hello World Internal (${label})`;
      await fs.writeFile(
        DOC_FILE,
        originalContent.replace('Hello World Internal (default)', text),
      );

      await expect(
        page
          .locator('.rp-playground > .rp-playground-runner > div')
          .getByText(text, { exact: true }),
      ).toHaveCount(1);
      expect(
        await page.evaluate(
          () =>
            (window as Window & { playgroundHmrMarker?: string })
              .playgroundHmrMarker,
        ),
      ).toBe('preserved');
    }
  });

  test('Should keep imports available across config restarts', async ({
    page,
  }) => {
    for (const title of [
      'First playground restart',
      'Second playground restart',
    ]) {
      const previousBuildCount = output.match(/built in/g)?.length ?? 0;
      await fs.writeFile(
        CONFIG_FILE,
        originalConfig.replace(
          'defineConfig({',
          `defineConfig({ title: '${title}',`,
        ),
      );
      await expect
        .poll(() => output.match(/built in/g)?.length ?? 0, { timeout: 30_000 })
        .toBeGreaterThan(previousBuildCount);
      await page.goto(`http://localhost:${appPort}/`, {
        waitUntil: 'networkidle',
      });
      await expect(page).toHaveTitle(new RegExp(title));
      await expect(page.locator('.rp-playground')).toHaveCount(3);
      await expect(
        page
          .locator('.rp-playground-runner')
          .getByText('Hello World External', {
            exact: true,
          }),
      ).toHaveCount(1);
    }
    expect(output).not.toContain("Can't resolve '_rspress_playground_imports'");
  });
});
