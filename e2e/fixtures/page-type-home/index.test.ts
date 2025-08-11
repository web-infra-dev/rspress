import { expect, test } from '@playwright/test';
import { getPort, killProcess, runDevCommand } from '../../utils/runCommands';

const appDir = __dirname;

test.describe('home pageType', async () => {
  let appPort: number;
  let app: unknown;
  test.beforeAll(async () => {
    appPort = await getPort();
    app = await runDevCommand(appDir, appPort);
  });

  test.afterAll(async () => {
    if (app) {
      await killProcess(app);
    }
  });

  test('Hero', async ({ page }) => {
    await page.goto(`http://localhost:${appPort}/base/`);
    await expect(page.locator('h1').textContent()).resolves.toBe(
      'E2E case title',
    );
    await expect(
      page.locator('.rspress-home-hero-text').textContent(),
    ).resolves.toBe('E2E case subTitle');
    await expect(
      page.locator('.rspress-home-hero-tagline').textContent(),
    ).resolves.toBe('E2E case tagline');

    const img = page.locator('.rspress-home-hero-image img').first();
    await expect(img.getAttribute('src')).resolves.toBe('/base/brand.png');
    await expect(img.getAttribute('alt')).resolves.toBe('E2E case brand image');
    await expect(img.getAttribute('srcset')).resolves.toBe(
      '/brand.png, /brand@2x.png 2x',
    );
    await expect(img.getAttribute('sizes')).resolves.toBe(
      '((min-width: 50em) and (max-width: 60em)) 50em, (max-width: 30em) 20em',
    );

    const actions = page.locator('.rspress-home-hero-actions a');
    await expect(actions).toHaveCount(3);
    await expect(actions.nth(0).textContent()).resolves.toBe('Action 1');
    await expect(actions.nth(1).textContent()).resolves.toBe('Action 2');
    await expect(actions.nth(2).textContent()).resolves.toBe('External');
    // click the first action
    const url1 = page.url();
    await actions.nth(0).click();
    await page.waitForSelector('.rspress-doc');
    expect(page.url()).toBe(`${url1}guide/action-1.html`);
  });

  test('Hero - zh', async ({ page }) => {
    await page.goto(`http://localhost:${appPort}/base/zh/`);
    await expect(page.locator('h1').textContent()).resolves.toBe(
      'E2E 用例 title',
    );
    await expect(
      page.locator('.rspress-home-hero-text').textContent(),
    ).resolves.toBe('E2E 用例 subTitle');
    await expect(
      page.locator('.rspress-home-hero-tagline').textContent(),
    ).resolves.toBe('E2E 用例 tagline');

    const img = page.locator('.rspress-home-hero-image img').first();
    await expect(img.getAttribute('src')).resolves.toBe('/base/brand.png');
    await expect(img.getAttribute('alt')).resolves.toBe('E2E 用例 brand image');
    await expect(img.getAttribute('srcset')).resolves.toBe(
      '/brand.png, /brand@2x.png 2x',
    );
    await expect(img.getAttribute('sizes')).resolves.toBe(
      '((min-width: 50em) and (max-width: 60em)) 50em, (max-width: 30em) 20em',
    );

    const actions = page.locator('.rspress-home-hero-actions a');
    await expect(actions).toHaveCount(3);
    await expect(actions.nth(0).textContent()).resolves.toBe('操作 1');
    await expect(actions.nth(1).textContent()).resolves.toBe('操作 2');
    await expect(actions.nth(2).textContent()).resolves.toBe('External');
    // click the first action
    const url1 = page.url();
    await actions.nth(0).click();
    await page.waitForSelector('.rspress-doc');
    expect(page.url()).toBe(`${url1}guide/action-1.html`);
  });

  test('Features', async ({ page }) => {
    await page.goto(`http://localhost:${appPort}/base/`);
    const features = await page.$$('.rspress-home-feature-card');
    expect(features).toHaveLength(2);

    const url1 = page.url();
    await features[0].click();
    expect(page.url()).toBe(url1);

    await features[1].click();
    expect(page.url()).toBe('https://example.com/');
  });
});
