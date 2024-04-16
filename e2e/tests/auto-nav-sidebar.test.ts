import { expect, test } from '@playwright/test';
import path from 'path';
import { getPort, killProcess, runDevCommand } from '../utils/runCommands';

const fixtureDir = path.resolve(__dirname, '../fixtures');

test.describe('Auto nav and sidebar test', async () => {
  let appPort;
  let app;
  test.beforeAll(async () => {
    const appDir = path.join(fixtureDir, 'auto-nav-sidebar');
    appPort = await getPort();
    app = await runDevCommand(appDir, appPort);
  });

  test.afterAll(async () => {
    if (app) {
      await killProcess(app);
    }
  });

  test('Should render nav and sidebar correctly', async ({ page }) => {
    await page.goto(`http://localhost:${appPort}/guide/`, {
      waitUntil: 'networkidle',
    });

    // take the nav
    const nav = await page.$$('.rspress-nav-menu');
    expect(nav?.length).toBe(1);

    // take the sidebar, properly a section or a tag
    const sidebar = await page.$$(
      `.rspress-sidebar .rspress-scrollbar > nav > section,
      .rspress-sidebar .rspress-scrollbar > nav > a`,
    );
    expect(sidebar?.length).toBe(2);
  });

  test('Should load total API Overview correctly', async ({ page }) => {
    await page.goto(`http://localhost:${appPort}/api/index.html`, {
      waitUntil: 'networkidle',
    });

    const h2 = await page.$$('.overview-index h2');
    const h2Texts = await Promise.all(h2.map(element => element.textContent()));
    expect(h2Texts.join(',')).toEqual(
      ['Config', 'Client API', 'Others'].join(','),
    );

    const h3 = await page.$$('.overview-group_8f375 h3');
    const h3Texts = await Promise.all(h3.map(element => element.textContent()));
    expect(h3Texts.join(',')).toEqual(
      [
        '基础配置',
        '主题配置',
        'Front Matter 配置',
        '构建配置',
        'Client API Overview',
        'Runtime API',
        '内置组件',
        '命令',
      ].join(','),
    );

    const a = await page.$$('.overview-group_8f375 ul a');
    const aTexts = await Promise.all(a.map(element => element.textContent()));
    expect(aTexts.join(',')).toEqual(
      [
        'root',
        'logoText',
        'nav',
        'sidebar',
        'builderConfig',
        '默认配置',
        'markdown',
        'markdown.remarkPlugins',
        '用法',
        '示例',
        'rspress dev',
        'rspress build',
      ].join(','),
    );
  });

  test('Should load subpage API Overview correctly - same name', async ({
    page,
  }) => {
    await page.goto(`http://localhost:${appPort}/api/config.html`, {
      waitUntil: 'networkidle',
    });

    const h2 = await page.$$('.overview-index h2');
    const h2Texts = await Promise.all(h2.map(element => element.textContent()));
    expect(h2Texts.join(',')).toEqual(['Config'].join(','));

    const h3 = await page.$$('.overview-group_8f375 h3');
    const h3Texts = await Promise.all(h3.map(element => element.textContent()));
    expect(h3Texts.join(',')).toEqual(
      ['基础配置', '主题配置', 'Front Matter 配置', '构建配置'].join(','),
    );

    const a = await page.$$('.overview-group_8f375 ul a');
    const aTexts = await Promise.all(a.map(element => element.textContent()));
    expect(aTexts.join(',')).toEqual(
      [
        'root',
        'logoText',
        'nav',
        'sidebar',
        'builderConfig',
        '默认配置',
        'markdown',
        'markdown.remarkPlugins',
      ].join(','),
    );
  });

  test('Should load subpage API Overview correctly - index.md', async ({
    page,
  }) => {
    await page.goto(`http://localhost:${appPort}/api/client-api/index.html`, {
      waitUntil: 'networkidle',
    });

    const h2 = await page.$$('.overview-index h2');
    const h2Texts = await Promise.all(h2.map(element => element.textContent()));
    expect(h2Texts.join(',')).toEqual(['Client API'].join(','));

    const h3 = await page.$$('.overview-group_8f375 h3');
    const h3Texts = await Promise.all(h3.map(element => element.textContent()));
    expect(h3Texts.join(',')).toEqual(['Runtime API', '内置组件'].join(','));

    const a = await page.$$('.overview-group_8f375 ul a');
    const aTexts = await Promise.all(a.map(element => element.textContent()));
    expect(aTexts.join(',')).toEqual(['用法', '示例'].join(','));
  });
});
