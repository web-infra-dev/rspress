import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { expect, test } from '@e2e/test';
import {
  getPort,
  killProcess,
  runBuildCommand,
  runPreviewCommand,
} from '../../utils/runCommands';

test.describe('preset: headless', () => {
  const appDir = import.meta.dirname;
  let appPort: number;
  let app: Awaited<ReturnType<typeof runPreviewCommand>> | null = null;

  test.beforeAll(async () => {
    appPort = await getPort();
    await runBuildCommand(appDir);
    app = await runPreviewCommand(appDir, appPort);
  });

  test.afterAll(async () => {
    if (app) {
      await killProcess(app);
    }
  });

  test('emits minimal headless CSS without preflight or default skin while preserving globalStyles', async () => {
    const cssDir = path.join(appDir, 'doc_build/static/css');
    const cssFiles = (await readdir(cssDir)).filter(f => f.endsWith('.css'));
    expect(cssFiles.length).toBeGreaterThan(0);

    const css = (
      await Promise.all(
        cssFiles.map(file => readFile(path.join(cssDir, file), 'utf8')),
      )
    ).join('\n');

    expect(css).toContain('@layer rp-headless');
    expect(css).toContain('--shiki-foreground');
    expect(css).toContain('.custom-headless-badge');

    // Strips preflight reset, brand palette, nprogress, and default decorative component CSS
    expect(css).not.toContain('--tw-content');
    expect(css).not.toContain('--rp-c-brand');
    expect(css).not.toContain('#nprogress');
    expect(css).not.toContain('.rp-callout');
  });

  test('renders functional layout skeleton, interactive visibility, and allows @layer overrides', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(`http://localhost:${appPort}`, {
      waitUntil: 'networkidle',
    });

    const computed = await page.evaluate(() => {
      const nav = document.querySelector('.rp-nav')!;
      const container = document.querySelector('.rp-doc-layout__container')!;
      const h1 = document.querySelector('.rp-doc h1')!;
      const ul = document.querySelector('.rp-doc ul')!;
      const sunIcon = document.querySelector(
        '.rp-switch-appearance__icon--sun',
      )!;
      const moonIcon = document.querySelector(
        '.rp-switch-appearance__icon--moon',
      )!;
      const socialSvg = document.querySelector('.rp-social-links__icon svg')!;
      const badge = document.querySelector('.custom-headless-badge')!;

      return {
        navDisplay: getComputedStyle(nav).display,
        navBorderBottomColor: getComputedStyle(nav).borderBottomColor,
        containerDisplay: getComputedStyle(container).display,
        // Without preflight reset, h1 is larger than body 16px and ul keeps list-style disc
        h1FontSize: Number.parseFloat(getComputedStyle(h1).fontSize),
        ulListStyleType: getComputedStyle(ul).listStyleType,
        sunDisplay: getComputedStyle(sunIcon).display,
        moonDisplay: getComputedStyle(moonIcon).display,
        socialWidth: socialSvg.getBoundingClientRect().width,
        badgeColor: getComputedStyle(badge).color,
      };
    });

    expect(computed.navDisplay).toBe('flex');
    // Later @layer utilities in user globalStyles overrides @layer rp-headless without !important
    expect(computed.navBorderBottomColor).toBe('rgb(20, 184, 166)');
    expect(computed.containerDisplay).toBe('flex');
    expect(computed.h1FontSize).toBeGreaterThan(20);
    expect(computed.ulListStyleType).toBe('disc');
    expect(computed.sunDisplay).not.toBe('none');
    expect(computed.moonDisplay).toBe('none');
    expect(computed.socialWidth).toBe(20);
    expect(computed.badgeColor).toBe('rgb(234, 88, 12)');

    // Inactive tab panel is hidden, clicking second tab reveals it
    const hiddenTab = page.locator('.rp-tabs__content__item').nth(1);
    await expect(hiddenTab).toBeHidden();
    await page.locator('.rp-tabs__label__item').nth(1).click();
    await expect(hiddenTab).toBeVisible();

    // Search modal opens and closes cleanly
    await page.locator('.rp-search-button').click();
    await expect(page.locator('.rp-search-panel__modal')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.locator('.rp-search-panel__modal')).toHaveCount(0);
  });
});
