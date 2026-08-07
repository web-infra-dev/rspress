import os from 'node:os';
import {
  expect,
  type Locator,
  type Page,
  type PlaywrightFixture,
  test,
} from '@e2e/test';
import { getShouldOpenNewPage } from '../../utils/newPage';
import { getPort, killProcess, runDevCommand } from '../../utils/runCommands';

test.describe('Navigation with <Link>', async () => {
  let appPort: number;
  let app: Awaited<ReturnType<typeof runDevCommand>>;

  const getContext = async (page: Page) => {
    await page.goto(`http://localhost:${appPort}`, {
      waitUntil: 'networkidle',
    });
    const shouldOpenNewPage = getShouldOpenNewPage(page, p => p.url());
    return {
      page,
      anchor: page.locator('.rp-nav-menu__item a').first(),
      shouldOpenNewPage,
    };
  };

  type PromiseData<T> = T extends PromiseLike<infer D> ? D : T;

  type TestContext = PromiseData<ReturnType<typeof getContext>>;

  const gotoPage = (suffix: string) => `http://localhost:${appPort}${suffix}`;

  test.beforeAll(async () => {
    const appDir = import.meta.dirname;
    appPort = await getPort();
    app = await runDevCommand(appDir, appPort);
  });

  test.afterAll(async () => {
    if (app) {
      await killProcess(app);
    }
  });

  test('it should navigate correctly', async ({ page }) => {
    const { anchor } = await getContext(page);
    const prevUrl = page.url();
    await anchor.click();
    await expect(
      page.waitForURL(url => url.href !== prevUrl, { timeout: 2000 }),
    ).resolves.toBe(undefined);
  });

  test.describe('it should open new window/tab with modifier keys hold', () => {
    let scope: TestContext;

    test.beforeEach<PlaywrightFixture>(async ({ page }) => {
      scope = await getContext(page);
      await scope.anchor.evaluate(e => e.removeAttribute('target'));
    });

    /** @{link https://support.google.com/chrome/answer/157179} */
    const clickOptionCases = [
      // new tab
      { button: 'middle' },
      // new window
      { modifiers: ['Shift'] },
      // new tab
      { modifiers: os.platform() === 'darwin' ? ['Meta'] : ['Control'] },
    ] satisfies Parameters<Locator['click']>[0][];

    for (const clickOption of clickOptionCases) {
      test(JSON.stringify(clickOption), async () => {
        await expect(
          scope.shouldOpenNewPage(() => scope.anchor.click(clickOption)),
        ).resolves.toBe(gotoPage('/doc-1/index.html'));
      });
    }

    test('target=_blank', async () => {
      await scope.anchor.evaluate(e => e.setAttribute('target', '_blank'));
      await expect(
        scope.shouldOpenNewPage(() => scope.anchor.click()),
      ).resolves.toBe(gotoPage('/doc-1/index.html'));
    });
  });
});

// The harness stays mounted while the router swaps pages.
declare global {
  interface Window {
    awaitedNavigate(href: string): Promise<void>;
    linkNavigate(href: string): Promise<void>;
    setHold(hold: boolean): void;
    setNavigatorMounted(mounted: boolean): void;
    navigationResult?: string;
  }
}

test.describe('awaited navigation', () => {
  let port: number;
  let app: Awaited<ReturnType<typeof runDevCommand>>;

  test.beforeAll(async () => {
    port = await getPort();
    app = await runDevCommand(
      import.meta.dirname,
      port,
      'rspress-awaited.config.ts',
    );
  });
  test.afterAll(async () => {
    if (app) await killProcess(app);
  });
  test.beforeEach(async ({ page }) => {
    await page.goto(`http://localhost:${port}/base/`);
    await page.waitForFunction(() => Boolean(window.awaitedNavigate));
  });

  test('serializes calls and preserves relative queries and hashes', async ({
    page,
  }) => {
    const targets = await page.evaluate(async () => {
      const results: string[] = [];
      await Promise.all([
        window
          .awaitedNavigate('/awaited-target.html?tab=api#first')
          .then(() =>
            results.push(location.pathname + location.search + location.hash),
          ),
        window
          .awaitedNavigate('#second')
          .then(() =>
            results.push(location.pathname + location.search + location.hash),
          ),
        window
          .awaitedNavigate('./awaited-target.html?tab=next#third')
          .then(() =>
            results.push(location.pathname + location.search + location.hash),
          ),
      ]);
      await window.awaitedNavigate('./awaited-target.html?tab=next#third');
      await window.awaitedNavigate('#');
      results.push(location.pathname + location.search + location.hash);
      await window.awaitedNavigate('/awaited-target.html?#');
      results.push(location.pathname + location.search + location.hash);
      return results;
    });
    expect(targets).toEqual([
      '/base/awaited-target.html?tab=api#first',
      '/base/awaited-target.html?tab=api#second',
      '/base/awaited-target.html?tab=next#third',
      '/base/awaited-target.html?tab=next',
      '/base/awaited-target.html',
    ]);
  });

  test('keeps the transition pending during preload', async ({ page }) => {
    let release!: () => void;
    const gate = new Promise<void>(resolve => {
      release = resolve;
    });
    await page.route(/\/static\/js\/async\/route-.*\.js/, async route => {
      await gate;
      await route.continue();
    });
    await page.evaluate(() => {
      window.linkNavigate('/awaited-target.html').then(() => {
        window.navigationResult = 'done';
      });
    });
    try {
      await expect(page.getByTestId('pending')).toHaveText('true');
      expect(
        await page.evaluate(() => window.navigationResult),
      ).toBeUndefined();
    } finally {
      release();
    }
    await page.waitForFunction(() => window.navigationResult === 'done');
    await expect(page.getByTestId('pending')).toHaveText('false');
    await expect(page).toHaveURL(/\/base\/awaited-target.html$/);
  });

  test('recovers from a preload failure and clears progress', async ({
    page,
  }) => {
    await page.route(/\/static\/js\/async\/route-.*\.js/, route =>
      route.abort(),
    );
    const error = await page.evaluate(() =>
      window
        .awaitedNavigate('/awaited-target.html')
        .catch(error => error.message),
    );
    expect(error).toBeTruthy();
    await expect(page.locator('#nprogress')).toHaveCount(0);
    await page.evaluate(() =>
      window.awaitedNavigate('/index.html?recovered=1'),
    );
    await expect(page).toHaveURL(/\/base\/index.html\?recovered=1$/);
  });

  test('cancels a slow preload on timeout without navigating later', async ({
    page,
  }) => {
    let release!: () => void;
    const gate = new Promise<void>(resolve => {
      release = resolve;
    });
    await page.route(/\/static\/js\/async\/route-.*\.js/, async route => {
      await gate;
      await route.continue();
    });
    try {
      const error = await page.evaluate(() =>
        window
          .awaitedNavigate('/awaited-target.html')
          .catch(error => error.message),
      );
      expect(error).toBe('Navigation did not complete within 10000ms');
      await expect(page.locator('#nprogress')).toHaveCount(0);
      const loaded = page.waitForResponse(/\/static\/js\/async\/route-.*\.js/);
      release();
      await loaded;
      await page.evaluate(() =>
        window.awaitedNavigate('/index.html?recovered=1'),
      );
      await expect(page).toHaveURL(/\/base\/index.html\?recovered=1$/);
    } finally {
      release();
    }
  });

  test('rejects external and missing routes without leaving the page', async ({
    page,
  }) => {
    for (const href of ['https://example.com/', '/missing.html']) {
      const error = await page.evaluate(
        href => window.awaitedNavigate(href).catch(error => error.message),
        href,
      );
      expect(error).toBe('Awaited navigation requires an internal route');
    }
    await page.evaluate(() => window.awaitedNavigate('/awaited-target.html'));
    await expect(page).toHaveURL(/\/base\/awaited-target.html$/);
  });

  test('times out and allows a later navigation', async ({ page }) => {
    await page.evaluate(() => window.setHold(true));
    await expect(page.getByTestId('pending')).toHaveAttribute(
      'data-held',
      'true',
    );
    const error = await page.evaluate(() =>
      window
        .awaitedNavigate('/awaited-target.html')
        .catch(error => error.message),
    );
    expect(error).toBe('Navigation did not complete within 10000ms');
    await page.evaluate(() => window.setHold(false));
    await expect(page.getByTestId('pending')).toHaveAttribute(
      'data-held',
      'false',
    );
    await page.evaluate(() => window.awaitedNavigate('/'));
    await expect(page).toHaveURL(`http://localhost:${port}/base`);
  });

  test('rejects both active and queued calls when unmounted', async ({
    page,
  }) => {
    await page.evaluate(() => window.setHold(true));
    await expect(page.getByTestId('pending')).toHaveAttribute(
      'data-held',
      'true',
    );
    const errors = await page.evaluate(async () => {
      const results = Promise.all([
        window
          .awaitedNavigate('/awaited-target.html')
          .catch(error => error.message),
        window.awaitedNavigate('/').catch(error => error.message),
      ]);
      setTimeout(() => window.setNavigatorMounted(false), 100);
      return results;
    });
    expect(errors).toEqual([
      'Navigation was interrupted',
      'Navigation was interrupted',
    ]);
  });
});
