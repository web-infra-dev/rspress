import { expect, test } from '@playwright/test';
import path from 'node:path';
import { getPort, killProcess, runDevCommand } from '../utils/runCommands';

const fixtureDir = path.resolve(__dirname, '../fixtures');

test.describe('i18n test', async () => {
  let appPort;
  let app;
  test.beforeAll(async () => {
    const appDir = path.join(fixtureDir, 'i18n');
    appPort = await getPort();
    app = await runDevCommand(appDir, appPort);
  });

  test.afterAll(async () => {
    if (app) {
      await killProcess(app);
    }
  });

  // check the language switch button
  test('Language switch button', async ({ page }) => {
    await page.goto(`http://localhost:${appPort}`, {
      waitUntil: 'networkidle',
    });

    const h1 = await page.$('h1');
    const text = await page.evaluate(h1 => h1?.textContent, h1);
    await expect(text).toContain('首页');

    const button = await page.$('.translation .rspress-nav-menu-group-button')!;
    expect(button).toBeTruthy();
    // hover the button
    await button!.hover();
    // click the button content to switch to English
    const buttonContent = await page.$(
      '.translation .rspress-nav-menu-group-content > div > div:nth-child(2)',
    );
    const buttonContentText = await page.evaluate(
      buttonContent => buttonContent?.textContent,
      buttonContent,
    );
    expect(buttonContentText).toBe('English');
  });

  test('Add language prefix in route automatically when current language is not default language', async ({
    page,
  }) => {
    await page.goto(`http://localhost:${appPort}/en/guide/basic/quick-start`, {
      waitUntil: 'networkidle',
    });
    // take the `click` button
    let link = await page.getByRole('link', {
      name: /absolute/,
    });
    expect(link).toBeTruthy();
    // check the compile result of absolute link in doc content
    expect(await link.getAttribute('href')).toBe(
      '/en/guide/basic/install.html',
    );
    link = await page.getByRole('link', {
      name: /relative/,
    });

    // check the compile result of relative link in doc content
    expect(link).toBeTruthy();
    expect(await link.getAttribute('href')).toBe(
      '/en/guide/basic/install.html',
    );
  });

  test('Should not add language prefix when current language is default language', async ({
    page,
  }) => {
    await page.goto(`http://localhost:${appPort}/guide/basic/quick-start`, {
      waitUntil: 'networkidle',
    });
    // check the compile result of absolute link in doc content
    let link = await page.getByRole('link', {
      name: /绝对路径/,
    });
    expect(link).toBeTruthy();
    expect(await link.getAttribute('href')).toBe('/guide/basic/install.html');
    // check the compile result of relative link in doc content
    link = await page.getByRole('link', {
      name: /相对路径/,
    });
    expect(link).toBeTruthy();
    expect(await link.getAttribute('href')).toBe('/guide/basic/install.html');
  });

  test('Should render sidebar correctly', async ({ page }) => {
    await page.goto(`http://localhost:${appPort}/guide/basic/quick-start`, {
      waitUntil: 'networkidle',
    });
    // take the sidebar
    const sidebar = await page.$$(
      '.rspress-sidebar .rspress-scrollbar > nav > section',
    );
    expect(sidebar?.length).toBe(1);
  });

  test('Should not render appearance switch button', async ({ page }) => {
    await page.goto(`http://localhost:${appPort}/guide/basic/quick-start`, {
      waitUntil: 'networkidle',
    });
    // take the appearance switch button
    const button = await page.$('.rspress-nav-appearance');
    expect(button).toBeFalsy();
  });

  test('Should not 404 after redirecting in first visit', async ({ page }) => {
    const changeNavigatorLanguage = async (language: string) => {
      await page.addScriptTag({
        content: `
          localStorage.clear();
          navigator.language = '${language}';
        `,
      });
    };
    await changeNavigatorLanguage('nl-NL');
    await page.goto(`http://localhost:${appPort}`, {
      waitUntil: 'networkidle',
    });
    const content = await page.evaluate(() => document.body.textContent);
    expect(content?.includes('PAGE NOT FOUND')).toBe(false);
  });

  test('Should render i18n sidebar - cn', async ({ page }) => {
    await page.goto(`http://localhost:${appPort}/guide/basic/quick-start`, {
      waitUntil: 'networkidle',
    });
    const dirContent = await page.textContent(
      '.rspress-sidebar .rspress-scrollbar nav section',
    );
    expect(dirContent).toContain('基本');

    const sectionHeaderContent = await page.textContent(
      '.rspress-sidebar-section-header span',
    );
    expect(sectionHeaderContent).toEqual('成长');
  });

  test('Should render i18n sidebar - en', async ({ page }) => {
    await page.goto(`http://localhost:${appPort}/en/guide/basic/quick-start`, {
      waitUntil: 'networkidle',
    });
    const dirContent = await page.textContent(
      '.rspress-sidebar .rspress-scrollbar nav section',
    );
    expect(dirContent).toContain('Basic');

    const sectionHeaderContent = await page.textContent(
      '.rspress-sidebar-section-header span',
    );
    expect(sectionHeaderContent).toEqual('Growth');
  });

  test('Should add routePrefix when type is custom-link', async ({ page }) => {
    await page.goto(`http://localhost:${appPort}/guide/basic/quick-start`, {
      waitUntil: 'networkidle',
    });
    const customLinkZh = await page.$('nav > a');
    const hrefZh = await page.evaluate(
      customLinkZh => customLinkZh?.getAttribute('href'),
      customLinkZh,
    );
    expect(hrefZh).toBe('/guide/basic/install.html');

    await page.goto(`http://localhost:${appPort}/en/guide/basic/quick-start`, {
      waitUntil: 'networkidle',
    });
    const customLinkEn = await page.$('nav > a');
    const hrefEn = await page.evaluate(
      customLinkEn => customLinkEn?.getAttribute('href'),
      customLinkEn,
    );
    expect(hrefEn).toBe('/en/guide/basic/install.html');
  });

  test('Should not crash when switch language in api page', async ({
    page,
  }) => {
    await page.goto(`http://localhost:${appPort}/api`, {
      waitUntil: 'networkidle',
    });
    const overviewContentZh = await page.textContent('.overview-index');
    expect(overviewContentZh).toEqual('Overviewzh');
    await page.click('.rspress-nav-menu-group-button');
    await page.click('.rspress-nav-menu-group-content a');
    await page.waitForLoadState();
    const content = await page.textContent('#root');
    expect(content).not.toEqual('');
    const overviewContentEn = await page.textContent('.overview-index');
    expect(overviewContentEn).toEqual('Overviewen');
  });
});
