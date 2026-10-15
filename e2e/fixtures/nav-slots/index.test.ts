import { expect, test } from '@e2e/test';
import {
  getPort,
  killProcess,
  runBuildCommand,
  runPreviewCommand,
} from '../../utils/runCommands';

test.describe('Navigation slots', () => {
  let appPort: number;
  let app: Awaited<ReturnType<typeof runPreviewCommand>>;

  test.beforeAll(async () => {
    appPort = await getPort();
    await runBuildCommand(import.meta.dirname);
    app = await runPreviewCommand(import.meta.dirname, appPort);
  });

  test.afterAll(async () => {
    if (app) await killProcess(app);
  });

  test('preserves desktop slot markup, active class and browser errors', async ({
    page,
  }) => {
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(`http://localhost:${appPort}/`);
    const left = page.locator('.rp-nav-menu--left');
    const right = page.locator('.rp-nav-menu--right');
    const labels =
      ':scope > .rp-nav-menu__item > .rp-nav-menu__item__container';
    await expect(left.locator(labels)).toHaveText(['BL', 'L1', 'L2', 'AL']);
    await expect(right.locator(labels)).toHaveText([
      'BR',
      'R1',
      'R2',
      'AR',
      'More',
    ]);
    await expect(
      page.locator('.rp-nav__left > ul.rp-nav-menu--left'),
    ).toHaveCount(1);
    await expect(
      page.locator('.rp-nav__right > ul.rp-nav-menu--right'),
    ).toHaveCount(1);
    await expect(page.locator('.rp-nav-menu .rp-nav-menu')).toHaveCount(0);
    await expect(page.locator('.rp-nav-menu > :not(li)')).toHaveCount(0);
    await right.getByText('More', { exact: true }).hover();
    await right.getByRole('link', { name: 'Target', exact: true }).click();
    await expect(page).toHaveURL(/\/target$/);
    await expect(
      right.getByRole('link', { name: 'AR', exact: true }).locator('..'),
    ).toHaveClass(/rp-nav-menu__item--active/);
    expect(errors).toEqual([]);
  });

  test('preserves mobile order, active class and legacy Array compatibility', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.addInitScript(() => {
      // Safari 15.3 and older do not provide this ES2023 method.
      Object.defineProperty(Array.prototype, 'findLastIndex', {
        value: undefined,
        configurable: true,
        writable: true,
      });
    });
    await page.goto(`http://localhost:${appPort}/`);
    await page.locator('.rp-nav-hamburger__sm').click();
    const screen = page.locator('.rp-nav-screen');
    await expect(screen.locator('.rp-nav-menu')).toHaveCount(0);
    await expect(
      screen.locator('.rp-nav-screen__container > .rp-nav-screen-menu-item'),
    ).toHaveText(['BR', 'R1', 'BL', 'L1', 'R2', 'AR', 'More', 'L2', 'AL']);
    await screen.getByText('More', { exact: true }).click();
    await screen.getByText('Nested', { exact: true }).click();
    await screen.getByRole('link', { name: 'Target', exact: true }).click();
    await expect(page).toHaveURL(/\/target$/);
    await expect(screen).toHaveCount(0);
    await page.locator('.rp-nav-hamburger__sm').click();
    await expect(
      screen.getByRole('link', { name: 'AR', exact: true }),
    ).toHaveClass(/rp-nav-screen-menu-item--active/);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
  });
});
