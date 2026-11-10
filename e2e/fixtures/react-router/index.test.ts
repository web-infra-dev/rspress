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
        app = await runDevCommand(import.meta.dirname, port);
      } else {
        await runBuildCommand(import.meta.dirname);
        app = await runPreviewCommand(import.meta.dirname, port);
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

    test('shows a recoverable error page when a navigation chunk fails', async ({
      page,
    }) => {
      await page.goto(`http://localhost:${port}/docs/`, {
        waitUntil: 'networkidle',
      });
      await page.route(
        /\/static\/js\/async\/.*\.js(?:\?.*)?$/,
        route => route.abort(),
        { times: 1 },
      );
      await page
        .getByRole('button', { name: 'Native slow', exact: true })
        .click();
      await expect(
        page.getByRole('heading', { name: 'Something went wrong' }),
      ).toBeVisible();
      await expect(page).toHaveURL(`http://localhost:${port}/docs/slow`);
      await expect(page.locator('#nprogress')).toHaveCount(0);
      await expect(page.locator('.rp-error__details')).toHaveCount(
        mode === 'dev' ? 1 : 0,
      );
      await page.getByRole('button', { name: 'Reload page' }).click();
      await expect(
        page.getByRole('heading', { name: 'Slow page', exact: false }),
      ).toBeVisible();
      await expect(page.locator('.rp-error')).toHaveCount(0);
    });

    test('catches render errors without depending on global components', async ({
      page,
    }) => {
      const errors: string[] = [];
      page.on('console', message => {
        if (message.type() === 'error') errors.push(message.text());
      });
      await page.goto(`http://localhost:${port}/docs/`, {
        waitUntil: 'networkidle',
      });
      await page.getByRole('button', { name: 'Trigger render error' }).click();
      await expect(
        page.getByRole('heading', { name: 'Something went wrong' }),
      ).toBeFocused();
      await expect(page).toHaveTitle('Something went wrong');
      if (mode === 'dev') {
        await expect(page.locator('.rp-error__details')).toContainText(
          'Error page render fixture',
        );
      } else {
        await expect(page.locator('body')).not.toContainText(
          'Error page render fixture',
        );
      }
      expect(
        errors.some(message => message.includes('Error page render fixture')),
      ).toBe(true);
      await expect(
        page.getByRole('link', { name: 'Take me home' }),
      ).toHaveAttribute('href', '/docs/');
      await page.getByRole('link', { name: 'Take me home' }).click();
      await expect(page.getByTestId('page-state')).toHaveText(
        '/|Navigation home',
      );
    });

    test('handles a failed initial page chunk', async ({ page }) => {
      await page.route(/\/static\/js\/async\/.*\.js(?:\?.*)?$/, route =>
        route.abort(),
      );
      await page.goto(`http://localhost:${port}/docs/slow`);
      await expect(
        page.getByRole('heading', { name: 'Something went wrong' }),
      ).toBeVisible();
      await page.unrouteAll();
      await page.getByRole('button', { name: 'Reload page' }).click();
      await expect(page.getByTestId('page-state')).toHaveText(
        '/slow|Slow page',
      );
    });

    if (mode === 'build') {
      test('emits HTML and Markdown with loader data and hydrates without errors', async ({
        page,
      }) => {
        const output = path.join(import.meta.dirname, 'doc_build');
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
