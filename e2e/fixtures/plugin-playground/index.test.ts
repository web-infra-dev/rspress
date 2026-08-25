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
  test.beforeAll(async () => {
    const appDir = import.meta.dirname;
    originalContent = await fs.readFile(DOC_FILE, 'utf-8');
    appPort = await getPort();
    app = await runDevCommand(appDir, appPort);
  });

  test.afterAll(async () => {
    try {
      if (app) {
        await killProcess(app);
      }
    } finally {
      await fs.writeFile(DOC_FILE, originalContent);
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

    const updatedContent = originalContent.replace(
      'Hello World Internal (default)',
      'Hello World Internal (updated)',
    );
    await fs.writeFile(DOC_FILE, updatedContent);

    await expect(
      page
        .locator('.rp-playground > .rp-playground-runner > div')
        .getByText('Hello World Internal (updated)'),
    ).toHaveCount(1);
  });
});
