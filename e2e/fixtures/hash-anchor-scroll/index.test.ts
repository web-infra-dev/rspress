import { expect, test, type Page } from '@e2e/test';
import {
  getPort,
  killProcess,
  runBuildCommand,
  runDevCommand,
  runPreviewCommand,
} from '../../utils/runCommands';

async function expectScroll(page: Page, top: number) {
  await expect
    .poll(() =>
      page.evaluate(expected => Math.abs(window.scrollY - expected), top),
    )
    .toBeLessThanOrEqual(1);
}

async function scrollTo(page: Page, top: number) {
  await page.evaluate(top => window.scrollTo(0, top), top);
  await expectScroll(page, top);
}

async function expectAnchor(page: Page, id: string) {
  await expect
    .poll(() =>
      page.locator(`[id="${id}"]`).evaluate(el => {
        const padding = Number.parseFloat(
          getComputedStyle(document.documentElement).scrollPaddingTop,
        );
        return Math.abs(el.getBoundingClientRect().top - padding);
      }),
    )
    .toBeLessThanOrEqual(1);
}

for (const mode of ['dev', 'build'] as const) {
  test.describe(`scroll restoration (${mode})`, () => {
    let appPort: number;
    let app: Awaited<ReturnType<typeof runDevCommand>>;

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

    test('scrolls after the target layout is ready', async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 720 });
      await page.goto(`http://localhost:${appPort}/docs/source`, {
        waitUntil: 'networkidle',
      });

      await page.getByRole('link', { name: 'Target section' }).click();
      await expect(page).toHaveURL(
        /\/docs\/target\?from=source#target-heading$/,
      );
      await expectAnchor(page, 'target-heading');
    });

    test('resets new entries and restores each history entry independently', async ({
      page,
    }) => {
      await page.goto(`http://localhost:${appPort}/docs/source`, {
        waitUntil: 'networkidle',
      });
      await scrollTo(page, 320);
      await page
        .getByRole('button', { name: 'Open target', exact: true })
        .click();
      await expect(page).toHaveURL(/\/docs\/target$/);
      await expectScroll(page, 0);
      await scrollTo(page, 480);

      // A second visit to /source must have its own scroll position.
      await page
        .getByRole('button', { name: 'Open source', exact: true })
        .click();
      await expect(page).toHaveURL(/\/docs\/source$/);
      await expectScroll(page, 0);
      await scrollTo(page, 640);

      await page.goBack();
      await expect(page).toHaveURL(/\/docs\/target$/);
      await expectScroll(page, 480);
      await page.goBack();
      await expect(page).toHaveURL(/\/docs\/source$/);
      await expectScroll(page, 320);
      await page.goForward();
      await expectScroll(page, 480);
      await page.goForward();
      await expectScroll(page, 640);
    });

    test('restores a saved position before following an entry hash', async ({
      page,
    }) => {
      await page.goto(`http://localhost:${appPort}/docs/source`, {
        waitUntil: 'networkidle',
      });
      await page.getByRole('button', { name: 'Open target section' }).click();
      await expectAnchor(page, 'target-heading');
      await scrollTo(page, 400);
      await page
        .getByRole('button', { name: 'Open source', exact: true })
        .click();
      await expect(page).toHaveURL(/\/docs\/source$/);

      await page.goBack();
      await expect(page).toHaveURL(/\/docs\/target#target-heading$/);
      await expectScroll(page, 400);
    });

    test('restores scroll after reloading', async ({ page }) => {
      await page.goto(`http://localhost:${appPort}/docs/target`, {
        waitUntil: 'networkidle',
      });
      await scrollTo(page, 600);
      await page.reload({ waitUntil: 'networkidle' });
      await expectScroll(page, 600);
    });

    if (mode === 'build') {
      test('reload keeps the latest reading position while a destination is loading', async ({
        page,
      }) => {
        await page.goto(`http://localhost:${appPort}/docs/source`, {
          waitUntil: 'networkidle',
        });
        await scrollTo(page, 400);

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
            try {
              await route.continue();
            } catch (error) {
              // Reload cancels the request for the pending destination.
              if (route.request().failure()?.errorText !== 'net::ERR_ABORTED') {
                throw error;
              }
            }
          },
          { times: 1 },
        );

        try {
          await page
            .getByRole('button', { name: 'Open target', exact: true })
            .click();
          await started;
          await expect(page.locator('#nprogress .bar')).toBeVisible();
          await expect(page).toHaveURL(/\/docs\/source$/);
          await scrollTo(page, 800);

          await page.reload({ waitUntil: 'networkidle' });
          await expect(page).toHaveURL(/\/docs\/source$/);
          await expectScroll(page, 800);
        } finally {
          release();
        }
      });
    }

    test('keeps scroll positions separate during document navigation', async ({
      page,
    }) => {
      await page.goto(`http://localhost:${appPort}/docs/target`, {
        waitUntil: 'networkidle',
      });
      await scrollTo(page, 600);
      await page.goto(`http://localhost:${appPort}/docs/source`, {
        waitUntil: 'networkidle',
      });
      await expectScroll(page, 0);

      await page.goBack({ waitUntil: 'networkidle' });
      await expect(page).toHaveURL(/\/docs\/target$/);
      await expectScroll(page, 600);
    });

    test('restores manual scroll on a hash URL after reloading', async ({
      page,
    }) => {
      await page.goto(
        `http://localhost:${appPort}/docs/target#target-heading`,
        {
          waitUntil: 'networkidle',
        },
      );
      await expectAnchor(page, 'target-heading');
      await scrollTo(page, 600);
      await page.reload({ waitUntil: 'networkidle' });
      await expectScroll(page, 600);
    });

    test('supports encoded initial hashes and subsequent same-page hashes', async ({
      page,
    }) => {
      await page.goto(
        `http://localhost:${appPort}/docs/target#${encodeURIComponent('编码标题')}`,
        { waitUntil: 'networkidle' },
      );
      await expectAnchor(page, '编码标题');
      await page.getByRole('button', { name: 'Open target section' }).click();
      await expect(page).toHaveURL(/\/docs\/target#target-heading$/);
      await expectAnchor(page, 'target-heading');
    });

    test('honors preventScrollReset for programmatic navigation', async ({
      page,
    }) => {
      await page.goto(`http://localhost:${appPort}/docs/source`, {
        waitUntil: 'networkidle',
      });
      await scrollTo(page, 500);
      await page.getByRole('button', { name: 'Keep scroll on target' }).click();
      await expect(page).toHaveURL(/\/docs\/target$/);
      await expectScroll(page, 500);
    });

    test('restores actual TOC anchors on backward and forward navigation', async ({
      page,
    }) => {
      const baseUrl = `http://localhost:${appPort}/docs/target?from=toc`;
      await page.goto(baseUrl, { waitUntil: 'networkidle' });
      const initialKey = await page.evaluate(() => history.state?.key);

      await page.locator('.rp-toc-item', { hasText: 'Target heading' }).click();
      await expect(page).toHaveURL(`${baseUrl}#target-heading`);
      await expectAnchor(page, 'target-heading');
      const firstTop = await page.evaluate(() => window.scrollY);
      const historyLength = await page.evaluate(() => history.length);
      await scrollTo(page, 400);
      await page.locator('.rp-toc-item', { hasText: 'Target heading' }).click();
      await expectAnchor(page, 'target-heading');
      expect(await page.evaluate(() => history.length)).toBe(historyLength);
      const firstKey = await page.evaluate(() => history.state?.key);

      await page.locator('.rp-toc-item', { hasText: '编码标题' }).click();
      await expect(page).toHaveURL(
        `${baseUrl}#${encodeURIComponent('编码标题')}`,
      );
      await expectAnchor(page, '编码标题');
      const secondTop = await page.evaluate(() => window.scrollY);
      const secondKey = await page.evaluate(() => history.state?.key);

      await page.goBack();
      await expect(page).toHaveURL(`${baseUrl}#target-heading`);
      await expectScroll(page, firstTop);
      await page.goForward();
      await expect(page).toHaveURL(
        `${baseUrl}#${encodeURIComponent('编码标题')}`,
      );
      await expectScroll(page, secondTop);
      expect(new Set([initialKey, firstKey, secondKey]).size).toBe(3);
    });

    test('restores manual scroll for each actual TOC history entry', async ({
      page,
    }) => {
      const baseUrl = `http://localhost:${appPort}/docs/target?from=toc-manual`;
      await page.goto(baseUrl, { waitUntil: 'networkidle' });
      await scrollTo(page, 240);
      await page.locator('.rp-toc-item', { hasText: 'Target heading' }).click();
      await expectAnchor(page, 'target-heading');
      await scrollTo(page, 400);
      await page.locator('.rp-toc-item', { hasText: '编码标题' }).click();
      await expectAnchor(page, '编码标题');
      await scrollTo(page, 800);

      await page.goBack();
      await expect(page).toHaveURL(`${baseUrl}#target-heading`);
      await expectScroll(page, 400);
      await page.goBack();
      await expect(page).toHaveURL(baseUrl);
      await expectScroll(page, 240);
      await page.goForward();
      await expectScroll(page, 400);
      await page.goForward();
      await expect(page).toHaveURL(
        `${baseUrl}#${encodeURIComponent('编码标题')}`,
      );
      await expectScroll(page, 800);
    });

    test('restores independent entries created by the hash navigation helper', async ({
      page,
    }) => {
      const baseUrl = `http://localhost:${appPort}/docs/target?from=helper`;
      await page.goto(baseUrl, { waitUntil: 'networkidle' });
      const initialKey = await page.evaluate(() => history.state?.key);
      await scrollTo(page, 240);

      await page
        .getByRole('button', { name: 'Navigate to target hash' })
        .click();
      await expect(page).toHaveURL(`${baseUrl}#target-heading`);
      await expectAnchor(page, 'target-heading');
      const firstKey = await page.evaluate(() => history.state?.key);
      await scrollTo(page, 400);

      await page
        .getByRole('button', { name: 'Navigate to encoded hash' })
        .click();
      await expect(page).toHaveURL(
        `${baseUrl}#${encodeURIComponent('编码标题')}`,
      );
      await expectAnchor(page, '编码标题');
      const secondKey = await page.evaluate(() => history.state?.key);
      await scrollTo(page, 800);

      await page.goBack();
      await expect(page).toHaveURL(`${baseUrl}#target-heading`);
      await expectScroll(page, 400);
      await page.goBack();
      await expect(page).toHaveURL(baseUrl);
      await expectScroll(page, 240);
      await page.goForward();
      await expectScroll(page, 400);
      await page.goForward();
      await expectScroll(page, 800);
      expect(new Set([initialKey, firstKey, secondKey]).size).toBe(3);
    });

    test('respects prevented hash links and hash links targeting a new tab', async ({
      page,
    }) => {
      const baseUrl = `http://localhost:${appPort}/docs/target?from=native-link`;
      await page.goto(baseUrl, { waitUntil: 'networkidle' });
      await scrollTo(page, 400);
      const initialKey = await page.evaluate(() => history.state?.key);

      await page.getByRole('link', { name: 'Prevent hash navigation' }).click();
      await expect(page).toHaveURL(baseUrl);
      await expectScroll(page, 400);
      expect(await page.evaluate(() => history.state?.key)).toBe(initialKey);

      const opened = page.waitForEvent('popup');
      await page.getByRole('link', { name: 'Open hash in new tab' }).click();
      const popup = await opened;
      try {
        await expect(popup).toHaveURL(`${baseUrl}#target-heading`);
        await expect(page).toHaveURL(baseUrl);
        await expectScroll(page, 400);
        expect(await page.evaluate(() => history.state?.key)).toBe(initialKey);
      } finally {
        await popup.close();
      }
    });
  });
}
