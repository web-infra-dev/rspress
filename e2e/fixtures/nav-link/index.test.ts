import { expect, test } from '@playwright/test';
import { getPort, killProcess, runDevCommand } from '../../utils/runCommands';

import os from 'node:os';
import type { Locator, Page } from '@playwright/test';
import { getShouldOpenNewPage } from '../../utils/newPage';

test.describe('Navigation with <Link>', async () => {
  let appPort: number;
  let app: unknown;

  const getContext = async (page: Page) => {
    await page.goto(`http://localhost:${appPort}`, {
      waitUntil: 'networkidle',
    });
    const shouldOpenNewPage = getShouldOpenNewPage(page, p => p.url());
    const dispose = () => page.close();

    return {
      page,
      anchor: page.locator('.rspress-nav-menu > a:first-child').first(),
      shouldOpenNewPage,
      dispose,
    };
  };

  type PromiseData<T> = T extends PromiseLike<infer D> ? D : T;

  type TestContext = PromiseData<ReturnType<typeof getContext>>;

  const gotoPage = (suffix: string) => `http://localhost:${appPort}${suffix}`;

  test.beforeAll(async () => {
    const appDir = __dirname;
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

    test.beforeAll(async ({ browser }) => {
      scope = await getContext(await browser.newPage());
    });

    test.afterAll(async () => {
      await scope.dispose();
    });

    test.beforeEach(async () => {
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
      test(JSON.stringify(clickOption), async ({ page: _ }) => {
        await expect(
          scope.shouldOpenNewPage(() => scope.anchor.click(clickOption)),
        ).resolves.toBe(gotoPage('/doc-1/index.html'));
      });
    }

    test('target=_blank', async ({ page: _ }) => {
      await scope.anchor.evaluate(e => e.setAttribute('target', '_blank'));
      await expect(
        scope.shouldOpenNewPage(() => scope.anchor.click()),
      ).resolves.toBe(gotoPage('/doc-1/index.html'));
    });
  });
});
