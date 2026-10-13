import { readFileSync } from 'node:fs';
import path from 'node:path';
import { expect, test } from '@e2e/test';
import {
  getPort,
  killProcess,
  runDevCommand,
  runBuildCommand,
  runPreviewCommand,
} from '../../utils/runCommands';

function getPackageVersion(name: string) {
  const pkgJsonPath = path.join(
    import.meta.dirname,
    'node_modules',
    name,
    'package.json',
  );
  return JSON.parse(readFileSync(pkgJsonPath, 'utf-8')).version as string;
}

for (const mode of ['dev', 'build'] as const) {
  test.describe(`React Router DOM 6 compatibility (${mode})`, async () => {
    let appPort: number;
    let app: Awaited<ReturnType<typeof runDevCommand>> | null;
    test.beforeAll(async () => {
      const appDir = import.meta.dirname;
      appPort = await getPort();
      if (mode === 'dev') {
        app = await runDevCommand(appDir, appPort);
      } else {
        await runBuildCommand(appDir);
        app = await runPreviewCommand(appDir, appPort);
      }
    });

    test.afterAll(async () => {
      if (app) {
        await killProcess(app);
      }
    });

    test('keeps the current page visible while a destination suspends', async ({
      page,
    }) => {
      let release!: () => void;
      let requested!: () => void;
      const gate = new Promise<void>(resolve => {
        release = resolve;
      });
      const started = new Promise<void>(resolve => {
        requested = resolve;
      });
      await page.route('**/transition-gate', async route => {
        requested();
        await gate;
        await route.fulfill({ body: 'ready' });
      });
      await page.goto(`http://localhost:${appPort}`, {
        waitUntil: 'networkidle',
      });
      try {
        await page.getByRole('button', { name: 'Open suspended page' }).click();
        await started;
        await expect(
          page.getByRole('heading', { name: 'Hello world', exact: false }),
        ).toBeVisible();
      } finally {
        release();
      }
      await expect(
        page.getByRole('heading', { name: 'Slow route', exact: false }),
      ).toBeVisible();
    });

    test('Index page', async ({ page }) => {
      await page.goto(`http://localhost:${appPort}`, {
        waitUntil: 'networkidle',
      });
      const h1 = page.locator('h1');
      await expect(h1).toContainText('Hello world');
      const body = page.locator('body');
      await expect(body).toContainText(
        `react-router-dom ${getPackageVersion('react-router-dom')}`,
      );
      await expect(body).toContainText(`react ${getPackageVersion('react')}`);
    });

    if (mode === 'build') {
      test('emits HTML and Markdown with the consumer router', () => {
        const output = path.join(import.meta.dirname, 'doc_build');
        for (const file of ['index.html', 'index.md']) {
          expect(readFileSync(path.join(output, file), 'utf8')).toContain(
            'Hello world',
          );
        }
      });
    }

    test('404 page', async ({ page }) => {
      await page.goto(`http://localhost:${appPort}/404`, {
        waitUntil: 'networkidle',
      });
      // find the 404 text in the page
      await expect(page.locator('body')).toContainText('404');
    });
  });
}
