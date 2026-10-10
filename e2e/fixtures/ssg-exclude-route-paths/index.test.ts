import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { expect, test } from '@e2e/test';
import {
  getPort,
  killProcess,
  runBuildCommand,
  runPreviewCommand,
} from '../../utils/runCommands';

test.describe('ssg.experimentalExcludeRoutePaths', () => {
  let appPort: number;
  let app: Awaited<ReturnType<typeof runPreviewCommand>> | null;

  test.beforeAll(async () => {
    const appDir = import.meta.dirname;
    appPort = await getPort();
    await runBuildCommand(appDir);
    app = await runPreviewCommand(appDir, appPort);
  });

  test.afterAll(async () => {
    if (app) {
      await killProcess(app);
    }
  });

  test('excluded route ships an empty SSG shell', async () => {
    const html = await readFile(
      path.join(import.meta.dirname, 'doc_build/index.html'),
      'utf-8',
    );
    // Tolerate template whitespace, but assert the container holds no element
    expect(html).toMatch(/<div id="__rspress_root">\s*<\/div>/);
  });

  test('non-excluded route is statically rendered', async () => {
    const html = await readFile(
      path.join(import.meta.dirname, 'doc_build/ssg-page.html'),
      'utf-8',
    );
    expect(html).toContain('Hello SSG');
  });

  test('excluded route is client-rendered without hydration errors', async ({
    page,
  }) => {
    const consoleMessages: string[] = [];
    const pageErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'warning' || msg.type() === 'error') {
        consoleMessages.push(msg.text());
      }
    });
    page.on('pageerror', error => {
      pageErrors.push(error.message);
    });

    await page.goto(`http://localhost:${appPort}`, {
      waitUntil: 'networkidle',
    });

    // The empty container means the h1 can only come from the client render
    await expect(page.locator('h1')).toContainText('Hello CSR');

    expect(pageErrors).toEqual([]);

    // The empty container has nothing to hydrate, so mounting it must not
    // produce hydration recoverable errors (React error #418/#423)
    // Only assert on hydration signatures so that unrelated console noise
    // cannot flake the test
    const hydrationErrors = consoleMessages.filter(message =>
      /hydration|hydrate|recoverable|Minified React error/i.test(message),
    );
    expect(hydrationErrors).toEqual([]);
  });
});
