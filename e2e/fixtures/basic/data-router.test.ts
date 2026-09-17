import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { expect, type Page, test } from '@e2e/test';
import {
  getPort,
  killProcess,
  runBuildCommand,
  runDevCommand,
  runPreviewCommand,
} from '../../utils/runCommands';

const config = 'rspress.data-router.config.ts';

// Hold a page chunk until the test explicitly releases it. Hover prefetching
// cannot hide the loading state because native navigation uses buttons.
async function holdPageChunk(page: Page) {
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
  return { release, started };
}

for (const mode of ['dev', 'build'] as const) {
  test.describe(`data router (${mode})`, () => {
    let app: Awaited<ReturnType<typeof runDevCommand>>;
    let port: number;
    test.beforeAll(async () => {
      port = await getPort();
      if (mode === 'dev') {
        app = await runDevCommand(import.meta.dirname, port, config);
      } else {
        await runBuildCommand(import.meta.dirname, config);
        app = await runPreviewCommand(import.meta.dirname, port, [
          '-c',
          config,
        ]);
      }
    });
    test.afterAll(async () => {
      await killProcess(app);
    });

    for (const button of ['Native slow', 'Theme slow', 'Transition slow']) {
      test(`${button} waits for the chunk before committing location and data`, async ({
        page,
      }) => {
        await page.goto(`http://localhost:${port}/docs/`, {
          waitUntil: 'networkidle',
        });
        const chunk = await holdPageChunk(page);
        try {
          await page.getByRole('button', { name: button, exact: true }).click();
          await chunk.started;
          await expect(page.getByTestId('navigation-state')).toHaveText(
            'loading',
          );
          await expect(page.getByTestId('navigation-completion')).toHaveText(
            'pending',
          );
          if (button === 'Transition slow') {
            await expect(page.getByTestId('transition-state')).toHaveText(
              'true',
            );
          }
          await expect(page.getByTestId('page-state')).toHaveText(
            '/|Navigation home',
          );
          await expect(page.locator('h1')).toContainText('Navigation home');
          await expect(page).toHaveURL(`http://localhost:${port}/docs/`);
          await expect(page.locator('#nprogress .bar')).toBeVisible();
        } finally {
          chunk.release();
        }
        await expect(page.getByTestId('navigation-completion')).toHaveText(
          'complete',
        );
        await expect(page.getByTestId('page-state')).toHaveText(
          '/slow|Slow page',
        );
        await expect(page.locator('h1')).toContainText('Slow page');
        await expect(page).toHaveURL(`http://localhost:${port}/docs/slow`);
        await expect(page.locator('#nprogress')).toHaveCount(0);
        await page.goBack();
        await expect(page.getByTestId('page-state')).toHaveText(
          '/|Navigation home',
        );
        await expect(page.locator('h1')).toContainText('Navigation home');
        await page.goForward();
        await expect(page.getByTestId('page-state')).toHaveText(
          '/slow|Slow page',
        );
      });
    }

    test('a superseded loader cannot overwrite a newer navigation', async ({
      page,
    }) => {
      await page.goto(`http://localhost:${port}/docs/`, {
        waitUntil: 'networkidle',
      });
      const chunk = await holdPageChunk(page);
      try {
        await page
          .getByRole('button', { name: 'Native slow', exact: true })
          .click();
        await chunk.started;
        await page
          .getByRole('button', { name: 'Native fast', exact: true })
          .click();
        await expect(page.getByTestId('page-state')).toHaveText(
          '/fast|Fast page',
        );
      } finally {
        chunk.release();
      }
      await page.waitForLoadState('networkidle');
      await expect(page.getByTestId('navigation-state')).toHaveText('idle');
      await expect(page.locator('h1')).toContainText('Fast page');
      await expect(page).toHaveURL(`http://localhost:${port}/docs/fast`);
    });

    test('hover preloads without navigating', async ({ page }) => {
      await page.goto(`http://localhost:${port}/docs/`, {
        waitUntil: 'networkidle',
      });
      const chunk = await holdPageChunk(page);
      try {
        await page.getByRole('link', { name: 'Hover to preload' }).hover();
        await chunk.started;
        await expect(page.getByTestId('navigation-state')).toHaveText('idle');
        await expect(page.getByTestId('page-state')).toHaveText(
          '/|Navigation home',
        );
      } finally {
        chunk.release();
      }
      await page.getByRole('link', { name: 'Hover to preload' }).click();
      await expect(page.locator('h1')).toContainText('Slow page');
    });

    test('native navigation handles anchors and missing pages', async ({
      page,
    }) => {
      await page.goto(`http://localhost:${port}/docs/`, {
        waitUntil: 'networkidle',
      });
      await page.getByRole('button', { name: 'Native anchor' }).click();
      await expect(page).toHaveURL(
        `http://localhost:${port}/docs/slow#slow-heading`,
      );
      await expect(page.locator('h1')).toContainText('Slow page');
      await page.getByRole('button', { name: 'Native missing' }).click();
      await expect(page.getByTestId('page-state')).toHaveText('/missing|404');
    });

    if (mode === 'build') {
      test('emits HTML and Markdown with loader data and hydrates without errors', async ({
        page,
      }) => {
        const output = path.join(import.meta.dirname, 'dist-data-router');
        expect(
          await readFile(path.join(output, 'slow.html'), 'utf8'),
        ).toContain('Slow page content.');
        expect(await readFile(path.join(output, 'slow.md'), 'utf8')).toContain(
          'Slow page content.',
        );
        const errors: string[] = [];
        page.on('pageerror', error => errors.push(error.message));
        page.on('console', message => {
          if (/hydrate|hydration|recoverable/i.test(message.text()))
            errors.push(message.text());
        });
        await page.goto(`http://localhost:${port}/docs/slow`, {
          waitUntil: 'networkidle',
        });
        await expect(page.getByTestId('page-state')).toHaveText(
          '/slow|Slow page',
        );
        expect(errors).toEqual([]);
      });
    }
  });
}
